export async function initSchema(db, pool, usingSQLite) {
  if (pool) {
    // ── SCHEMA CREATION (Aurora PostgreSQL) ──────────────────────────────────
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) UNIQUE,
      email VARCHAR(120) UNIQUE,
      username VARCHAR(80),
      name VARCHAR(120),
      password VARCHAR(255),
      role VARCHAR(20),
      "villageId" VARCHAR(60),
      gender VARCHAR(20) DEFAULT NULL,
      age INTEGER DEFAULT NULL,
      economic_status VARCHAR(10) DEFAULT NULL,
      caste VARCHAR(20) DEFAULT NULL,
      area_type VARCHAR(10) DEFAULT NULL,
      aadhaar_masked VARCHAR(20) DEFAULT NULL,
      aadhaar_hash VARCHAR(64) DEFAULT NULL
    );
    CREATE TABLE IF NOT EXISTS otps (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20),
      otp VARCHAR(10),
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER,
      token TEXT UNIQUE NOT NULL,
      "expiresAt" TIMESTAMPTZ NOT NULL,
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS revoked_tokens (
      token TEXT PRIMARY KEY,
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
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
      lng DOUBLE PRECISION DEFAULT NULL
    );
    CREATE TABLE IF NOT EXISTS pregnancy_data (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120),
      age INTEGER,
      trimester INTEGER,
      "dueDate" VARCHAR(30),
      "riskLevel" VARCHAR(20),
      "villageId" VARCHAR(60)
    );
    CREATE TABLE IF NOT EXISTS malnutrition_data (
      id SERIAL PRIMARY KEY,
      "childName" VARCHAR(120),
      "ageMonths" INTEGER,
      weight DOUBLE PRECISION,
      height DOUBLE PRECISION,
      status VARCHAR(50),
      "villageId" VARCHAR(60)
    );
    CREATE TABLE IF NOT EXISTS symptoms (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER,
      "villageId" VARCHAR(60),
      symptoms TEXT,
      prediction TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS skin_logs (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER,
      "villageId" VARCHAR(60),
      condition VARCHAR(120),
      severity VARCHAR(20),
      "rednessPercent" INTEGER,
      "irregularPercent" INTEGER,
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS ambulance_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      name VARCHAR(120),
      location VARCHAR(255),
      priority VARCHAR(30),
      type VARCHAR(30) DEFAULT 'emergency',
      symptoms TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS ngo_reports (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255),
      content TEXT,
      "villageId" VARCHAR(60),
      date VARCHAR(30)
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
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
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
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS twilio_receipts (
      id SERIAL PRIMARY KEY,
      message_sid VARCHAR(60) UNIQUE,
      to_phone VARCHAR(20),
      status VARCHAR(30),
      error_code VARCHAR(20),
      error_message TEXT,
      received_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
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
  } else {
    // ── SQLite Schema Auto-Creation & Demo Data Seeding ──────────────────────
    console.log('📦 Initializing SQLite database schema and indexing...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE,
        email TEXT UNIQUE,
        username TEXT,
        name TEXT,
        password TEXT,
        role TEXT,
        "villageId" TEXT,
        gender TEXT DEFAULT NULL,
        age INTEGER DEFAULT NULL,
        economic_status TEXT DEFAULT NULL,
        caste TEXT DEFAULT NULL,
        area_type TEXT DEFAULT NULL,
        aadhaar_masked TEXT DEFAULT NULL,
        aadhaar_hash TEXT DEFAULT NULL
      );
      CREATE TABLE IF NOT EXISTS otps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT,
        otp TEXT,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        "userId" INTEGER,
        token TEXT UNIQUE NOT NULL,
        "expiresAt" DATETIME NOT NULL,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS revoked_tokens (
        token TEXT PRIMARY KEY,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
      );
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
        lng REAL DEFAULT NULL
      );
      CREATE TABLE IF NOT EXISTS pregnancy_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        age INTEGER,
        trimester INTEGER,
        "dueDate" TEXT,
        "riskLevel" TEXT,
        "villageId" TEXT
      );
      CREATE TABLE IF NOT EXISTS malnutrition_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        "childName" TEXT,
        "ageMonths" INTEGER,
        weight REAL,
        height REAL,
        status TEXT,
        "villageId" TEXT
      );
      CREATE TABLE IF NOT EXISTS symptoms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        "userId" INTEGER,
        "villageId" TEXT,
        symptoms TEXT,
        prediction TEXT,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS skin_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        "userId" INTEGER,
        "villageId" TEXT,
        condition TEXT,
        severity TEXT,
        "rednessPercent" INTEGER,
        "irregularPercent" INTEGER,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS ambulance_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT,
        location TEXT,
        priority TEXT,
        type TEXT DEFAULT 'emergency',
        symptoms TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS ngo_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        "villageId" TEXT,
        date TEXT
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS twilio_receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_sid TEXT UNIQUE,
        to_phone TEXT,
        status TEXT,
        error_code TEXT,
        error_message TEXT,
        received_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_sqlite_symptoms_villageid  ON symptoms("villageId");
      CREATE INDEX IF NOT EXISTS idx_sqlite_symptoms_createdat  ON symptoms("createdAt");
      CREATE INDEX IF NOT EXISTS idx_sqlite_ambulance_status    ON ambulance_requests(status);
      CREATE INDEX IF NOT EXISTS idx_sqlite_referrals_village   ON referrals("villageId");
      CREATE INDEX IF NOT EXISTS idx_sqlite_referrals_status    ON referrals(status);
    `);
  }
}
