export const GOVERNMENT_SCHEMES = [
  {
    name: 'Ayushman Bharat PM-JAY',
    name_hi: 'आयुष्मान भारत पीएम-जेएवाई',
    description: 'Free health insurance coverage of ₹5 lakhs per family per year for secondary and tertiary hospitalization.',
    benefit: '₹5,00,000 annual health coverage per family',
    category: 'health_insurance',
    min_age: 0, max_age: 120,
    gender_eligibility: 'all',
    caste_eligibility: 'all',
    economic_status_eligibility: 'BPL',
    area_type_eligibility: 'all',
    required_documents: 'Aadhaar Card,Ration Card,Income Certificate,Family SECC data',
    steps: '1. Visit nearest Ayushman Mitra at empanelled hospital|2. Show Aadhaar and ration card|3. Get Golden Card issued|4. Avail free treatment at any empanelled hospital'
  },
  {
    name: 'Janani Suraksha Yojana (JSY)',
    name_hi: 'जननी सुरक्षा योजना',
    description: 'Cash assistance for institutional delivery to reduce maternal and neonatal mortality.',
    benefit: '₹1,400 (Rural) or ₹1,00,000 (Urban) cash on institutional delivery',
    category: 'maternal_health',
    min_age: 14, max_age: 49,
    gender_eligibility: 'female',
    caste_eligibility: 'all',
    economic_status_eligibility: 'BPL',
    area_type_eligibility: 'all',
    required_documents: 'Aadhaar Card,MCH Card,BPL Certificate,Bank Account Details',
    steps: '1. Register with ASHA worker during pregnancy|2. Get antenatal checkups done|3. Deliver at a government hospital or empanelled private facility|4. Claim cash benefit through ASHA or hospital counter'
  },
  {
    name: 'Pradhan Mantri Matru Vandana Yojana (PMMVY)',
    name_hi: 'प्रधानमंत्री मातृ वंदना योजना',
    description: 'Maternity benefit program providing financial support to pregnant and lactating mothers.',
    benefit: '₹5,000 in three installments for first living child',
    category: 'maternal_health',
    min_age: 19, max_age: 49,
    gender_eligibility: 'female',
    caste_eligibility: 'all',
    economic_status_eligibility: 'all',
    area_type_eligibility: 'all',
    required_documents: 'Aadhaar Card,MCP Card,Bank Account,Registration at Anganwadi',
    steps: '1. Register at local Anganwadi Centre within 150 days of pregnancy|2. Submit first installment claim with LMP proof|3. Receive ₹1,00,000 after first ANC checkup|4. Get ₹2,000 after 6-month ANC|5. Receive ₹2,000 after child birth registration'
  },
  {
    name: 'Rashtriya Bal Swasthya Karyakram (RBSK)',
    name_hi: 'राष्ट्रीय बाल स्वास्थ्य कार्यक्रम',
    description: 'Free screening and treatment for children from birth to 18 years for 4Ds: Defects, Diseases, Deficiencies, and Developmental delays.',
    benefit: 'Free health screening and treatment up to ₹1 lakh',
    category: 'child_health',
    min_age: 0, max_age: 18,
    gender_eligibility: 'all',
    caste_eligibility: 'all',
    economic_status_eligibility: 'all',
    area_type_eligibility: 'all',
    required_documents: 'Birth Certificate,Aadhaar Card (for parents),School enrollment proof',
    steps: '1. Attend RBSK health camp at your school or Anganwadi|2. Health team screens for defects and conditions|3. If condition found, get referral letter|4. Visit District Early Intervention Centre (DEIC)|5. Receive free treatment or surgery'
  },
  {
    name: 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)',
    name_hi: 'pradhan mantri suraksha bima yojana',
    description: 'Accidental death and disability insurance at Rs.20/year premium.',
    benefit: 'Rs.2 lakh on accidental death; Rs.1 lakh on partial disability',
    category: 'insurance',
    min_age: 18, max_age: 70,
    gender_eligibility: 'all', caste_eligibility: 'all',
    economic_status_eligibility: 'all', area_type_eligibility: 'all',
    required_documents: 'Aadhaar Card,Bank Account with auto-debit facility',
    steps: '1. Visit bank branch|2. Fill PMSBY form|3. Link Aadhaar|4. Pay Rs.20 premium|5. Coverage starts same day'
  },
  {
    name: 'POSHAN 2.0 (Saksham Anganwadi)',
    name_hi: 'poshan 2.0 saksham anganwadi',
    description: 'Flagship nutrition mission for pregnant women, lactating mothers, children under 6.',
    benefit: 'Free supplementary nutrition, take-home rations, growth monitoring and counselling',
    category: 'nutrition',
    min_age: 0, max_age: 49,
    gender_eligibility: 'all', caste_eligibility: 'all',
    economic_status_eligibility: 'all', area_type_eligibility: 'rural',
    required_documents: 'Aadhaar Card,Birth Certificate,MCH Card',
    steps: '1. Visit nearest Anganwadi Centre|2. Register child or pregnancy|3. Receive free nutrition monthly|4. Attend growth monitoring|5. Track child milestones'
  },
  {
    name: 'National Tuberculosis Elimination Programme (NTEP)',
    name_hi: 'rashritya kshay unmulan karyakram',
    description: 'Free TB diagnosis, treatment, and nutritional support. India aims to eliminate TB by 2025.',
    benefit: 'Free diagnosis, free DOTS treatment, Rs.500/month nutritional support during TB treatment',
    category: 'disease',
    min_age: 0, max_age: 120,
    gender_eligibility: 'all', caste_eligibility: 'all',
    economic_status_eligibility: 'all', area_type_eligibility: 'all',
    required_documents: 'Aadhaar Card,Bank Account for DBT,Chest X-Ray or sputum test report',
    steps: '1. Visit government hospital or DOTS centre|2. Get free sputum test|3. Register on Ni-kshay if positive|4. Receive free DOTS treatment 6 months|5. Get Rs.500/month via DBT'
  },
  {
    name: 'Mission Indradhanush (Universal Immunization)',
    name_hi: 'mission indradhanush universal tikakaran',
    description: 'Full immunization for children under 2 years and pregnant women against 12 diseases.',
    benefit: 'Free vaccines for 12 diseases including Polio, DPT, Hepatitis B, Measles',
    category: 'child_health',
    min_age: 0, max_age: 2,
    gender_eligibility: 'all', caste_eligibility: 'all',
    economic_status_eligibility: 'all', area_type_eligibility: 'all',
    required_documents: 'Birth Certificate,MCH Card',
    steps: '1. Visit nearest Anganwadi or PHC|2. Register child within first month|3. Follow vaccination schedule|4. Get MCH Card stamped after each vaccine|5. Complete all rounds before age 2'
  }
];

