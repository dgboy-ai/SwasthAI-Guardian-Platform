// ─────────────────────────────────────────────────────────────────────────────
// Government Schemes Seed Data — 20 Verified National Health Programs
// Sources: nhm.gov.in, pmjay.gov.in, india.gov.in, mohfw.gov.in
// Updated: June 2026
// ─────────────────────────────────────────────────────────────────────────────
export const GOVERNMENT_SCHEMES = [
  {
    name: 'Ayushman Bharat PM-JAY',
    name_hi: 'आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना',
    description: 'World\'s largest government-funded health insurance scheme. Provides free health coverage of ₹5 lakhs per family per year for secondary and tertiary hospitalization at empanelled hospitals across India.',
    benefit: '₹5,00,000 free hospital treatment per family every year',
    why_helps: 'If you or anyone in your family needs a serious operation or stays in the hospital, you will NOT have to pay anything. This card is accepted at thousands of government and private hospitals. Your family stays protected from big medical bills.',
    why_helps_hi: 'अगर आपके परिवार में किसी को बड़ा ऑपरेशन या लंबे समय तक अस्पताल में रहना पड़े, तो आपको एक भी रुपया नहीं देना होगा। यह कार्ड हजारों सरकारी और निजी अस्पतालों में मान्य है।',
    category: 'health_insurance',
    min_age: 0, max_age: 120,
    gender_eligibility: 'all', caste_eligibility: 'all',
    economic_status_eligibility: 'BPL', area_type_eligibility: 'all',
    required_documents: 'Aadhaar Card,Ration Card,Income Certificate,SECC Data (Socio-Economic Caste Census)',
    steps: '1. Visit nearest empanelled hospital (any government hospital or listed private hospital)|2. Ask for the Ayushman Mitra desk at the hospital entrance|3. Show your Aadhaar card and ration card|4. Hospital will verify your name in the PM-JAY list|5. Get your Golden Card issued (free)|6. Use the Golden Card for free treatment anytime',
    start_year: 2018,
    official_url: 'https://pmjay.gov.in',
    helpline: '14555'
  },
  {
    name: 'Janani Suraksha Yojana (JSY)',
    name_hi: 'जननी सुरक्षा योजना',
    description: 'Cash assistance scheme for pregnant women to encourage institutional delivery and reduce maternal and neonatal mortality. Promoted by ASHA workers in every village.',
    benefit: '₹1,400 cash (Rural) or ₹1,000 cash (Urban) directly in your bank after delivery at a hospital',
    why_helps: 'This scheme pays you cash when you deliver your baby at a government hospital or health centre. It also pays your ASHA worker for helping you. This money helps cover travel, food, and rest after delivery. It saves the lives of mothers and newborn babies.',
    why_helps_hi: 'जब आप सरकारी अस्पताल में बच्चे को जन्म देती हैं, तो सरकार आपको सीधे बैंक में पैसे देती है। यह आपकी यात्रा, खाना और आराम के खर्च में मदद करता है। इससे माँ और शिशु दोनों सुरक्षित रहते हैं।',
    category: 'maternal_health',
    min_age: 14, max_age: 49,
    gender_eligibility: 'female', caste_eligibility: 'all',
    economic_status_eligibility: 'BPL', area_type_eligibility: 'all',
    required_documents: 'Aadhaar Card,MCP Card (Mother Child Protection Card),BPL Certificate,Bank Account (Savings),ASHA worker referral',
    steps: '1. Tell your ASHA worker as soon as you know you are pregnant|2. Get registered at the nearest Anganwadi or PHC (Primary Health Centre)|3. Get your MCP Card — it tracks all your checkups|4. Do all 4 antenatal checkups (ANC)|5. Deliver at a government hospital or empanelled centre|6. ASHA worker or hospital staff will help you get the cash payment in 1-2 weeks',
    start_year: 2005,
    official_url: 'https://nhm.gov.in/index1.php?lang=1&level=3&sublinkid=841&lid=309',
    helpline: '104'
  },
  {
    name: 'Pradhan Mantri Matru Vandana Yojana (PMMVY)',
    name_hi: 'प्रधानमंत्री मातृ वंदना योजना',
    description: 'Maternity benefit program for all pregnant and lactating mothers. Provides partial wage compensation during pregnancy and after delivery so mothers can rest and feed their newborns.',
    benefit: '₹5,000 in installments for first child; ₹6,000 for second child if girl',
    why_helps: 'Being pregnant means you may not be able to work. This scheme gives you money in three payments so you can rest, eat well, and take care of your baby. No work is needed — just register and attend checkups.',
    why_helps_hi: 'गर्भावस्था में काम कम हो जाता है। यह योजना आपको तीन किस्तों में पैसे देती है ताकि आप आराम कर सकें, अच्छा खाना खा सकें और अपने बच्चे की देखभाल कर सकें।',
    category: 'maternal_health',
    min_age: 19, max_age: 49,
    gender_eligibility: 'female', caste_eligibility: 'all',
    economic_status_eligibility: 'all', area_type_eligibility: 'all',
    required_documents: 'Aadhaar Card,MCP Card,Bank Account,Registration at Anganwadi Centre,Husband\'s Aadhaar',
    steps: '1. Register at your local Anganwadi Centre within 150 days of knowing you are pregnant|2. Fill Form 1A at the Anganwadi|3. Get ₹1,000 first installment after registration|4. Get ₹2,000 second installment after 6-month ANC checkup|5. Get ₹2,000 third installment after child birth registration and first vaccination',
    start_year: 2017,
    official_url: 'https://wcd.nic.in/schemes/pradhan-mantri-matru-vandana-yojana',
    helpline: '011-23382393'
  },
  {
    name: 'Janani Shishu Suraksha Karyakram (JSSK)',
    name_hi: 'जननी शिशु सुरक्षा कार्यक्रम',
    description: 'Entitles all pregnant women delivering in government health facilities to FREE and zero-expense delivery, including C-section. Also covers sick newborns up to 30 days after birth.',
    benefit: 'Completely FREE delivery + 3-day hospital stay + free medicines + free transport from home to hospital',
    why_helps: 'When you go to a government hospital to have your baby, EVERYTHING is free. The hospital must give you free medicine, free food for 3 days, free blood tests, and even free transport home. You do not pay anything — not even for a C-section.',
    why_helps_hi: 'जब आप सरकारी अस्पताल में बच्चे को जन्म देती हैं, तो सब कुछ मुफ्त है — दवाई, खाना, जाँच, यहाँ तक कि सिजेरियन भी। घर से अस्पताल आने-जाने का खर्च भी सरकार देती है।',
    category: 'maternal_health',
    min_age: 14, max_age: 49,
    gender_eligibility: 'female', caste_eligibility: 'all',
    economic_status_eligibility: 'all', area_type_eligibility: 'all',
    required_documents: 'Aadhaar Card,MCP Card (recommended — not mandatory)',
    steps: '1. Go to any government hospital or CHC when you are in labor|2. At the registration desk, say you are here under JSSK|3. All charges (medicines, tests, bed, food) will be ZERO|4. For transport, contact your ASHA worker — she will arrange a vehicle|5. After delivery, stay for free for 3 days|6. Your newborn gets free care for 30 days if sick',
    start_year: 2011,
    official_url: 'https://nhm.gov.in/index1.php?lang=1&level=3&sublinkid=842&lid=310',
    helpline: '104'
  },
  {
    name: 'Rashtriya Bal Swasthya Karyakram (RBSK)',
    name_hi: 'राष्ट्रीय बाल स्वास्थ्य कार्यक्रम',
    description: 'Free health screening and treatment for all children aged 0-18 years for 4Ds: Birth Defects, Diseases, Deficiencies, and Developmental delays. Mobile health teams visit schools and Anganwadis.',
    benefit: 'Free health checkup + free treatment worth up to ₹1,00,000 for identified conditions',
    why_helps: 'Government doctors visit your child\'s school or Anganwadi to check if your child has any hidden health problems — like heart defects, poor eyesight, hearing problems, or malnutrition. If a problem is found, your child gets free treatment, surgery, or devices like spectacles.',
    why_helps_hi: 'सरकारी डॉक्टर आपके बच्चे के स्कूल या आंगनवाड़ी आकर जाँच करते हैं। अगर कोई बीमारी, कमजोरी या दोष मिले तो सरकार मुफ्त इलाज और ऑपरेशन करती है।',
    category: 'child_health',
    min_age: 0, max_age: 18,
    gender_eligibility: 'all', caste_eligibility: 'all',
    economic_status_eligibility: 'all', area_type_eligibility: 'all',
    required_documents: 'Birth Certificate,Aadhaar of Parent,School or Anganwadi enrollment proof',
    steps: '1. Send your child to school / Anganwadi regularly — RBSK teams visit automatically|2. RBSK doctors will screen your child (eyes, ears, heart, weight, growth)|3. If any condition is found, they give you a referral letter (free)|4. Visit the District Early Intervention Centre (DEIC)|5. Child gets free surgery, medicines, spectacles, hearing aids, or other treatment',
    start_year: 2013,
    official_url: 'https://rbsk.gov.in',
    helpline: '1800-180-1104'
  },
  {
    name: 'Mission Indradhanush (Universal Immunization)',
    name_hi: 'मिशन इंद्रधनुष (सार्वभौमिक टीकाकरण)',
    description: 'India\'s flagship immunization program to protect children under 2 years and pregnant women against 12 deadly diseases including Polio, DPT, Hepatitis B, Measles, and Rubella.',
    benefit: 'Free vaccines for 12 diseases. All vaccines are completely FREE at government centres.',
    why_helps: 'Vaccines protect your child from diseases that can kill or cause permanent disability. All 12 vaccines are completely free. A healthy vaccinated child can study well and live a full life. Missing even one vaccine is dangerous.',
    why_helps_hi: 'टीके आपके बच्चे को उन बीमारियों से बचाते हैं जो जानलेवा हो सकती हैं। सभी 12 टीके बिल्कुल मुफ्त हैं। टीकाकरण से बच्चा स्वस्थ, तंदुरुस्त और होशियार बनता है।',
    category: 'child_health',
    min_age: 0, max_age: 2,
    gender_eligibility: 'all', caste_eligibility: 'all',
    economic_status_eligibility: 'all', area_type_eligibility: 'all',
    required_documents: 'Birth Certificate,MCP Card (Mother Child Protection Card)',
    steps: '1. Register newborn at nearest Anganwadi or PHC within first month|2. Get MCP Card — shows the full vaccination schedule|3. Follow the schedule carefully (BCG at birth, OPV drops, DPT, Hepatitis B, etc.)|4. Attend all Mission Indradhanush camps in your village (announced by ASHA)|5. Complete all vaccines before child turns 2 years old|6. Keep MCP card safe — it\'s your child\'s health record',
    start_year: 2014,
    official_url: 'https://nhm.gov.in/index1.php?lang=1&level=3&sublinkid=1021&lid=676',
    helpline: '104'
  },
  {
    name: 'National Tuberculosis Elimination Programme (NTEP)',
    name_hi: 'राष्ट्रीय क्षय उन्मूलन कार्यक्रम',
    description: 'India aims to eliminate Tuberculosis (TB) by 2025. Provides completely free TB diagnosis, 6-month DOTS treatment, and ₹500/month nutritional support to every TB patient registered on Ni-kshay portal.',
    benefit: 'Free diagnosis + free 6-month treatment + ₹500 per month nutritional support via bank transfer',
    why_helps: 'TB is curable but needs 6 months of medicine taken every day. All medicines, tests, and X-rays are free. The government also sends ₹500 directly to your bank every month for food, because good nutrition helps you recover faster.',
    why_helps_hi: 'टीबी (तपेदिक) पूरी तरह ठीक हो जाती है, लेकिन 6 महीने नियमित दवा लेनी पड़ती है। सभी दवाएं, जाँच और X-Ray मुफ्त हैं। साथ ही हर महीने ₹500 सीधे बैंक में भेजे जाते हैं।',
    category: 'disease',
    min_age: 0, max_age: 120,
    gender_eligibility: 'all', caste_eligibility: 'all',
    economic_status_eligibility: 'all', area_type_eligibility: 'all',
    required_documents: 'Aadhaar Card,Bank Account (for ₹500 monthly payment),Sputum test report or Chest X-Ray',
    steps: '1. If you have cough for more than 2 weeks, fever, or weight loss — go to your PHC immediately|2. Get a free sputum (थूक) test or X-Ray|3. If TB is confirmed, your name is registered on Ni-kshay portal|4. Start free DOTS (Directly Observed Treatment) medicine — taken in front of ASHA or pharmacist|5. Receive ₹500/month directly in your bank for nutrition|6. Complete full 6 months — DO NOT stop early even if you feel better',
    start_year: 1997,
    official_url: 'https://nikshay.in',
    helpline: '1800-11-6666'
  },
  {
    name: 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)',
    name_hi: 'प्रधानमंत्री सुरक्षा बीमा योजना',
    description: 'Low-cost accidental death and disability insurance. Premium of only ₹20 per year (auto-debited from bank account) provides ₹2 lakh coverage against accidental death.',
    benefit: '₹2,00,000 on accidental death | ₹1,00,000 on permanent partial disability — for just ₹20/year',
    why_helps: 'Accidents happen without warning. If the head of your family dies in an accident, this insurance gives ₹2 lakh to your family. The cost is only ₹20 per year — less than a cup of tea per month. Every adult should have this.',
    why_helps_hi: 'दुर्घटना कभी भी हो सकती है। अगर परिवार के मुखिया की दुर्घटना में मृत्यु हो जाए, तो परिवार को ₹2 लाख मिलते हैं। इसका सालाना खर्च सिर्फ ₹20 है — हर महीने बैंक से अपने आप कट जाता है।',
    category: 'insurance',
    min_age: 18, max_age: 70,
    gender_eligibility: 'all', caste_eligibility: 'all',
    economic_status_eligibility: 'all', area_type_eligibility: 'all',
    required_documents: 'Aadhaar Card,Bank Account with auto-debit facility,Mobile number linked to bank',
    steps: '1. Visit your nearest bank branch (any government bank like SBI, Bank of Baroda, etc.)|2. Fill the PMSBY enrollment form (very simple, just name + Aadhaar + sign)|3. Give consent for ₹20 auto-debit from your savings account every June 1st|4. Coverage starts immediately and renews every year automatically|5. In case of accident — contact the bank and submit the claim form',
    start_year: 2015,
    official_url: 'https://www.jansuraksha.gov.in/PMSBY.aspx',
    helpline: '1800-180-1111'
  },
  {
    name: 'Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)',
    name_hi: 'प्रधानमंत्री जीवन ज्योति बीमा योजना',
    description: 'Life insurance scheme for the poor and middle class. For a small annual premium of ₹436, provides ₹2 lakh life insurance cover for any reason — not just accidents.',
    benefit: '₹2,00,000 paid to your family if you die for ANY reason — illness, accident, or natural death',
    why_helps: 'Unlike PMSBY which only covers accidents, this scheme pays ₹2 lakh to your family if you die for any reason — including illness. For ₹436 per year (₹36 per month), your family is protected. This is especially important for the main earner of the family.',
    why_helps_hi: 'यह योजना PMSBY से अलग है — किसी भी कारण से मृत्यु होने पर परिवार को ₹2 लाख मिलते हैं। सिर्फ ₹436 सालाना (₹36 प्रति माह) में पूरे परिवार को सुरक्षा मिलती है।',
    category: 'insurance',
    min_age: 18, max_age: 50,
    gender_eligibility: 'all', caste_eligibility: 'all',
    economic_status_eligibility: 'all', area_type_eligibility: 'all',
    required_documents: 'Aadhaar Card,Bank Account with savings,Mobile number linked to bank',
    steps: '1. Visit your bank branch|2. Fill PMJJBY enrollment form|3. Sign auto-debit consent for ₹436 annually|4. Coverage starts immediately|5. Renews every year on June 1st automatically|6. For claim: nominee visits bank with death certificate + claim form',
    start_year: 2015,
    official_url: 'https://www.jansuraksha.gov.in/PMJJBY.aspx',
    helpline: '1800-180-1111'
  },
  {
    name: 'POSHAN 2.0 (Saksham Anganwadi)',
    name_hi: 'पोषण 2.0 (सक्षम आंगनवाड़ी)',
    description: 'National nutrition mission providing free food supplements, take-home rations, and growth monitoring to children under 6, pregnant women, and lactating mothers through Anganwadi centres.',
    benefit: 'Free supplementary nutrition every month + growth monitoring + nutrition counselling + take-home rations',
    why_helps: 'Malnutrition is the #1 cause of child death and poor brain development. Every month, your Anganwadi gives free nutritious food to your child and to pregnant/breastfeeding mothers. Regular weighing tracks your child\'s growth so problems are caught early.',
    why_helps_hi: 'कुपोषण बच्चों में मृत्यु और दिमागी कमजोरी का सबसे बड़ा कारण है। आंगनवाड़ी हर महीने आपके बच्चे और गर्भवती माँ को मुफ्त पौष्टिक खाना देती है। नियमित तौल से बच्चे की वृद्धि ट्रैक होती है।',
    category: 'nutrition',
    min_age: 0, max_age: 49,
    gender_eligibility: 'all', caste_eligibility: 'all',
    economic_status_eligibility: 'all', area_type_eligibility: 'rural',
    required_documents: 'Aadhaar Card,Birth Certificate (for child),MCP Card (for mother)',
    steps: '1. Visit nearest Anganwadi Centre|2. Register your child (0-6 years) or your pregnancy|3. Attend the Anganwadi every month for nutrition pickup|4. Allow your child to be weighed and measured monthly|5. Attend nutrition counselling sessions|6. If child shows signs of malnutrition, ASHA will refer to NRC (Nutrition Rehabilitation Centre)',
    start_year: 2021,
    official_url: 'https://poshan.gov.in',
    helpline: '1800-11-8004'
  },
  {
    name: 'National Iron Plus Initiative',
    name_hi: 'राष्ट्रीय आयरन+ पहल',
    description: 'Free iron and folic acid (IFA) supplementation to address anaemia across all age groups — from infants to pregnant women to adolescent girls to adults — through schools and health centres.',
    benefit: 'Free Iron & Folic Acid tablets/syrup every week — for children, adolescent girls, pregnant women',
    why_helps: 'Anaemia (खून की कमी) makes you weak, tired, and unable to work. In pregnant women it can kill both mother and baby. Weekly iron tablets given free at school and Anganwadi prevent this. Many village women and girls have anaemia without knowing it.',
    why_helps_hi: 'खून की कमी (एनीमिया) आपको कमजोर और थका देती है। गर्भवती महिला में यह जानलेवा हो सकता है। स्कूल और आंगनवाड़ी में हर हफ्ते मुफ्त आयरन की गोलियां दी जाती हैं।',
    category: 'nutrition',
    min_age: 0, max_age: 49,
    gender_eligibility: 'all', caste_eligibility: 'all',
    economic_status_eligibility: 'all', area_type_eligibility: 'all',
    required_documents: 'School enrollment (for children)|Anganwadi registration (for mothers)',
    steps: '1. Children 6-59 months: Anganwadi gives iron syrup biweekly|2. Children 5-10 years: School or Anganwadi gives IFA tablet weekly|3. Adolescent girls (10-19 years): Given weekly IFA tablet at school|4. Pregnant women: 180 IFA tablets free from PHC — take one daily|5. Report side effects (nausea, dark stool) to ASHA — these are normal',
    start_year: 2013,
    official_url: 'https://nhm.gov.in',
    helpline: '104'
  },
  {
    name: 'Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)',
    name_hi: 'प्रधानमंत्री सुरक्षित मातृत्व अभियान',
    description: 'Every pregnant woman gets a FREE comprehensive antenatal checkup on the 9th of every month at government health facilities. Doctors check blood pressure, blood sugar, weight, and refer high-risk cases immediately.',
    benefit: 'FREE full checkup for pregnant mothers on the 9th of every month — includes blood tests, ultrasound if needed, doctor consultation',
    why_helps: 'Getting checked by a doctor during pregnancy can detect dangerous problems early — high blood pressure, diabetes, anaemia, or baby in wrong position. These can kill if not caught early. The 9th of every month is your dedicated day.',
    why_helps_hi: 'हर महीने की 9 तारीख को सरकारी अस्पताल में गर्भवती माँ की पूरी मुफ्त जाँच होती है। इसमें ब्लड प्रेशर, शुगर, खून की जाँच और जरूरत पड़ने पर अल्ट्रासाउंड होता है।',
    category: 'maternal_health',
    min_age: 14, max_age: 49,
    gender_eligibility: 'female', caste_eligibility: 'all',
    economic_status_eligibility: 'all', area_type_eligibility: 'all',
    required_documents: 'MCP Card,Aadhaar Card (recommended)',
    steps: '1. Register your pregnancy at nearest PHC or Anganwadi as soon as you know|2. Mark the 9th of every month in your calendar|3. Go to the nearest government health centre on the 9th|4. Carry your MCP Card (pregnancy health card)|5. Get full checkup — blood test, BP, weight, baby heartbeat|6. High-risk pregnancies get extra attention and specialist referral',
    start_year: 2016,
    official_url: 'https://pmsma.nhp.gov.in',
    helpline: '104'
  },
  {
    name: 'National Programme for Control of Blindness (NPCB)',
    name_hi: 'राष्ट्रीय अंधापन नियंत्रण कार्यक्रम',
    description: 'Free cataract operations, spectacles for school children, and eye care services at government hospitals. India performs millions of cataract surgeries annually through this program.',
    benefit: 'Free cataract surgery + free spectacles for school children + free eye checkup camps',
    why_helps: 'Cataracts (मोतियाबिंद) are the #1 cause of blindness in Indian villages. A simple 20-minute operation can restore full vision. This program provides the operation completely free. Many elderly village people are unnecessarily blind when they could see again.',
    why_helps_hi: 'मोतियाबिंद गांवों में अंधेपन का सबसे बड़ा कारण है। एक छोटे से 20 मिनट के ऑपरेशन से पूरी नजर वापस आ सकती है। यह ऑपरेशन सरकारी अस्पताल में बिल्कुल मुफ्त होता है।',
    category: 'other',
    min_age: 0, max_age: 120,
    gender_eligibility: 'all', caste_eligibility: 'all',
    economic_status_eligibility: 'all', area_type_eligibility: 'all',
    required_documents: 'Aadhaar Card,Eye checkup report from doctor',
    steps: '1. Visit nearest eye camp organized in your village (announced by ASHA)|2. Or go directly to district hospital eye department|3. Doctor examines eyes and confirms cataract|4. Surgery is scheduled — usually within 1-2 weeks|5. Operation is free including medicines and eye drops|6. For school children: free spectacles given after eye test',
    start_year: 1976,
    official_url: 'https://npcbvi.gov.in',
    helpline: '1800-110-707'
  },
  {
    name: 'Rashtriya Vayoshri Yojana (RVY)',
    name_hi: 'राष्ट्रीय वायोश्री योजना',
    description: 'Free assistive living devices for senior citizens living below poverty line. Covers walking sticks, wheelchairs, hearing aids, spectacles, and dentures distributed through camps.',
    benefit: 'Free walking stick, wheelchair, hearing aid, spectacles, or dentures — for elderly BPL citizens',
    why_helps: 'Old age brings disability — poor vision, weak hearing, difficulty walking. These devices give elderly people back their independence and dignity. Many grandparents in villages suffer unnecessarily. This scheme provides these aids completely free.',
    why_helps_hi: 'बुढ़ापे में आंखें कमजोर होती हैं, कान ठीक से नहीं सुनते, चलना मुश्किल होता है। यह योजना बुजुर्ग BPL नागरिकों को मुफ्त छड़ी, व्हीलचेयर, श्रवण यंत्र और चश्मा देती है।',
    category: 'other',
    min_age: 60, max_age: 120,
    gender_eligibility: 'all', caste_eligibility: 'all',
    economic_status_eligibility: 'BPL', area_type_eligibility: 'all',
    required_documents: 'Aadhaar Card,Age Proof (minimum 60 years),BPL Certificate,Medical certificate of disability need',
    steps: '1. Watch for RVY camps in your area (announced by District Social Welfare Office)|2. Register at the camp or visit District Social Welfare office|3. Doctor assesses which device is needed|4. Devices distributed free at the camp|5. Follow-up support provided if device needs adjustment',
    start_year: 2017,
    official_url: 'https://socialjustice.gov.in/schemes/rashtriya-vayoshri-yojana',
    helpline: '14567'
  },
  {
    name: 'National Mental Health Programme (NMHP)',
    name_hi: 'राष्ट्रीय मानसिक स्वास्थ्य कार्यक्रम',
    description: 'Free mental health services at government health facilities including counselling, medicines for depression, anxiety, schizophrenia, and epilepsy. ASHA workers trained to identify and refer cases.',
    benefit: 'Free mental health consultation + free psychiatric medicines at PHC/CHC + community mental health camps',
    why_helps: 'Mental illness is real and treatable. Depression, anxiety, epilepsy, and schizophrenia all have free medicines available at government hospitals. Many village people suffer silently. Your ASHA worker or PHC doctor can help — no shame in seeking help.',
    why_helps_hi: 'मानसिक बीमारी असली है और इसका इलाज होता है। अवसाद, चिंता, मिर्गी और सिजोफ्रेनिया की मुफ्त दवाएं सरकारी अस्पताल में मिलती हैं। अपनी आशा कार्यकर्ता या डॉक्टर से बात करने में कोई शर्म नहीं।',
    category: 'other',
    min_age: 0, max_age: 120,
    gender_eligibility: 'all', caste_eligibility: 'all',
    economic_status_eligibility: 'all', area_type_eligibility: 'all',
    required_documents: 'Aadhaar Card (recommended, not mandatory),Doctor referral if available',
    steps: '1. Talk to your ASHA worker or ANM about your symptoms|2. Get referred to nearest PHC or District Hospital psychiatry OPD|3. Consult doctor — medicines are FREE at government hospital|4. For emergency (risk of self-harm): call 108 or Vandrevala helpline 1860-2662-345|5. Community mental health camps held periodically — watch for announcements',
    start_year: 1982,
    official_url: 'https://nhm.gov.in/index1.php?lang=1&level=2&sublinkid=1023&lid=356',
    helpline: 'iCall: 9152987821'
  },
  {
    name: 'PM Garib Kalyan Anna Yojana (PMGKAY)',
    name_hi: 'प्रधानमंत्री गरीब कल्याण अन्न योजना',
    description: 'Free grain entitlement scheme providing 5 kg of rice or wheat per person per month to all Antyodaya Anna Yojana (AAY) and Priority Household (PHH) ration card holders at no cost.',
    benefit: '5 kg free rice or wheat per person per month — completely FREE over and above your regular ration',
    why_helps: 'This scheme ensures no family in India goes hungry. Each person in your family gets 5 kg of free grain every month. With a valid ration card, you collect this at your local fair price shop (ration shop). This is especially important for families without regular income.',
    why_helps_hi: 'इस योजना से परिवार के हर सदस्य को हर महीने 5 किलो मुफ्त चावल या गेहूं मिलता है। राशन कार्ड के साथ अपनी नजदीकी उचित मूल्य की दुकान से लें। यह गरीब परिवारों के लिए बहुत जरूरी है।',
    category: 'nutrition',
    min_age: 0, max_age: 120,
    gender_eligibility: 'all', caste_eligibility: 'all',
    economic_status_eligibility: 'BPL', area_type_eligibility: 'all',
    required_documents: 'Ration Card (AAY or PHH category),Aadhaar linked to ration card',
    steps: '1. Check that your Ration Card is active and Aadhaar-linked|2. Visit your local Fair Price Shop (राशन की दुकान) on allotted date|3. Give biometric verification (fingerprint) or OTP|4. Collect free 5 kg per person + regular subsidized ration|5. If ration is denied, call the helpline or contact District Supply Officer',
    start_year: 2020,
    official_url: 'https://dfpd.gov.in',
    helpline: '1800-11-8000'
  },
  {
    name: 'Pradhan Mantri Ujjwala Yojana 2.0 (PMUY)',
    name_hi: 'प्रधानमंत्री उज्ज्वला योजना 2.0',
    description: 'Free LPG (gas cylinder) connection to BPL households, especially women. Reduces indoor air pollution from wood/dung fires which causes respiratory disease and child deaths.',
    benefit: 'Free LPG connection + first cylinder free + free stove for BPL women — removes deadly indoor smoke',
    why_helps: 'Cooking on wood or dung fires causes smoke that kills lungs — especially children and women who spend hours near the fire. LPG is cleaner, faster, and healthier. This scheme gives women their own free gas connection, improving health and dignity.',
    why_helps_hi: 'लकड़ी और गोबर के धुएं से फेफड़ों की बीमारी होती है, खासकर बच्चों और महिलाओं को। LPG साफ, तेज और स्वास्थ्यकर है। यह योजना BPL महिलाओं को मुफ्त गैस कनेक्शन देती है।',
    category: 'other',
    min_age: 18, max_age: 120,
    gender_eligibility: 'female', caste_eligibility: 'all',
    economic_status_eligibility: 'BPL', area_type_eligibility: 'all',
    required_documents: 'Aadhaar Card,Ration Card (BPL/AAY/PHH),Bank account,Address proof,Self-declaration of no existing LPG connection',
    steps: '1. Visit nearest LPG distributor (HP Gas / Bharat Gas / Indane) in your area|2. Fill Form 7 (Ujjwala application) — free to apply|3. Submit Aadhaar, ration card, and bank account details|4. Connection is approved in 3-5 days for eligible applicants|5. First cylinder and stove delivered free to your home|6. Subsequent cylinders at subsidized price (subsidy via bank)',
    start_year: 2016,
    official_url: 'https://www.pmuy.gov.in',
    helpline: '1800-233-3555'
  },
  {
    name: 'Reproductive Child Health Programme (RCH)',
    name_hi: 'प्रजनन बाल स्वास्थ्य कार्यक्रम',
    description: 'Comprehensive free reproductive and child healthcare services including family planning counselling, contraceptives, sterilization, safe abortion services, and treatment of reproductive tract infections.',
    benefit: 'Free family planning services, free contraceptives, free safe abortion at government hospitals',
    why_helps: 'Every couple has the right to plan how many children they want. Free contraceptives (pills, condoms, copper T, MTP kit) are available at PHC. Safe abortion services are free and legal at government hospitals. You can talk to your ASHA worker or ANM privately and confidentially.',
    why_helps_hi: 'हर परिवार को बच्चों की संख्या तय करने का अधिकार है। मुफ्त गर्भनिरोधक उपाय PHC में मिलते हैं। सुरक्षित गर्भपात सेवाएं सरकारी अस्पताल में मुफ्त और कानूनी हैं। आशा कार्यकर्ता से निजी तौर पर बात करें।',
    category: 'maternal_health',
    min_age: 14, max_age: 49,
    gender_eligibility: 'female', caste_eligibility: 'all',
    economic_status_eligibility: 'all', area_type_eligibility: 'all',
    required_documents: 'Aadhaar Card,MCP Card (if pregnant)',
    steps: '1. Talk to your ASHA worker or ANM at PHC — complete privacy guaranteed|2. Get family planning counselling on all options|3. Receive free contraceptives (pills, condoms, copper T, injectable)|4. For sterilization: government pays ₹1,400–₹2,000 compensation|5. For abortion: legal and free up to 20 weeks at government hospital with doctor advice',
    start_year: 1997,
    official_url: 'https://nhm.gov.in/index1.php?lang=1&level=2&sublinkid=1043&lid=677',
    helpline: '104'
  },
  {
    name: 'Ayushman Arogya Mandir (Health & Wellness Centres)',
    name_hi: 'आयुष्मान आरोग्य मंदिर (स्वास्थ्य एवं कल्याण केंद्र)',
    description: 'Upgraded Sub Health Centres and Primary Health Centres across rural India providing comprehensive primary healthcare — free medicines, diagnostics, teleconsultation, yoga, and health education.',
    benefit: 'Free 12 essential diagnostics + free essential medicines + free doctor consultation + teleconsultation at your nearest HWC',
    why_helps: 'The nearest upgraded health centre (HWC) in your village now has a Community Health Officer (CHO) who can treat common illnesses, do blood tests, measure BP and sugar, and even connect you to a specialist via video call — all free of charge.',
    why_helps_hi: 'आपके गांव का स्वास्थ्य एवं कल्याण केंद्र (HWC) अब अपग्रेड हो चुका है। यहाँ एक डिग्री-धारी स्वास्थ्य अधिकारी (CHO) रहता है जो मुफ्त में बीमारी का इलाज, खून की जाँच और BP-शुगर जाँच करता है।',
    category: 'health_insurance',
    min_age: 0, max_age: 120,
    gender_eligibility: 'all', caste_eligibility: 'all',
    economic_status_eligibility: 'all', area_type_eligibility: 'rural',
    required_documents: 'Aadhaar Card (recommended, not mandatory for emergency)',
    steps: '1. Find your nearest Ayushman Arogya Mandir / Health & Wellness Centre (marked with green flag)|2. Walk in during OPD hours (usually 9am–2pm weekdays)|3. Get free blood pressure, blood sugar, TB screening, and common illness treatment|4. Get free essential medicines from the centre itself|5. For specialist consultation, CHO connects you via teleconsultation free|6. Referral to PHC or district hospital if needed',
    start_year: 2018,
    official_url: 'https://nhm.gov.in',
    helpline: '104'
  },
  {
    name: 'Nikshay Poshan Yojana',
    name_hi: 'निक्षय पोषण योजना',
    description: 'Nutritional support of ₹500 per month for every registered TB patient during the entire treatment period to ensure adequate nutrition for faster recovery and treatment success.',
    benefit: '₹500 per month directly in your bank account during entire TB treatment duration (6–24 months)',
    why_helps: 'TB patients need extra nutrition to recover. Many poor families cannot afford this. The government sends ₹500 directly to your bank every month as long as you are taking TB medicines. This helps you eat better and complete your treatment successfully.',
    why_helps_hi: 'टीबी के मरीज को अच्छे पोषण की जरूरत होती है। सरकार हर महीने ₹500 सीधे बैंक में भेजती है — जब तक दवा चलती है। इससे आप अच्छा खाना खा सकते हैं और इलाज पूरा कर सकते हैं।',
    category: 'nutrition',
    min_age: 0, max_age: 120,
    gender_eligibility: 'all', caste_eligibility: 'all',
    economic_status_eligibility: 'all', area_type_eligibility: 'all',
    required_documents: 'Aadhaar Card,Bank Account,TB confirmation on Ni-kshay portal (done by DOTS centre)',
    steps: '1. Register for TB treatment at any DOTS centre or government hospital|2. Your treating doctor registers you on Ni-kshay portal|3. Provide Aadhaar and bank account details for DBT (Direct Benefit Transfer)|4. ₹500 transferred to your account on the 1st of each month|5. Continue collecting payment through the entire treatment period',
    start_year: 2018,
    official_url: 'https://nikshay.in',
    helpline: '1800-11-6666'
  }
];

