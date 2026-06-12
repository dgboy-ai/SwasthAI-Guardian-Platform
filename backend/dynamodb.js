import {
  DynamoDBClient,
  ListTablesCommand,
  CreateTableCommand,
  DescribeTableCommand,
  UpdateTimeToLiveCommand,
  DescribeTimeToLiveCommand,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
const isProduction = process.env.NODE_ENV === 'production';

let docClient = null;

// ── Table Definitions with Deliberate Access Patterns ──────────────────────────
// Each table has composite keys and GSIs designed for the actual query patterns:
//   outbreak_telemetry : query by village, district/time, and disease
//   sync_queues        : query by device (pending items) + query by status (fleet management)
//   village_node_state : single-item lookup by village + TTL auto-expire
//   emergency_streams  : query by district/date bucket + query by priority
const TABLE_DEFINITIONS = [
  {
    name: 'outbreak_telemetry',
    // Access pattern A: "All outbreaks in village X after time T" → villageId + detectedAt
    // Access pattern B: "All outbreaks of disease D in last 7 days" → disease-index GSI
    KeySchema: [
      { AttributeName: 'villageId',   KeyType: 'HASH'  },
      { AttributeName: 'detectedAt',  KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'villageId',  AttributeType: 'S' },
      { AttributeName: 'detectedAt', AttributeType: 'S' },
      { AttributeName: 'disease',    AttributeType: 'S' },
      { AttributeName: 'districtId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'disease-index',
        KeySchema: [
          { AttributeName: 'disease',    KeyType: 'HASH'  },
          { AttributeName: 'detectedAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      },
      {
        IndexName: 'district-time-index',
        KeySchema: [
          { AttributeName: 'districtId', KeyType: 'HASH'  },
          { AttributeName: 'detectedAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    TtlAttribute: null,
  },
  {
    name: 'sync_queues',
    // Access pattern A: "All pending items for device D" → deviceId + queuedAt
    // Access pattern B: "All failed syncs across fleet" → status-index GSI
    KeySchema: [
      { AttributeName: 'deviceId',  KeyType: 'HASH'  },
      { AttributeName: 'queuedAt',  KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'deviceId',  AttributeType: 'S' },
      { AttributeName: 'queuedAt',  AttributeType: 'S' },
      { AttributeName: 'status',    AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [{
      IndexName: 'status-index',
      KeySchema: [
        { AttributeName: 'status',   KeyType: 'HASH'  },
        { AttributeName: 'queuedAt', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }],
    BillingMode: 'PAY_PER_REQUEST',
    TtlAttribute: null,
  },
  {
    name: 'village_node_state',
    // Access pattern: single-item read/write per village (heartbeat state)
    // TTL: expiresAt — auto-expire stale village nodes after 7 days of inactivity
    KeySchema: [
      { AttributeName: 'villageId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'villageId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [],  // No GSI for single-item access
    BillingMode: 'PAY_PER_REQUEST',
    TtlAttribute: 'expiresAt',   // TTL auto-expire: 7 days of inactivity
  },
  {
    name: 'emergency_streams',
    // Access pattern A: "All emergencies in district X" → districtId + streamId
    // Access pattern B: "All critical priority events" → priority-index GSI
    KeySchema: [
      { AttributeName: 'districtId', KeyType: 'HASH'  },
      { AttributeName: 'streamId',   KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'districtId', AttributeType: 'S' },
      { AttributeName: 'streamId',   AttributeType: 'S' },
      { AttributeName: 'priority',   AttributeType: 'S' },
      { AttributeName: 'districtDateBucket', AttributeType: 'S' },
      { AttributeName: 'timestamp',  AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'priority-index',
        KeySchema: [
          { AttributeName: 'priority',  KeyType: 'HASH'  },
          { AttributeName: 'streamId',  KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      },
      {
        IndexName: 'district-date-index',
        KeySchema: [
          { AttributeName: 'districtDateBucket', KeyType: 'HASH'  },
          { AttributeName: 'timestamp',          KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    TtlAttribute: null,
  },
  {
    name: 'security_audit_logs',
    // Access pattern A: "All audit logs for actor X sorted by timestamp" → actor + timestamp
    KeySchema: [
      { AttributeName: 'actor',     KeyType: 'HASH'  },
      { AttributeName: 'timestamp', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'actor',     AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [],
    BillingMode: 'PAY_PER_REQUEST',
    TtlAttribute: null,
  }
];

// ── Fix 5: Idempotent TTL — check before set, safe to call every startup ───────
async function ensureTTL(client, tableName, ttlAttribute) {
  try {
    const desc = await client.send(new DescribeTimeToLiveCommand({ TableName: tableName }));
    const status = desc.TimeToLiveDescription?.TimeToLiveStatus; // ENABLED | ENABLING | DISABLED | DISABLING
    if (status === 'ENABLED' || status === 'ENABLING') {
      console.log(`[DynamoDB] ✓ TTL already active on ${tableName}.${ttlAttribute} (${status})`);
      return;
    }
    await client.send(new UpdateTimeToLiveCommand({
      TableName: tableName,
      TimeToLiveSpecification: { AttributeName: ttlAttribute, Enabled: true }
    }));
    console.log(`[DynamoDB] ✅ TTL enabled on ${tableName}.${ttlAttribute} (7-day auto-expire)`);
  } catch (ttlErr) {
    // Non-fatal — TTL is best-effort; records will still be written
    console.warn(`[DynamoDB] TTL ensure skipped for ${tableName}:`, ttlErr.message);
  }
}

// ── Fix 4: GSI validation — compare actual GSIs vs required schema ─────────────
async function validateGSIs(client, tableDef) {
  if (!tableDef.GlobalSecondaryIndexes || tableDef.GlobalSecondaryIndexes.length === 0) return;
  try {
    const desc = await client.send(new DescribeTableCommand({ TableName: tableDef.name }));
    const actualGSIs = (desc.Table?.GlobalSecondaryIndexes || []).map(g => g.IndexName);
    const requiredGSIs = tableDef.GlobalSecondaryIndexes.map(g => g.IndexName);
    const missingGSIs = requiredGSIs.filter(name => !actualGSIs.includes(name));
    if (missingGSIs.length > 0) {
      // Cannot auto-add GSIs to existing tables (requires recreation or UpdateTable).
      // Log a prominent warning so ops team is aware; route logic has Scan fallback.
      console.warn(
        `[DynamoDB] ⚠️  Table '${tableDef.name}' is MISSING GSI(s): [${missingGSIs.join(', ')}].`,
        'To fix: recreate the table or run an UpdateTable migration manually.',
        'Queries using these indexes will fall back to Scan.'
      );
    } else {
      console.log(`[DynamoDB] ✓ All GSIs verified on ${tableDef.name}: [${actualGSIs.join(', ')}]`);
    }
  } catch (err) {
    console.warn(`[DynamoDB] GSI validation failed for ${tableDef.name}:`, err.message);
  }
}

// ── Table bootstrap: create if missing, validate GSIs if existing, set TTL ─────
async function ensureTablesExist(client) {
  try {
    const listRes = await client.send(new ListTablesCommand({}));
    const existingTables = listRes.TableNames || [];

    for (const tableDef of TABLE_DEFINITIONS) {
      const exists = existingTables.includes(tableDef.name);

      if (!exists) {
        // ── Create new table ──
        console.log(`[DynamoDB] Creating table: ${tableDef.name} ...`);
        const createParams = {
          TableName:             tableDef.name,
          KeySchema:             tableDef.KeySchema,
          AttributeDefinitions:  tableDef.AttributeDefinitions,
          BillingMode:           tableDef.BillingMode,
        };
        // Only include GSIs when defined (CreateTableCommand rejects empty array)
        if (tableDef.GlobalSecondaryIndexes && tableDef.GlobalSecondaryIndexes.length > 0) {
          createParams.GlobalSecondaryIndexes = tableDef.GlobalSecondaryIndexes;
        }
        await client.send(new CreateTableCommand(createParams));
        console.log(`[DynamoDB] ✅ Table ${tableDef.name} created.`);

        // Fix 5: Set TTL immediately after creation — no setTimeout fragility
        if (tableDef.TtlAttribute) {
          await ensureTTL(client, tableDef.name, tableDef.TtlAttribute);
        }
      } else {
        console.log(`[DynamoDB] ✓ Table ${tableDef.name} already exists — validating...`);

        // Fix 4: Validate GSIs on existing tables
        await validateGSIs(client, tableDef);

        // Fix 5: Ensure TTL is set on every startup (idempotent)
        if (tableDef.TtlAttribute) {
          await ensureTTL(client, tableDef.name, tableDef.TtlAttribute);
        }
      }
    }
  } catch (err) {
    console.warn("[DynamoDB] Table bootstrap error:", err.message);
  }
}

if (hasAwsCredentials || isProduction) {
  try {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || "ap-south-1",
      credentials: hasAwsCredentials ? {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      } : undefined
    });
    docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        convertEmptyValues: true,
        removeUndefinedValues: true,
      }
    });
    console.log("⚡ AWS DynamoDB Client Initialized (region:", process.env.AWS_REGION || "ap-south-1", ")");
    // Run async — does not block server startup
    ensureTablesExist(client).catch(err => console.error("[DynamoDB] Bootstrap failed:", err.message));
  } catch (err) {
    console.error("❌ Failed to initialize AWS DynamoDB Client:", err.message);
  }
} else {
  const msg = "[DynamoDB] No AWS credentials — local mock mode. Set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY for real DynamoDB.";
  if (isProduction) {
    console.error(`⚠️ PRODUCTION WARNING: ${msg}`);
  } else {
    console.log(msg);
  }
}

// ── In-memory mock storage for local dev ──────────────────────────────────────
const mockStore = {
  outbreak_telemetry: [],
  sync_queues:        [],
  village_node_state: {},
  emergency_streams:  [],
  security_audit_logs: []
};

const dynamoHelper = {
  isMock: !docClient,

  // Returns schema info for health/detailed endpoint
  schema: TABLE_DEFINITIONS.map(t => ({
    name:     t.name,
    hashKey:  t.KeySchema[0].AttributeName,
    rangeKey: t.KeySchema[1]?.AttributeName || null,
    gsiCount: (t.GlobalSecondaryIndexes || []).length,
    ttl:      t.TtlAttribute || null,
    billing:  t.BillingMode
  })),

  // ── put ────────────────────────────────────────────────────────────────────
  async put(tableName, item) {
    if (docClient) {
      try {
        await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
        return { success: true, store: 'dynamodb' };
      } catch (err) {
        console.error(`[DynamoDB] Put Error on ${tableName}:`, err.message);
        if (!isProduction) {
          console.warn("[DynamoDB] Falling back to local mock.");
          this._putMock(tableName, item);
        }
        return { success: false, error: err.message };
      }
    } else {
      this._putMock(tableName, item);
      return { success: true, store: 'mock' };
    }
  },

  _putMock(tableName, item) {
    if (!mockStore[tableName]) mockStore[tableName] = [];
    if (tableName === 'village_node_state') {
      mockStore.village_node_state[item.villageId] = item;
    } else {
      mockStore[tableName].push({ ...item, _insertedAt: new Date().toISOString() });
    }
  },

  // ── get ────────────────────────────────────────────────────────────────────
  async get(tableName, key) {
    if (docClient) {
      try {
        const res = await docClient.send(new GetCommand({ TableName: tableName, Key: key }));
        return res.Item || null;
      } catch (err) {
        console.error(`[DynamoDB] Get Error on ${tableName}:`, err.message);
        return null;
      }
    } else {
      if (tableName === 'village_node_state') {
        return mockStore.village_node_state[key.villageId] || null;
      }
      return null;
    }
  },

  // ── Fix 1: query — named, expressive parameters ────────────────────────────
  async query(tableName, keyConditionExpression, expressionAttributeValues, indexName = null, extraParams = {}) {
    if (docClient) {
      try {
        const params = {
          TableName:                 tableName,
          KeyConditionExpression:    keyConditionExpression,
          ExpressionAttributeValues: expressionAttributeValues,
          ...extraParams,
        };
        if (indexName) params.IndexName = indexName;
        const res = await docClient.send(new QueryCommand(params));
        return res.Items || [];
      } catch (err) {
        console.error(`[DynamoDB] Query Error on ${tableName}:`, err.message);
        if (!isProduction) return this._queryMock(tableName, expressionAttributeValues);
        return [];
      }
    } else {
      return this._queryMock(tableName, expressionAttributeValues);
    }
  },

  // ── Fix 1: queryByVillage — Query using villageId PK + optional 7-day range ─
  // Replaces scan('outbreak_telemetry') for known-village lookups.
  async queryByVillage(tableName, villageId, daysBack = 7) {
    const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
    return this.query(
      tableName,
      'villageId = :vid AND detectedAt >= :cutoff',
      { ':vid': villageId, ':cutoff': cutoff }
    );
  },

  // ── queryByDisease — Query using GSI 'disease-index' ──────────────────────
  async queryByDisease(tableName, disease, daysBack = 7) {
    const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
    return this.query(
      tableName,
      'disease = :disease AND detectedAt >= :cutoff',
      { ':disease': disease, ':cutoff': cutoff },
      'disease-index'
    );
  },

  async queryByDistrict(tableName, districtId, daysBack = 7) {
    const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
    return this.query(
      tableName,
      'districtId = :districtId AND detectedAt >= :cutoff',
      { ':districtId': districtId, ':cutoff': cutoff },
      'district-time-index'
    );
  },

  async queryEmergenciesByDistrictDate(districtId, daysBack = 7) {
    const days = Math.max(1, Math.min(parseInt(daysBack, 10) || 7, 31));
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const buckets = [];
    for (let i = 0; i < days; i += 1) {
      const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      buckets.push(`${districtId}#${day}`);
    }
    const results = await Promise.all(buckets.map(bucket =>
      this.query(
        'emergency_streams',
        'districtDateBucket = :bucket AND #ts >= :cutoff',
        { ':bucket': bucket, ':cutoff': cutoff },
        'district-date-index',
        { ExpressionAttributeNames: { '#ts': 'timestamp' } }
      )
    ));
    return results.flat();
  },

  // ── Fix 1: queryRecentAll — Query ALL villages via page-by-page pattern ──────
  // Used when we need a cross-village view (e.g. heatmap, district report).
  // Falls back to Scan only in mock/dev mode for simplicity.
  async queryRecentAll(tableName, daysBack = 7) {
    if (docClient) {
      // Real DynamoDB: Scan with FilterExpression is unavoidable for cross-partition reads.
      // At production scale, this should be replaced with a time-series GSI or
      // aggregation Lambda. For now, we apply a FilterExpression to reduce data transfer.
      const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
      try {
        let items = [];
        let lastKey;
        do {
          const params = {
            TableName: tableName,
            FilterExpression: 'detectedAt >= :cutoff',
            ExpressionAttributeValues: { ':cutoff': cutoff },
            ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
          };
          const res = await docClient.send(new ScanCommand(params));
          items = items.concat(res.Items || []);
          lastKey = res.LastEvaluatedKey;
        } while (lastKey);
        return items;
      } catch (err) {
        console.error(`[DynamoDB] queryRecentAll Error on ${tableName}:`, err.message);
        return [];
      }
    } else {
      return this._scanMock(tableName);
    }
  },

  _queryMock(tableName, expressionAttributeValues) {
    if (tableName === 'village_node_state') return Object.values(mockStore.village_node_state);
    const list = mockStore[tableName] || [];
    const val  = expressionAttributeValues ? Object.values(expressionAttributeValues)[0] : null;
    if (val) {
      return list.filter(item =>
        item.villageId === val || item.village_id === val ||
        item.userId === val || item.deviceId === val ||
        item.districtId === val || item.districtDateBucket === val || item.disease === val
      );
    }
    return list;
  },

  // ── scan — kept for tables without a time-range key (sync_queues, emergency_streams) ──
  async scan(tableName) {
    if (docClient) {
      try {
        const res = await docClient.send(new ScanCommand({ TableName: tableName }));
        return res.Items || [];
      } catch (err) {
        console.error(`[DynamoDB] Scan Error on ${tableName}:`, err.message);
        if (!isProduction) return this._scanMock(tableName);
        return [];
      }
    } else {
      return this._scanMock(tableName);
    }
  },

  _scanMock(tableName) {
    if (tableName === 'village_node_state') return Object.values(mockStore.village_node_state);
    return mockStore[tableName] || [];
  },

  // ── Fix 3: updateNodeState — UpdateCommand avoids full-overwrite race conditions ──
  // Only updates the fields we explicitly pass; leaves other attributes untouched.
  async updateNodeState(villageId, status, lastActive, syncPendingCount) {
    const now     = Math.floor(Date.now() / 1000);
    const ttl     = now + (7 * 24 * 60 * 60); // 7-day epoch TTL

    if (docClient) {
      try {
        await docClient.send(new UpdateCommand({
          TableName: 'village_node_state',
          Key: { villageId },
          // Attribute names/values use # / : prefixes to avoid DynamoDB reserved-word conflicts
          UpdateExpression:
            'SET #st = :status, lastActive = :lastActive, syncPendingCount = :spc, expiresAt = :ttl',
          ExpressionAttributeNames:  { '#st': 'status' },
          ExpressionAttributeValues: {
            ':status':    status,
            ':lastActive': lastActive || new Date().toISOString(),
            ':spc':       syncPendingCount ?? 0,
            ':ttl':       ttl,
          },
          // Creates the item if it doesn't exist yet (upsert behaviour)
        }));
        return { success: true, store: 'dynamodb' };
      } catch (err) {
        console.error(`[DynamoDB] UpdateNodeState Error:`, err.message);
        // Fall through to mock in dev
        if (!isProduction) {
          this._putMock('village_node_state', { villageId, status, lastActive, syncPendingCount, expiresAt: ttl });
        }
        return { success: false, error: err.message };
      }
    } else {
      // Mock: simple object-store upsert (no race condition risk in single-process dev)
      const existing = mockStore.village_node_state[villageId] || {};
      mockStore.village_node_state[villageId] = {
        ...existing,
        villageId,
        status,
        lastActive: lastActive || new Date().toISOString(),
        syncPendingCount: syncPendingCount ?? 0,
        expiresAt: ttl,
      };
      return { success: true, store: 'mock' };
    }
  }
};

export default dynamoHelper;