export async function seedData(db, pool, usingSQLite, bcrypt) {
  if (pool) {
    const schemeCount = await pool.query('SELECT COUNT(*) FROM government_schemes');
    if (parseInt(schemeCount.rows[0].count) === 0) {
      for (const s of GOVERNMENT_SCHEMES) {
        await pool.query(
          `INSERT INTO government_schemes
           (name, name_hi, description, benefit, category, min_age, max_age,
            gender_eligibility, caste_eligibility, economic_status_eligibility,
            area_type_eligibility, required_documents, steps)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [s.name, s.name_hi, s.description, s.benefit, s.category,
           s.min_age, s.max_age, s.gender_eligibility, s.caste_eligibility,
           s.economic_status_eligibility, s.area_type_eligibility,
           s.required_documents, s.steps]
        );
      }
      console.log('Seeded government schemes into Aurora PostgreSQL.');
    }
  } else {
    // Seed default demo accounts in SQLite if missing
    const hash = await bcrypt.hash('Demo@1234', 10);
    const adminCheck = await db.get("SELECT id FROM users WHERE role = 'admin'");
    if (!adminCheck) {
      await db.run(
        'INSERT OR IGNORE INTO users (phone, email, username, name, password, role, "villageId") VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['9876543210', 'villager@swasthai.in', 'demo_villager', 'Ramesh Kumar', hash, 'villager', 'v101']
      );
      await db.run(
        'INSERT OR IGNORE INTO users (phone, email, username, name, password, role, "villageId") VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['9876543211', 'asha@swasthai.in', 'demo_asha', 'Sita Devi (ASHA)', hash, 'ngo', 'v101']
      );
      await db.run(
        'INSERT OR IGNORE INTO users (phone, email, username, name, password, role, "villageId") VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['9876543212', 'admin@swasthai.in', 'demo_admin', 'CMO Varanasi', hash, 'admin', null]
      );
      console.log('   👤 Default SQLite demo accounts seeded.');
    }

    // Seed standard villages in SQLite if missing
    const villageCheck = await db.get("SELECT id FROM village_health LIMIT 1");
    if (!villageCheck) {
      await db.run(
        `INSERT OR IGNORE INTO village_health
         ("villageId", name, population, pregnant_women, children_under_5,
          malnutrition_cases, asha_contact, "districtId", lat, lng, "lastUpdated")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        ['v101', 'Rampur', 1200, 14, 89, 7, '9876543211', 'varanasi_district', 25.3176, 82.9739]
      );
      await db.run(
        `INSERT OR IGNORE INTO village_health
         ("villageId", name, population, pregnant_women, children_under_5,
          malnutrition_cases, asha_contact, "districtId", lat, lng, "lastUpdated")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        ['v102', 'Mohanlal Ganj', 850, 9, 63, 4, '9876543213', 'lucknow_district', 26.7606, 80.8893]
      );
      console.log('   🏘️ Default SQLite villages seeded (with districtId + coords).');
    }

    // Seed default government schemes in SQLite if missing
    const schemeCheck = await db.get("SELECT id FROM government_schemes LIMIT 1");
    if (!schemeCheck) {
      for (const s of GOVERNMENT_SCHEMES) {
        await db.run(
          `INSERT INTO government_schemes
           (name, name_hi, description, benefit, category, min_age, max_age,
            gender_eligibility, caste_eligibility, economic_status_eligibility,
            area_type_eligibility, required_documents, steps)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [s.name, s.name_hi, s.description, s.benefit, s.category,
           s.min_age, s.max_age, s.gender_eligibility, s.caste_eligibility,
           s.economic_status_eligibility, s.area_type_eligibility,
           s.required_documents, s.steps]
        );
      }
      console.log('   📜 8 Government schemes seeded into SQLite.');
    }
  }
}