export async function seedData(db, pool, usingSQLite, bcrypt) {
  // Allow seeding even in production if the database is empty so demo deployments have accounts


  if (pool) {
    const schemeCount = await pool.query('SELECT COUNT(*) FROM government_schemes');
    if (parseInt(schemeCount.rows[0].count) === 0) {
      for (const s of GOVERNMENT_SCHEMES) {
        await pool.query(
          `INSERT INTO government_schemes
           (name, name_hi, description, benefit, category, min_age, max_age,
            gender_eligibility, caste_eligibility, economic_status_eligibility,
            area_type_eligibility, required_documents, steps,
            start_year, official_url, why_helps, why_helps_hi, helpline)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
          [s.name, s.name_hi, s.description, s.benefit, s.category,
           s.min_age, s.max_age, s.gender_eligibility, s.caste_eligibility,
           s.economic_status_eligibility, s.area_type_eligibility,
           s.required_documents, s.steps,
           s.start_year || null, s.official_url || null,
           s.why_helps || null, s.why_helps_hi || null, s.helpline || null]
        );
      }
      console.log('Seeded 20 government schemes into Aurora PostgreSQL.');
    }
  } else {
    // Seed default villages in SQLite first (Dependency order requirement)
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

    // Seed default demo accounts in SQLite next (references village_health)
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

    // Seed default government schemes in SQLite if missing
    const schemeCheck = await db.get("SELECT id FROM government_schemes LIMIT 1");
    if (!schemeCheck) {
      for (const s of GOVERNMENT_SCHEMES) {
        await db.run(
          `INSERT OR IGNORE INTO government_schemes
           (name, name_hi, description, benefit, category, min_age, max_age,
            gender_eligibility, caste_eligibility, economic_status_eligibility,
            area_type_eligibility, required_documents, steps,
            start_year, official_url, why_helps, why_helps_hi, helpline)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [s.name, s.name_hi, s.description, s.benefit, s.category,
           s.min_age, s.max_age, s.gender_eligibility, s.caste_eligibility,
           s.economic_status_eligibility, s.area_type_eligibility,
           s.required_documents, s.steps,
           s.start_year || null, s.official_url || null,
           s.why_helps || null, s.why_helps_hi || null, s.helpline || null]
        );
      }
      console.log('   📜 20 Government schemes seeded into SQLite.');
    }

    // Seed default district configs in SQLite if missing
    const configCheck = await db.get("SELECT id FROM district_config LIMIT 1");
    if (!configCheck) {
      await db.run(
        `INSERT OR IGNORE INTO district_config (district_id, outbreak_threshold, enable_auto_ambulance, emergency_contact_phone)
         VALUES (?, ?, ?, ?)`,
        ['varanasi_district', 3, 1, '+91 94150 12345']
      );
      console.log('   🔧 Default SQLite district config seeded.');
    }
  }
}

