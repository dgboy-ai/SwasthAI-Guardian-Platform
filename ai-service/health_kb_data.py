# Structured Health Knowledge Base for RAG-Powered Sakhi
# Total chunks: 200+ (covering 101 diseases, government schemes, emergency protocols, and local contacts)
# Includes 2-sentence sliding-window overlap for context continuity.

HEALTH_KNOWLEDGE = [
    # ── maternal health & pregnancy (1-40) ──
    {
        "text": "Pregnant women should attend at least 8 antenatal care (ANC) visits to monitor fetal growth. The first ANC visit should be scheduled before 12 weeks of pregnancy. Initial checks must cover blood pressure, haemoglobin, blood sugar, and urine protein to rule out complications.",
        "source": "WHO ANC Guidelines 2016 + MoHFW Reproductive Health Protocol",
        "urgency": "P4"
    },
    {
        "text": "The first ANC visit should be scheduled before 12 weeks of pregnancy. Initial checks must cover blood pressure, haemoglobin, blood sugar, and urine protein to rule out complications. Gestational hypertension (BP ≥140/90 mmHg) detected during these visits requires close medical observation.",
        "source": "WHO ANC Guidelines 2016 + MoHFW Reproductive Health Protocol",
        "urgency": "P3"
    },
    {
        "text": "Initial checks must cover blood pressure, haemoglobin, blood sugar, and urine protein to rule out complications. Gestational hypertension (BP ≥140/90 mmHg) detected during these visits requires close medical observation. Severe hypertension (BP ≥160/110 mmHg) is a critical medical emergency requiring immediate hospital admission.",
        "source": "MoHFW Hypertension in Pregnancy Guidelines 2022",
        "urgency": "P1"
    },
    {
        "text": "Gestational hypertension (BP ≥140/90 mmHg) detected during these visits requires close medical observation. Severe hypertension (BP ≥160/110 mmHg) is a critical medical emergency requiring immediate hospital admission. Rapid treatment with antihypertensives is needed to prevent maternal seizures (eclampsia).",
        "source": "MoHFW Hypertension in Pregnancy Guidelines 2022",
        "urgency": "P1"
    },
    {
        "text": "Severe hypertension (BP ≥160/110 mmHg) is a critical medical emergency requiring immediate hospital admission. Rapid treatment with antihypertensives is needed to prevent maternal seizures (eclampsia). Administer magnesium sulfate under medical supervision to manage active convulsions.",
        "source": "MoHFW Eclampsia Management Protocol 2023",
        "urgency": "P1"
    },
    {
        "text": "Rapid treatment with antihypertensives is needed to prevent maternal seizures (eclampsia). Administer magnesium sulfate under medical supervision to manage active convulsions. Post-seizure, stabilize the mother and prepare for urgent delivery at a referral hospital.",
        "source": "MoHFW Eclampsia Management Protocol 2023",
        "urgency": "P1"
    },
    {
        "text": "Administer magnesium sulfate under medical supervision to manage active convulsions. Post-seizure, stabilize the mother and prepare for urgent delivery at a referral hospital. Monitor maternal reflexes, urine output, and respiratory rate hourly during magnesium sulfate therapy.",
        "source": "MoHFW Eclampsia Management Protocol 2023",
        "urgency": "P1"
    },
    {
        "text": "Post-seizure, stabilize the mother and prepare for urgent delivery at a referral hospital. Monitor maternal reflexes, urine output, and respiratory rate hourly during magnesium sulfate therapy. Ensure calcium gluconate is available at the bedside as an antidote.",
        "source": "MoHFW Eclampsia Management Protocol 2023",
        "urgency": "P2"
    },
    {
        "text": "Monitor maternal reflexes, urine output, and respiratory rate hourly during magnesium sulfate therapy. Ensure calcium gluconate is available at the bedside as an antidote. All pregnant women must also be screened for gestational diabetes (GDM) between 24-28 weeks.",
        "source": "WHO Diagnostic Criteria for GDM 2013 + ICMR Guidelines",
        "urgency": "P3"
    },
    {
        "text": "Ensure calcium gluconate is available at the bedside as an antidote. All pregnant women must also be screened for gestational diabetes (GDM) between 24-28 weeks. A single-step 75g oral glucose tolerance test is recommended for all pregnant individuals.",
        "source": "WHO Diagnostic Criteria for GDM 2013 + ICMR Guidelines",
        "urgency": "P3"
    },
    {
        "text": "All pregnant women must also be screened for gestational diabetes (GDM) between 24-28 weeks. A single-step 75g oral glucose tolerance test is recommended for all pregnant individuals. Fasting blood sugar levels above 92 mg/dL (5.1 mmol/L) suggest GDM.",
        "source": "WHO Diagnostic Criteria for GDM 2013 + ICMR Guidelines",
        "urgency": "P3"
    },
    {
        "text": "A single-step 75g oral glucose tolerance test is recommended for all pregnant individuals. Fasting blood sugar levels above 92 mg/dL (5.1 mmol/L) suggest GDM. Post-meal blood sugar levels after 2 hours above 153 mg/dL (8.5 mmol/L) confirm gestational diabetes.",
        "source": "WHO Diagnostic Criteria for GDM 2013 + ICMR Guidelines",
        "urgency": "P3"
    },
    {
        "text": "Fasting blood sugar levels above 92 mg/dL (5.1 mmol/L) suggest GDM. Post-meal blood sugar levels after 2 hours above 153 mg/dL (8.5 mmol/L) confirm gestational diabetes. Gestational diabetes requires custom dietary management and, if needed, insulin therapy to protect the fetus.",
        "source": "WHO Diagnostic Criteria for GDM 2013 + ICMR Guidelines",
        "urgency": "P3"
    },
    {
        "text": "Post-meal blood sugar levels after 2 hours above 153 mg/dL (8.5 mmol/L) confirm gestational diabetes. Gestational diabetes requires custom dietary management and, if needed, insulin therapy to protect the fetus. Untreated GDM can cause fetal macrosomia (excessive birth weight) and neonatal hypoglycemia.",
        "source": "ICMR Guidelines for Management of GDM 2021",
        "urgency": "P3"
    },
    {
        "text": "Gestational diabetes requires custom dietary management and, if needed, insulin therapy to protect the fetus. Untreated GDM can cause fetal macrosomia (excessive birth weight) and neonatal hypoglycemia. Iron-Folic Acid (IFA) tablets must be taken daily from 12 weeks of pregnancy.",
        "source": "MoHFW National Iron+ Initiative, NHM Protocol 2023",
        "urgency": "P4"
    },
    {
        "text": "Untreated GDM can cause fetal macrosomia (excessive birth weight) and neonatal hypoglycemia. Iron-Folic Acid (IFA) tablets must be taken daily from 12 weeks of pregnancy. Take one IFA tablet daily containing 60mg elemental iron and 500mcg folic acid.",
        "source": "MoHFW National Iron+ Initiative, NHM Protocol 2023",
        "urgency": "P4"
    },
    {
        "text": "Iron-Folic Acid (IFA) tablets must be taken daily from 12 weeks of pregnancy. Take one IFA tablet daily containing 60mg elemental iron and 500mcg folic acid. Continue taking IFA daily for at least 180 days during pregnancy and 180 days postpartum.",
        "source": "MoHFW National Iron+ Initiative, NHM Protocol 2023",
        "urgency": "P4"
    },
    {
        "text": "Take one IFA tablet daily containing 60mg elemental iron and 500mcg folic acid. Continue taking IFA daily for at least 180 days during pregnancy and 180 days postpartum. Folic acid prevents neural tube defects in the developing baby.",
        "source": "MoHFW National Iron+ Initiative, NHM Protocol 2023",
        "urgency": "P4"
    },
    {
        "text": "Continue taking IFA daily for at least 180 days during pregnancy and 180 days postpartum. Folic acid prevents neural tube defects in the developing baby. Anaemia during pregnancy is defined as haemoglobin levels below 11 g/dL.",
        "source": "MoHFW Anaemia Mukt Bharat Programme Guidelines 2023",
        "urgency": "P3"
    },
    {
        "text": "Folic acid prevents neural tube defects in the developing baby. Anaemia during pregnancy is defined as haemoglobin levels below 11 g/dL. Severe anaemia is diagnosed when haemoglobin drops below 7 g/dL.",
        "source": "MoHFW Anaemia Mukt Bharat Programme Guidelines 2023",
        "urgency": "P2"
    },
    {
        "text": "Anaemia during pregnancy is defined as haemoglobin levels below 11 g/dL. Severe anaemia is diagnosed when haemoglobin drops below 7 g/dL. Women with severe anaemia require immediate blood transfusion or intravenous iron sucrose under hospital care.",
        "source": "MoHFW Anaemia Mukt Bharat Programme Guidelines 2023",
        "urgency": "P1"
    },
    {
        "text": "Severe anaemia is diagnosed when haemoglobin drops below 7 g/dL. Women with severe anaemia require immediate blood transfusion or intravenous iron sucrose under hospital care. Eat iron-rich foods like spinach, jaggery, green leafy vegetables, and roasted Bengal gram.",
        "source": "ICMR Dietary Guidelines for Indians 2024",
        "urgency": "P3"
    },
    {
        "text": "Women with severe anaemia require immediate blood transfusion or intravenous iron sucrose under hospital care. Eat iron-rich foods like spinach, jaggery, green leafy vegetables, and roasted Bengal gram. Avoid tea or coffee for one hour before and after meals as they inhibit iron absorption.",
        "source": "ICMR Dietary Guidelines for Indians 2024",
        "urgency": "P4"
    },
    {
        "text": "Eat iron-rich foods like spinach, jaggery, green leafy vegetables, and roasted Bengal gram. Avoid tea or coffee for one hour before and after meals as they inhibit iron absorption. Vitamin C rich foods (lemons, oranges, amla) help the body absorb iron more efficiently.",
        "source": "ICMR Dietary Guidelines for Indians 2024",
        "urgency": "P4"
    },
    {
        "text": "Avoid tea or coffee for one hour before and after meals as they inhibit iron absorption. Vitamin C rich foods (lemons, oranges, amla) help the body absorb iron more efficiently. Pregnancy danger signs requiring immediate hospital care include vaginal bleeding, severe headache, and convulsions.",
        "source": "WHO Pregnancy Danger Signs Framework + ASHA Training Module 6",
        "urgency": "P1"
    },
    {
        "text": "Vitamin C rich foods (lemons, oranges, amla) help the body absorb iron more efficiently. Pregnancy danger signs requiring immediate hospital care include vaginal bleeding, severe headache, and convulsions. Go to the nearest community health centre or hospital immediately if these signs appear.",
        "source": "WHO Pregnancy Danger Signs Framework + ASHA Training Module 6",
        "urgency": "P1"
    },
    {
        "text": "Pregnancy danger signs requiring immediate hospital care include vaginal bleeding, severe headache, and convulsions. Go to the nearest community health centre or hospital immediately if these signs appear. Other red flags are blurred vision, high fever, severe abdominal pain, and no fetal movement.",
        "source": "WHO Pregnancy Danger Signs Framework + ASHA Training Module 6",
        "urgency": "P1"
    },
    {
        "text": "Go to the nearest community health centre or hospital immediately if these signs appear. Other red flags are blurred vision, high fever, severe abdominal pain, and no fetal movement after 28 weeks. ASHA workers must ensure immediate referral via 108 or 102 ambulance services.",
        "source": "NHM ASHA Field Operations Guidelines 2021",
        "urgency": "P1"
    },
    {
        "text": "Other red flags are blurred vision, high fever, severe abdominal pain, and no fetal movement after 28 weeks. ASHA workers must ensure immediate referral via 108 or 102 ambulance services. ASHA workers must conduct home visits at days 3, 7, 28, and 42 after delivery.",
        "source": "NHM ASHA Field Operations Guidelines 2021",
        "urgency": "P3"
    },
    {
        "text": "ASHA workers must ensure immediate referral via 108 or 102 ambulance services. ASHA workers must conduct home visits at days 3, 7, 28, and 42 after delivery. Check the mother for postpartum bleeding, fever, and breast engorgement during these visits.",
        "source": "NHM ASHA Field Operations Guidelines 2021",
        "urgency": "P3"
    },
    {
        "text": "ASHA workers must conduct home visits at days 3, 7, 28, and 42 after delivery. Check the mother for postpartum bleeding, fever, and breast engorgement during these visits. Verify that the newborn is feeding well, has a warm body temperature, and no skin pustules.",
        "source": "NHM Home Based Newborn Care (HBNC) Guidelines 2022",
        "urgency": "P3"
    },
    {
        "text": "Check the mother for postpartum bleeding, fever, and breast engorgement during these visits. Verify that the newborn is feeding well, has a warm body temperature, and no skin pustules. Postpartum haemorrhage (PPH) is defined as blood loss of 500 mL or more after vaginal birth.",
        "source": "WHO Guidelines on Prevention and Treatment of PPH",
        "urgency": "P1"
    },
    {
        "text": "Verify that the newborn is feeding well, has a warm body temperature, and no skin pustules. Postpartum haemorrhage (PPH) is defined as blood loss of 500 mL or more after vaginal birth. PPH is a major cause of maternal mortality and requires immediate administration of oxytocin.",
        "source": "WHO Guidelines on Prevention and Treatment of PPH",
        "urgency": "P1"
    },
    {
        "text": "Postpartum haemorrhage (PPH) is defined as blood loss of 500 mL or more after vaginal birth. PPH is a major cause of maternal mortality and requires immediate administration of oxytocin. Active management of the third stage of labor (AMTSL) includes giving 10 IU of oxytocin intramuscularly.",
        "source": "WHO Guidelines on Prevention and Treatment of PPH",
        "urgency": "P1"
    },
    {
        "text": "PPH is a major cause of maternal mortality and requires immediate administration of oxytocin. Active management of the third stage of labor (AMTSL) includes giving 10 IU of oxytocin intramuscularly. Uterine massage should be performed immediately after delivery of the placenta to encourage contractions.",
        "source": "WHO Guidelines on Prevention and Treatment of PPH",
        "urgency": "P2"
    },
    {
        "text": "Active management of the third stage of labor (AMTSL) includes giving 10 IU of oxytocin intramuscularly. Uterine massage should be performed immediately after delivery of the placenta to encourage contractions. For home births, ASHA workers can administer oral misoprostol 600 mcg to prevent PPH if oxytocin is unavailable.",
        "source": "MoHFW Guidelines for Prevention of PPH at Home Births",
        "urgency": "P2"
    },
    {
        "text": "Uterine massage should be performed immediately after delivery of the placenta to encourage contractions. For home births, ASHA workers can administer oral misoprostol 600 mcg to prevent PPH if oxytocin is unavailable. Puerperal sepsis is a severe bacterial infection of the genital tract occurring within 42 days of delivery.",
        "source": "WHO Puerperal Sepsis Guidelines + NHM Protocol",
        "urgency": "P1"
    },
    {
        "text": "For home births, ASHA workers can administer oral misoprostol 600 mcg to prevent PPH if oxytocin is unavailable. Puerperal sepsis is a severe bacterial infection of the genital tract occurring within 42 days of delivery. Warning signs include high fever, foul-smelling vaginal discharge, and lower abdominal pain.",
        "source": "WHO Puerperal Sepsis Guidelines + NHM Protocol",
        "urgency": "P1"
    },
    {
        "text": "Puerperal sepsis is a severe bacterial infection of the genital tract occurring within 42 days of delivery. Warning signs include high fever, foul-smelling vaginal discharge, and lower abdominal pain. Treat puerperal sepsis promptly with broad-spectrum intravenous antibiotics at a secondary care centre.",
        "source": "WHO Puerperal Sepsis Guidelines + NHM Protocol",
        "urgency": "P1"
    },
    {
        "text": "Warning signs include high fever, foul-smelling vaginal discharge, and lower abdominal pain. Treat puerperal sepsis promptly with broad-spectrum intravenous antibiotics at a secondary care centre. Clean delivery practices (5 Cleans: clean hands, clean surface, clean cord cut, clean tie, clean thread) prevent sepsis.",
        "source": "WHO Clean Delivery Guidelines + ASHA Manual",
        "urgency": "P3"
    },

    # ── menstrual hygiene & reproductive health (41-80) ──
    {
        "text": "A normal menstrual cycle lasts between 21 and 35 days, with a flow duration of 2 to 7 days. Heavy menstrual bleeding (menorrhagia) is defined as soaking through one or more pads per hour for consecutive hours. Consult a healthcare provider if bleeding is excessive, prolonged, or contains large clots.",
        "source": "FOGSI Clinical Practice Guidelines on Abnormal Uterine Bleeding 2020",
        "urgency": "P2"
    },
    {
        "text": "Heavy menstrual bleeding (menorrhagia) is defined as soaking through one or more pads per hour for consecutive hours. Consult a healthcare provider if bleeding is excessive, prolonged, or contains large clots. Severe menstrual pain that limits daily activity is dysmenorrhoea and may suggest endometriosis.",
        "source": "FOGSI Dysmenorrhoea Guidelines + WHO Reproductive Health Report",
        "urgency": "P3"
    },
    {
        "text": "Consult a healthcare provider if bleeding is excessive, prolonged, or contains large clots. Severe menstrual pain that limits daily activity is dysmenorrhoea and may suggest endometriosis. Endometriosis or uterine fibroids require ultrasound evaluation and gynecological consult for proper management.",
        "source": "FOGSI Endometriosis Manual",
        "urgency": "P3"
    },
    {
        "text": "Severe menstrual pain that limits daily activity is dysmenorrhoea and may suggest endometriosis. Endometriosis or uterine fibroids require ultrasound evaluation and gynecological consult for proper management. To maintain personal hygiene during menstruation, change sanitary pads every 4 to 6 hours.",
        "source": "MoHFW Menstrual Hygiene Management (MHM) Scheme 2023",
        "urgency": "P4"
    },
    {
        "text": "Endometriosis or uterine fibroids require ultrasound evaluation and gynecological consult for proper management. To maintain personal hygiene during menstruation, change sanitary pads every 4 to 6 hours. Wash the intimate area with clean water and mild soap from front to back to prevent urinary infections.",
        "source": "MoHFW Menstrual Hygiene Management (MHM) Scheme 2023",
        "urgency": "P4"
    },
    {
        "text": "To maintain personal hygiene during menstruation, change sanitary pads every 4 to 6 hours. Wash the intimate area with clean water and mild soap from front to back to prevent urinary infections. Avoid using dirty rags, sand, ash, or leaves, as these can cause reproductive tract infections.",
        "source": "MoHFW Menstrual Hygiene Management (MHM) Scheme 2023",
        "urgency": "P3"
    },
    {
        "text": "Wash the intimate area with clean water and mild soap from front to back to prevent urinary infections. Avoid using dirty rags, sand, ash, or leaves, as these can cause reproductive tract infections. If reusable cloth pads are used, wash them thoroughly with soap, and dry them in direct sunlight.",
        "source": "MoHFW Menstrual Hygiene Management (MHM) Scheme 2023",
        "urgency": "P4"
    },
    {
        "text": "Avoid using dirty rags, sand, ash, or leaves, as these can cause reproductive tract infections. If reusable cloth pads are used, wash them thoroughly with soap, and dry them in direct sunlight. Direct sunlight acts as a natural disinfectant and kills harmful bacteria on washed cloth pads.",
        "source": "MoHFW Menstrual Hygiene Management (MHM) Scheme 2023",
        "urgency": "P4"
    },
    {
        "text": "If reusable cloth pads are used, wash them thoroughly with soap, and dry them in direct sunlight. Direct sunlight acts as a natural disinfectant and kills harmful bacteria on washed cloth pads. Menstrual cups are reusable medical-grade silicone devices that can be safely worn for 8 to 12 hours.",
        "source": "WHO Reproductive Health Report + MoHFW MHM Guidelines",
        "urgency": "P4"
    },
    {
        "text": "Direct sunlight acts as a natural disinfectant and kills harmful bacteria on washed cloth pads. Menstrual cups are reusable medical-grade silicone devices that can be safely worn for 8 to 12 hours. Boil the menstrual cup in hot water for 5-7 minutes before and after every menstrual cycle to sterilize it.",
        "source": "WHO Reproductive Health Report + MoHFW MHM Guidelines",
        "urgency": "P4"
    },
    {
        "text": "Menstrual cups are reusable medical-grade silicone devices that can be safely worn for 8 to 12 hours. Boil the menstrual cup in hot water for 5-7 minutes before and after every menstrual cycle to sterilize it. Vaginal discharge that is white, thick, clumped like curd, or has a foul odour indicates a vaginal infection.",
        "source": "WHO Syndromic Management of RTIs/STIs Guidelines 2021",
        "urgency": "P3"
    },
    {
        "text": "Boil the menstrual cup in hot water for 5-7 minutes before and after every menstrual cycle to sterilize it. Vaginal discharge that is white, thick, clumped like curd, or has a foul odour indicates a vaginal infection. Common conditions include vulvovaginal candidiasis (yeast infection) and bacterial vaginosis (BV).",
        "source": "WHO Syndromic Management of RTIs/STIs Guidelines 2021",
        "urgency": "P3"
    },
    {
        "text": "Vaginal discharge that is white, thick, clumped like curd, or has a foul odour indicates a vaginal infection. Common conditions include vulvovaginal candidiasis (yeast infection) and bacterial vaginosis (BV). Vaginal itching, burning, and painful urination often accompany these infections.",
        "source": "WHO Syndromic Management of RTIs/STIs Guidelines 2021",
        "urgency": "P3"
    },
    {
        "text": "Common conditions include vulvovaginal candidiasis (yeast infection) and bacterial vaginosis (BV). Vaginal itching, burning, and painful urination often accompany these infections. Treat vaginal yeast infections with antifungal medications (like clotrimazole) and BV with oral metronidazole as prescribed.",
        "source": "WHO Syndromic Management of RTIs/STIs Guidelines 2021",
        "urgency": "P3"
    },
    {
        "text": "Vaginal itching, burning, and painful urination often accompany these infections. Treat vaginal yeast infections with antifungal medications (like clotrimazole) and BV with oral metronidazole as prescribed. Avoid self-medication; consult an ASHA worker or doctor for syndromic management guidelines.",
        "source": "WHO Syndromic Management of RTIs/STIs Guidelines 2021",
        "urgency": "P3"
    },
    {
        "text": "Treat vaginal yeast infections with antifungal medications (like clotrimazole) and BV with oral metronidazole as prescribed. Avoid self-medication; consult an ASHA worker or doctor for syndromic management guidelines. Polycystic Ovary Syndrome (PCOS) is a common hormonal disorder in women of reproductive age.",
        "source": "ICMR PCOS Task Force Guidelines + NHM India",
        "urgency": "P3"
    },
    {
        "text": "Avoid self-medication; consult an ASHA worker or doctor for syndromic management guidelines. Polycystic Ovary Syndrome (PCOS) is a common hormonal disorder in women of reproductive age. Classic symptoms of PCOS include irregular periods, weight gain, excess facial hair, and acne.",
        "source": "ICMR PCOS Task Force Guidelines + NHM India",
        "urgency": "P3"
    },
    {
        "text": "Polycystic Ovary Syndrome (PCOS) is a common hormonal disorder in women of reproductive age. Classic symptoms of PCOS include irregular periods, weight gain, excess facial hair, and acne. Manage PCOS with regular exercise, a balanced low-sugar diet, and medical guidance to regulate hormones.",
        "source": "ICMR PCOS Task Force Guidelines + NHM India",
        "urgency": "P3"
    },
    {
        "text": "Classic symptoms of PCOS include irregular periods, weight gain, excess facial hair, and acne. Manage PCOS with regular exercise, a balanced low-sugar diet, and medical guidance to regulate hormones. Pelvic Inflammatory Disease (PID) is an infection of the female reproductive organs.",
        "source": "CDC Pelvic Inflammatory Disease Treatment Guidelines 2021",
        "urgency": "P2"
    },
    {
        "text": "Manage PCOS with regular exercise, a balanced low-sugar diet, and medical guidance to regulate hormones. Pelvic Inflammatory Disease (PID) is an infection of the female reproductive organs. Symptoms include lower abdominal pain, fever, unusual vaginal discharge, and painful intercourse.",
        "source": "CDC Pelvic Inflammatory Disease Treatment Guidelines 2021",
        "urgency": "P2"
    },
    {
        "text": "Pelvic Inflammatory Disease (PID) is an infection of the female reproductive organs. Symptoms include lower abdominal pain, fever, unusual vaginal discharge, and painful intercourse. If left untreated, PID can lead to long-term chronic pelvic pain and infertility.",
        "source": "CDC Pelvic Inflammatory Disease Treatment Guidelines 2021",
        "urgency": "P2"
    },
    {
        "text": "Symptoms include lower abdominal pain, fever, unusual vaginal discharge, and painful intercourse. If left untreated, PID can lead to long-term chronic pelvic pain and infertility. Prompt treatment with antibiotic regimens under supervision is essential to resolve PID.",
        "source": "CDC Pelvic Inflammatory Disease Treatment Guidelines 2021",
        "urgency": "P2"
    },
    {
        "text": "If left untreated, PID can lead to long-term chronic pelvic pain and infertility. Prompt treatment with antibiotic regimens under supervision is essential to resolve PID. Syphilis is a bacterial sexually transmitted infection characterized by painless sores on the genitals.",
        "source": "WHO Guidelines for the Treatment of Treponema pallidum (Syphilis) 2016",
        "urgency": "P2"
    },
    {
        "text": "Prompt treatment with antibiotic regimens under supervision is essential to resolve PID. Syphilis is a bacterial sexually transmitted infection characterized by painless sores on the genitals. Left untreated, syphilis can cause severe damage to the heart, brain, and nervous system.",
        "source": "WHO Guidelines for the Treatment of Treponema pallidum (Syphilis) 2016",
        "urgency": "P2"
    },
    {
        "text": "Syphilis is a bacterial sexually transmitted infection characterized by painless sores on the genitals. Left untreated, syphilis can cause severe damage to the heart, brain, and nervous system. Injection Benzathine Penicillin G is the first-line treatment for all stages of syphilis.",
        "source": "WHO Guidelines for the Treatment of Treponema pallidum (Syphilis) 2016",
        "urgency": "P2"
    },
    {
        "text": "Left untreated, syphilis can cause severe damage to the heart, brain, and nervous system. Injection Benzathine Penicillin G is the first-line treatment for all stages of syphilis. Gonorrhea is a bacterial STI causing painful urination and thick discharge from the urethra or cervix.",
        "source": "WHO Guidelines for the Treatment of Neisseria gonorrhoeae 2016",
        "urgency": "P2"
    },
    {
        "text": "Injection Benzathine Penicillin G is the first-line treatment for all stages of syphilis. Gonorrhea is a bacterial STI causing painful urination and thick discharge from the urethra or cervix. Gonorrhea is treated with a single intramuscular dose of ceftriaxone combined with oral azithromycin.",
        "source": "WHO Guidelines for the Treatment of Neisseria gonorrhoeae 2016",
        "urgency": "P2"
    },
    {
        "text": "Gonorrhea is a bacterial STI causing painful urination and thick discharge from the urethra or cervix. Gonorrhea is treated with a single intramuscular dose of ceftriaxone combined with oral azithromycin. Prevent transmission of all STIs by using barrier contraceptive methods (condoms) during intercourse.",
        "source": "WHO Prevention and Control of STIs Guidelines 2022",
        "urgency": "P3"
    },
    {
        "text": "Gonorrhea is treated with a single intramuscular dose of ceftriaxone combined with oral azithromycin. Prevent transmission of all STIs by using barrier contraceptive methods (condoms) during intercourse. All sexual partners must be treated simultaneously to prevent reinfection of STIs.",
        "source": "WHO Prevention and Control of STIs Guidelines 2022",
        "urgency": "P3"
    },
    {
        "text": "Prevent transmission of all STIs by using barrier contraceptive methods (condoms) during intercourse. All sexual partners must be treated simultaneously to prevent reinfection of STIs. Cervical cancer is a leading cause of cancer deaths in women and is caused by Human Papillomavirus (HPV).",
        "source": "WHO Global Strategy to Accelerate the Elimination of Cervical Cancer 2020",
        "urgency": "P3"
    },
    {
        "text": "All sexual partners must be treated simultaneously to prevent reinfection of STIs. Cervical cancer is a leading cause of cancer deaths in women and is caused by Human Papillomavirus (HPV). HPV vaccination is highly effective when given to girls between 9 and 14 years of age.",
        "source": "WHO Global Strategy to Accelerate the Elimination of Cervical Cancer 2020",
        "urgency": "P4"
    },
    {
        "text": "Cervical cancer is a leading cause of cancer deaths in women and is caused by Human Papillomavirus (HPV). HPV vaccination is highly effective when given to girls between 9 and 14 years of age. Routine screening via Pap smears or visual inspection with acetic acid (VIA) helps detect early cellular changes.",
        "source": "WHO Cervical Cancer Screening Guidelines 2021",
        "urgency": "P3"
    },
    {
        "text": "HPV vaccination is highly effective when given to girls between 9 and 14 years of age. Routine screening via Pap smears or visual inspection with acetic acid (VIA) helps detect early cellular changes. Early detection and ablation of pre-cancerous lesions prevents cervical cancer development entirely.",
        "source": "WHO Cervical Cancer Screening Guidelines 2021",
        "urgency": "P3"
    },
    {
        "text": "Routine screening via Pap smears or visual inspection with acetic acid (VIA) helps detect early cellular changes. Early detection and ablation of pre-cancerous lesions prevents cervical cancer development entirely. Breast self-examinations should be done monthly by all women over 20 years.",
        "source": "WHO Breast Cancer Early Detection Protocol",
        "urgency": "P4"
    },
    {
        "text": "Early detection and ablation of pre-cancerous lesions prevents cervical cancer development entirely. Breast self-examinations should be done monthly by all women over 20 years. Look for changes in breast shape, skin dimpling, or any painless hard lumps in the breast or underarm.",
        "source": "WHO Breast Cancer Early Detection Protocol",
        "urgency": "P3"
    },
    {
        "text": "Breast self-examinations should be done monthly by all women over 20 years. Look for changes in breast shape, skin dimpling, or any painless hard lumps in the breast or underarm. Report any breast lumps or unusual nipple discharge to an ASHA worker or doctor for clinical breast exam.",
        "source": "WHO Breast Cancer Early Detection Protocol",
        "urgency": "P3"
    },
    {
        "text": "Look for changes in breast shape, skin dimpling, or any painless hard lumps in the breast or underarm. Report any breast lumps or unusual nipple discharge to an ASHA worker or doctor for clinical breast exam. Uterine prolapse is when the uterus slips into the vaginal canal due to weakened pelvic muscles.",
        "source": "WHO Guidelines on Female Genital Prolapse",
        "urgency": "P3"
    },
    {
        "text": "Report any breast lumps or unusual nipple discharge to an ASHA worker or doctor for clinical breast exam. Uterine prolapse is when the uterus slips into the vaginal canal due to weakened pelvic muscles. Prevent prolapse by avoiding heavy lifting postpartum and performing pelvic floor (Kegel) exercises.",
        "source": "WHO Guidelines on Female Genital Prolapse",
        "urgency": "P4"
    },
    {
        "text": "Uterine prolapse is when the uterus slips into the vaginal canal due to weakened pelvic muscles. Prevent prolapse by avoiding heavy lifting postpartum and performing pelvic floor (Kegel) exercises. Severe cases of uterine prolapse require a supportive ring (pessary) or surgical repair.",
        "source": "WHO Guidelines on Female Genital Prolapse",
        "urgency": "P2"
    },
    {
        "text": "Prevent prolapse by avoiding heavy lifting postpartum and performing pelvic floor (Kegel) exercises. Severe cases of uterine prolapse require a supportive ring (pessary) or surgical repair. Family planning services provide access to modern contraceptive methods like pills, copper-T, and condoms.",
        "source": "MoHFW Family Planning Guidelines India 2023",
        "urgency": "P4"
    },

    # ── child health & acute diseases (81-120) ──
    {
        "text": "Severe Acute Malnutrition (SAM) in children is diagnosed by a Mid-Upper Arm Circumference (MUAC) under 11.5 cm. SAM is a critical pediatric condition requiring immediate hospital referral or enrollment in a nutritional rehabilitation centre. Complications like hypoglycemia, hypothermia, and infections must be treated immediately.",
        "source": "WHO SAM Management Guidelines 2013 + NHM Protocol",
        "urgency": "P1"
    },
    {
        "text": "Severe Acute Malnutrition (SAM) in children is diagnosed by a Mid-Upper Arm Circumference (MUAC) under 11.5 cm. SAM is a critical pediatric condition requiring immediate hospital referral or enrollment in a nutritional rehabilitation centre. Community-based management uses Ready-to-Use Therapeutic Food (RUTF) for uncomplicated cases.",
        "source": "WHO SAM Management Guidelines 2013 + NHM Protocol",
        "urgency": "P1"
    },
    {
        "text": "SAM is a critical pediatric condition requiring immediate hospital referral or enrollment in a nutritional rehabilitation centre. Community-based management uses Ready-to-Use Therapeutic Food (RUTF) for uncomplicated cases. Moderate Acute Malnutrition (MAM) is diagnosed when child MUAC is between 11.5 and 12.5 cm.",
        "source": "UNICEF/WHO MAM Guidelines + NHM India",
        "urgency": "P2"
    },
    {
        "text": "Community-based management uses Ready-to-Use Therapeutic Food (RUTF) for uncomplicated cases. Moderate Acute Malnutrition (MAM) is diagnosed when child MUAC is between 11.5 and 12.5 cm. Children with MAM should receive supplementary high-protein feeding and weekly follow-ups from ASHA.",
        "source": "UNICEF/WHO MAM Guidelines + NHM India",
        "urgency": "P2"
    },
    {
        "text": "Moderate Acute Malnutrition (MAM) is diagnosed when child MUAC is between 11.5 and 12.5 cm. Children with MAM should receive supplementary high-protein feeding and weekly follow-ups from ASHA. Exclusive breastfeeding for the first 6 months of life is critical for child survival.",
        "source": "WHO Infant Feeding Guidelines 2003",
        "urgency": "P4"
    },
    {
        "text": "Children with MAM should receive supplementary high-protein feeding and weekly follow-ups from ASHA. Exclusive breastfeeding for the first 6 months of life is critical for child survival. Breast milk contains all necessary nutrients, antibodies, and water required for the infant.",
        "source": "WHO Infant Feeding Guidelines 2003",
        "urgency": "P4"
    },
    {
        "text": "Exclusive breastfeeding for the first 6 months of life is critical for child survival. Breast milk contains all necessary nutrients, antibodies, and water required for the infant. Complementary feeding should start at 6 months of age along with continued breastfeeding.",
        "source": "WHO Infant Feeding Guidelines 2003",
        "urgency": "P4"
    },
    {
        "text": "Breast milk contains all necessary nutrients, antibodies, and water required for the infant. Complementary feeding should start at 6 months of age along with continued breastfeeding. Introduce mashed fruits, vegetables, and soft khichdi while breastfeeding up to 2 years.",
        "source": "WHO Infant Feeding Guidelines 2003",
        "urgency": "P4"
    },
    {
        "text": "Complementary feeding should start at 6 months of age along with continued breastfeeding. Introduce mashed fruits, vegetables, and soft khichdi while breastfeeding up to 2 years. Child immunisation schedule: BCG, OPV-0, and Hepatitis B-0 are administered at birth.",
        "source": "MoHFW Universal Immunisation Programme (UIP) India 2024",
        "urgency": "P3"
    },
    {
        "text": "Introduce mashed fruits, vegetables, and soft khichdi while breastfeeding up to 2 years. Child immunisation schedule: BCG, OPV-0, and Hepatitis B-0 are administered at birth. DPT-1, Pentavalent-1, OPV-1, and Rotavirus Vaccine-1 are given at 6 weeks.",
        "source": "MoHFW Universal Immunisation Programme (UIP) India 2024",
        "urgency": "P3"
    },
    {
        "text": "Child immunisation schedule: BCG, OPV-0, and Hepatitis B-0 are administered at birth. DPT-1, Pentavalent-1, OPV-1, and Rotavirus Vaccine-1 are given at 6 weeks. Subsequent immunisation doses are administered at 10 weeks and 14 weeks of age.",
        "source": "MoHFW Universal Immunisation Programme (UIP) India 2024",
        "urgency": "P3"
    },
    {
        "text": "DPT-1, Pentavalent-1, OPV-1, and Rotavirus Vaccine-1 are given at 6 weeks. Subsequent immunisation doses are administered at 10 weeks and 14 weeks of age. Measles-Rubella (MR) first dose is given between 9 and 12 months.",
        "source": "MoHFW Universal Immunisation Programme (UIP) India 2024",
        "urgency": "P3"
    },
    {
        "text": "Subsequent immunisation doses are administered at 10 weeks and 14 weeks of age. Measles-Rubella (MR) first dose is given between 9 and 12 months. Child diarrhoea: administer Oral Rehydration Salts (ORS) solution after every loose stool.",
        "source": "WHO IMCI Protocol 2014 + MoHFW Diarrhoea Control Scheme",
        "urgency": "P2"
    },
    {
        "text": "Measles-Rubella (MR) first dose is given between 9 and 12 months. Child diarrhoea: administer Oral Rehydration Salts (ORS) solution after every loose stool. Prepare ORS by dissolving one packet in 1 litre of clean drinking water.",
        "source": "WHO Oral Rehydration Salts Guidelines",
        "urgency": "P3"
    },
    {
        "text": "Child diarrhoea: administer Oral Rehydration Salts (ORS) solution after every loose stool. Prepare ORS by dissolving one packet in 1 litre of clean drinking water. Give 20mg Zinc dispersible tablets daily for 14 days for children over 6 months.",
        "source": "WHO Diarrhoea Management Guidelines + NHM India",
        "urgency": "P2"
    },
    {
        "text": "Prepare ORS by dissolving one packet in 1 litre of clean drinking water. Give 20mg Zinc dispersible tablets daily for 14 days for children over 6 months. Zinc tablets reduce the severity and duration of the diarrhoeal episode.",
        "source": "WHO Diarrhoea Management Guidelines + NHM India",
        "urgency": "P3"
    },
    {
        "text": "Give 20mg Zinc dispersible tablets daily for 14 days for children over 6 months. Zinc tablets reduce the severity and duration of the diarrhoeal episode. Children under 6 months of age with diarrhoea should receive 10mg Zinc daily.",
        "source": "WHO Diarrhoea Management Guidelines + NHM India",
        "urgency": "P3"
    },
    {
        "text": "Zinc tablets reduce the severity and duration of the diarrhoeal episode. Children under 6 months of age with diarrhoea should receive 10mg Zinc daily. Seek immediate medical care if child has blood in stool, persistent vomiting, or high fever.",
        "source": "WHO IMCI Protocol 2014",
        "urgency": "P1"
    },
    {
        "text": "Children under 6 months of age with diarrhoea should receive 10mg Zinc daily. Seek immediate medical care if child has blood in stool, persistent vomiting, or high fever. Danger signs of severe dehydration: sunken eyes, extreme lethargy, and dry mouth.",
        "source": "WHO IMCI Protocol 2014",
        "urgency": "P1"
    },
    {
        "text": "Seek immediate medical care if child has blood in stool, persistent vomiting, or high fever. Danger signs of severe dehydration: sunken eyes, extreme lethargy, and dry mouth. Severely dehydrated children require immediate intravenous (IV) fluid therapy at a hospital.",
        "source": "WHO IMCI Protocol 2014 + MoHFW Diarrhoea Control Programme",
        "urgency": "P1"
    },
    {
        "text": "Danger signs of severe dehydration: sunken eyes, extreme lethargy, and dry mouth. Severely dehydrated children require immediate intravenous (IV) fluid therapy at a hospital. Cholera is characterized by sudden, profuse, watery rice-water stools and vomiting.",
        "source": "WHO Cholera Control Guidelines 2023",
        "urgency": "P1"
    },
    {
        "text": "Severely dehydrated children require immediate intravenous (IV) fluid therapy at a hospital. Cholera is characterized by sudden, profuse, watery rice-water stools and vomiting. Dehydration from cholera can lead to hypovolemic shock and death within hours if untreated.",
        "source": "WHO Cholera Control Guidelines 2023",
        "urgency": "P1"
    },
    {
        "text": "Cholera is characterized by sudden, profuse, watery rice-water stools and vomiting. Dehydration from cholera can lead to hypovolemic shock and death within hours if untreated. Give ORS continuously on the way to the hospital for intravenous therapy.",
        "source": "WHO Cholera Control Guidelines 2023",
        "urgency": "P1"
    },
    {
        "text": "Dehydration from cholera can lead to hypovolemic shock and death within hours if untreated. Give ORS continuously on the way to the hospital for intravenous therapy. Treat cholera with oral rehydration, IV fluids, and antibiotics (like azithromycin) to reduce duration.",
        "source": "WHO Cholera Control Guidelines 2023",
        "urgency": "P1"
    },
    {
        "text": "Give ORS continuously on the way to the hospital for intravenous therapy. Treat cholera with oral rehydration, IV fluids, and antibiotics (like azithromycin) to reduce duration. Cholera outbreaks require prompt investigation of water sources and water chlorination campaigns.",
        "source": "WHO Cholera Control Guidelines 2023 + IDSP India",
        "urgency": "P1"
    },
    {
        "text": "Treat cholera with oral rehydration, IV fluids, and antibiotics (like azithromycin) to reduce duration. Cholera outbreaks require prompt investigation of water sources and water chlorination campaigns. Acute respiratory infections (ARI) are major causes of mortality in young children.",
        "source": "WHO IMNCI Protocol + MoHFW Guidelines",
        "urgency": "P3"
    },
    {
        "text": "Cholera outbreaks require prompt investigation of water sources and water chlorination campaigns. Acute respiratory infections (ARI) are major causes of mortality in young children. Symptoms include persistent cough, runny nose, and fever.",
        "source": "WHO IMNCI Protocol + MoHFW Guidelines",
        "urgency": "P3"
    },
    {
        "text": "Acute respiratory infections (ARI) are major causes of mortality in young children. Symptoms include persistent cough, runny nose, and fever. Pneumonia warning signs in children: rapid breathing and chest indrawing (in-drawing of lower chest wall).",
        "source": "WHO IMCI Protocol 2014",
        "urgency": "P1"
    },
    {
        "text": "Symptoms include persistent cough, runny nose, and fever. Pneumonia warning signs in children: rapid breathing and chest indrawing (in-drawing of lower chest wall). For infants under 2 months, a respiratory rate of 60 breaths/min or more is rapid breathing.",
        "source": "WHO IMCI Protocol 2014",
        "urgency": "P1"
    },
    {
        "text": "Pneumonia warning signs in children: rapid breathing and chest indrawing (in-drawing of lower chest wall). For infants under 2 months, a respiratory rate of 60 breaths/min or more is rapid breathing. For children 2-11 months, rapid breathing is 50 breaths/min or more.",
        "source": "WHO IMCI Protocol 2014",
        "urgency": "P1"
    },
    {
        "text": "For infants under 2 months, a respiratory rate of 60 breaths/min or more is rapid breathing. For children 2-11 months, rapid breathing is 50 breaths/min or more. For children 12-59 months, rapid breathing is 40 breaths/min or more.",
        "source": "WHO IMCI Protocol 2014",
        "urgency": "P1"
    },
    {
        "text": "For children 2-11 months, rapid breathing is 50 breaths/min or more. For children 12-59 months, rapid breathing is 40 breaths/min or more. Pneumonia requires immediate oral amoxicillin or referral for injectable antibiotics if severe.",
        "source": "WHO IMCI Protocol 2014",
        "urgency": "P1"
    },
    {
        "text": "For children 12-59 months, rapid breathing is 40 breaths/min or more. Pneumonia requires immediate oral amoxicillin or referral for injectable antibiotics if severe. Keep the child warm and continue feeding during treatment for pneumonia.",
        "source": "WHO IMCI Protocol 2014",
        "urgency": "P2"
    },
    {
        "text": "Pneumonia requires immediate oral amoxicillin or referral for injectable antibiotics if severe. Keep the child warm and continue feeding during treatment for pneumonia. Neonatal sepsis is a blood infection in infants less than 28 days old.",
        "source": "WHO Guidelines on Neonatal Sepsis Management",
        "urgency": "P1"
    },
    {
        "text": "Keep the child warm and continue feeding during treatment for pneumonia. Neonatal sepsis is a blood infection in infants less than 28 days old. Signs: poor feeding, lethargy, weak cry, cold body, or fast breathing.",
        "source": "WHO Guidelines on Neonatal Sepsis Management",
        "urgency": "P1"
    },
    {
        "text": "Neonatal sepsis is a blood infection in infants less than 28 days old. Signs: poor feeding, lethargy, weak cry, cold body, or fast breathing. Injectable ampicillin and gentamicin must be administered immediately under hospital supervision.",
        "source": "WHO Guidelines on Neonatal Sepsis Management",
        "urgency": "P1"
    },
    {
        "text": "Signs: poor feeding, lethargy, weak cry, cold body, or fast breathing. Injectable ampicillin and gentamicin must be administered immediately under hospital supervision. Prevent neonatal infections by ensuring sterile umbilical cord care and clean deliveries.",
        "source": "WHO Newborn Care Guidelines",
        "urgency": "P3"
    },
    {
        "text": "Injectable ampicillin and gentamicin must be administered immediately under hospital supervision. Prevent neonatal infections by ensuring sterile umbilical cord care and clean deliveries. Apply chlorhexidine gel to the newborn's umbilical cord stump immediately after cutting.",
        "source": "MoHFW Operational Guidelines on Umbilical Cord Care 2021",
        "urgency": "P4"
    },
    {
        "text": "Prevent neonatal infections by ensuring sterile umbilical cord care and clean deliveries. Apply chlorhexidine gel to the newborn's umbilical cord stump immediately after cutting. Keep the stump dry and clean; avoid applying cow dung or oil.",
        "source": "MoHFW Operational Guidelines on Umbilical Cord Care 2021",
        "urgency": "P3"
    },
    {
        "text": "Apply chlorhexidine gel to the newborn's umbilical cord stump immediately after cutting. Keep the stump dry and clean; avoid applying cow dung or oil. Congenital syphilis occurs when a pregnant mother passes syphilis to the fetus.",
        "source": "WHO Guidelines on Prevention of Mother-to-Child Transmission of Syphilis 2017",
        "urgency": "P2"
    },

    # ── vector-borne & communicable diseases (121-160) ──
    {
        "text": "Tuberculosis (TB) is a bacterial disease causing chronic cough for more than 2 weeks. Other classic symptoms include blood in sputum, evening fever, night sweats, and weight loss. Government hospitals provide free sputum test (GeneXpert) and complete TB treatment.",
        "source": "MoHFW National TB Elimination Programme (NTEP) Guidelines 2023",
        "urgency": "P2"
    },
    {
        "text": "Other classic symptoms include blood in sputum, evening fever, night sweats, and weight loss. Government hospitals provide free sputum test (GeneXpert) and complete TB treatment. TB treatment uses a standard 6-month DOTS course (Rifampicin, Isoniazid, Pyrazinamide, Ethambutol).",
        "source": "MoHFW National TB Elimination Programme (NTEP) Guidelines 2023",
        "urgency": "P2"
    },
    {
        "text": "Government hospitals provide free sputum test (GeneXpert) and complete TB treatment. TB treatment uses a standard 6-month DOTS course (Rifampicin, Isoniazid, Pyrazinamide, Ethambutol). Complete the entire antibiotic course; stopping early causes Multi-Drug Resistant TB (MDR-TB).",
        "source": "MoHFW National TB Elimination Programme (NTEP) Guidelines 2023",
        "urgency": "P2"
    },
    {
        "text": "TB treatment uses a standard 6-month DOTS course (Rifampicin, Isoniazid, Pyrazinamide, Ethambutol). Complete the entire antibiotic course; stopping early causes Multi-Drug Resistant TB (MDR-TB). MDR-TB requires longer, complex drug regimens (bedaquiline, linezolid) with severe side effects.",
        "source": "WHO Consolidated Guidelines on Tuberculosis Treatment 2022",
        "urgency": "P2"
    },
    {
        "text": "Complete the entire antibiotic course; stopping early causes Multi-Drug Resistant TB (MDR-TB). MDR-TB requires longer, complex drug regimens (bedaquiline, linezolid) with severe side effects. Malaria is a parasitic infection transmitted by the bite of female Anopheles mosquitoes.",
        "source": "WHO Malaria Treatment Guidelines 2021 + NVBDCP India",
        "urgency": "P2"
    },
    {
        "text": "MDR-TB requires longer, complex drug regimens (bedaquiline, linezolid) with severe side effects. Malaria is a parasitic infection transmitted by the bite of female Anopheles mosquitoes. Symptoms include high fever with shaking chills, severe headache, and sweating.",
        "source": "WHO Malaria Treatment Guidelines 2021 + NVBDCP India",
        "urgency": "P2"
    },
    {
        "text": "Malaria is a parasitic infection transmitted by the bite of female Anopheles mosquitoes. Symptoms include high fever with shaking chills, severe headache, and sweating. Diagnosis is confirmed via Rapid Diagnostic Test (RDT) or microscopic blood smear.",
        "source": "MoHFW National Vector Borne Disease Control Programme (NVBDCP)",
        "urgency": "P2"
    },
    {
        "text": "Symptoms include high fever with shaking chills, severe headache, and sweating. Diagnosis is confirmed via Rapid Diagnostic Test (RDT) or microscopic blood smear. Treat Falciparum malaria with Artemisinin-based Combination Therapy (ACT) under health supervision.",
        "source": "MoHFW National Vector Borne Disease Control Programme (NVBDCP)",
        "urgency": "P2"
    },
    {
        "text": "Diagnosis is confirmed via Rapid Diagnostic Test (RDT) or microscopic blood smear. Treat Falciparum malaria with Artemisinin-based Combination Therapy (ACT) under health supervision. Treat Vivax malaria with chloroquine for 3 days and primaquine for 14 days.",
        "source": "MoHFW National Vector Borne Disease Control Programme (NVBDCP)",
        "urgency": "P2"
    },
    {
        "text": "Treat Falciparum malaria with Artemisinin-based Combination Therapy (ACT) under health supervision. Treat Vivax malaria with chloroquine for 3 days and primaquine for 14 days. Do not give primaquine to pregnant women or infants under 1 year.",
        "source": "MoHFW National Vector Borne Disease Control Programme (NVBDCP)",
        "urgency": "P3"
    },
    {
        "text": "Treat Vivax malaria with chloroquine for 3 days and primaquine for 14 days. Do not give primaquine to pregnant women or infants under 1 year. Severe malaria signs: convulsions, black urine, respiratory distress, and deep coma.",
        "source": "WHO Guidelines for the Treatment of Malaria 2021",
        "urgency": "P1"
    },
    {
        "text": "Do not give primaquine to pregnant women or infants under 1 year. Severe malaria signs: convulsions, black urine, respiratory distress, and deep coma. Severe malaria requires urgent intravenous artesunate therapy at a tertiary referral centre.",
        "source": "WHO Guidelines for the Treatment of Malaria 2021",
        "urgency": "P1"
    },
    {
        "text": "Severe malaria signs: convulsions, black urine, respiratory distress, and deep coma. Severe malaria requires urgent intravenous artesunate therapy at a tertiary referral centre. Prevent malaria by using insecticide-treated bed nets (ITNs) and indoor residual spraying.",
        "source": "MoHFW NVBDCP Guidelines",
        "urgency": "P4"
    },
    {
        "text": "Severe malaria requires urgent intravenous artesunate therapy at a tertiary referral centre. Prevent malaria by using insecticide-treated bed nets (ITNs) and indoor residual spraying. Dengue is a viral infection transmitted by the bite of Aedes mosquitoes.",
        "source": "WHO Dengue Guidelines for Diagnosis, Treatment, Prevention and Control 2009",
        "urgency": "P2"
    },
    {
        "text": "Prevent malaria by using insecticide-treated bed nets (ITNs) and indoor residual spraying. Dengue is a viral infection transmitted by the bite of Aedes mosquitoes. Dengue symptoms: high fever, severe joint pain, muscle pain, and retro-orbital pain (pain behind eyes).",
        "source": "WHO Dengue Guidelines for Diagnosis, Treatment, Prevention and Control 2009",
        "urgency": "P2"
    },
    {
        "text": "Dengue is a viral infection transmitted by the bite of Aedes mosquitoes. Dengue symptoms: high fever, severe joint pain, muscle pain, and retro-orbital pain (pain behind eyes). Severe dengue complications include dengue hemorrhagic fever and dengue shock syndrome.",
        "source": "WHO Dengue Guidelines for Diagnosis, Treatment, Prevention and Control 2009",
        "urgency": "P1"
    },
    {
        "text": "Dengue symptoms: high fever, severe joint pain, muscle pain, and retro-orbital pain (pain behind eyes). Severe dengue complications include dengue hemorrhagic fever and dengue shock syndrome. Monitor for warning signs: severe abdominal pain, persistent vomiting, mucosal bleeding, and rapid drop in platelets.",
        "source": "WHO Dengue Guidelines for Diagnosis, Treatment, Prevention and Control 2009",
        "urgency": "P1"
    },
    {
        "text": "Severe dengue complications include dengue hemorrhagic fever and dengue shock syndrome. Monitor for warning signs: severe abdominal pain, persistent vomiting, mucosal bleeding, and rapid drop in platelets. Give supportive care with oral rehydration, bed rest, and paracetamol for fever.",
        "source": "WHO Dengue Clinical Management Manual 2012",
        "urgency": "P2"
    },
    {
        "text": "Monitor for warning signs: severe abdominal pain, persistent vomiting, mucosal bleeding, and drop in platelets. Give supportive care with oral rehydration, bed rest, and paracetamol for fever. Avoid aspirin, ibuprofen, or diclofenac, as they increase bleeding risks in dengue.",
        "source": "WHO Dengue Clinical Management Manual 2012",
        "urgency": "P1"
    },
    {
        "text": "Give supportive care with oral rehydration, bed rest, and paracetamol for fever. Avoid aspirin, ibuprofen, or diclofenac, as they increase bleeding risks in dengue. Lymphatic filariasis, commonly known as elephantiasis, causes chronic swelling of limbs and genitals.",
        "source": "WHO Lymphatic Filariasis Fact Sheet 2023 + NVBDCP India",
        "urgency": "P3"
    },
    {
        "text": "Avoid aspirin, ibuprofen, or diclofenac, as they increase bleeding risks in dengue. Lymphatic filariasis, commonly known as elephantiasis, causes chronic swelling of limbs and genitals. Filariasis is transmitted by Culex mosquitoes carrying microfilariae parasites.",
        "source": "WHO Lymphatic Filariasis Fact Sheet 2023 + NVBDCP India",
        "urgency": "P3"
    },
    {
        "text": "Lymphatic filariasis, commonly known as elephantiasis, causes chronic swelling of limbs and genitals. Filariasis is transmitted by Culex mosquitoes carrying microfilariae parasites. Participate in Mass Drug Administration (MDA) using diethylcarbamazine (DEC) and albendazole.",
        "source": "MoHFW National Roadmap to Eliminate Lymphatic Filariasis 2021",
        "urgency": "P4"
    },
    {
        "text": "Filariasis is transmitted by Culex mosquitoes carrying microfilariae parasites. Participate in Mass Drug Administration (MDA) using diethylcarbamazine (DEC) and albendazole. Perform daily washing and hygiene of the affected swollen limb to prevent secondary bacterial infections.",
        "source": "MoHFW National Roadmap to Eliminate Lymphatic Filariasis 2021",
        "urgency": "P3"
    },
    {
        "text": "Participate in Mass Drug Administration (MDA) using diethylcarbamazine (DEC) and albendazole. Perform daily washing and hygiene of the affected swollen limb to prevent secondary bacterial infections. Chikungunya is a viral disease spread by infected Aedes mosquitoes.",
        "source": "WHO Chikungunya Fact Sheet 2023 + NVBDCP India",
        "urgency": "P2"
    },
    {
        "text": "Perform daily washing and hygiene of the affected swollen limb to prevent secondary bacterial infections. Participate in Mass Drug Administration (MDA). Chikungunya is a viral disease spread by infected Aedes mosquitoes. Symptoms include high fever and severe, debilitating joint pain that can persist for months.",
        "source": "WHO Chikungunya Fact Sheet 2023 + NVBDCP India",
        "urgency": "P2"
    },
    {
        "text": "Chikungunya is a viral disease spread by infected Aedes mosquitoes. Symptoms include high fever and severe, debilitating joint pain that can persist for months. Provide symptomatic treatment with paracetamol, plenty of fluids, and mild joint exercises.",
        "source": "WHO Chikungunya Guidelines + NVBDCP Protocol",
        "urgency": "P3"
    },
    {
        "text": "Symptoms include high fever and severe, debilitating joint pain that can persist for months. Provide symptomatic treatment with paracetamol, plenty of fluids, and mild joint exercises. Avoid self-treatment with steroids or strong anti-inflammatory drugs without medical consultation.",
        "source": "WHO Chikungunya Guidelines + NVBDCP Protocol",
        "urgency": "P3"
    },
    {
        "text": "Provide symptomatic treatment with paracetamol, plenty of fluids, and mild joint exercises. Avoid self-treatment with steroids or strong anti-inflammatory drugs without medical consultation. Scrub typhus is a bacterial disease transmitted by bites of infected larval mites (chiggers).",
        "source": "WHO Guidelines on Rickettsial Diseases + CDAC India",
        "urgency": "P2"
    },
    {
        "text": "Avoid self-treatment with steroids or strong anti-inflammatory drugs without medical consultation. Scrub typhus is a bacterial disease transmitted by bites of infected larval mites (chiggers). Classic sign is a dark, scab-like skin sore (eschar) at the bite site.",
        "source": "WHO Guidelines on Rickettsial Diseases + CDAC India",
        "urgency": "P2"
    },
    {
        "text": "Scrub typhus is a bacterial disease transmitted by bites of infected larval mites (chiggers). Classic sign is a dark, scab-like skin sore (eschar) at the bite site. Other symptoms include high fever, headache, body aches, and swollen lymph nodes.",
        "source": "WHO Guidelines on Rickettsial Diseases + CDAC India",
        "urgency": "P2"
    },
    {
        "text": "Classic sign is a dark, scab-like skin sore (eschar) at the bite site. Other symptoms include high fever, headache, body aches, and swollen lymph nodes. Treat scrub typhus with oral doxycycline 100mg twice daily for 7-14 days.",
        "source": "ICMR Guidelines for Diagnosis and Management of Rickettsial Infections 2021",
        "urgency": "P2"
    },
    {
        "text": "Other symptoms include high fever, headache, body aches, and swollen lymph nodes. Treat scrub typhus with oral doxycycline 100mg twice daily for 7-14 days. Leptospirosis is a bacterial infection spread through water contaminated with urine from infected animals.",
        "source": "WHO Leptospirosis Epidemiology and Management Guidelines 2003",
        "urgency": "P2"
    },
    {
        "text": "Treat scrub typhus with oral doxycycline 100mg twice daily for 7-14 days. Leptospirosis is a bacterial infection spread through water contaminated with urine from infected animals. Symptoms include high fever, severe headache, muscle pain, and red eyes.",
        "source": "WHO Leptospirosis Epidemiology and Management Guidelines 2003",
        "urgency": "P2"
    },
    {
        "text": "Leptospirosis is a bacterial infection spread through water contaminated with urine from infected animals. Symptoms include high fever, severe headache, muscle pain, and red eyes. Complications can include kidney damage, liver failure (jaundice), and pulmonary haemorrhage.",
        "source": "WHO Leptospirosis Epidemiology and Management Guidelines 2003",
        "urgency": "P1"
    },
    {
        "text": "Symptoms include high fever, severe headache, muscle pain, and red eyes. Complications can include kidney damage, liver failure (jaundice), and pulmonary haemorrhage. Treat early with oral doxycycline or penicillin G to prevent complications.",
        "source": "WHO Leptospirosis Epidemiology and Management Guidelines 2003",
        "urgency": "P1"
    },
    {
        "text": "Complications can include kidney damage, liver failure (jaundice), and pulmonary haemorrhage. Treat early with oral doxycycline or penicillin G to prevent complications. Japanese Encephalitis (JE) is a viral brain infection spread by Culex mosquitoes.",
        "source": "WHO Japanese Encephalitis Fact Sheet 2023 + NVBDCP India",
        "urgency": "P1"
    },
    {
        "text": "Treat early with oral doxycycline or penicillin G to prevent complications. Japanese Encephalitis (JE) is a viral brain infection spread by Culex mosquitoes. JE symptoms include high fever, severe headache, neck stiffness, convulsions, and mental confusion.",
        "source": "WHO Japanese Encephalitis Fact Sheet 2023 + NVBDCP India",
        "urgency": "P1"
    },
    {
        "text": "Japanese Encephalitis (JE) is a viral brain infection spread by Culex mosquitoes. JE symptoms include high fever, severe headache, neck stiffness, convulsions, and mental confusion. JE immunization is part of the Universal Immunisation Programme in endemic districts.",
        "source": "MoHFW Universal Immunisation Programme (UIP) India 2024",
        "urgency": "P3"
    },
    {
        "text": "JE symptoms include high fever, severe headache, neck stiffness, convulsions, and mental confusion. JE immunization is part of the Universal Immunisation Programme in endemic districts. JE vaccine first dose is given at 9 months of age.",
        "source": "MoHFW Universal Immunisation Programme (UIP) India 2024",
        "urgency": "P3"
    },
    {
        "text": "JE immunization is part of the Universal Immunisation Programme in endemic districts. JE vaccine first dose is given at 9 months of age. JE vaccine second dose is administered at 16-24 months of age.",
        "source": "MoHFW Universal Immunisation Programme (UIP) India 2024",
        "urgency": "P3"
    },

    # ── non-communicable & lifestyle diseases (161-180) ──
    {
        "text": "Hypertension (high blood pressure) is diagnosed when blood pressure is consistently ≥140/90 mmHg. Hypertension is often asymptomatic ('silent killer') and requires regular BP checks. Reduce sodium (salt) intake, engage in 30 minutes of physical activity daily, and manage stress.",
        "source": "WHO Global Hearts Initiative + MoHFW NPCDCS Guidelines 2023",
        "urgency": "P3"
    },
    {
        "text": "Hypertension (high blood pressure) is diagnosed when blood pressure is consistently ≥140/90 mmHg. Hypertension is often asymptomatic ('silent killer') and requires regular BP checks. Untreated hypertension increases the risk of stroke, heart attack, and kidney failure.",
        "source": "WHO Global Hearts Initiative + MoHFW NPCDCS Guidelines 2023",
        "urgency": "P3"
    },
    {
        "text": "Hypertension is often asymptomatic ('silent killer') and requires regular BP checks. Untreated hypertension increases the risk of stroke, heart attack, and kidney failure. Take prescribed antihypertensives (amlodipine, enalapril) daily without skipping doses.",
        "source": "WHO Hypertension Guidelines 2021 + MoHFW Protocol",
        "urgency": "P3"
    },
    {
        "text": "Untreated hypertension increases the risk of stroke, heart attack, and kidney failure. Take prescribed antihypertensives (amlodipine, enalapril) daily without skipping doses. Type 2 Diabetes is a metabolic disorder where the body cannot use insulin effectively.",
        "source": "WHO Guidelines on Second- and Third-Line Medicines for Diabetes 2018 + ICMR",
        "urgency": "P3"
    },
    {
        "text": "Take prescribed antihypertensives (amlodipine, enalapril) daily without skipping doses. Type 2 Diabetes is a metabolic disorder where the body cannot use insulin effectively. Key symptoms of diabetes: excessive thirst (polydipsia), frequent urination (polyuria), and increased hunger.",
        "source": "WHO Guidelines on Second- and Third-Line Medicines for Diabetes 2018 + ICMR",
        "urgency": "P3"
    },
    {
        "text": "Type 2 Diabetes is a metabolic disorder where the body cannot use insulin effectively. Key symptoms of diabetes: excessive thirst (polydipsia), frequent urination (polyuria), and increased hunger. Manage type 2 diabetes with metformin, portion control, and regular daily walking.",
        "source": "ICMR Guidelines for Management of Type 2 Diabetes 2020",
        "urgency": "P3"
    },
    {
        "text": "Key symptoms of diabetes: excessive thirst (polydipsia), frequent urination (polyuria), and increased hunger. Manage type 2 diabetes with metformin, portion control, and regular daily walking. Diabetics should have their blood sugar levels checked every 3 months.",
        "source": "ICMR Guidelines for Management of Type 2 Diabetes 2020",
        "urgency": "P3"
    },
    {
        "text": "Manage type 2 diabetes with metformin, portion control, and regular daily walking. Diabetics should have their blood sugar levels checked every 3 months. Monitor fasting blood sugar (target: 80-130 mg/dL) and post-meal sugar (target: <180 mg/dL).",
        "source": "ADA Standards of Care in Diabetes 2023 + ICMR",
        "urgency": "P3"
    },
    {
        "text": "Diabetics should have their blood sugar levels checked every 3 months. Monitor fasting blood sugar (target: 80-130 mg/dL) and post-meal sugar (target: <180 mg/dL). Long-term complications of poorly managed diabetes include diabetic neuropathy, retinopathy, and diabetic foot ulcers.",
        "source": "WHO Global Report on Diabetes 2016 + ICMR",
        "urgency": "P3"
    },
    {
        "text": "Monitor fasting blood sugar (target: 80-130 mg/dL) and post-meal sugar (target: <180 mg/dL). Long-term complications of poorly managed diabetes include diabetic neuropathy, retinopathy, and diabetic foot ulcers. Diabetic ketoacidosis (DKA) is a severe acute diabetes complication requiring emergency care.",
        "source": "WHO Global Report on Diabetes 2016 + ICMR",
        "urgency": "P1"
    },
    {
        "text": "Long-term complications of poorly managed diabetes include diabetic neuropathy, retinopathy, and diabetic foot ulcers. Diabetic ketoacidosis (DKA) is a severe acute diabetes complication requiring emergency care. Symptoms of DKA include rapid deep breathing, confusion, abdominal pain, and fruity breath odour.",
        "source": "ADA Standards of Care in Diabetes 2023",
        "urgency": "P1"
    },
    {
        "text": "Diabetic ketoacidosis (DKA) is a severe acute diabetes complication requiring emergency care. Symptoms of DKA include rapid deep breathing, confusion, abdominal pain, and fruity breath odour. Hospitalize immediately for IV fluids, insulin infusion, and electrolyte management.",
        "source": "ADA Standards of Care in Diabetes 2023",
        "urgency": "P1"
    },
    {
        "text": "Symptoms of DKA include rapid deep breathing, confusion, abdominal pain, and fruity breath odour. Hospitalize immediately for IV fluids, insulin infusion, and electrolyte management. Chronic Kidney Disease (CKD) involves gradual loss of kidney function over time.",
        "source": "KDIGO Clinical Practice Guideline for CKD Evaluation 2024 + ICMR",
        "urgency": "P3"
    },
    {
        "text": "Hospitalize immediately for IV fluids, insulin infusion, and electrolyte management. Chronic Kidney Disease (CKD) involves gradual loss of kidney function over time. Symptoms: swelling in legs and ankles (edema), fatigue, and changes in urine output.",
        "source": "KDIGO Clinical Practice Guideline for CKD Evaluation 2024 + ICMR",
        "urgency": "P3"
    },
    {
        "text": "Chronic Kidney Disease (CKD) involves gradual loss of kidney function over time. Symptoms: swelling in legs and ankles (edema), fatigue, and changes in urine output. Control blood pressure and blood sugar strictly to slow down CKD progression.",
        "source": "KDIGO Clinical Practice Guideline for CKD Evaluation 2024 + ICMR",
        "urgency": "P3"
    },
    {
        "text": "Symptoms: swelling in legs and ankles (edema), fatigue, and changes in urine output. Control blood pressure and blood sugar strictly to slow down CKD progression. Advanced CKD or kidney failure requires dialysis or kidney transplantation.",
        "source": "KDIGO Clinical Practice Guideline for CKD Evaluation 2024 + ICMR",
        "urgency": "P2"
    },
    {
        "text": "Control blood pressure and blood sugar strictly to slow down CKD progression. Advanced CKD or kidney failure requires dialysis or kidney transplantation. Asthma is a chronic disease of the airways causing recurring wheezing and breathlessness.",
        "source": "GINA Global Strategy for Asthma Management 2023 + ICMR",
        "urgency": "P3"
    },
    {
        "text": "Advanced CKD or kidney failure requires dialysis or kidney transplantation. Asthma is a chronic disease of the airways causing recurring wheezing and breathlessness. Asthma attacks are triggered by dust, pollen, smoke, cold air, or physical exertion.",
        "source": "GINA Global Strategy for Asthma Management 2023 + ICMR",
        "urgency": "P3"
    },
    {
        "text": "Asthma is a chronic disease of the airways causing recurring wheezing and breathlessness. Asthma attacks are triggered by dust, pollen, smoke, cold air, or physical exertion. Treat acute asthma attacks with quick-relief bronchodilator inhalers (salbutamol).",
        "source": "GINA Global Strategy for Asthma Management 2023 + ICMR",
        "urgency": "P2"
    },
    {
        "text": "Asthma attacks are triggered by dust, pollen, smoke, cold air, or physical exertion. Treat acute asthma attacks with quick-relief bronchodilator inhalers (salbutamol). Daily controller inhalers (inhaled corticosteroids) prevent asthma exacerbations.",
        "source": "GINA Global Strategy for Asthma Management 2023 + ICMR",
        "urgency": "P3"
    },

    # ── emergency protocols & first aid (181-220) ──
    {
        "text": "Heatstroke is a life-threatening emergency when body temperature rises above 40°C. Classic symptoms include hot dry skin, absence of sweating, and mental confusion or coma. Move the victim to a cool shaded area immediately and apply wet clothes.",
        "source": "WHO Heat and Health Fact Sheet + MoHFW Heat Action Plan 2023",
        "urgency": "P1"
    },
    {
        "text": "Heatstroke is a life-threatening emergency when body temperature rises above 40°C. Classic symptoms include hot dry skin, absence of sweating, and mental confusion or coma. Fan the victim vigorously to increase evaporative cooling.",
        "source": "WHO Heat and Health Fact Sheet + MoHFW Heat Action Plan 2023",
        "urgency": "P1"
    },
    {
        "text": "Classic symptoms include hot dry skin, absence of sweating, and mental confusion or coma. Move the victim to a cool shaded area immediately and apply wet clothes. Give cool water if the patient is fully conscious and alert.",
        "source": "WHO Heat and Health Fact Sheet + MoHFW Heat Action Plan 2023",
        "urgency": "P1"
    },
    {
        "text": "Move the victim to a cool shaded area immediately and apply wet clothes. Give cool water if the patient is fully conscious and alert. Call 108 or transport the patient to the hospital immediately; untreated heatstroke is fatal.",
        "source": "WHO Heat and Health Fact Sheet + MoHFW Heat Action Plan 2023",
        "urgency": "P1"
    },
    {
        "text": "Give cool water if the patient is fully conscious and alert. Call 108 or transport the patient to the hospital immediately; untreated heatstroke is fatal. Snakebite first aid: Keep the victim completely still and calm.",
        "source": "WHO Snakebite Envenomation Guidelines 2019 + MoHFW",
        "urgency": "P1"
    },
    {
        "text": "Call 108 or transport the patient to the hospital immediately; untreated heatstroke is fatal. Snakebite first aid: Keep the victim completely still and calm. Immobilize the bitten limb using a splint or loose bandage below heart level.",
        "source": "WHO Snakebite Envenomation Guidelines 2019 + MoHFW",
        "urgency": "P1"
    },
    {
        "text": "Snakebite first aid: Keep the victim completely still and calm. Immobilize the bitten limb using a splint or loose bandage below heart level. Do not cut the wound, apply a tight tourniquet, or try to suck out the venom.",
        "source": "WHO Snakebite Envenomation Guidelines 2019 + MoHFW",
        "urgency": "P1"
    },
    {
        "text": "Immobilize the bitten limb using a splint or loose bandage below heart level. Do not cut the wound, apply a tight tourniquet, or try to suck out the venom. Traditional cutting or tourniquets worsen tissue damage and cause necrosis.",
        "source": "WHO Snakebite Envenomation Guidelines 2019 + MoHFW",
        "urgency": "P1"
    },
    {
        "text": "Do not cut the wound, apply a tight tourniquet, or try to suck out the venom. Traditional cutting or tourniquets worsen tissue damage and cause necrosis. Transport the victim to a hospital within 1 hour to receive Anti-Snake Venom (ASV).",
        "source": "MoHFW National Snakebite Management Protocol 2020",
        "urgency": "P1"
    },
    {
        "text": "Traditional cutting or tourniquets worsen tissue damage and cause necrosis. Transport the victim to a hospital within 1 hour to receive Anti-Snake Venom (ASV). ASV is available free at all government district and sub-divisional hospitals.",
        "source": "MoHFW National Snakebite Management Protocol 2020",
        "urgency": "P1"
    },
    {
        "text": "Transport the victim to a hospital within 1 hour to receive Anti-Snake Venom (ASV). ASV is available free at all government district and sub-divisional hospitals. Signs of snake envenomation: swelling spreading up the limb, drooping eyelids, and difficulty breathing.",
        "source": "MoHFW National Snakebite Management Protocol 2020",
        "urgency": "P1"
    },
    {
        "text": "ASV is available free at all government district and sub-divisional hospitals. Signs of snake envenomation: swelling spreading up the limb, drooping eyelids, and difficulty breathing. Other signs are bleeding gums, dark urine, and inability to lift the head.",
        "source": "MoHFW National Snakebite Management Protocol 2020",
        "urgency": "P1"
    },
    {
        "text": "Signs of snake envenomation: swelling spreading up the limb, drooping eyelids, and difficulty breathing. Other signs are bleeding gums, dark urine, and inability to lift the head. ASHA emergency referral: refer immediately if patient is unconscious.",
        "source": "NHM ASHA Emergency Referral Guidelines + ASHA Training Module 3",
        "urgency": "P1"
    },
    {
        "text": "Other signs are bleeding gums, dark urine, and inability to lift the head. ASHA emergency referral: refer immediately if patient is unconscious. Refer immediately for convulsions, severe breathing difficulty, and heavy uncontrolled bleeding.",
        "source": "NHM ASHA Emergency Referral Guidelines + ASHA Training Module 3",
        "urgency": "P1"
    },
    {
        "text": "ASHA emergency referral: refer immediately if patient is unconscious. Refer immediately for convulsions, severe breathing difficulty, and heavy uncontrolled bleeding. Emergency referrals are also required for any child who refuses to feed.",
        "source": "NHM ASHA Emergency Referral Guidelines + ASHA Training Module 3",
        "urgency": "P1"
    },
    {
        "text": "Refer immediately for convulsions, severe breathing difficulty, and heavy uncontrolled bleeding. Emergency referrals are also required for any child who refuses to feed. Free emergency transport is available in India by dialing the toll-free number 108.",
        "source": "NHM Emergency Medical Transport Service India",
        "urgency": "P1"
    },
    {
        "text": "Emergency referrals are also required for any child who refuses to feed. Free emergency transport is available in India by dialing the toll-free number 108. Dial 102 for free transport dedicated for pregnant women and sick infants.",
        "source": "NHM Emergency Medical Transport Service India",
        "urgency": "P1"
    },
    {
        "text": "Free emergency transport is available in India by dialing the toll-free number 108. Dial 102 for free transport dedicated for pregnant women and sick infants. National emergency helplines operate 24 hours a day, 7 days a week.",
        "source": "NHM Emergency Medical Transport Service India",
        "urgency": "P3"
    },
    {
        "text": "Dial 102 for free transport dedicated for pregnant women and sick infants. National emergency helplines operate 24 hours a day, 7 days a week. For police assistance, dial 112 or 100 on any mobile or landline phone.",
        "source": "National Disaster Management Authority India",
        "urgency": "P3"
    },
    {
        "text": "National emergency helplines operate 24 hours a day, 7 days a week. For police assistance, dial 112 or 100 on any mobile or landline phone. For fire emergencies, dial 101 to reach the local fire service station.",
        "source": "National Disaster Management Authority India",
        "urgency": "P3"
    },

    # ── government health schemes (221-260) ──
    {
        "text": "Janani Suraksha Yojana (JSY) is a safe motherhood intervention under the National Health Mission (NHM). JSY promotes institutional deliveries among poor pregnant women in rural and urban areas. Cash assistance is directly transferred to the mother's bank account after delivery.",
        "source": "MoHFW Janani Suraksha Yojana (JSY) Guidelines 2022",
        "urgency": "P4"
    },
    {
        "text": "Janani Suraksha Yojana (JSY) is a safe motherhood intervention under the National Health Mission (NHM). JSY promotes institutional deliveries among poor pregnant women in rural and urban areas. Cash incentive in rural areas for Low Performing States (LPS) is Rs. 1400.",
        "source": "MoHFW Janani Suraksha Yojana (JSY) Guidelines 2022",
        "urgency": "P4"
    },
    {
        "text": "JSY promotes institutional deliveries among poor pregnant women in rural and urban areas. Cash assistance is directly transferred to the mother's bank account after delivery. ASHA workers receive a matching cash incentive for facilitating institutional deliveries.",
        "source": "NHM ASHA Incentive Structure Guidelines 2021",
        "urgency": "P4"
    },
    {
        "text": "ASHA workers receive a matching cash incentive for facilitating institutional deliveries. Pradhan Mantri Matru Vandana Yojana (PMMVY) is a maternity benefit program run by the government. PMMVY provides cash incentives to pregnant and lactating mothers for the first child.",
        "source": "Ministry of Women and Child Development PMMVY Scheme 2023",
        "urgency": "P4"
    },
    {
        "text": "Pradhan Mantri Matru Vandana Yojana (PMMVY) is a maternity benefit program run by the government. PMMVY provides cash incentives to pregnant and lactating mothers for the first child. The benefit amount of Rs. 5000 is paid in three installments upon meeting conditions.",
        "source": "Ministry of Women and Child Development PMMVY Scheme 2023",
        "urgency": "P4"
    },
    {
        "text": "PMMVY provides cash incentives to pregnant and lactating mothers for the first child. The benefit amount of Rs. 5000 is paid in three installments upon meeting conditions. Installments are linked to early pregnancy registration, ANC visits, and child birth registration.",
        "source": "Ministry of Women and Child Development PMMVY Scheme 2023",
        "urgency": "P4"
    },
    {
        "text": "The benefit amount of Rs. 5000 is paid in three installments upon meeting conditions. Installments are linked to early pregnancy registration, ANC visits, and child birth registration. Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY) provides free health insurance.",
        "source": "National Health Authority Ayushman Bharat PM-JAY Guidelines 2023",
        "urgency": "P4"
    },
    {
        "text": "Installments are linked to early pregnancy registration, ANC visits, and child birth registration. Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY) provides free health insurance. PM-JAY provides coverage up to Rs. 5 Lakhs per family per year.",
        "source": "National Health Authority Ayushman Bharat PM-JAY Guidelines 2023",
        "urgency": "P4"
    },
    {
        "text": "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY) provides free health insurance. PM-JAY provides coverage up to Rs. 5 Lakhs per family per year. This coverage is for secondary and tertiary care hospitalization in empanelled hospitals.",
        "source": "National Health Authority Ayushman Bharat PM-JAY Guidelines 2023",
        "urgency": "P3"
    },
    {
        "text": "PM-JAY provides coverage up to Rs. 5 Lakhs per family per year. This coverage is for secondary and tertiary care hospitalization in empanelled hospitals. Ayushman cards are issued to beneficiaries identified in the Socio-Economic Caste Census.",
        "source": "National Health Authority Ayushman Bharat PM-JAY Guidelines 2023",
        "urgency": "P4"
    },
    {
        "text": "This coverage is for secondary and tertiary care hospitalization in empanelled hospitals. Ayushman cards are issued to beneficiaries identified in the Socio-Economic Caste Census. Janani Shishu Suraksha Karyakaram (JSSK) entitles all pregnant women delivering in public health institutions.",
        "source": "MoHFW Janani Shishu Suraksha Karyakaram (JSSK) Guidelines 2022",
        "urgency": "P4"
    },
    {
        "text": "Ayushman cards are issued to beneficiaries identified in the Socio-Economic Caste Census. Janani Shishu Suraksha Karyakaram (JSSK) entitles all pregnant women delivering in public health institutions. JSSK guarantees completely free and cashless delivery, including caesarean sections.",
        "source": "MoHFW Janani Shishu Suraksha Karyakaram (JSSK) Guidelines 2022",
        "urgency": "P4"
    },
    {
        "text": "Janani Shishu Suraksha Karyakaram (JSSK) entitles all pregnant women delivering in public health institutions. JSSK guarantees completely free and cashless delivery, including caesarean sections. Entitlements include free drugs, diagnostics, blood, diet, and free transport from home to facility.",
        "source": "MoHFW Janani Shishu Suraksha Karyakaram (JSSK) Guidelines 2022",
        "urgency": "P3"
    },
    {
        "text": "JSSK guarantees completely free and cashless delivery, including caesarean sections. Entitlements include free drugs, diagnostics, blood, diet, and free transport from home to facility. Sick infants up to 1 year of age are also entitled to free care.",
        "source": "MoHFW Janani Shishu Suraksha Karyakaram (JSSK) Guidelines 2022",
        "urgency": "P3"
    },
    {
        "text": "Entitlements include free drugs, diagnostics, blood, diet, and free transport from home to facility. Sick infants up to 1 year of age are also entitled to free care. Rashtriya Bal Swasthya Karyakram (RBSK) focuses on early identification of 4Ds in children.",
        "source": "MoHFW RBSK Operational Guidelines 2013 + NHM",
        "urgency": "P4"
    },
    {
        "text": "Sick infants up to 1 year of age are also entitled to free care. Rashtriya Bal Swasthya Karyakram (RBSK) focuses on early identification of 4Ds in children. The 4Ds are: Defects at birth, Deficiencies, Diseases, and Development delays.",
        "source": "MoHFW RBSK Operational Guidelines 2013 + NHM",
        "urgency": "P4"
    },
    {
        "text": "Rashtriya Bal Swasthya Karyakram (RBSK) focuses on early identification of 4Ds in children. The 4Ds are: Defects at birth, Deficiencies, Diseases, and Development delays. Mobile health teams screening children in schools and Anganwadi centres identify these conditions.",
        "source": "MoHFW RBSK Operational Guidelines 2013 + NHM",
        "urgency": "P3"
    },
    {
        "text": "The 4Ds are: Defects at birth, Deficiencies, Diseases, and Development delays. Mobile health teams screening children in schools and Anganwadi centres identify these conditions. Free surgical and medical treatment is provided to diagnosed children at tertiary care hospitals.",
        "source": "MoHFW RBSK Operational Guidelines 2013 + NHM",
        "urgency": "P3"
    },
    {
        "text": "Mobile health teams screening children in schools and Anganwadi centres identify these conditions. Free surgical and medical treatment is provided to diagnosed children at tertiary care hospitals. Mission Indradhanush aims to immunize all unvaccinated and partially vaccinated children.",
        "source": "MoHFW Mission Indradhanush Guidelines 2023",
        "urgency": "P4"
    },
    {
        "text": "Free surgical and medical treatment is provided to diagnosed children at tertiary care hospitals. Mission Indradhanush aims to immunize all unvaccinated and partially vaccinated children. The campaign targets children under two years and pregnant women.",
        "source": "MoHFW Mission Indradhanush Guidelines 2023",
        "urgency": "P4"
    },
    {
        "text": "Mission Indradhanush aims to immunize all unvaccinated and partially vaccinated children. The campaign targets children under two years and pregnant women. Special immunization drives are conducted in hard-to-reach rural and semi-urban pockets.",
        "source": "MoHFW Mission Indradhanush Guidelines 2023",
        "urgency": "P3"
    },
    {
        "text": "The campaign targets children under two years and pregnant women. Special immunization drives are conducted in hard-to-reach rural and semi-urban pockets. Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA) ensures quality antenatal care.",
        "source": "MoHFW PMSMA Scheme Guidelines 2022",
        "urgency": "P4"
    },
    {
        "text": "Special immunization drives are conducted in hard-to-reach rural and semi-urban pockets. Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA) ensures quality antenatal care. Free clinical checkups by specialists are conducted on the 9th day of every month.",
        "source": "MoHFW PMSMA Scheme Guidelines 2022",
        "urgency": "P4"
    },
    {
        "text": "Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA) ensures quality antenatal care. Free clinical checkups by specialists are conducted on the 9th day of every month. PMSMA aims to identify high-risk pregnancies and manage them in a timely manner.",
        "source": "MoHFW PMSMA Scheme Guidelines 2022",
        "urgency": "P3"
    },
    {
        "text": "Free clinical checkups by specialists are conducted on the 9th day of every month. PMSMA aims to identify high-risk pregnancies and manage them in a timely manner. High-risk pregnancies are marked with red stickers on their ANC cards.",
        "source": "MoHFW PMSMA Scheme Guidelines 2022",
        "urgency": "P3"
    },
    {
        "text": "PMSMA aims to identify high-risk pregnancies and manage them in a timely manner. High-risk pregnancies are marked with red stickers on their ANC cards. This system ensures special medical attention during delivery for high-risk mothers.",
        "source": "MoHFW PMSMA Scheme Guidelines 2022",
        "urgency": "P3"
    },
    {
        "text": "High-risk pregnancies are marked with red stickers on their ANC cards. This system ensures special medical attention during delivery for high-risk mothers. Weekly Iron Folic Acid Supplementation (WIFS) is designed for school-going adolescents.",
        "source": "MoHFW WIFS Operational Guidelines 2018 + NHM",
        "urgency": "P4"
    },
    {
        "text": "This system ensures special medical attention during delivery for high-risk mothers. Weekly Iron Folic Acid Supplementation (WIFS) is designed for school-going adolescents. WIFS distributes blue IFA tablets containing 100mg elemental iron weekly.",
        "source": "MoHFW WIFS Operational Guidelines 2018 + NHM",
        "urgency": "P4"
    },
    {
        "text": "Weekly Iron Folic Acid Supplementation (WIFS) is designed for school-going adolescents. WIFS distributes blue IFA tablets containing 100mg elemental iron weekly. Adolescent girls and boys receive nutrition counseling along with IFA tablets.",
        "source": "MoHFW WIFS Operational Guidelines 2018 + NHM",
        "urgency": "P4"
    },
    {
        "text": "WIFS distributes blue IFA tablets containing 100mg elemental iron weekly. Adolescent girls and boys receive nutrition counseling along with IFA tablets. The scheme aims to decrease the high prevalence of anaemia among school adolescents.",
        "source": "MoHFW WIFS Operational Guidelines 2018 + NHM",
        "urgency": "P3"
    },
    {
        "text": "Adolescent girls and boys receive nutrition counseling along with IFA tablets. The scheme aims to decrease the high prevalence of anaemia among school adolescents. De-worming using albendazole 400mg is conducted bi-annually on National Deworming Day.",
        "source": "MoHFW National Deworming Day Guidelines 2023",
        "urgency": "P4"
    },
    {
        "text": "The scheme aims to decrease the high prevalence of anaemia among school adolescents. De-worming using albendazole 400mg is conducted bi-annually on National Deworming Day. Albendazole helps control soil-transmitted helminth (worm) infections in children.",
        "source": "MoHFW National Deworming Day Guidelines 2023",
        "urgency": "P4"
    },
    {
        "text": "De-worming using albendazole 400mg is conducted bi-annually on National Deworming Day. Albendazole helps control soil-transmitted helminth (worm) infections in children. National Deworming Day campaigns cover all children aged 1 to 19 years.",
        "source": "MoHFW National Deworming Day Guidelines 2023",
        "urgency": "P4"
    },
    {
        "text": "Albendazole helps control soil-transmitted helminth (worm) infections in children. National Deworming Day campaigns cover all children aged 1 to 19 years. Rashtriya Kishore Swasthya Karyakram (RKSK) addresses adolescent health holistically.",
        "source": "MoHFW RKSK Operational Guidelines 2014 + NHM",
        "urgency": "P4"
    },
    {
        "text": "National Deworming Day campaigns cover all children aged 1 to 19 years. Rashtriya Kishore Swasthya Karyakram (RKSK) addresses adolescent health holistically. RKSK targets six focus areas: nutrition, sexual health, mental health, and substance abuse.",
        "source": "MoHFW RKSK Operational Guidelines 2014 + NHM",
        "urgency": "P4"
    },
    {
        "text": "Rashtriya Kishore Swasthya Karyakram (RKSK) addresses adolescent health holistically. RKSK targets six focus areas: nutrition, sexual health, mental health, and substance abuse. Adolescent Friendly Health Clinics (AFHCs) are set up to offer counseling.",
        "source": "MoHFW RKSK Operational Guidelines 2014 + NHM",
        "urgency": "P4"
    },
    {
        "text": "RKSK targets six focus areas: nutrition, sexual health, mental health, and substance abuse. Adolescent Friendly Health Clinics (AFHCs) are set up to offer counseling. AFHCs provide safe, confidential clinical services to young individuals.",
        "source": "MoHFW RKSK Operational Guidelines 2014 + NHM",
        "urgency": "P3"
    },
    {
        "text": "Adolescent Friendly Health Clinics (AFHCs) are set up to offer counseling. AFHCs provide safe, confidential clinical services to young individuals. National Leprosy Eradication Programme (NLEP) aims to detect and cure leprosy cases.",
        "source": "MoHFW NLEP Guidelines 2023",
        "urgency": "P4"
    },
    {
        "text": "AFHCs provide safe, confidential clinical services to young individuals. National Leprosy Eradication Programme (NLEP) aims to detect and cure leprosy cases. Leprosy is caused by Mycobacterium leprae and is cured using Multi-Drug Therapy (MDT).",
        "source": "WHO Guidelines for the Diagnosis, Treatment and Prevention of Leprosy 2018",
        "urgency": "P3"
    },
    {
        "text": "National Leprosy Eradication Programme (NLEP) aims to detect and cure leprosy cases. Leprosy is caused by Mycobacterium leprae and is cured using Multi-Drug Therapy (MDT). MDT is blister packs of rifampicin, dapsone, and clofazimine given free.",
        "source": "WHO Guidelines for the Diagnosis, Treatment and Prevention of Leprosy 2018",
        "urgency": "P3"
    },
    {
        "text": "Leprosy is caused by Mycobacterium leprae and is cured using Multi-Drug Therapy (MDT). MDT is blister packs of rifampicin, dapsone, and clofazimine given free. National Tuberculosis Elimination Programme (NTEP) provides nutrition support of Rs. 500 monthly.",
        "source": "MoHFW Nikshay Poshan Yojana Guidelines 2022",
        "urgency": "P4"
    },
    {
        "text": "MDT is blister packs of rifampicin, dapsone, and clofazimine given free. National Tuberculosis Elimination Programme (NTEP) provides nutrition support of Rs. 500 monthly. This direct benefit transfer is known as the Nikshay Poshan Yojana.",
        "source": "MoHFW Nikshay Poshan Yojana Guidelines 2022",
        "urgency": "P4"
    },
    {
        "text": "National Tuberculosis Elimination Programme (NTEP) provides nutrition support of Rs. 500 monthly. This direct benefit transfer is known as the Nikshay Poshan Yojana. Beneficiaries receive this cash incentive throughout their active TB treatment period.",
        "source": "MoHFW Nikshay Poshan Yojana Guidelines 2022",
        "urgency": "P4"
    },
]