export async function seedDemoData(db, usingSQLite, bcrypt) {
  const hash = await bcrypt.hash('Demo@1234', 10);
  
  await db.run("DELETE FROM users WHERE username IN ('demo_villager', 'demo_asha', 'demo_admin')");
  await db.run("DELETE FROM village_health WHERE \"villageId\" IN ('v101', 'v102')");
  await db.run("DELETE FROM pregnancy_data WHERE \"villageId\" IN ('v101', 'v102')");
  await db.run("DELETE FROM malnutrition_data WHERE \"villageId\" IN ('v101', 'v102')");
  await db.run("DELETE FROM symptoms WHERE \"villageId\" IN ('v101', 'v102')");
  await db.run("DELETE FROM ambulance_requests WHERE priority IN ('High', 'Medium', 'Low', 'Pad Request')");

  await db.run('INSERT INTO users (phone, email, username, name, password, role, "villageId") VALUES (?, ?, ?, ?, ?, ?, ?)', ['9876543210', 'villager@swasthai.in', 'demo_villager', 'Ramesh Kumar', hash, 'villager', 'v101']);
  await db.run('INSERT INTO users (phone, email, username, name, password, role, "villageId") VALUES (?, ?, ?, ?, ?, ?, ?)', ['9876543211', 'asha@swasthai.in', 'demo_asha', 'Sita Devi (ASHA)', hash, 'ngo', 'v101']);
  await db.run('INSERT INTO users (phone, email, username, name, password, role, "villageId") VALUES (?, ?, ?, ?, ?, ?, ?)', ['9876543212', 'admin@swasthai.in', 'demo_admin', 'CMO Varanasi', hash, 'admin', null]);

  const nowSql = usingSQLite ? "datetime('now')" : "NOW()";
  await db.run(
    `INSERT INTO village_health
     ("villageId", name, population, pregnant_women, children_under_5,
      malnutrition_cases, asha_contact, "districtId", lat, lng, "lastUpdated")
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${nowSql})`,
    ['v101', 'Rampur', 1200, 14, 89, 7, '9876543211', 'varanasi_district', 25.3176, 82.9739]
  );
  await db.run(
    `INSERT INTO village_health
     ("villageId", name, population, pregnant_women, children_under_5,
      malnutrition_cases, asha_contact, "districtId", lat, lng, "lastUpdated")
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${nowSql})`,
    ['v102', 'Mohanlal Ganj', 850, 9, 63, 4, '9876543213', 'lucknow_district', 26.7606, 80.8893]
  );

  // Query demo ASHA/NGO worker ID for pregnancy recorded_by reference
  const ngoAcc = await db.get("SELECT id FROM users WHERE username = 'demo_asha'");
  const ngoUserId = ngoAcc?.id || null;

  await db.run('INSERT INTO pregnancy_data (name, age, trimester, "riskLevel", "dueDate", "villageId", recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?)', ['Sunita Devi', 24, 3, 'High', '2026-08-15', 'v101', ngoUserId]);
  await db.run('INSERT INTO pregnancy_data (name, age, trimester, "riskLevel", "dueDate", "villageId", recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?)', ['Meena Kumari', 21, 2, 'Low', '2026-11-05', 'v101', ngoUserId]);

  await db.run('INSERT INTO malnutrition_data ("childName", "ageMonths", weight, height, status, "villageId") VALUES (?, ?, ?, ?, ?, ?)', ['Raju', 24, 11.2, 85.0, 'Moderate', 'v101']);
  await db.run('INSERT INTO malnutrition_data ("childName", "ageMonths", weight, height, status, "villageId") VALUES (?, ?, ?, ?, ?, ?)', ['Priya', 36, 14.5, 95.0, 'Normal', 'v101']);

  await db.run(
    'INSERT INTO symptoms ("userId", "villageId", symptoms, prediction, disease, advice, confidence, model_used) VALUES (1, ?, ?, ?, ?, ?, ?, ?)',
    ['v101', 'Fever, cough, body pain for 3 days', 'Mild Viral Infection - Maintain hydration, isolate, report if temp exceeds 102F', 'Mild Viral Infection', 'Maintain hydration, isolate, report if temp exceeds 102F', 0.90, 'Offline Rule Matcher']
  );
  
  await db.run('INSERT INTO ambulance_requests (user_id, name, location, priority, type, request_type, symptoms, status) VALUES (1, ?, ?, ?, ?, ?, ?, ?)', ['Ramesh Kumar', 'Rampur, Near Primary School', 'High', 'emergency', 'ambulance', 'Severe chest pain and difficulty breathing', 'pending']);
  await db.run('INSERT INTO ambulance_requests (user_id, name, location, priority, type, request_type, symptoms, status) VALUES (1, ?, ?, ?, ?, ?, ?, ?)', ['Sita Devi', 'ASHA Center रामपुर', 'Low', 'operation', 'pad_request', 'Confidential request for sanitary pads supply', 'pending']);
}