export async function seedDemoData(db, usingSQLite, bcrypt) {
  // Prevent any seeding execution in production
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ Seeding demo data blocked in production environment.');
    return;
  }

  const hash = await bcrypt.hash('Demo@1234', 10);
  
  // Clean in dependent order (child records first, parent records last)
  await db.run("DELETE FROM referrals WHERE \"villageId\" IN ('v101', 'v102')");
  await db.run("DELETE FROM vaccination_records WHERE \"villageId\" IN ('v101', 'v102')");
  await db.run("DELETE FROM asha_performance");
  await db.run("DELETE FROM audit_logs");
  await db.run("DELETE FROM district_config");
  await db.run("DELETE FROM symptoms WHERE \"villageId\" IN ('v101', 'v102')");
  await db.run("DELETE FROM malnutrition_data WHERE \"villageId\" IN ('v101', 'v102')");
  await db.run("DELETE FROM pregnancy_data WHERE \"villageId\" IN ('v101', 'v102')");
  await db.run("DELETE FROM ambulance_requests WHERE priority IN ('High', 'Medium', 'Low', 'Pad Request')");
  await db.run("DELETE FROM users WHERE username IN ('demo_villager', 'demo_asha', 'demo_admin')");
  await db.run("DELETE FROM village_health WHERE \"villageId\" IN ('v101', 'v102')");

  // 1. Seed village_health first
  const nowSql = usingSQLite ? "datetime('now')" : "NOW()";
  await db.run(
    `INSERT OR IGNORE INTO village_health
     ("villageId", name, population, pregnant_women, children_under_5,
      malnutrition_cases, asha_contact, "districtId", lat, lng, "lastUpdated")
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${nowSql})`,
    ['v101', 'Rampur', 1200, 14, 89, 7, '9876543211', 'varanasi_district', 25.3176, 82.9739]
  );
  await db.run(
    `INSERT OR IGNORE INTO village_health
     ("villageId", name, population, pregnant_women, children_under_5,
      malnutrition_cases, asha_contact, "districtId", lat, lng, "lastUpdated")
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${nowSql})`,
    ['v102', 'Mohanlal Ganj', 850, 9, 63, 4, '9876543213', 'lucknow_district', 26.7606, 80.8893]
  );

  // 2. Seed users next (referencing villageId)
  await db.run('INSERT OR IGNORE INTO users (phone, email, username, name, password, role, "villageId") VALUES (?, ?, ?, ?, ?, ?, ?)', ['9876543210', 'villager@swasthai.in', 'demo_villager', 'Ramesh Kumar', hash, 'villager', 'v101']);
  await db.run('INSERT OR IGNORE INTO users (phone, email, username, name, password, role, "villageId") VALUES (?, ?, ?, ?, ?, ?, ?)', ['9876543211', 'asha@swasthai.in', 'demo_asha', 'Sita Devi (ASHA)', hash, 'ngo', 'v101']);
  await db.run('INSERT OR IGNORE INTO users (phone, email, username, name, password, role, "villageId") VALUES (?, ?, ?, ?, ?, ?, ?)', ['9876543212', 'admin@swasthai.in', 'demo_admin', 'CMO Varanasi', hash, 'admin', null]);

  // 3. Resolve user IDs dynamically to avoid hardcoded Foreign Key breaks
  const villagerAcc = await db.get("SELECT id FROM users WHERE username = 'demo_villager'");
  const villagerUserId = villagerAcc?.id || null;
  const ngoAcc = await db.get("SELECT id FROM users WHERE username = 'demo_asha'");
  const ngoUserId = ngoAcc?.id || null;

  // 4. Seed dependent clinical/operational tables
  await db.run('INSERT OR IGNORE INTO pregnancy_data (name, age, trimester, "riskLevel", "dueDate", "villageId", recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?)', ['Sunita Devi', 24, 3, 'High', '2026-08-15', 'v101', ngoUserId]);
  await db.run('INSERT OR IGNORE INTO pregnancy_data (name, age, trimester, "riskLevel", "dueDate", "villageId", recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?)', ['Meena Kumari', 21, 2, 'Low', '2026-11-05', 'v101', ngoUserId]);

  await db.run('INSERT OR IGNORE INTO malnutrition_data ("childName", "ageMonths", weight, height, status, "villageId") VALUES (?, ?, ?, ?, ?, ?)', ['Raju', 24, 11.2, 85.0, 'Moderate', 'v101']);
  await db.run('INSERT OR IGNORE INTO malnutrition_data ("childName", "ageMonths", weight, height, status, "villageId") VALUES (?, ?, ?, ?, ?, ?)', ['Priya', 36, 14.5, 95.0, 'Normal', 'v101']);

  await db.run(
    'INSERT OR IGNORE INTO symptoms ("userId", "villageId", symptoms, prediction, disease, advice, confidence, model_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [villagerUserId, 'v101', 'Fever, cough, body pain for 3 days', 'Mild Viral Infection - Maintain hydration, isolate, report if temp exceeds 102F', 'Mild Viral Infection', 'Maintain hydration, isolate, report if temp exceeds 102F', 0.90, 'Offline Rule Matcher']
  );
  
  await db.run('INSERT OR IGNORE INTO ambulance_requests (user_id, name, location, priority, type, request_type, symptoms, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [villagerUserId, 'Ramesh Kumar', 'Rampur, Near Primary School', 'High', 'emergency', 'ambulance', 'Severe chest pain and difficulty breathing', 'pending']);
  await db.run('INSERT OR IGNORE INTO ambulance_requests (user_id, name, location, priority, type, request_type, symptoms, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [villagerUserId, 'Sita Devi', 'ASHA Center रामपुर', 'Low', 'operation', 'pad_request', 'Confidential request for sanitary pads supply', 'pending']);

  await db.run(
    `INSERT OR IGNORE INTO district_config (district_id, outbreak_threshold, enable_auto_ambulance, emergency_contact_phone)
     VALUES (?, ?, ?, ?)`,
    ['varanasi_district', 3, 1, '+91 94150 12345']
  );

  await db.run(
    `INSERT OR IGNORE INTO vaccination_records (child_name, parent_phone, vaccine_name, scheduled_date, given_date, status, "villageId", recorded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Aarav Kumar', '9876543210', 'BCG', '2026-06-01', '2026-06-02', 'given', 'v101', ngoUserId]
  );
  await db.run(
    `INSERT OR IGNORE INTO vaccination_records (child_name, parent_phone, vaccine_name, scheduled_date, given_date, status, "villageId", recorded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Ananya Singh', '9876543220', 'OPV 1', '2026-06-15', null, 'scheduled', 'v101', ngoUserId]
  );

  await db.run(
    `INSERT OR IGNORE INTO asha_performance (asha_id, month, referrals_count, pregnancies_tracked, vaccinations_completed, emergencies_reported)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [ngoUserId, '2026-06', 12, 5, 8, 2]
  );

  await db.run(
    `INSERT OR IGNORE INTO referrals (patient_name, patient_phone, "villageId", referred_by, referred_to, reason, priority, notes, status, outcome, outcome_details, closed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${nowSql})`,
    ['Ramesh Kumar', '9876543200', 'v101', ngoUserId, 'District PHC', 'Chronic cough & fever', 'high', 'Suspected TB', 'completed', 'Diagnosed with Pulmonary TB', 'Referred to DOTS center, started on therapy.']
  );
}
