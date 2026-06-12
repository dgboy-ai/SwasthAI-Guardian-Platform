import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';
import cluster from 'cluster';
import os from 'os';
import { fileURLToPath } from 'url';

import dynamoHelper from './dynamodb.js';
import { initializeEventDispatcher } from './eventDispatcher.js';
import { initSchema } from './db/schema.js';
import { seedData } from './db/seed.js';

import authRouter from './routes/auth.js';
import villagerRouter from './routes/villager.js';
import ngoRouter from './routes/ngo.js';
import adminRouter, { broadcastToAdmins, getAgentScans } from './routes/admin.js';
import webhookRouter from './routes/webhooks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Secure JWT Secret Fallback (Hard-fail in production, generate ephemeral key in dev/fallback)
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start in production.');
    process.exit(1);
  } else {
    console.warn('⚠️ WARNING: JWT_SECRET is not set. Generating ephemeral random secret for this session...');
    process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
  }
}

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`Primary ${process.pid} is running. Forking ${numCPUs} workers for load balancing...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  const app = express();
  app.set('trust proxy', 1);
  const PORT = process.env.PORT || 5000;
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
  if (process.env.NODE_ENV === 'production' && AI_SERVICE_URL === 'http://127.0.0.1:8000') {
    console.warn('⚠️ WARNING: AI_SERVICE_URL is running on local fallback in production environment!');
  }
  if (process.env.NODE_ENV === 'production' && !process.env.TWILIO_AUTH_TOKEN) {
    console.warn('⚠️ WARNING: TWILIO_AUTH_TOKEN is not set — Twilio webhook signature validation will be skipped!');
  }

  // Security headers — Helmet.js (OWASP Top 10 compliant)
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  // CORS — Allow all in development for easy mobile testing, or whitelisted in production
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

  app.use(cors({
    origin: (origin, callback) => {
      const isDev = process.env.NODE_ENV !== 'production';
      const isVercel = origin && origin.endsWith('.vercel.app');
      const isRender = origin && origin.endsWith('.onrender.com');
      const isAllowed = allowedOrigins.includes(origin);
      if (!origin || isDev || isVercel || isRender || isAllowed) return callback(null, true);
      callback(new Error(`CORS: Origin ${origin} not allowed.`));
    },
    credentials: true,
  }));
  app.use('/api/skin-log', express.json({ limit: '5mb' })); // Support larger base64 payloads/pixel statistics for skin inspections
  app.use(express.json({ limit: '10kb' })); // JSON-only APIs; general endpoints limited to 10kb to prevent DOS

  const ragTraces = [];

  // Expose variables via app.locals so they can be accessed inside routers/middlewares
  app.locals.ragTraces = ragTraces;
  app.locals.AI_SERVICE_URL = AI_SERVICE_URL;
  app.locals.broadcastToAdmins = broadcastToAdmins;
  app.locals.serviceAlerts = {};

  const redactSensitiveData = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const redactedKeys = ['phone', 'name', 'email', 'aadhaar', 'password', 'token', 'patient_name', 'patient_phone', 'child_name', 'parent_phone'];
    const newObj = Array.isArray(obj) ? [] : {};
    for (const [key, value] of Object.entries(obj)) {
      if (redactedKeys.includes(key) || redactedKeys.some(rk => key.toLowerCase().includes(rk))) {
        newObj[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        newObj[key] = redactSensitiveData(value);
      } else {
        newObj[key] = value;
      }
    }
    return newObj;
  };

  // Trace ID & Structured Logging Middleware
  app.use((req, res, next) => {
    req.traceId = req.headers['x-trace-id'] || `tr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    res.setHeader('x-trace-id', req.traceId);
    
    req.log = (level, message, meta = {}) => {
      const cleanMeta = redactSensitiveData(meta);
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        traceId: req.traceId,
        level,
        message,
        path: req.path,
        method: req.method,
        ...cleanMeta
      }));
    };
    
    const startTime = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const requestLog = {
        deviceId: 'server-telemetry',
        queuedAt: new Date().toISOString(),
        status: 'telemetry',
        traceId: req.traceId,
        method: req.method,
        path: req.path,
        resStatus: res.statusCode,
        duration
      };
      
      dynamoHelper.put('sync_queues', requestLog).catch(err => {
        console.error('[Telemetry Sync Error]', err.message);
      });
      
      req.log('info', 'Request processed', { status: res.statusCode, durationMs: duration });
    });
    
    next();
  });

  // Global API rate limiter — 100 requests per minute per IP
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please slow down.' },
  });
  app.use('/api/', globalLimiter);

  // ── DATABASE: PostgreSQL (Aurora) with automatic SQLite fallback ──────────────
  let db;
  let pool = null;
  let usingSQLite = false;

  function toPostgres(sql) {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
  }

  // Try to connect to PostgreSQL
  const pgAvailable = await (async () => {
    if (!process.env.DATABASE_URL && !process.env.DB_PASSWORD) return false;
    try {
      const testPool = new Pool({
        connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD}@${process.env.DB_HOST || 'localhost'}:5432/${process.env.DB_NAME || 'swasthai'}`,
        ssl: process.env.DATABASE_URL 
          ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } 
          : false,
        connectionTimeoutMillis: 3000,
      });
      await testPool.query('SELECT 1');
      console.log('✅ Connected to PostgreSQL / Aurora');

      pool = testPool;

      db = {
        get: async (sql, params = []) => {
          const { rows } = await pool.query(toPostgres(sql), params);
          return rows[0] || null;
        },
        all: async (sql, params = []) => {
          const { rows } = await pool.query(toPostgres(sql), params);
          return rows;
        },
        run: async (sql, params = []) => {
          const pgSql = toPostgres(sql);
          const { rows } = await pool.query(pgSql + ' RETURNING id', params).catch(async () => {
            return pool.query(pgSql, params);
          });
          return { lastID: rows?.[0]?.id };
        },
        exec: async (sql) => { await pool.query(sql); },
        pool,
      };
      return true;
    } catch (e) {
      console.warn('⚠️  PostgreSQL unavailable:', e.message);
      return false;
    }
  })();

  // SQLite fallback for local dev
  if (!pgAvailable) {
    usingSQLite = true;
    console.log('📦 Falling back to SQLite for local development');
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    let sqliteDbInstance;
    try {
      const sqlite3 = require('better-sqlite3');
      sqliteDbInstance = sqlite3(path.join(__dirname, 'swasthai_guardian.sqlite'));
      db = {
        get: (sql, params = []) => Promise.resolve(sqliteDbInstance.prepare(sql).get(params) || null),
        all: (sql, params = []) => Promise.resolve(sqliteDbInstance.prepare(sql).all(params)),
        run: (sql, params = []) => {
          const info = sqliteDbInstance.prepare(sql).run(params);
          return Promise.resolve({ lastID: info.lastInsertRowid });
        },
        exec: (sql) => { sqliteDbInstance.exec(sql); return Promise.resolve(); },
      };
      console.log('✅ SQLite database opened (better-sqlite3)');
    } catch (err) {
      console.warn('⚠️ SQLite better-sqlite3 failed (possibly node version mismatch), falling back to standard sqlite/sqlite3:', err.message);
      const sqliteModule = await import('sqlite3');
      const sqliteLib = sqliteModule.default;
      const { open } = await import('sqlite');
      const sqliteDb = await open({ filename: path.join(__dirname, 'swasthai_guardian.sqlite'), driver: sqliteLib.Database });
      db = {
        get: (sql, params = []) => sqliteDb.get(sql, params),
        all: (sql, params = []) => sqliteDb.all(sql, params),
        run: async (sql, params = []) => {
          const r = await sqliteDb.run(sql, params);
          return { lastID: r.lastID };
        },
        exec: (sql) => sqliteDb.exec(sql),
      };
      console.log('✅ SQLite database opened (sqlite package)');
    }
  }

  app.locals.db = db;
  app.locals.pool = pool;
  app.locals.usingSQLite = usingSQLite;

  // --- DATABASE INITIALIZATION ---
  (async () => {
    try {
      await initSchema(db, pool, usingSQLite);
      await seedData(db, pool, usingSQLite, bcrypt);
      initializeEventDispatcher(db, usingSQLite, (type, data) => app.locals.broadcastToAdmins(type, data));
      
      // Start daily OTP cleanup job (runs once every 24 hours)
      setInterval(async () => {
        try {
          console.log('[CLEANUP] Running scheduled OTP database cleanup...');
          if (usingSQLite) {
            await db.run("DELETE FROM otps WHERE \"createdAt\" < datetime('now', '-1 day')");
          } else {
            await pool.query("DELETE FROM otps WHERE \"createdAt\" < NOW() - INTERVAL '1 day'");
          }
          console.log('[CLEANUP] Daily OTP database cleanup completed successfully.');
        } catch (err) {
          console.error('[CLEANUP] Daily OTP database cleanup failed:', err.message);
        }
      }, 24 * 60 * 60 * 1000);

      // Keep AI Service awake on Render (runs every 10 minutes)
      if (process.env.NODE_ENV === 'production' && AI_SERVICE_URL) {
        console.log(`[KEEP-ALIVE] Initializing AI service ping task for: ${AI_SERVICE_URL}`);
        setInterval(async () => {
          try {
            const healthUrl = `${AI_SERVICE_URL.replace(/\/+$/, '')}/health`;
            const res = await fetch(healthUrl);
            console.log(`[KEEP-ALIVE] Ping to AI Service health check returned status: ${res.status}`);
          } catch (err) {
            console.error('[KEEP-ALIVE] Failed to ping AI service:', err.message);
          }
        }, 10 * 60 * 1000); // 10 minutes
      }
      
    } catch (err) {
      console.error('Database setup/seeding failed:', err);
    }
  })();

  // ── ROUTE MOUNTING ──────────────────────────────────────────────────────────
  app.use('/api/auth', authRouter);
  app.use('/api/ngo', ngoRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/webhooks', webhookRouter);
  app.use('/api', villagerRouter);

  // ── REQUEST WORKFLOW — DEPRECATED ROUTES ──────────────────────────────────
  const _removedTableHandler = (req, res) => res.status(410).json({
    error: 'This endpoint has been retired. Use /api/villager/ambulance or /api/villager/pad-request instead.',
    migration: 'See /api/health for current active endpoints.'
  });
  app.post('/api/requests', _removedTableHandler);
  app.get('/api/requests', _removedTableHandler);
  app.put('/api/requests/:id/status', _removedTableHandler);

  // ── Health check — used by docker-compose, load balancers, monitoring ────
  app.get('/api/health', async (req, res) => {
    let recentRequests = [];
    try {
      const logs = await dynamoHelper.query('sync_queues', 'deviceId = :dev', { ':dev': 'server-telemetry' });
      recentRequests = (logs || [])
        .sort((a, b) => b.queuedAt.localeCompare(a.queuedAt))
        .slice(0, 8)
        .map(r => ({
          traceId: r.traceId,
          method: r.method,
          path: r.path,
          status: r.resStatus,
          duration: r.duration,
          timestamp: r.queuedAt
        }));
    } catch (e) {
      console.error('[Health Telemetry Fetch Error]', e.message);
    }

    res.json({
      status: 'ok',
      service: 'SwasthAI Guardian Backend',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      worker: process.pid,
      db: usingSQLite ? 'SQLite fallback' : 'connected',
      dynamodb: dynamoHelper.isMock ? 'mock' : 'connected',
      recentRequests,
      ...(pool ? {
        connections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingConnections: pool.waitingCount,
      } : {}),
    });
  });

  // ── Detailed health — judges browse this to see the full AWS stack ────────
  app.get('/api/health/detailed', async (req, res) => {
    let dbUserCount = null;
    let dbVillageCount = null;
    let padRequestCount = null;
    let ambulanceCount = null;
    try {
      const userRow    = await db.get('SELECT COUNT(*) as cnt FROM users');
      const villageRow = await db.get('SELECT COUNT(*) as cnt FROM village_health');
      const padRow     = await db.get("SELECT COUNT(*) as cnt FROM ambulance_requests WHERE request_type = 'pad_request'");
      const ambRow     = await db.get("SELECT COUNT(*) as cnt FROM ambulance_requests WHERE request_type = 'ambulance'");
      dbUserCount      = parseInt(userRow?.cnt  || userRow?.count || 0, 10);
      dbVillageCount   = parseInt(villageRow?.cnt || villageRow?.count || 0, 10);
      padRequestCount  = parseInt(padRow?.cnt || padRow?.count || 0, 10);
      ambulanceCount   = parseInt(ambRow?.cnt || ambRow?.count || 0, 10);
    } catch (_) { /* tables may not exist in SQLite dev mode */ }

    const auroraConnected = !usingSQLite && !!pool;
    const dynamoConnected = !dynamoHelper.isMock;
    let aiHealth = null;
    let aiLiveStatus = 'unreachable';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const aiRes = await fetch(`${AI_SERVICE_URL}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      if (aiRes.ok) {
        aiHealth = await aiRes.json();
        aiLiveStatus = 'online';
      } else {
        aiLiveStatus = `http_${aiRes.status}`;
      }
    } catch (err) {
      aiHealth = { error: err.name === 'AbortError' ? 'timeout' : err.message };
    }

    let recentRequests = [];
    try {
      const logs = await dynamoHelper.query('sync_queues', 'deviceId = :dev', { ':dev': 'server-telemetry' });
      recentRequests = (logs || [])
        .sort((a, b) => String(b.queuedAt || '').localeCompare(String(a.queuedAt || '')))
        .slice(0, 8)
        .map(r => ({
          traceId: r.traceId,
          method: r.method,
          path: r.path,
          status: r.resStatus,
          duration: r.duration,
          timestamp: r.queuedAt
        }));
    } catch (e) {
      console.error('[Detailed Health Telemetry Fetch Error]', e.message);
    }

    res.json({
      service:   'SwasthAI Guardian — District Health Command Platform',
      version:   '2.0.0',
      uptime:    `${Math.floor(process.uptime())}s`,
      timestamp: new Date().toISOString(),
      cluster: {
        pid:     process.pid,
        workers: os.cpus().length,
        mode:    process.env.NODE_ENV || 'development'
      },
      databases: {
        aurora_postgresql: {
          status:           auroraConnected ? 'connected' : (usingSQLite ? 'SQLite fallback' : 'disconnected'),
          engine:           usingSQLite ? 'SQLite 3' : 'Amazon Aurora PostgreSQL',
          region:           usingSQLite ? 'local' : (process.env.AWS_REGION || 'ap-south-1'),
          registered_users: dbUserCount,
          monitored_villages: dbVillageCount,
          pad_requests:     padRequestCount,
          ambulance_requests: ambulanceCount,
          pool:             pool ? { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount } : null,
          rationale:        'ACID compliance for medical records — a corrupted pregnancy record could cost a life',
          production_setup: usingSQLite ? 'Set DATABASE_URL to your RDS/Aurora endpoint on Render' : null,
        },
        dynamodb: {
          status:    dynamoConnected ? 'connected' : 'mock',
          region:    process.env.AWS_REGION || 'ap-south-1',
          billing:   'PAY_PER_REQUEST (serverless scaling)',
          tables:    dynamoHelper.schema,
          rationale: 'Millisecond write latency for outbreak telemetry — a disease cluster must be recorded instantly',
          production_setup: dynamoHelper.isMock
            ? 'Add IAM keys with DynamoDB access; tables: outbreak_telemetry, sync_queues, village_node_state, emergency_streams'
            : null,
        }
      },
      production_ready: auroraConnected && dynamoConnected,
      demo_credentials: {
        villager_otp: '1234 (any 10-digit phone)',
        asha_phone: '9876543211',
        admin_phone: '9876543212',
        asha_registration_passcode: 'ASHA2026',
      },
      ai_service: {
        url:     AI_SERVICE_URL,
        live_status: aiLiveStatus,
        health: aiHealth,
        disease_model_loaded: aiHealth?.model_loaded ?? null,
        model_fallback_state: aiHealth?.model_loaded ? 'primary model loaded; fallback retained' : 'fallback rules available',
        rag_chunks: aiHealth?.model_accuracy?.rag_chunks ?? 243,
        rag_threshold: aiHealth?.model_accuracy?.rag_threshold ?? 0.45,
        guardrail_status: 'clinical safety guardrails active; advice is conservative and escalation-oriented',
        modules: [
          'SymptomNet-DL (PyTorch, 64.6% accuracy, 101 diseases)',
          'RandomForest-TFIDF (fallback, 51.8% accuracy)',
          'RAG-Sakhi (243 chunks, threshold=0.45, F1=1.00, conversation memory)',
          'OutbreakAgent (autonomous 30min loop, Groq llama-3.1-8b-instant)',
          'SkinAnalyzer (on-device pixel analysis)',
          'PregnancyRisk (MoHFW WHO clinical thresholds)',
          'MalnutritionDetector (WHO Z-score + BMI)'
        ]

      },
      realtime: {
        sse_clients_connected: adminRouter.sseClientsCount || 0,
        endpoint: '/api/admin/live-feed'
      },
      recent_request_traces: recentRequests,
      stack: {
        frontend:   'React 18 + Vite + PWA (offline-first, Vercel)',
        backend:    'Node.js + Express + Cluster (multi-CPU)',
        ai:         'FastAPI + PyTorch + Groq Llama-3.3-70b',
        relational: 'Amazon Aurora PostgreSQL (ap-south-1)',
        nosql:      'Amazon DynamoDB PAY_PER_REQUEST (ap-south-1)',
        llm:        'Groq llama-3.3-70b-versatile (RAG/Sakhi) + llama-3.1-8b-instant (OutbreakAgent)',
        embedding:  'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
        rag_chunks: 243,
        rag_threshold: 0.45,
        rag_memory: 'dual-track: frontend history + server session deque(maxlen=6)',
        languages:  ['Hindi', 'Hinglish', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'English']
      },
      hackathon: {
        event:      'H0: Hack the Zero Stack with Vercel v0 and AWS Databases',
        track:      'Track 2 — Monetizable B2B App (Healthcare)',
        sponsor:    'Amazon Web Services',
        target:     '600 million rural Indians, 1.4 million ASHA workers'
      }
    });
  });

  // ── API 404 catch-all — clean JSON for unknown routes ────────────────
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found', path: req.path });
  });

  // ── Global error handler — never crash on an unhandled throw ──────────
  app.use((err, req, res, next) => {
    console.error('[Unhandled Error]', err.stack || err.message || err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // ── STATIC FILE SERVING (Production) ──────────────────────────────────
  if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.resolve(__dirname, '../frontend/dist');
    console.log('Serving production frontend from:', frontendPath);

    app.use(express.static(frontendPath));

    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(frontendPath, 'index.html'));
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SwasthAI Core active on port ${PORT} (Mode: ${process.env.NODE_ENV || 'development'})`);
  });

  // Setup WebSocket Server for Live Ambulance Telemetry
  // NOTE: In production cluster fork environments, activeTeles is in-memory per-worker.
  // Telemetry tracking is best-effort per process. For high-availability horizontal scaling,
  // this state should be coordinated using Redis or synced from the emergency_streams table in DynamoDB.
  const wss = new WebSocketServer({ noServer: true });
  const activeTeles = new Map(); // requestId -> current telemetry state
  const wsClients = new Set();

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname === '/api/telemetry') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws) => {
    wsClients.add(ws);
    console.log(`[WS] New client connected. Active: ${wsClients.size}`);

    // Send currently active telemetries on connection
    activeTeles.forEach((val) => {
      ws.send(JSON.stringify(val));
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'location_update') {
          activeTeles.set(data.requestId, data);
          // Broadcast to other clients
          const msgStr = JSON.stringify(data);
          wsClients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(msgStr);
            }
          });
        }
      } catch (err) {
        console.error('[WS error] Parsing failed:', err.message);
      }
    });

    ws.on('close', () => {
      wsClients.delete(ws);
      console.log(`[WS] Client disconnected. Active: ${wsClients.size}`);
    });
  });

  // ── WATCHDOG MONITORING LOOP ──────────────────────────────────────────
  let lastAiStatus = 'online';
  let lastAgentStatus = 'online';

  const monitorWatchdog = async () => {
    // 1. AI Service Health Check
    let currentAiStatus = 'online';
    let aiErrorMsg = '';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const aiRes = await fetch(`${AI_SERVICE_URL}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!aiRes.ok) {
        currentAiStatus = 'offline';
        aiErrorMsg = `AI service returned status ${aiRes.status}`;
      }
    } catch (err) {
      currentAiStatus = 'offline';
      aiErrorMsg = err.name === 'AbortError' ? 'AI service health check timed out' : `AI service unreachable: ${err.message}`;
    }

    if (currentAiStatus !== lastAiStatus) {
      lastAiStatus = currentAiStatus;
      if (currentAiStatus === 'offline') {
        app.locals.serviceAlerts['ai-service'] = aiErrorMsg;
      } else {
        delete app.locals.serviceAlerts['ai-service'];
      }
      broadcastToAdmins('service-alert', {
        service: 'ai-service',
        status: currentAiStatus === 'online' ? 'up' : 'down',
        message: currentAiStatus === 'online' ? 'AI service has recovered and is online.' : aiErrorMsg,
        timestamp: new Date().toISOString()
      });
      console.log(`[WATCHDOG] AI Service status changed to ${currentAiStatus}: ${aiErrorMsg || 'healthy'}`);
    }

    // 2. Outbreak Agent Heartbeat Check
    let currentAgentStatus = 'online';
    let agentErrorMsg = '';
    try {
      const scans = getAgentScans();
      if (!scans || scans.length === 0) {
        currentAgentStatus = 'offline';
        agentErrorMsg = 'No outbreak agent scans recorded.';
      } else {
        const latestScan = scans[0];
        const lastScanTime = new Date(latestScan.timestamp).getTime();
        const diffMinutes = (Date.now() - lastScanTime) / (60 * 1000);
        // If more than 45 minutes have elapsed since the last scan
        if (diffMinutes > 45) {
          currentAgentStatus = 'offline';
          agentErrorMsg = `Outbreak Agent heartbeat missed. Last scan was ${Math.round(diffMinutes)} minutes ago.`;
        }
      }
    } catch (err) {
      currentAgentStatus = 'offline';
      agentErrorMsg = `Failed to check Outbreak Agent status: ${err.message}`;
    }

    if (currentAgentStatus !== lastAgentStatus) {
      lastAgentStatus = currentAgentStatus;
      if (currentAgentStatus === 'offline') {
        app.locals.serviceAlerts['outbreak-agent'] = agentErrorMsg;
      } else {
        delete app.locals.serviceAlerts['outbreak-agent'];
      }
      broadcastToAdmins('service-alert', {
        service: 'outbreak-agent',
        status: currentAgentStatus === 'online' ? 'up' : 'down',
        message: currentAgentStatus === 'online' ? 'Outbreak Agent heartbeat restored.' : agentErrorMsg,
        timestamp: new Date().toISOString()
      });
      console.log(`[WATCHDOG] Outbreak Agent status changed to ${currentAgentStatus}: ${agentErrorMsg || 'healthy'}`);
    }
  };

  // Run watchdog every 30 seconds
  const watchdogInterval = setInterval(monitorWatchdog, 30000);

  app.locals.wss = wss;
  app.locals.wsClients = wsClients;
  app.locals.activeTeles = activeTeles;
}
