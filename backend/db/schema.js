import { GOVERNMENT_SCHEMES } from './seed.js';

export async function initSchema(db, pool, usingSQLite) {
  if (pool) {
    // ── SCHEMA CREATION (Aurora PostgreSQL) ──────────────────────────────────
    await pool.query(`
    CREATE TABLE IF NOT EXISTS village_health (
      id SERIAL PRIMARY KEY,
      "villageId" VARCHAR(60) UNIQUE,
      name VARCHAR(120),
      population INTEGER,
      pregnant_women INTEGER,
      children_under_5 INTEGER,
      malnutrition_cases INTEGER,
      asha_contact VARCHAR(20),
      "outbreakAlert" TEXT DEFAULT NULL,
      "lastUpdated" TIMESTAMPTZ DEFAULT NULL,
      "districtId" VARCHAR(80) DEFAULT NULL,
      lat DOUBLE PRECISION DEFAULT NULL,
      lng DOUBLE PRECISION DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) UNIQUE,
      email VARCHAR(120) UNIQUE,
      username VARCHAR(80),
      name VARCHAR(120),
      password VARCHAR(255),
      role VARCHAR(20),
      "villageId" VARCHAR(60) REFERENCES village_health("villageId") ON DELETE SET NULL,
      gender VARCHAR(20) DEFAULT NULL,
      age INTEGER DEFAULT NULL,
      economic_status VARCHAR(10) DEFAULT NULL,
      caste VARCHAR(20) DEFAULT NULL,
      area_type VARCHAR(10) DEFAULT NULL,
      aadhaar_masked VARCHAR(20) DEFAULT NULL,
      aadhaar_hash VARCHAR(64) DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS otps (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20),
      otp VARCHAR(10),
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER,
      token TEXT UNIQUE NOT NULL,
      "expiresAt" TIMESTAMPTZ NOT NULL,
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS revoked_tokens (
      token TEXT PRIMARY KEY,
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pregnancy_data (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120),
      age INTEGER,
      trimester INTEGER,
      "dueDate" VARCHAR(30),
      "riskLevel" VARCHAR(20),
      "villageId" VARCHAR(60),
      recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      client_request_id VARCHAR(120) UNIQUE DEFAULT NULL,
      systolic_bp INTEGER DEFAULT NULL,
      diastolic_bp INTEGER DEFAULT NULL,
      bs DOUBLE PRECISION DEFAULT NULL,
      body_temp DOUBLE PRECISION DEFAULT NULL,
      heart_rate INTEGER DEFAULT NULL,
      factors_json TEXT DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS malnutrition_data (
      id SERIAL PRIMARY KEY,
      "childName" VARCHAR(120),
      "ageMonths" INTEGER,
      weight DOUBLE PRECISION,
      height DOUBLE PRECISION,
      status VARCHAR(50),
      "villageId" VARCHAR(60),
      client_request_id VARCHAR(120) UNIQUE DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS symptoms (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER,
      "villageId" VARCHAR(60),
      symptoms TEXT,
      prediction TEXT,
      disease VARCHAR(120),
      advice TEXT,
      confidence REAL,
      model_used VARCHAR(50),
      client_request_id VARCHAR(120) UNIQUE DEFAULT NULL,
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skin_logs (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER,
      "villageId" VARCHAR(60),
      condition VARCHAR(120),
      severity VARCHAR(20),
      "rednessPercent" INTEGER,
      "irregularPercent" INTEGER,
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ambulance_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      name VARCHAR(120),
      location VARCHAR(255),
      priority VARCHAR(30),
      type VARCHAR(30) DEFAULT 'emergency',
      request_type VARCHAR(30) DEFAULT 'ambulance',
      symptoms TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      client_request_id VARCHAR(120) UNIQUE DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ngo_reports (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255),
      content TEXT,
      "villageId" VARCHAR(60),
      date VARCHAR(30),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS government_schemes (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      name_hi VARCHAR(255),
      description TEXT,
      benefit TEXT,
      category VARCHAR(50),
      min_age INTEGER DEFAULT 0,
      max_age INTEGER DEFAULT 120,
      gender_eligibility VARCHAR(20) DEFAULT 'all',
      caste_eligibility VARCHAR(255) DEFAULT 'all',
      economic_status_eligibility VARCHAR(10) DEFAULT 'all',
      area_type_eligibility VARCHAR(10) DEFAULT 'all',
      required_documents TEXT,
      steps TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id SERIAL PRIMARY KEY,
      patient_name VARCHAR(120) NOT NULL,
      patient_phone VARCHAR(20),
      "villageId" VARCHAR(60),
      referred_by INTEGER,
      referred_to VARCHAR(120),
      reason TEXT,
      priority VARCHAR(20) DEFAULT 'routine',
      status VARCHAR(20) DEFAULT 'pending',
      notes TEXT,
      outcome VARCHAR(120) DEFAULT NULL,
      outcome_details TEXT DEFAULT NULL,
      closed_at TIMESTAMPTZ DEFAULT NULL,
      client_request_id VARCHAR(120) UNIQUE DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS village_bulk_uploads (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255),
      uploaded_by INTEGER,
      rows_inserted INTEGER DEFAULT 0,
      rows_skipped INTEGER DEFAULT 0,
      errors TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS twilio_receipts (
      id SERIAL PRIMARY KEY,
      message_sid VARCHAR(60) UNIQUE,
      to_phone VARCHAR(20),
      status VARCHAR(30),
      error_code VARCHAR(20),
      error_message TEXT,
      received_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vaccination_records (
      id SERIAL PRIMARY KEY,
      child_name VARCHAR(120) NOT NULL,
      parent_phone VARCHAR(20),
      vaccine_name VARCHAR(120) NOT NULL,
      scheduled_date VARCHAR(30),
      given_date VARCHAR(30) DEFAULT NULL,
      status VARCHAR(20) DEFAULT 'scheduled',
      "villageId" VARCHAR(60) REFERENCES village_health("villageId") ON DELETE SET NULL,
      recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      client_request_id VARCHAR(120) UNIQUE DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS asha_performance (
      id SERIAL PRIMARY KEY,
      asha_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      month VARCHAR(10) NOT NULL,
      referrals_count INTEGER DEFAULT 0,
      pregnancies_tracked INTEGER DEFAULT 0,
      vaccinations_completed INTEGER DEFAULT 0,
      emergencies_reported INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(asha_id, month)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      action VARCHAR(120) NOT NULL,
      resource VARCHAR(120) NOT NULL,
      resource_id VARCHAR(120) DEFAULT NULL,
      ip_address VARCHAR(45) DEFAULT NULL,
      user_agent TEXT DEFAULT NULL,
      trace_id VARCHAR(120) DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS district_config (
      id SERIAL PRIMARY KEY,
      district_id VARCHAR(80) UNIQUE NOT NULL,
      outbreak_threshold INTEGER DEFAULT 3,
      enable_auto_ambulance BOOLEAN DEFAULT TRUE,
      emergency_contact_phone VARCHAR(20) DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Setup modtime triggers
    DROP TRIGGER IF EXISTS update_users_modtime ON users;
    CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_otps_modtime ON otps;
    CREATE TRIGGER update_otps_modtime BEFORE UPDATE ON otps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_refresh_tokens_modtime ON refresh_tokens;
    CREATE TRIGGER update_refresh_tokens_modtime BEFORE UPDATE ON refresh_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_revoked_tokens_modtime ON revoked_tokens;
    CREATE TRIGGER update_revoked_tokens_modtime BEFORE UPDATE ON revoked_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_village_health_modtime ON village_health;
    CREATE TRIGGER update_village_health_modtime BEFORE UPDATE ON village_health FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_pregnancy_data_modtime ON pregnancy_data;
    CREATE TRIGGER update_pregnancy_data_modtime BEFORE UPDATE ON pregnancy_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_malnutrition_data_modtime ON malnutrition_data;
    CREATE TRIGGER update_malnutrition_data_modtime BEFORE UPDATE ON malnutrition_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_symptoms_modtime ON symptoms;
    CREATE TRIGGER update_symptoms_modtime BEFORE UPDATE ON symptoms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_skin_logs_modtime ON skin_logs;
    CREATE TRIGGER update_skin_logs_modtime BEFORE UPDATE ON skin_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_ambulance_requests_modtime ON ambulance_requests;
    CREATE TRIGGER update_ambulance_requests_modtime BEFORE UPDATE ON ambulance_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_ngo_reports_modtime ON ngo_reports;
    CREATE TRIGGER update_ngo_reports_modtime BEFORE UPDATE ON ngo_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_government_schemes_modtime ON government_schemes;
    CREATE TRIGGER update_government_schemes_modtime BEFORE UPDATE ON government_schemes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_referrals_modtime ON referrals;
    CREATE TRIGGER update_referrals_modtime BEFORE UPDATE ON referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_village_bulk_uploads_modtime ON village_bulk_uploads;
    CREATE TRIGGER update_village_bulk_uploads_modtime BEFORE UPDATE ON village_bulk_uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_twilio_receipts_modtime ON twilio_receipts;
    CREATE TRIGGER update_twilio_receipts_modtime BEFORE UPDATE ON twilio_receipts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_vaccination_records_modtime ON vaccination_records;
    CREATE TRIGGER update_vaccination_records_modtime BEFORE UPDATE ON vaccination_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_asha_performance_modtime ON asha_performance;
    CREATE TRIGGER update_asha_performance_modtime BEFORE UPDATE ON asha_performance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_district_config_modtime ON district_config;
    CREATE TRIGGER update_district_config_modtime BEFORE UPDATE ON district_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // ── PERFORMANCE INDEXES ──────────────────────────────────────────────────
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_symptoms_villageid    ON symptoms("villageId");
      CREATE INDEX IF NOT EXISTS idx_symptoms_userid       ON symptoms("userId");
      CREATE INDEX IF NOT EXISTS idx_symptoms_createdat    ON symptoms("createdAt");
      CREATE INDEX IF NOT EXISTS idx_ambulance_userid      ON ambulance_requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_ambulance_status      ON ambulance_requests(status);
      CREATE INDEX IF NOT EXISTS idx_pregnancy_village     ON pregnancy_data("villageId");
      CREATE INDEX IF NOT EXISTS idx_malnut_village        ON malnutrition_data("villageId");
      CREATE INDEX IF NOT EXISTS idx_referrals_village     ON referrals("villageId");
      CREATE INDEX IF NOT EXISTS idx_referrals_status      ON referrals(status);
      CREATE INDEX IF NOT EXISTS idx_bulkuploads_by        ON village_bulk_uploads(uploaded_by);
      CREATE INDEX IF NOT EXISTS idx_twilio_sid            ON twilio_receipts(message_sid);
      CREATE INDEX IF NOT EXISTS idx_otps_createdat        ON otps("createdAt");
    `);

    // ── POSTGRESQL COLUMN AUTO-MIGRATION ───────────────────────────────────
    const addColIfMissing = async (table, col, colType) => {
      try {
        const cleanColName = col.replace(/"/g, ''); // Strip quotes for catalog lookup
        const res = await pool.query(
          `SELECT column_name FROM information_schema.columns
           WHERE table_name=$1 AND column_name=$2`,
          [table, cleanColName]
        );
        if (res.rowCount === 0) {
          await pool.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${colType}`);
          console.log(`[MIGRATION] Added column ${col} to ${table}`);
        }
      } catch (err) {
        console.error(`Migration error (${table}.${col}):`, err.message);
      }
    };

    await addColIfMissing('users', 'gender', 'VARCHAR(20) DEFAULT NULL');
    await addColIfMissing('users', 'age', 'INTEGER DEFAULT NULL');
    await addColIfMissing('users', 'economic_status', 'VARCHAR(10) DEFAULT NULL');
    await addColIfMissing('users', 'caste', 'VARCHAR(20) DEFAULT NULL');
    await addColIfMissing('users', 'area_type', 'VARCHAR(10) DEFAULT NULL');
    await addColIfMissing('users', 'aadhaar_masked', 'VARCHAR(20) DEFAULT NULL');
    await addColIfMissing('users', 'aadhaar_hash', 'VARCHAR(64) DEFAULT NULL');
    await addColIfMissing('village_health', '"outbreakAlert"', 'TEXT DEFAULT NULL');
    await addColIfMissing('village_health', '"lastUpdated"', 'TIMESTAMPTZ DEFAULT NULL');
    await addColIfMissing('village_health', '"districtId"', 'VARCHAR(80) DEFAULT NULL');
    await addColIfMissing('village_health', 'lat', 'DOUBLE PRECISION DEFAULT NULL');
    await addColIfMissing('village_health', 'lng', 'DOUBLE PRECISION DEFAULT NULL');
    await addColIfMissing('ambulance_requests', 'type', "VARCHAR(30) DEFAULT 'emergency'");
    await addColIfMissing('ambulance_requests', 'request_type', "VARCHAR(30) DEFAULT 'ambulance'");
    await addColIfMissing('ambulance_requests', 'client_request_id', 'VARCHAR(120) DEFAULT NULL');
    await addColIfMissing('ambulance_requests', 'updated_at', 'TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP');
    await addColIfMissing('users', 'created_at', 'TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP');
    await addColIfMissing('users', 'updated_at', 'TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP');
    await addColIfMissing('pregnancy_data', 'recorded_by', 'INTEGER REFERENCES users(id) ON DELETE SET NULL');
    await addColIfMissing('pregnancy_data', 'client_request_id', 'VARCHAR(120) DEFAULT NULL');
    await addColIfMissing('pregnancy_data', 'systolic_bp', 'INTEGER DEFAULT NULL');
    await addColIfMissing('pregnancy_data', 'diastolic_bp', 'INTEGER DEFAULT NULL');
    await addColIfMissing('pregnancy_data', 'bs', 'DOUBLE PRECISION DEFAULT NULL');
    await addColIfMissing('pregnancy_data', 'body_temp', 'DOUBLE PRECISION DEFAULT NULL');
    await addColIfMissing('pregnancy_data', 'heart_rate', 'INTEGER DEFAULT NULL');
    await addColIfMissing('pregnancy_data', 'factors_json', 'TEXT DEFAULT NULL');
    await addColIfMissing('pregnancy_data', 'updated_at', 'TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP');
    await addColIfMissing('symptoms', 'disease', 'VARCHAR(120) DEFAULT NULL');
    await addColIfMissing('symptoms', 'advice', 'TEXT DEFAULT NULL');
    await addColIfMissing('symptoms', 'confidence', 'REAL DEFAULT NULL');
    await addColIfMissing('symptoms', 'model_used', 'VARCHAR(50) DEFAULT NULL');
    await addColIfMissing('symptoms', 'client_request_id', 'VARCHAR(120) DEFAULT NULL');
    await addColIfMissing('symptoms', 'updated_at', 'TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP');
    await addColIfMissing('malnutrition_data', 'client_request_id', 'VARCHAR(120) DEFAULT NULL');
    await addColIfMissing('referrals', 'outcome', 'VARCHAR(120) DEFAULT NULL');
    await addColIfMissing('referrals', 'outcome_details', 'TEXT DEFAULT NULL');
    await addColIfMissing('referrals', 'closed_at', 'TIMESTAMPTZ DEFAULT NULL');
    await addColIfMissing('referrals', 'client_request_id', 'VARCHAR(120) DEFAULT NULL');
    await addColIfMissing('vaccination_records', 'client_request_id', 'VARCHAR(120) DEFAULT NULL');
    await addColIfMissing('audit_logs', 'trace_id', 'VARCHAR(120) DEFAULT NULL');
    await addColIfMissing('government_schemes', 'start_year', 'INTEGER DEFAULT NULL');
    await addColIfMissing('government_schemes', 'official_url', 'TEXT DEFAULT NULL');
    await addColIfMissing('government_schemes', 'why_helps', 'TEXT DEFAULT NULL');
    await addColIfMissing('government_schemes', 'why_helps_hi', 'TEXT DEFAULT NULL');
    await addColIfMissing('government_schemes', 'helpline', 'VARCHAR(80) DEFAULT NULL');

    // ── Upsert enriched scheme data for existing + missing schemes ─────────
    try {
      for (const sc of GOVERNMENT_SCHEMES) {
        await pool.query(
          `INSERT INTO government_schemes
           (name, name_hi, description, benefit, category, min_age, max_age,
            gender_eligibility, caste_eligibility, economic_status_eligibility,
            area_type_eligibility, required_documents, steps,
            start_year, official_url, why_helps, why_helps_hi, helpline)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
           ON CONFLICT (name) DO UPDATE SET
             name_hi=EXCLUDED.name_hi, description=EXCLUDED.description,
             benefit=EXCLUDED.benefit, why_helps=EXCLUDED.why_helps,
             why_helps_hi=EXCLUDED.why_helps_hi, start_year=EXCLUDED.start_year,
             official_url=EXCLUDED.official_url, helpline=EXCLUDED.helpline,
             steps=EXCLUDED.steps, required_documents=EXCLUDED.required_documents`,
          [sc.name, sc.name_hi, sc.description, sc.benefit, sc.category,
           sc.min_age, sc.max_age, sc.gender_eligibility, sc.caste_eligibility,
           sc.economic_status_eligibility, sc.area_type_eligibility,
           sc.required_documents, sc.steps,
           sc.start_year || null, sc.official_url || null,
           sc.why_helps || null, sc.why_helps_hi || null, sc.helpline || null]
        );
      }
      console.log('[MIGRATION] Schemes upserted — 20 schemes now in DB.');
    } catch (upErr) {
      // ON CONFLICT requires unique constraint on name — add it if missing
      try {
        await pool.query('ALTER TABLE government_schemes ADD CONSTRAINT gs_name_unique UNIQUE (name)');
        console.log('[MIGRATION] Added unique constraint on government_schemes.name');
      } catch (_) {} // Already exists, ignore
    }

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_symptoms_client_request       ON symptoms(client_request_id) WHERE client_request_id IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_ambulance_client_request      ON ambulance_requests(client_request_id) WHERE client_request_id IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_pregnancy_client_request      ON pregnancy_data(client_request_id) WHERE client_request_id IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_malnutrition_client_request   ON malnutrition_data(client_request_id) WHERE client_request_id IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_client_request      ON referrals(client_request_id) WHERE client_request_id IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_vaccination_client_request    ON vaccination_records(client_request_id) WHERE client_request_id IS NOT NULL;
    `);
  } else {
    // ── SQLite Schema Auto-Creation & Demo Data Seeding ──────────────────────
    console.log('📦 Initializing SQLite database schema and indexing...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS village_health (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        "villageId" TEXT UNIQUE,
        name TEXT,
        population INTEGER,
        pregnant_women INTEGER,
        children_under_5 INTEGER,
        malnutrition_cases INTEGER,
        asha_contact TEXT,
        "outbreakAlert" TEXT DEFAULT NULL,
        "lastUpdated" DATETIME DEFAULT NULL,
        "districtId" TEXT DEFAULT NULL,
        lat REAL DEFAULT NULL,
        lng REAL DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE,
        email TEXT UNIQUE,
        username TEXT,
        name TEXT,
        password TEXT,
        role TEXT,
        "villageId" TEXT REFERENCES village_health("villageId") ON DELETE SET NULL,
        gender TEXT DEFAULT NULL,
        age INTEGER DEFAULT NULL,
        economic_status TEXT DEFAULT NULL,
        caste TEXT DEFAULT NULL,
        area_type TEXT DEFAULT NULL,
        aadhaar_masked TEXT DEFAULT NULL,
        aadhaar_hash TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS otps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT,
        otp TEXT,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        "userId" INTEGER,
        token TEXT UNIQUE NOT NULL,
        "expiresAt" DATETIME NOT NULL,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS revoked_tokens (
        token TEXT PRIMARY KEY,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pregnancy_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        age INTEGER,
        trimester INTEGER,
        "dueDate" TEXT,
        "riskLevel" TEXT,
        "villageId" TEXT,
        recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        client_request_id TEXT UNIQUE DEFAULT NULL,
        systolic_bp INTEGER DEFAULT NULL,
        diastolic_bp INTEGER DEFAULT NULL,
        bs REAL DEFAULT NULL,
        body_temp REAL DEFAULT NULL,
        heart_rate INTEGER DEFAULT NULL,
        factors_json TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS malnutrition_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        "childName" TEXT,
        "ageMonths" INTEGER,
        weight REAL,
        height REAL,
        status TEXT,
        "villageId" TEXT,
        client_request_id TEXT UNIQUE DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS symptoms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        "userId" INTEGER,
        "villageId" TEXT,
        symptoms TEXT,
        prediction TEXT,
        disease TEXT,
        advice TEXT,
        confidence REAL,
        model_used TEXT,
        client_request_id TEXT UNIQUE DEFAULT NULL,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS skin_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        "userId" INTEGER,
        "villageId" TEXT,
        condition TEXT,
        severity TEXT,
        "rednessPercent" INTEGER,
        "irregularPercent" INTEGER,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ambulance_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT,
        location TEXT,
        priority TEXT,
        type TEXT DEFAULT 'emergency',
        request_type TEXT DEFAULT 'ambulance',
        symptoms TEXT,
        status TEXT DEFAULT 'pending',
        client_request_id TEXT UNIQUE DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ngo_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        "villageId" TEXT,
        date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS government_schemes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        name_hi TEXT,
        description TEXT,
        benefit TEXT,
        category TEXT,
        min_age INTEGER DEFAULT 0,
        max_age INTEGER DEFAULT 120,
        gender_eligibility TEXT DEFAULT 'all',
        caste_eligibility TEXT DEFAULT 'all',
        economic_status_eligibility TEXT DEFAULT 'all',
        area_type_eligibility TEXT DEFAULT 'all',
        required_documents TEXT,
        steps TEXT,
        start_year INTEGER DEFAULT NULL,
        official_url TEXT DEFAULT NULL,
        why_helps TEXT DEFAULT NULL,
        why_helps_hi TEXT DEFAULT NULL,
        helpline TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS referrals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_name TEXT NOT NULL,
        patient_phone TEXT,
        "villageId" TEXT,
        referred_by INTEGER,
        referred_to TEXT,
        reason TEXT,
        priority TEXT DEFAULT 'routine',
        status TEXT DEFAULT 'pending',
        notes TEXT,
        outcome TEXT DEFAULT NULL,
        outcome_details TEXT DEFAULT NULL,
        closed_at DATETIME DEFAULT NULL,
        client_request_id TEXT UNIQUE DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS village_bulk_uploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT,
        uploaded_by INTEGER,
        rows_inserted INTEGER DEFAULT 0,
        rows_skipped INTEGER DEFAULT 0,
        errors TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS twilio_receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_sid TEXT UNIQUE,
        to_phone TEXT,
        status TEXT,
        error_code TEXT,
        error_message TEXT,
        received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS vaccination_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        child_name TEXT NOT NULL,
        parent_phone TEXT,
        vaccine_name TEXT NOT NULL,
        scheduled_date TEXT,
        given_date TEXT DEFAULT NULL,
        status TEXT DEFAULT 'scheduled',
        "villageId" TEXT REFERENCES village_health("villageId") ON DELETE SET NULL,
        recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        client_request_id TEXT UNIQUE DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS asha_performance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asha_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        month TEXT NOT NULL,
        referrals_count INTEGER DEFAULT 0,
        pregnancies_tracked INTEGER DEFAULT 0,
        vaccinations_completed INTEGER DEFAULT 0,
        emergencies_reported INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(asha_id, month)
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        resource_id TEXT DEFAULT NULL,
        ip_address TEXT DEFAULT NULL,
        user_agent TEXT DEFAULT NULL,
        trace_id TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS district_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        district_id TEXT UNIQUE NOT NULL,
        outbreak_threshold INTEGER DEFAULT 3,
        enable_auto_ambulance BOOLEAN DEFAULT 1,
        emergency_contact_phone TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_sqlite_symptoms_villageid  ON symptoms("villageId");
      CREATE INDEX IF NOT EXISTS idx_sqlite_symptoms_createdat  ON symptoms("createdAt");
      CREATE INDEX IF NOT EXISTS idx_sqlite_ambulance_status    ON ambulance_requests(status);
      CREATE INDEX IF NOT EXISTS idx_sqlite_referrals_village   ON referrals("villageId");
      CREATE INDEX IF NOT EXISTS idx_sqlite_referrals_status    ON referrals(status);
      CREATE INDEX IF NOT EXISTS idx_sqlite_otps_createdat      ON otps("createdAt");

      -- Triggers for auto-updating updated_at columns in SQLite
      CREATE TRIGGER IF NOT EXISTS update_users_modtime AFTER UPDATE ON users FOR EACH ROW
      BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_village_health_modtime AFTER UPDATE ON village_health FOR EACH ROW
      BEGIN
        UPDATE village_health SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_pregnancy_data_modtime AFTER UPDATE ON pregnancy_data FOR EACH ROW
      BEGIN
        UPDATE pregnancy_data SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_malnutrition_data_modtime AFTER UPDATE ON malnutrition_data FOR EACH ROW
      BEGIN
        UPDATE malnutrition_data SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_symptoms_modtime AFTER UPDATE ON symptoms FOR EACH ROW
      BEGIN
        UPDATE symptoms SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_skin_logs_modtime AFTER UPDATE ON skin_logs FOR EACH ROW
      BEGIN
        UPDATE skin_logs SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_ambulance_requests_modtime AFTER UPDATE ON ambulance_requests FOR EACH ROW
      BEGIN
        UPDATE ambulance_requests SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_referrals_modtime AFTER UPDATE ON referrals FOR EACH ROW
      BEGIN
        UPDATE referrals SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_vaccination_records_modtime AFTER UPDATE ON vaccination_records FOR EACH ROW
      BEGIN
        UPDATE vaccination_records SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_asha_performance_modtime AFTER UPDATE ON asha_performance FOR EACH ROW
      BEGIN
        UPDATE asha_performance SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_district_config_modtime AFTER UPDATE ON district_config FOR EACH ROW
      BEGIN
        UPDATE district_config SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;
    `);

    // ── SQLite COLUMN AUTO-MIGRATION ───────────────────────────────────────
    const addSQLiteColIfMissing = async (table, col, colType) => {
      try {
        const info = await db.all(`PRAGMA table_info(${table})`);
        const exists = info.some(c => c.name === col.replace(/"/g, ''));
        if (!exists) {
          await db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${colType}`);
          console.log(`[SQLite MIGRATION] Added column ${col} to ${table}`);
        }
      } catch (err) {
        console.error(`SQLite migration error (${table}.${col}):`, err.message);
      }
    };

    await addSQLiteColIfMissing('users', 'gender', 'TEXT DEFAULT NULL');
    await addSQLiteColIfMissing('users', 'age', 'INTEGER DEFAULT NULL');
    await addSQLiteColIfMissing('users', 'economic_status', 'TEXT DEFAULT NULL');
    await addSQLiteColIfMissing('users', 'caste', 'TEXT DEFAULT NULL');
    await addSQLiteColIfMissing('users', 'area_type', 'TEXT DEFAULT NULL');
    await addSQLiteColIfMissing('users', 'aadhaar_masked', 'TEXT DEFAULT NULL');
    await addSQLiteColIfMissing('users', 'aadhaar_hash', 'TEXT DEFAULT NULL');
    await addSQLiteColIfMissing('users', 'created_at', 'DATETIME DEFAULT NULL');
    await addSQLiteColIfMissing('users', 'updated_at', 'DATETIME DEFAULT NULL');

    await addSQLiteColIfMissing('village_health', '"outbreakAlert"', 'TEXT DEFAULT NULL');
    await addSQLiteColIfMissing('village_health', '"lastUpdated"', 'DATETIME DEFAULT NULL');
    await addSQLiteColIfMissing('village_health', '"districtId"', 'TEXT DEFAULT NULL');
    await addSQLiteColIfMissing('village_health', 'lat', 'REAL DEFAULT NULL');
    await addSQLiteColIfMissing('village_health', 'lng', 'REAL DEFAULT NULL');
    await addSQLiteColIfMissing('village_health', 'updated_at', 'DATETIME DEFAULT NULL');

    await addSQLiteColIfMissing('ambulance_requests', 'type', "TEXT DEFAULT 'emergency'");
    await addSQLiteColIfMissing('ambulance_requests', 'request_type', "TEXT DEFAULT 'ambulance'");
    await addSQLiteColIfMissing('ambulance_requests', 'client_request_id', 'TEXT DEFAULT NULL');
    await addSQLiteColIfMissing('ambulance_requests', 'updated_at', 'DATETIME DEFAULT NULL');

    await addSQLiteColIfMissing('pregnancy_data', 'recorded_by', 'INTEGER REFERENCES users(id) ON DELETE SET NULL');
    await addSQLiteColIfMissing('pregnancy_data', 'client_request_id', 'TEXT DEFAULT NULL');
    await addSQLiteColIfMissing('pregnancy_data', 'systolic_bp', 'INTEGER DEFAULT NULL');
    await addSQLiteColIfMissing('pregnancy_data', 'diastolic_bp', 'INTEGER DEFAULT NULL');
    await addSQLiteColIfMissing('pregnancy_data', 'bs', 'REAL DEFAULT NULL');
    await addSQLiteColIfMissing('pregnancy_data', 'body_temp', 'REAL DEFAULT NULL');
    await addSQLiteColIfMissing('pregnancy_data', 'heart_rate', 'INTEGER DEFAULT NULL');
    await addSQLiteColIfMissing('pregnancy_data', 'factors_json', 'TEXT DEFAULT NULL');
    await addSQLiteColIfMissing('pregnancy_data', 'updated_at', 'DATETIME DEFAULT NULL');

    await addSQLiteColIfMissing('symptoms', 'disease', 'TEXT DEFAULT NULL');
    await addSQLiteColIfMissing('symptoms', 'advice', 'TEXT DEFAULT NULL');
    await addSQLiteColIfMissing('symptoms', 'confidence', 'REAL DEFAULT NULL');
    await addSQLiteColIfMissing('symptoms', 'model_used', 'TEXT DEFAULT NULL');
    await addSQLiteColIfMissing('symptoms', 'client_request_id', 'TEXT DEFAULT NULL');
    await addSQLiteColIfMissing('symptoms', 'updated_at', 'DATETIME DEFAULT NULL');
    await addSQLiteColIfMissing('malnutrition_data', 'client_request_id', 'TEXT DEFAULT NULL');

    await addSQLiteColIfMissing('referrals', 'outcome', 'TEXT DEFAULT NULL');
    await addSQLiteColIfMissing('referrals', 'outcome_details', 'TEXT DEFAULT NULL');
    await addSQLiteColIfMissing('referrals', 'closed_at', 'DATETIME DEFAULT NULL');
    await addSQLiteColIfMissing('referrals', 'client_request_id', 'TEXT DEFAULT NULL');
    await addSQLiteColIfMissing('vaccination_records', 'client_request_id', 'TEXT DEFAULT NULL');
    await addSQLiteColIfMissing('audit_logs', 'trace_id', 'TEXT DEFAULT NULL');

    await db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sqlite_symptoms_client_request      ON symptoms(client_request_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sqlite_ambulance_client_request     ON ambulance_requests(client_request_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sqlite_pregnancy_client_request     ON pregnancy_data(client_request_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sqlite_malnutrition_client_request  ON malnutrition_data(client_request_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sqlite_referrals_client_request     ON referrals(client_request_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sqlite_vaccination_client_request  ON vaccination_records(client_request_id);
    `);
  }
}
