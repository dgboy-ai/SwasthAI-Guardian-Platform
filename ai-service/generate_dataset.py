import random
import os

# Set seed for reproducible generation
random.seed(42)

# ── Multilingual Symptom Lexicon ──
# Dynamically translates core English symptoms into Hindi, Hinglish, Tamil, Telugu, Marathi, and Bengali
SYMPTOM_LEXICON = {
    "high fever": {
        "hi": "तेज बुखार", "hinglish": "tez bukhar", "ta": "கடுமையான காய்ச்சல்",
        "te": "తీవ్రమైన జ్వరం", "mr": "तीव्र ताप", "bn": "তীব্র জ্বর"
    },
    "shivering": {
        "hi": "कंपकंपी", "hinglish": "kampkampi", "ta": "நடுக்கம்",
        "te": "వణుకు", "mr": "थंडी वाजणे", "bn": "কাঁপুনি"
    },
    "chills": {
        "hi": "ठंड लगना", "hinglish": "thand lagna", "ta": "குளிர்",
        "te": "చలి", "mr": "कापरे भरणे", "bn": "শীত করা"
    },
    "sweating": {
        "hi": "पसीना आना", "hinglish": "paseena aana", "ta": "வியர்வை",
        "te": "చెమటలు", "mr": "घामाघाम", "bn": "ঘাম হওয়া"
    },
    "headache": {
        "hi": "सिरदर्द", "hinglish": "sar dard", "ta": "தலைவலி",
        "te": "తలనొప్పి", "mr": "डोकेदुखी", "bn": "মাথাব্যথা"
    },
    "vomiting": {
        "hi": "उल्टी", "hinglish": "ulti", "ta": "வாந்தி",
        "te": "వాంతులు", "mr": "उलट्या", "bn": "বমি"
    },
    "nausea": {
        "hi": "जी मिचलाना", "hinglish": "ji michlana", "ta": "குமட்டல்",
        "te": "కడుపులో తిప్పడం", "mr": "मळमळ", "bn": "বমি বমি ভাব"
    },
    "weakness": {
        "hi": "कमजोरी", "hinglish": "kamzori", "ta": "பலவீனம்",
        "te": "బలహీనత", "mr": "अशक्तपणा", "bn": "দুর্বলতা"
    },
    "body ache": {
        "hi": "बदन दर्द", "hinglish": "badan dard", "ta": "உடல் வலி",
        "te": "ఒంటి నొప్పులు", "mr": "अंगदुखी", "bn": "গা ব্যথা"
    },
    "joint pain": {
        "hi": "जोड़ों में दर्द", "hinglish": "jodon me dard", "ta": "மூட்டு வலி",
        "te": "కీళ్ల నొప్పులు", "mr": "सांधेदुखी", "bn": "জয়েন্টে ব্যথা"
    },
    "eye pain": {
        "hi": "आंकड़ों में दर्द", "hinglish": "aankhon ke piche dard", "ta": "கண் வலி",
        "te": "కంటి నొప్పి", "mr": "डोळ्यांमागे वेदना", "bn": "চোখের পেছনে ব্যথা"
    },
    "skin rash": {
        "hi": "त्वचा पर लाल चकत्ते", "hinglish": "skin rash", "ta": "தடிப்பு",
        "te": "మచ్చలు", "mr": "पुरळ", "bn": "গায়ে ফুসকুড়ি"
    },
    "bleeding gums": {
        "hi": "मसूड़ों से खून आना", "hinglish": "masudon se khoon", "ta": "ஈறுகளில் இரத்தம்",
        "te": "చిగుళ్ళ నుండి రక్తం", "mr": "हिरड्यांमधून रक्त", "bn": "মাড়ি থেকে রক্ত"
    },
    "stomach pain": {
        "hi": "पेट दर्द", "hinglish": "pet dard", "ta": "வயிற்று வலி",
        "te": "కడుపు నొప్పి", "mr": "पोटदुखी", "bn": "পেটে ব্যথা"
    },
    "diarrhea": {
        "hi": "दस्त", "hinglish": "dast", "ta": "வயிற்றுப்போக்கு",
        "te": "విరేచనాలు", "mr": "जुलाब", "bn": "পাতला পায়খানা"
    },
    "constipation": {
        "hi": "कब्ज", "hinglish": "kabz", "ta": "மலச்சிக்கல்",
        "te": "మలబద్ధకం", "mr": "बद्धकोष्ठता", "bn": "কোষ্ঠকাঠিন্য"
    },
    "cough": {
        "hi": "खांसी", "hinglish": "khansi", "ta": "இருமல்",
        "te": "దగ్గు", "mr": "खोकला", "bn": "কাশি"
    },
    "coughing up blood": {
        "hi": "खांसी में खून आना", "hinglish": "khansi me khoon", "ta": "இரத்தம் துப்புதல்",
        "te": "దగ్గులో రక్తం", "mr": "खोकल्यातून रक्त", "bn": "কাশির সাথে রক্ত"
    },
    "chest pain": {
        "hi": "सीने में दर्द", "hinglish": "seene me dard", "ta": "மார்பு வலி",
        "te": "నెஞ்சு வலி", "mr": "छातीत दुखणे", "bn": "बुके ব্যথা"
    },
    "weight loss": {
        "hi": "वजन कम होना", "hinglish": "wajan kam hona", "ta": "எடை குறைதல்",
        "te": "బరువు తగ్గడం", "mr": "वजन कमी होणे", "bn": "ওজন হ্রাস"
    },
    "night sweats": {
        "hi": "रात में पसीना आना", "hinglish": "raat me paseena", "ta": "இரவு வியர்வை",
        "te": "రాత్రి చెమటలు", "mr": "रात्रीचा घाम", "bn": "রাতে ঘাম হওয়া"
    },
    "watery diarrhea": {
        "hi": "पानी जैसे दस्त", "hinglish": "paani jaisa dast", "ta": "நீர் போன்ற பேதி",
        "te": "నీళ్ల విరేచనాలు", "mr": "पाण्याचे जुलाब", "bn": "জলের মতো পায়খানা"
    },
    "dehydration": {
        "hi": "निर्जलीकरण", "hinglish": "dehydration", "ta": "நீரிழப்பு",
        "te": "నీటి కొరత", "mr": "शरीरातील पाणी कमी होणे", "bn": "জলশূন্যতা"
    },
    "yellow skin": {
        "hi": "त्वचा का पीला होना", "hinglish": "peeli skin", "ta": "மஞ்சள் தோல்",
        "te": "పసుపు చర్మం", "mr": "पिवळी पडलेली त्वचा", "bn": "ত্বক হলুদ হওয়া"
    },
    "yellow eyes": {
        "hi": "पीली आंखें", "hinglish": "peeli aankhen", "ta": "மஞ்சள் கண்",
        "te": "పసుపు కళ్ళు", "mr": "पिवळे पडलेले डोळे", "bn": "চোখ হলুদ হওয়া"
    },
    "dark urine": {
        "hi": "गहरा पीला पेशाब", "hinglish": "pila peshab", "ta": "சிறுநீர் மஞ்சள்",
        "te": "పసుపు மூత్రం", "mr": "गडद लघवी", "bn": "প্রস্রাব হলুদ হওয়া"
    },
    "breathing difficulty": {
        "hi": "सांस लेने में कठिनाई", "hinglish": "saans me takleef", "ta": "மூச்சு திணறல்",
        "te": "శ్వాస తీసుకోవడంలో ఇబ్బంది", "mr": "श्वास घेण्यास त्रास", "bn": "শ্বাসকষ্ট"
    },
    "sore throat": {
        "hi": "गले में खराश", "hinglish": "gale me kharash", "ta": "தொன்டை வலி",
        "te": "తొంతు నొప్పి", "mr": "घसा दुखी", "bn": "গলা ব্যথা"
    },
    "fluid blisters": {
        "hi": "पानी वाले फफोले", "hinglish": "paani wale blisters", "ta": "கொப்புளங்கள்",
        "te": "నీటి బొబ్బలు", "mr": "पाण्याचे फोड", "bn": "জলের ফোস্কা"
    },
    "confusion": {
        "hi": "मानसिक भ्रम", "hinglish": "confusion", "ta": "மயக்கம்",
        "te": "మతిభ్రమించడం", "mr": "गोंधळलेली मनस्थिती", "bn": "মানসিক বিভ্রান্তি"
    },
    "dog bite": {
        "hi": "कुत्ते का काटना", "hinglish": "kutte ka katna", "ta": "நாய்கடி",
        "te": "కుక్క కాటు", "mr": "कुत्रा चावणे", "bn": "कुकুরের কামড়"
    },
    "lockjaw": {
        "hi": "जबड़ा बंद होना", "hinglish": "lockjaw", "ta": "தாடை விறைப்பு",
        "te": "తాడ బిగుసుకుపోవడం", "mr": "जबडा जाम होणे", "bn": "চোয়াল আটকে যাওয়া"
    },
    "stiff neck": {
        "hi": "गर्दन में अकड़न", "hinglish": "gardan me akadn", "ta": "கழுத்து விறைப்பு",
        "te": "మెడ బిగువు", "mr": "मान आखडणे", "bn": "ঘাড় শক্ত হওয়া"
    },
    "high blood pressure": {
        "hi": "उच्च रक्तचाप", "hinglish": "high bp", "ta": "உயர் இரத்த அழுத்தம்",
        "te": "అధిక రక్తపోటు", "mr": "उच्च रक्तदाब", "bn": "উচ্চ रक्तচাপ"
    },
    "wheezing": {
        "hi": "सांस में सीटी की आवाज", "hinglish": "wheezing sound", "ta": "மூச்சு வீசிங்",
        "te": "శ్వాసలో పిల్లికూతలు", "mr": "दम लागणे", "bn": "হাঁপানি টান"
    },
    "ear pain": {
        "hi": "कान में तेज दर्द", "hinglish": "kaan me dard", "ta": "காது வலி",
        "te": "కాదు నొప్పి", "mr": "कान दुखी", "bn": "কান ব্যথা"
    },
    "ear discharge": {
        "hi": "कान बहना", "hinglish": "kaan behna", "ta": "காது சீழ்",
        "te": "కాదు కారడం", "mr": "कान वाहणे", "bn": "কান দিয়ে জল পড়া"
    },
    "eye redness": {
        "hi": "आंख आना", "hinglish": "laal aankh", "ta": "கண் சிவப்பு",
        "te": "కళ్ళు ఎర్రబడటం", "mr": "डोळे लाल होणे", "bn": "চোখ লাল হওয়া"
    },
    "kidney stone pain": {
        "hi": "पथरी का तेज दर्द", "hinglish": "pathri ka dard", "ta": "சிறுநீரக கல் வலி",
        "te": "కిడ్నీ రాళ్ల నొప్పి", "mr": "किडनी स्टोनचे दुखणे", "bn": "কিডনি পাথরের ব্যথা"
    },
    "severe itching": {
        "hi": "तेज खुजली", "hinglish": "tez khujli", "ta": "அரிப்பு",
        "te": "తీవ్రమైన దురద", "mr": "तीव्र खाज", "bn": "তীব্র চুলকানি"
    },
    "scorpion bite": {
        "hi": "बिच्छू का डंक", "hinglish": "bichhu ne kata", "ta": "தேள் கடி",
        "te": "తేలు కాటు", "mr": "विंचू चावणे", "bn": "বিচ্ছুর কামড়"
    },
    "circular rash": {
        "hi": "गोलाकार लाल चकत्ते", "hinglish": "round rashes", "ta": "வட்ட வடிவ தடிப்பு",
        "te": "గుండ్రటి మచ్చలు", "mr": "वर्तुळाकार पुरळ", "bn": "গোলাকার ফুসকুড়ি"
    },

    # --- Unique Discriminative Symptoms for Low-Accuracy Diseases (Fix 1) ---
    "loss of smell": {
        "hi": "सूंघने की शक्ति खोना", "hinglish": "smell chali gayi", "ta": "வாசனை இல்லை",
        "te": "వాసన తెలియకపోవడం", "mr": "वास येणे बंद होणे", "bn": "গন্ধ না পাওয়া"
    },
    "loss of taste": {
        "hi": "स्वाद न आना", "hinglish": "taste nahi aa raha", "ta": "சுவை இல்லை",
        "te": "రుచి తెలియకపోవడం", "mr": "चव जाणे", "bn": "স্বাদ না পাওয়া"
    },
    "eschar wound": {
        "hi": "काला ददोड़ा घाव", "hinglish": "black eschar wound", "ta": "கரும்புண்",
        "te": "నల్లని కాటు గాయం", "mr": "काळी खरूज जखम", "bn": "কালো ক্ষত চিহ্ন"
    },
    "mite bite mark": {
        "hi": "घुन के काटने का निशान", "hinglish": "mite bite mark", "ta": "பூச்சி கடி தழும்பு",
        "te": "పురుగు కాటు గుర్తు", "mr": "कीटक चावण्याची खूण", "bn": "মাইট কামড়ের দাগ"
    },
    "rat contact fever": {
        "hi": "चूहे के संपर्क से बुखार", "hinglish": "chuha contact bukhar", "ta": "எலி தொடர்பு காய்ச்சல்",
        "te": "ఎలుక సంపర్కం వల్ల జ్వరం", "mr": "उंदीर संपर्कामुळे ताप", "bn": "ইঁদুরের সংস্পর্শে জ্বর"
    },
    "flea bite": {
        "hi": "पिस्सू का काटना", "hinglish": "pissu ne kata", "ta": "தெள்ளு கடி",
        "te": "నిస్సువు కాటు", "mr": "पिसवाचे चावणे", "bn": "মাছির কামড়"
    },
    "bilateral joint swelling": {
        "hi": "दोनों जोड़ों में सूजन", "hinglish": "dono jodon me sujan", "ta": "இரு மூட்டுகளிலும் வீக்கம்",
        "te": "రెండు కీళ్లలో వాపు", "mr": "दोन्ही सांध्यांना सूज", "bn": "উভয় জয়েন্টে ফোলা"
    },
    "right lower abdominal pain": {
        "hi": "पेट के दाहिने निचले हिस्से में दर्द", "hinglish": "right side neeche pet dard", "ta": "வலது கீழ் வயிற்று வலி",
        "te": "కుడి వైపు కింది పొత్తికడుపు నొప్పి", "mr": "उजव्या खालच्या पोटात वेदना", "bn": "পেটের ডান নিচের ব্যথা"
    },
    "wet productive cough": {
        "hi": "बलगम वाली खांसी", "hinglish": "balgam wali khansi", "ta": "சளியுடன் இருமல்",
        "te": "శ్లేష్మంతో దగ్గు", "mr": "बलगमयुक्त खोकला", "bn": "কফসহ ভেজা কাশি"
    },
    "inhaler needed": {
        "hi": "इनहेलर की जरूरत", "hinglish": "inhaler chahiye saans ke liye", "ta": "இன்ஹேலர் தேவை",
        "te": "ఇన్హేలర్ అవసరం", "mr": "इनहेलर आवश्यक", "bn": "ইনহেলার দরকার"
    },
    "sudden food illness": {
        "hi": "खाने के बाद अचानक बीमारी", "hinglish": "khana khake bimar", "ta": "சாப்பிட்டதும் திடீர் நோய்",
        "te": "తిన్న తర్వాత హఠాత్తుగా అనారోగ్యం", "mr": "जेवल्यानंतर अचानक आजारी", "bn": "খাবার খেয়ে হঠাৎ অসুস্থ"
    },
    "collapsed in sun": {
        "hi": "धूप में बेहोश होना", "hinglish": "dhoop me behosh ho gaya", "ta": "வெயிலில் மயக்கம்",
        "te": "ఎండలో మూర్ఛపోవడం", "mr": "उन्हात कोलमडणे", "bn": "রোদে অজ্ঞান হওয়া"
    },
    "hot dry skin": {
        "hi": "गर्म और सूखी त्वचा", "hinglish": "garmi me skin sukhi", "ta": "சூடான வறண்ட தோல்",
        "te": "వేడి పొడి చర్మం", "mr": "उष्ण कोरडी त्वचा", "bn": "গরম শুষ্ক ত্বক"
    },
    "cyclic fever chills": {
        "hi": "बुखार और ठंड का चक्र", "hinglish": "baar baar bukhar aana", "ta": "ஒழுங்கான காய்ச்சல் குளிர்",
        "te": "వారంవారం జ్వర చలి", "mr": "नियमित ताप येणे", "bn": "চক্রাকার জ্বর ও শীত"
    },
    "light sensitivity": {
        "hi": "रोशनी से तकलीफ", "hinglish": "light se takleef aankhon ko", "ta": "ஒளி ஒவ்வாமை",
        "te": "వెలుతురు తీవ్రత", "mr": "प्रकाश असह्य होणे", "bn": "আলোতে অসহ্য যন্ত্রণা"
    },
    
    # --- New Lexicons for 50 Additions ---
    "spleen enlargement": {
        "hi": "प्लीहा का बढ़ना", "hinglish": "spleen badhna", "ta": "மண்ணீரல் வீக்கம்",
        "te": "ప్లీహము వాపు", "mr": "प्लिहा वाढणे", "bn": "প্লীহা বৃদ্ধি"
    },
    "severe leg swelling": {
        "hi": "पैर में अत्यधिक सूजन", "hinglish": "pair me heavy sujan", "ta": "கால் வீக்கம்",
        "te": "కాలు వాపు", "mr": "पायाला सूज", "bn": "পায়ে অতিরিক্ত ফোলা"
    },
    "stomach worms": {
        "hi": "पेट के कीड़े", "hinglish": "pet ke keede", "ta": "வயிற்றுப் புழுக்கள்",
        "te": "కడుపు పురుగులు", "mr": "पोटातील जंत", "bn": "পেটের কৃমি"
    },
    "severe anemia": {
        "hi": "अत्यधिक खून की कमी", "hinglish": "heavy khoon ki kami", "ta": "இரத்த சோகை",
        "te": "తీవ్ర రక్తహీనత", "mr": "तीव्र रक्तक्षय", "bn": "তীব্র রক্তাল্পতা"
    },
    "dry cough with dust exposure": {
        "hi": "धूल से सूखी खांसी", "hinglish": "dust se sukhi khansi", "ta": "உலர் இருமல்",
        "te": "పొడి దగ్గు", "mr": "धुळीमुळे कोरडा खोकला", "bn": "ধুলোবালির শুকনো কাশি"
    },
    "breathlessness in farmers": {
        "hi": "सांस लेने में रुकावट", "hinglish": "saans lene me takleef", "ta": "மூச்சுத் திணறல்",
        "te": "శ్వాస ఆడకపోవడం", "mr": "श्वास कोंडणे", "bn": "দমবন্ধ ভাব"
    },
    "pesticide inhalation": {
        "hi": "कीटनाशक का सांस में जाना", "hinglish": "pesticide inhalation", "ta": "பூச்சிக்கொல்லி சுவாசம்",
        "te": "క్రిమిసంహారక పీల్చడం", "mr": "कीटकनाशकाचा धूर", "bn": "কীটনাশক শ্বাস নেওয়া"
    },
    "livestock contact infection": {
        "hi": "पशुओं के संपर्क से संक्रमण", "hinglish": "janwar se infection", "ta": "கால்நடை தொற்று",
        "te": "పశువుల సంపర్కం", "mr": "जनावरांचा संसर्ग", "bn": "গবাদি পশু থেকে সংক্রমণ"
    },
    "severe skin ulcers": {
        "hi": "त्वचा पर गहरे घाव", "hinglish": "skin ulcers", "ta": "சரும புண்கள்",
        "te": "చర్మ పుండ్లు", "mr": "त्वचेचे व्रण", "bn": "ত্বকে গভীর ক্ষত"
    },
    "childhood severe diarrhea": {
        "hi": "बच्चों में गंभीर दस्त", "hinglish": "baccho me dast", "ta": "குழந்தை வயிற்றுப்போக்கு",
        "te": "పిల్లల విరేచనాలు", "mr": "लहान मुलांचे जुलाब", "bn": "শিশুদের তীব্র ডায়রিয়া"
    },
    "liver abscess pain": {
        "hi": "जिगर में सूजन का दर्द", "hinglish": "liver me pain", "ta": "கல்லீரல் வலி",
        "te": "కాలేయ నొప్పి", "mr": "यकृताचे दुखणे", "bn": "লিভারে ব্যথার ক্ষত"
    },
    "bone pain due to water fluorosis": {
        "hi": "हड्डियों में तेज दर्द", "hinglish": "haddiyon me pain", "ta": "எலும்பு வலி",
        "te": "ఎముకల నొప్పి", "mr": "हाडांमध्ये तीव्र वेदना", "bn": "হাঁড়ে মারাত্মক ব্যথা"
    },
    "skin lesions from arsenic": {
        "hi": "त्वचा पर काले धब्बे", "hinglish": "skin lesions", "ta": "சரும தழும்புகள்",
        "te": "చర్మ మచ్చలు", "mr": "त्वचेवर डाग", "bn": "ত্বকে কালো দাগ ও ক্ষত"
    },
    "painful big toe": {
        "hi": "पैर के अंगूठे में दर्द", "hinglish": "toe me dard", "ta": "கால் கட்டைவிரல் வலி",
        "te": "కాలి బొటనవేలు నొప్పి", "mr": "पायाच्या अंगठ्यात वेदना", "bn": "পায়ের বুড়ো আঙুলে তীব্র ব্যথা"
    },
    "rapid heart rate and weight loss": {
        "hi": "तेज धड़कन और वजन घटना", "hinglish": "fast heartbeat and weight loss", "ta": "உடல் எடை குறைதல்",
        "te": "గుండె వేగం పెరగడం", "mr": "जलद हृदयाचे ठोके", "bn": "হৃদস্পন্দন বৃদ্ধি ও ওজন হ্রাস"
    },
    "cold intolerance and fatigue": {
        "hi": "ठंड सहन न होना और थकान", "hinglish": "cold and fatigue", "ta": "சோர்வு",
        "te": "చలి తట్టుకోలేకపోవడం", "mr": "थंडी वाजणे व थकवा", "bn": "শীত সহ্য না হওয়া ও ক্লান্তি"
    },
    "right upper abdominal pain": {
        "hi": "पेट के ऊपरी दाहिने हिस्से में दर्द", "hinglish": "right side pet dard", "ta": "வயிற்று வலி",
        "te": "కడుపు కుడి వైపు నొప్పి", "mr": "पोटाच्या उजव्या भागात दुखणे", "bn": "পেটের ডানদিকের ওপরের অংশে ব্যথা"
    },
    "palpitations and sudden dread": {
        "hi": "अचानक घबराहट और डर लगना", "hinglish": "palpitations and fear", "ta": "திடீர் பயம்",
        "te": "ఆందోళన మరియు భయం", "mr": "धडधड आणि अचानक भीती", "bn": "হঠাৎ বুক ধড়ফড়ানি ও তীব্র ভয়"
    },
    "persistent low mood": {
        "hi": "लगातार उदासी और निराशा", "hinglish": "low mood", "ta": "மனச்சோர்வு",
        "te": "నిరంతర నిరాశ", "mr": "सतत उदासीनता", "bn": "ক্রমাগত বিষণ্ণতা ও মন খারাপ"
    },
    "neck and shoulder stiffness": {
        "hi": "गर्दन और कंधे में अकड़न", "hinglish": "gardan aur kandha stiffness", "ta": "கழுத்து வலி",
        "te": "మెడ మరియు భుజం నొప్పులు", "mr": "मान आणि खांदे आखडणे", "bn": "ঘাড় ও কাঁধ শক্ত হওয়া"
    },
    "lower back shooting pain": {
        "hi": "कमर से पैर तक दर्द", "hinglish": "back shooting pain", "ta": "முதுகு வலி",
        "te": "నడుము నొప్పి", "mr": "कमरेतून पायाकडे जाणारी कळ", "bn": "কোমর থেকে পা পর্যন্ত তীব্র ব্যথা"
    },
    "unexplained persistent exhaustion": {
        "hi": "अकारण लगातार थकान", "hinglish": "constant weakness", "ta": "கடுமையான சோர்வு",
        "te": "నిరంతర అలసట", "mr": "अकारण थकवा", "bn": "অকারণ ক্রমাগত ক্লান্তি"
    },
    "long sitting swollen leg": {
        "hi": "ज्यादा बैठने से पैर में सूजन", "hinglish": "swollen leg", "ta": "கால் வீக்கம்",
        "te": "కాలు వాపు", "mr": "पायाला सूज येणे", "bn": "দীর্ঘক্ষণ বসে পায়ে ফোলা"
    },
    "urban severe heartburn": {
        "hi": "सीने में तेज जलन", "hinglish": "seene me jalan", "ta": "நெஞ்செரிச்சல்",
        "te": "గుండెల్లో మంట", "mr": "छातीत जळजळ", "bn": "বুকে তীব্র জ্বালাপোড়া ও টক ঢেঁকুর"
    },
    "urban screen eye fatigue": {
        "hi": "स्क्रीन देखने से आँखों में थकान", "hinglish": "eye fatigue", "ta": "கண் சோர்வு",
        "te": "కంటి అలసట", "mr": "डोळ्यांवर ताण", "bn": "স্ক্রিন দেখার কারণে চোখের ক্লান্তি"
    },
    "wrist pain typing": {
        "hi": "टाइपिंग से कलाई में दर्द", "hinglish": "wrist pain", "ta": "மணிக்கட்டு வலி",
        "te": "మణికట్టు నొప్పి", "mr": "मनगट दुखी", "bn": "টাইপ করার ফলে কব্জিতে ব্যথা"
    },
    "urban stress sleep disorder": {
        "hi": "तनाव के कारण नींद न आना", "hinglish": "neend na aana", "ta": "தூக்கமின்மை",
        "te": "నిద్రలేమి", "mr": "निद्रानाश", "bn": "মানসিক চাপের কারণে অনিদ্রা"
    },
    "hormonal imbalance women": {
        "hi": "महिलाओं में हार्मोन असंतुलन", "hinglish": "hormonal imbalance", "ta": "ஹார்மோன் குறைபாடு",
        "te": "హార్మోన్ల అసమతుల్యత", "mr": "हार्मोनल असंतुलन", "bn": "হরমোনের ভারসাম্যহীনতা"
    },
    "sudden numbness slurred speech": {
        "hi": "अचानक सुन्न होना और लड़खड़ाती आवाज", "hinglish": "numbness and slurred speech", "ta": "பேச்சு குளறுதல்",
        "te": "నొప్పి తెలియకపోవడం, మాట పడిపోవడం", "mr": "अंग सुन्न होणे व तोतरे बोलणे", "bn": "হঠাৎ অবশ ভাব ও কথা জড়িয়ে যাওয়া"
    },
    "gradual vision loss": {
        "hi": "धीरे-धीरे दृष्टि कम होना", "hinglish": "dhire dhire dikhna kam hona", "ta": "பார்வை குறைபாடு",
        "te": "క్రమంగా చూపు మందగించడం", "mr": "हळूहळू दृष्टी कमी होणे", "bn": "ধীরে ধীরে দৃষ্টিশক্তি হ্রাস"
    },
    "vegetarian diet numbness": {
        "hi": "हाथ-पैर सुन्न होना (शाकाहारी आहार)", "hinglish": "b12 deficiency", "ta": "பலவீனம்",
        "te": "చేతులు కాళ్ళు తిమ్మిరి", "mr": "हातपाय सुन्न पडणे", "bn": "নিরামিষ খাদ্যের ফলে হাত-পা ঝিনঝিন করা"
    },
    "lack of sunlight body pain": {
        "hi": "धूप न मिलने से बदन दर्द", "hinglish": "vitamin d deficiency pain", "ta": "உடல் வலி",
        "te": "శరీర నొప్పులు", "mr": "उन्हाच्या अभावामुळे अंगदुखी", "bn": "সূর্যালোকের অভাবে গায়ে মারাত্মক ব্যথা"
    }
}

# 101 Diseases mapped to their clinical details and core English symptom pools (Original 51 + 50 New approved ones!)
DISEASE_ENGLISH_POOLS = {
    # --- Original 51 ---
    "Malaria": {
        "severity": "P2", "specialty": "General Physician",
        "advice_en": "Sleep under a mosquito net, drink fluids, and visit nearest PHC within 24h for blood test.",
        "advice_hi": "मच्छरदानी के नीचे सोएं, तरल पदार्थ पिएं और रक्त परीक्षण के लिए 24 घंटे के भीतर नजदीकी पीएचसी पर जाएं।",
        "symptoms": ["high fever", "shivering", "chills", "sweating", "headache", "nausea", "weakness", "cyclic fever chills"]
    },
    "Dengue": {
        "severity": "P2", "specialty": "General Physician",
        "advice_en": "Complete bed rest, stay hydrated. Do NOT take pain relievers like Ibuprofen/Aspirin (only Paracetamol is safe).",
        "advice_hi": "पूर्ण विश्राम करें, हाइड्रेटेड रहें। इबुप्रोफेन/एस्पिरिन जैसी दर्द निवारक दवाएं न लें (केवल पैरासिटामोल सुरक्षित है)।",
        "symptoms": ["high fever", "joint pain", "eye pain", "skin rash", "body ache", "bleeding gums"]
    },
    "Typhoid": {
        "severity": "P2", "specialty": "General Physician",
        "advice_en": "Drink only boiled/filtered water, eat soft cooked food, and complete prescribed antibiotics.",
        "advice_hi": "केवल उबला/छना हुआ पानी पिएं, नरम पका हुआ भोजन खाएं और निर्धारित एंटीबायोटिक्स का कोर्स पूरा करें।",
        "symptoms": ["high fever", "stomach pain", "diarrhea", "constipation", "weakness", "headache"]
    },
    "Tuberculosis": {
        "severity": "P2", "specialty": "Pulmonologist",
        "advice_en": "Wear a mask, sleep in a ventilated room, and visit PHC for free sputum/DOTS test.",
        "advice_hi": "मास्क पहनें, हवादार कमरे में सोएं और मुफ्त बलगम/डॉट परीक्षण के लिए पीएचसी पर जाएं।",
        "symptoms": ["cough", "coughing up blood", "chest pain", "weight loss", "night sweats", "high fever"]
    },
    "Cholera": {
        "severity": "P1", "specialty": "Emergency Care",
        "advice_en": "Drink ORS after every stool to prevent dehydration. Continue light diet (rice/curd) and see doctor.",
        "advice_hi": "निर्जलीकरण को रोकने के लिए हर दस्त के बाद ओआरएस पिएं। हल्का आहार (चावल/दही) जारी रखें और डॉक्टर से मिलें।",
        "symptoms": ["watery diarrhea", "dehydration", "vomiting", "nausea", "weakness"]
    },
    "Dysentery": {
        "severity": "P2", "specialty": "General Physician",
        "advice_en": "Drink ORS to stay hydrated, eat clean soft food, and visit doctor for antibiotic check.",
        "advice_hi": "निर्जलीकरण से बचने के लिए ओआरएस पिएं, साफ नरम भोजन खाएं और एंटीबायोटिक जांच के लिए डॉक्टर से मिलें।",
        "symptoms": ["coughing up blood", "stomach pain", "diarrhea", "nausea", "weakness"]
    },
    "Jaundice": {
        "severity": "P2", "specialty": "Gastroenterologist",
        "advice_en": "Rest completely. Avoid fatty/oily food and alcohol. Seek medical check at PHC.",
        "advice_hi": "पूर्ण विश्राम करें। वसायुक्त/तैलीय भोजन और शराब से बचें। पीएचसी में चिकित्सा जांच कराएं।",
        "symptoms": ["yellow skin", "yellow eyes", "dark urine", "stomach pain", "nausea", "weakness"]
    },
    "Anaemia": {
        "severity": "P3", "specialty": "General Physician",
        "advice_en": "Eat iron-rich food daily (spinach, jaggery, dates). Consult ASHA for free Iron tablets.",
        "advice_hi": "रोजाना आयरन युक्त भोजन करें (पालक, गुड़, खजूर)। मुफ्त आयरन की गोलियों के लिए आशा से परामर्श करें।",
        "symptoms": ["yellow skin", "weakness", "breathing difficulty", "headache", "nausea"]
    },
    "Pneumonia": {
        "severity": "P1", "specialty": "Pulmonologist",
        "advice_en": "Requires urgent doctor visit. Keep patient in upright position to ease breathing.",
        "advice_hi": "तुरंत डॉक्टर के पास जाने की आवश्यकता है। सांस लेने में आसानी के लिए मरीज को सीधी स्थिति में रखें।",
        "symptoms": ["cough", "breathing difficulty", "chest pain", "high fever", "chills", "weakness"]
    },
    "Viral Fever": {
        "severity": "P3", "specialty": "General Physician",
        "advice_en": "Rest well, drink warm water, take paracetamol for fever. See doctor if fever lasts >3 days.",
        "advice_hi": "अच्छी तरह आराम करें, गुनगुना पानी पिएं, बुखार के लिए पैरासिटामोल लें। यदि बुखार 3 दिनों से अधिक रहता है तो डॉक्टर को दिखाएं।",
        "symptoms": ["high fever", "body ache", "headache", "sore throat", "cough", "weakness"]
    },
    "Chickenpox": {
        "severity": "P3", "specialty": "General Physician",
        "advice_en": "Keep isolated, avoid scratching blisters, apply calamine lotion, and consult ASHA worker.",
        "advice_hi": "अलग रहें, फफोले खुजलाने से बचें, कैलामाइन लोशन लगाएं और आशा कार्यकर्ता से परामर्श करें।",
        "symptoms": ["fluid blisters", "skin rash", "high fever", "headache", "weakness"]
    },
    "Measles": {
        "severity": "P3", "specialty": "Pediatrician",
        "advice_en": "Keep isolated, keep eyes clean, consult doctor for vitamin A dosage and fever management.",
        "advice_hi": "अलग रहें, आंखें साफ रखें, विटामिन ए की खुराक और बुखार प्रबंधन के लिए डॉक्टर से परामर्श करें।",
        "symptoms": ["skin rash", "high fever", "cough", "eye redness", "sore throat"]
    },
    "Heatstroke": {
        "severity": "P1", "specialty": "Emergency Care",
        "advice_en": "Move to shade, apply wet cloths, sip cool water, and seek immediate emergency care.",
        "advice_hi": "छाया में जाएं, गीले कपड़े लगाएं, ठंडा पानी पिएं और तुरंत आपातकालीन सहायता लें।",
        "symptoms": ["high fever", "confusion", "headache", "nausea", "weakness"]
    },
    "Snakebite": {
        "severity": "P1", "specialty": "Emergency Care",
        "advice_en": "Keep calm and still, immobilize limb, do NOT cut or suck wound, seek nearest hospital with anti-venom immediately.",
        "advice_hi": "शांत और स्थिर रहें, अंग को हिलाएं नहीं, घाव को काटें या चूसें नहीं, तुरंत एंटी-वेनम वाले नजदीकी अस्पताल जाएं।",
        "symptoms": ["body ache", "breathing difficulty", "confusion", "weakness"]
    },
    "Acute Respiratory Infection": {
        "severity": "P2", "specialty": "Pulmonologist",
        "advice_en": "Drink warm fluids, steam inhalation, and see doctor if breathing is difficult.",
        "advice_hi": "गुनगुना पानी पिएं, भाप लें और सांस लेने में तकलीफ होने पर डॉक्टर को दिखाएं।",
        "symptoms": ["wet productive cough", "breathing difficulty", "cough", "sore throat", "headache", "high fever"]
    },
    "Skin Infection": {
        "severity": "P4", "specialty": "Dermatologist",
        "advice_en": "Keep skin clean and dry. Avoid sharing personal items and apply antifungal/antibacterial cream as prescribed.",
        "advice_hi": "त्वचा को साफ और सूखा रखें। व्यक्तिगत सामान साझा करने से बचें और निर्धारित एंटीफंगल/जीवाणुरोधी क्रीम लगाएं।",
        "symptoms": ["skin rash", "severe itching", "body ache", "fluid blisters"]
    },
    "UTI": {
        "severity": "P3", "specialty": "General Physician",
        "advice_en": "Drink 2-3 liters of water daily. Do not hold urine. Consult doctor for antibiotics.",
        "advice_hi": "रोजाना 2-3 लीटर पानी पिएं। पेशाब को रोक कर न रखें। एंटीबायोटिक्स के लिए डॉक्टर से सलाह लें।",
        "symptoms": ["stomach pain", "dark urine", "weakness"]
    },
    "Appendicitis": {
        "severity": "P1", "specialty": "Emergency Care",
        "advice_en": "Go to the emergency room immediately. Do NOT eat or drink anything until doctor checks you.",
        "advice_hi": "तुरंत आपातकालीन कक्ष में जाएं। जब तक डॉक्टर आपकी जांच न कर लें, तब तक कुछ भी न खाएं-पिएं।",
        "symptoms": ["right lower abdominal pain", "stomach pain", "nausea", "vomiting", "high fever", "weakness"]
    },
    "Meningitis": {
        "severity": "P1", "specialty": "Neurologist",
        "advice_en": "Urgent neurological checkup needed. Go to the hospital emergency ward immediately.",
        "advice_hi": "त्वरित न्यूरोलॉजिकल जांच की आवश्यकता है। तुरंत अस्पताल के आपातकालीन वार्ड में जाएं।",
        "symptoms": ["stiff neck", "high fever", "headache", "confusion", "nausea", "light sensitivity"]
    },
    "Scrub Typhus": {
        "severity": "P2", "specialty": "General Physician",
        "advice_en": "Consult doctor for Doxycycline therapy. Keep surroundings clean to prevent mite bites.",
        "advice_hi": "डॉक्सीसाइक्लिन थेरेपी के लिए डॉक्टर से संपर्क करें। घुन के काटने से बचने के लिए आसपास सफाई रखें।",
        "symptoms": ["eschar wound", "mite bite mark", "high fever", "chills", "headache", "body ache", "skin rash"]
    },
    "Pre-eclampsia": {
        "severity": "P1", "specialty": "Gynecologist",
        "advice_en": "Immediate emergency delivery clinic check. Highly dangerous pregnancy complication.",
        "advice_hi": "तुरंत आपातकालीन प्रसव क्लिनिक जांच कराएं। गर्भावस्था की अत्यधिक खतरनाक जटिलता।",
        "symptoms": ["high blood pressure", "headache", "breathing difficulty", "stomach pain", "nausea"]
    },
    "Gestational Diabetes": {
        "severity": "P2", "specialty": "Gynecologist",
        "advice_en": "Regular blood sugar monitoring required. Consult gynecologist and clinical nutritionist.",
        "advice_hi": "नियमित रक्त शर्करा की निगरानी आवश्यक है। स्त्री रोग विशेषज्ञ और पोषण विशेषज्ञ से सलाह लें।",
        "symptoms": ["weakness", "headache", "yellow skin"]
    },
    "Asthma": {
        "severity": "P2", "specialty": "Pulmonologist",
        "advice_en": "Keep inhaler ready. Avoid smoke, dust, and cold air triggers. Seek emergency if breathing gets very difficult.",
        "advice_hi": "इनहेलर तैयार रखें। धुएं, धूल और ठंडी हवा के ट्रिगर्स से बचें। सांस लेने में ज्यादा तकलीफ होने पर आपातकालीन सहायता लें।",
        "symptoms": ["inhaler needed", "breathing difficulty", "wheezing", "chest pain", "cough", "weakness"]
    },
    "Bronchitis": {
        "severity": "P3", "specialty": "Pulmonologist",
        "advice_en": "Inhale steam, drink warm liquids, and avoid tobacco smoke. See doctor if cough lasts >2 weeks.",
        "advice_hi": "भाप लें, गर्म तरल पदार्थ पिएं और तंबाकू के धुएं से बचें। यदि खांसी 2 सप्ताह से अधिक समय तक बनी रहती है तो डॉक्टर को दिखाएं।",
        "symptoms": ["cough", "weakness", "breathing difficulty", "chills", "chest pain"]
    },
    "Food Poisoning": {
        "severity": "P3", "specialty": "General Physician",
        "advice_en": "Drink ORS, eat bland foods (bananas, rice), and avoid dairy. Consult doctor if vomiting persists.",
        "advice_hi": "ओआरएस पिएं, हल्का भोजन (केला, चावल) खाएं और डेयरी उत्पादों से बचें। यदि लगातार उल्टी हो तो डॉक्टर से सलाह लें।",
        "symptoms": ["sudden food illness", "nausea", "vomiting", "diarrhea", "stomach pain", "high fever", "weakness"]
    },
    "Rabies": {
        "severity": "P1", "specialty": "Emergency Care",
        "advice_en": "Wash animal bite wound with soap under running water for 15 min, and get anti-rabies vaccine immediately.",
        "advice_hi": "जानवर के काटने के घाव को बहते पानी में साबुन से 15 मिनट तक धोएं, और तुरंत रेबीज रोधी टीका लगवाएं।",
        "symptoms": ["dog bite", "confusion", "nausea", "high fever", "weakness"]
    },
    "Tetanus": {
        "severity": "P1", "specialty": "Emergency Care",
        "advice_en": "Clean wound immediately. Get tetanus toxoid (TT) injection within 24h of injury.",
        "advice_hi": "घाव को तुरंत साफ करें। चोट लगने के 24 घंटे के भीतर टिटनेस का टीका (टीटी) लगवाएं।",
        "symptoms": ["lockjaw", "stiff neck", "breathing difficulty", "weakness"]
    },
    "Leptospirosis": {
        "severity": "P1", "specialty": "General Physician",
        "advice_en": "Avoid waterlogged areas during floods. Consult doctor for early antibiotic therapy.",
        "advice_hi": "बाढ़ के दौरान जलभराव वाले क्षेत्रों से बचें। शुरुआती एंटीबायोटिक थेरेपी के लिए डॉक्टर से सलाह लें।",
        "symptoms": ["high fever", "headache", "body ache", "yellow skin", "vomiting", "eye redness"]
    },
    "Chikungunya": {
        "severity": "P2", "specialty": "General Physician",
        "advice_en": "Stay hydrated, take paracetamol for pain. Joint pain may persist for months.",
        "advice_hi": "हाइड्रेटेड रहें, दर्द के लिए पैरासिटामोल लें। जोड़ों का दर्द महीनों तक बना रह सकता है।",
        "symptoms": ["bilateral joint swelling", "joint pain", "high fever", "skin rash", "body ache", "headache", "weakness"]
    },
    "Japanese Encephalitis": {
        "severity": "P1", "specialty": "Neurologist",
        "advice_en": "Requires immediate hospitalization. Mosquito-borne brain fever danger.",
        "advice_hi": "तुरंत अस्पताल में भर्ती होने की आवश्यकता है। मच्छर जनित दिमागी बुखार का खतरा।",
        "symptoms": ["high fever", "headache", "stiff neck", "confusion", "weakness"]
    },
    "Filariasis": {
        "severity": "P3", "specialty": "General Physician",
        "advice_en": "Keep skin of affected limb clean, elevate leg. Take DEC/Albendazole as prescribed.",
        "advice_hi": "प्रभावित अंग की त्वचा को साफ रखें, पैर को ऊपर उठाएं। डॉक्टर के परामर्श अनुसार डीईसी/एल्बेंडाजोल लें।",
        "symptoms": ["body ache", "chills", "high fever", "weakness"]
    },
    "Scabies": {
        "severity": "P4", "specialty": "Dermatologist",
        "advice_en": "Apply Permethrin lotion from neck down, wash all family clothes in hot water.",
        "advice_hi": "गर्दन से नीचे पर्मेथ्रिन लोशन लगाएं, परिवार के सभी कपड़े गर्म पानी में धोएं।",
        "symptoms": ["severe itching", "skin rash", "body ache"]
    },
    "Peptic Ulcer Disease": {
        "severity": "P3", "specialty": "Gastroenterologist",
        "advice_en": "Avoid spicy food, tea, coffee, and pain killers. See doctor for antacid therapy.",
        "advice_hi": "मसालेदार भोजन, चाय, कॉफी और दर्द निवारक दवाओं से बचें। एंटासिड थेरेपी के लिए डॉक्टर से मिलें।",
        "symptoms": ["stomach pain", "nausea", "vomiting", "weakness"]
    },
    "GERD": {
        "severity": "P4", "specialty": "Gastroenterologist",
        "advice_en": "Eat small frequent meals, do not lie down immediately after eating. Avoid fried foods.",
        "advice_hi": "थोड़ा-थोड़ा भोजन कई बार करें, खाने के तुरंत बाद न लेटें। तले हुए भोजन से बचें।",
        "symptoms": ["chest pain", "stomach pain", "nausea", "cough"]
    },
    "Tonsillitis": {
        "severity": "P4", "specialty": "ENT Specialist",
        "advice_en": "Gargle with warm salt water, drink warm liquids. Visit doctor if swallowing is blocked.",
        "advice_hi": "गुनगुने नमक के पानी से गरारे करें, गर्म तरल पदार्थ पिएं। यदि निगलने में कठिनाई हो तो डॉक्टर से मिलें।",
        "symptoms": ["sore throat", "stiff neck", "headache", "high fever"]
    },
    "Otitis Media": {
        "severity": "P4", "specialty": "ENT Specialist",
        "advice_en": "Do not put oil or sharp objects in ear. Keep ear dry and consult ENT doctor.",
        "advice_hi": "कान में तेल या नुकीली चीजें न डालें। कान सूखा रखें और ईएनटी डॉक्टर से सलाह लें।",
        "symptoms": ["ear pain", "ear discharge", "headache", "high fever", "weakness"]
    },
    "Conjunctivitis": {
        "severity": "P4", "specialty": "Ophthalmologist",
        "advice_en": "Wash eyes with clean water, avoid touching eyes, do not share towels. Use antibiotic eye drops.",
        "advice_hi": "आंको को साफ पानी से धोएं, आंखें छूने से बचें, तौलिया साझा न करें। एंटीबायोटिक आई ड्रॉप्स का प्रयोग करें।",
        "symptoms": ["eye redness", "severe itching", "headache", "chills"]
    },
    "Covid-19": {
        "severity": "P2", "specialty": "Pulmonologist",
        "advice_en": "Isolate yourself immediately. Monitor oxygen level with pulse oximeter. Seek emergency if SpO2 <94%.",
        "advice_hi": "तुरंत खुद को अलग करें। पल्स ऑक्सीमीटर से ऑक्सीजन स्तर की निगरानी करें। SpO2 <94% होने पर तत्काल सहायता लें।",
        "symptoms": ["loss of smell", "loss of taste", "cough", "high fever", "breathing difficulty", "body ache", "headache", "sore throat", "weakness"]
    },
    "Diabetes": {
        "severity": "P3", "specialty": "General Physician",
        "advice_en": "Reduce sugar and simple carb intake. Exercise daily. Monitor fasting blood glucose.",
        "advice_hi": "चीनी और कार्बोहाइड्रेट का सेवन कम करें। रोज व्यायाम करें। फास्टिंग ब्लड ग्लूकोज की निगरानी करें।",
        "symptoms": ["weakness", "weight loss", "dehydration"]
    },
    "Hypertension": {
        "severity": "P3", "specialty": "Cardiologist",
        "advice_en": "Adopt low sodium diet, avoid stress and smoking. Consult doctor for blood pressure medications.",
        "advice_hi": "कम नमक वाला आहार लें, तनाव और धूम्रपान से बचें। रक्तचाप की दवाओं के लिए डॉक्टर से संपर्क करें।",
        "symptoms": ["headache", "confusion", "chest pain", "breathing difficulty"]
    },
    "Angina": {
        "severity": "P1", "specialty": "Cardiologist",
        "advice_en": "Sit down immediately. Take Sorbitrate under tongue if prescribed. Go to cardiac emergency hospital.",
        "advice_hi": "तुरंत बैठ जाएं। यदि निर्धारित हो तो जीभ के नीचे सोर्बिट्रेट लें। कार्डियक इमरजेंसी अस्पताल जाएं।",
        "symptoms": ["chest pain", "breathing difficulty", "sweating", "nausea"]
    },
    "COPD": {
        "severity": "P2", "specialty": "Pulmonologist",
        "advice_en": "Avoid smoking and dust exposure. Use bronchodilators as prescribed. Seek oxygen support if breathless.",
        "advice_hi": "धूम्रपान और धूल के संपर्क से बचें। निर्धारित ब्रोंकोडायलेटर का उपयोग करें। सांस फूलने पर ऑक्सीजन सहायता लें।",
        "symptoms": ["cough", "breathing difficulty", "wheezing", "weakness"]
    },
    "Rheumatoid Arthritis": {
        "severity": "P3", "specialty": "Orthopedic",
        "advice_en": "Do gentle range-of-motion exercises, apply warm compress. Consult rheumatologist for DMARDs.",
        "advice_hi": "हल्का व्यायाम करें, गर्म सिकाई करें। डीएमएआरडी दवाओं के लिए संधिविज्ञान विशेषज्ञ से संपर्क करें।",
        "symptoms": ["joint pain", "weakness", "high fever"]
    },
    "Kidney Stones": {
        "severity": "P2", "specialty": "Urologist",
        "advice_en": "Drink plenty of water (3-4L). Avoid oxalate-rich foods (spinach, tomatoes). Seek medical checkup.",
        "advice_hi": "खूब पानी पिएं (3-4 लीटर)। ऑक्सालेट युक्त खाद्य पदार्थों (पालक, टमाटर) से बचें। डॉक्टर से मिलें।",
        "symptoms": ["kidney stone pain", "stomach pain", "vomiting", "nausea"]
    },
    "Migraine": {
        "severity": "P3", "specialty": "Neurologist",
        "advice_en": "Rest in a quiet dark room, apply cold compress to forehead, avoid trigger foods like chocolate.",
        "advice_hi": "शांत अंधेरे कमरे में आराम करें, माथे पर ठंडी सिकाई करें, चॉकलेट जैसे ट्रिगर खाद्य पदार्थों से बचें।",
        "symptoms": ["headache", "nausea", "vomiting"]
    },
    "Goitre": {
        "severity": "P3", "specialty": "Endocrinologist",
        "advice_en": "Use iodized salt. Consult endocrinologist for thyroid hormone profile tests.",
        "advice_hi": "आयोडीन युक्त नमक का प्रयोग करें। थायराइड हार्मोन प्रोफाइल परीक्षणों के लिए एंडोक्रिनोलॉजिस्ट से मिलें।",
        "symptoms": ["stiff neck", "cough", "breathing difficulty"]
    },
    "Scorpion Sting": {
        "severity": "P1", "specialty": "Emergency Care",
        "advice_en": "Keep stung limb below heart level. Seek immediate emergency center for anti-scorpion venom.",
        "advice_hi": "डंक मारे गए अंग को हृदय के स्तर से नीचे रखें। एंटी-बिच्छू विष के लिए तुरंत आपातकालीन केंद्र जाएं।",
        "symptoms": ["scorpion bite", "body ache", "breathing difficulty", "weakness"]
    },
    "Eczema": {
        "severity": "P4", "specialty": "Dermatologist",
        "advice_en": "Moisturize skin frequently, use mild soaps, and apply mild steroid cream under doctor guidance.",
        "advice_hi": "त्वचा को बार-बार मॉइस्चराइज करें, हल्के साबुनों का उपयोग करें, और डॉक्टर के मार्गदर्शन में माइल्ड स्टेरॉयड क्रीम लगाएं।",
        "symptoms": ["severe itching", "skin rash"]
    },
    "Psoriasis": {
        "severity": "P4", "specialty": "Dermatologist",
        "advice_en": "Keep skin hydrated, apply coal tar or prescription topical creams, manage stress.",
        "advice_hi": "त्वचा को हाइड्रेटेड रखें, कोल तार या डॉक्टर द्वारा निर्धारित क्रीम लगाएं, तनाव कम करें।",
        "symptoms": ["severe itching", "skin rash", "joint pain"]
    },
    "Whooping Cough": {
        "severity": "P2", "specialty": "Pediatrician",
        "advice_en": "Highly contagious. Complete prescribed antibiotic course. Seek emergency if baby turns blue during cough.",
        "advice_hi": "अत्यधिक संक्रामक। निर्धारित एंटीबायोटिक कोर्स पूरा करें। यदि खांसते समय बच्चा नीला पड़ जाए तो तत्काल आपातकालीन सहायता लें।",
        "symptoms": ["cough", "wheezing", "vomiting", "weakness"]
    },
    "Ringworm": {
        "severity": "P4", "specialty": "Dermatologist",
        "advice_en": "Apply antifungal cream (clotrimazole/miconazole) twice daily. Keep area clean and dry.",
        "advice_hi": "एंटीफंगल क्रीम (क्लोट्रिमेज़ोल/मिकोनाज़ोल) दिन में दो बार लगाएं। क्षेत्र को साफ और सूखा रखें।",
        "symptoms": ["circular rash", "severe itching"]
    },

    # --- 50 Approved New Real-life Diseases (Neglected, Rural, and Urban Lifestyle Focus) ---
    "Malaria Vivax": {
        "severity": "P2", "specialty": "General Physician",
        "advice_en": "Recurrent malaria strain. Seek immediate blood test at PHC. Complete full course of Primaquine under supervision.",
        "advice_hi": "आवर्तक मलेरिया तनाव। पीएचसी में तत्काल रक्त परीक्षण कराएं। देखरेख में प्राइमाक्विन का पूरा कोर्स पूरा करें।",
        "symptoms": ["chills", "high fever", "shivering", "sweating", "body ache"]
    },
    "Kala-Azar": {
        "severity": "P1", "specialty": "General Physician",
        "advice_en": "Visceral Leishmaniasis transmitted by sandflies. Spleen enlargement threat. Go to District Hospital immediately.",
        "advice_hi": "सैंडफ्लाई द्वारा फैलने वाला विसरल लीशमैनियासिस। प्लीहा बढ़ने का खतरा। तुरंत जिला अस्पताल जाएं।",
        "symptoms": ["high fever", "spleen enlargement", "weight loss", "weakness", "yellow skin"]
    },
    "Lymphatic Elephantiasis": {
        "severity": "P3", "specialty": "General Physician",
        "advice_en": "Neglected tropical disease. Wash limbs daily with soap and clean water to prevent secondary infection.",
        "advice_hi": "उपेक्षित उष्णकटिबंधीय रोग। माध्यमिक संक्रमण को रोकने के लिए रोजाना साबुन और साफ पानी से अंगों को धोएं।",
        "symptoms": ["severe leg swelling", "high fever", "body ache", "chills"]
    },
    "Ascariasis": {
        "severity": "P3", "specialty": "Pediatrician",
        "advice_en": "Common roundworm infection. Get Albendazole chewable tablet from ASHA worker or local PHC.",
        "advice_hi": "सामान्य राउंडवॉर्म संक्रमण। आशा कार्यकर्ता या स्थानीय पीएचसी से एल्बेंडाजोल की चबाने योग्य गोली लें।",
        "symptoms": ["stomach worms", "stomach pain", "vomiting", "nausea", "weight loss"]
    },
    "Hookworm Disease": {
        "severity": "P3", "specialty": "General Physician",
        "advice_en": "Soil-transmitted worm causing severe rural anemia. Always wear shoes outside. Complete deworming course.",
        "advice_hi": "मिट्टी से फैलने वाले कीड़े जो गंभीर ग्रामीण एनीमिया का कारण बनते हैं। बाहर हमेशा जूते पहनें। डीवर्मिंग कोर्स पूरा करें।",
        "symptoms": ["severe anemia", "weakness", "stomach pain", "diarrhea"]
    },
    "Silicosis": {
        "severity": "P2", "specialty": "Pulmonologist",
        "advice_en": "Occupational lung disease from dust. Avoid further exposure, wear N95 mask, seek supportive care.",
        "advice_hi": "धूल से होने वाला व्यावसायिक फेफड़ों का रोग। आगे के संपर्क से बचें, N95 मास्क पहनें, सहायक देखभाल लें।",
        "symptoms": ["dry cough with dust exposure", "breathing difficulty", "chest pain", "weakness"]
    },
    "Farmers Lung": {
        "severity": "P2", "specialty": "Pulmonologist",
        "advice_en": "Hypersensitivity pneumonitis from moldy crops or dust. Stay away from damp agricultural feed.",
        "advice_hi": "फफूंदयुक्त फसलों या धूल से होने वाला हाइपरसेंसिटिविटी न्यूमोनाइटिस। नम कृषि चारे से दूर रहें।",
        "symptoms": ["breathlessness in farmers", "cough", "high fever", "chills", "chest pain"]
    },
    "Organophosphate Poisoning": {
        "severity": "P1", "specialty": "Emergency Care",
        "advice_en": "CRITICAL EMERGENCY. Remove contaminated clothing immediately, wash skin. Administer Atropine at nearest ER.",
        "advice_hi": "गंभीर आपातकाल। दूषित कपड़े तुरंत हटाएं, त्वचा धोएं। नजदीकी आपातकालीन कक्ष में एट्रोपिन लगवाएं।",
        "symptoms": ["pesticide inhalation", "vomiting", "confusion", "breathing difficulty", "sweating"]
    },
    "Brucellosis": {
        "severity": "P2", "specialty": "General Physician",
        "advice_en": "Infection from raw dairy or contact with livestock. Avoid unpasteurized milk. Complete dual antibiotic therapy.",
        "advice_hi": "कच्चे डेयरी उत्पादों या पशुओं के संपर्क से होने वाला संक्रमण। बिना पाश्चुरीकृत दूध से बचें। दोहरी एंटीबायोटिक थेरेपी पूरी करें।",
        "symptoms": ["livestock contact infection", "high fever", "sweating", "body ache", "joint pain"]
    },
    "Bovine Tuberculosis": {
        "severity": "P2", "specialty": "Pulmonologist",
        "advice_en": "Tuberculosis strain contracted from raw cow milk or cattle. Complete full course of anti-TB DOTS treatment.",
        "advice_hi": "गाय के कच्चे दूध या मवेशियों से अनुबंधित टीबी स्ट्रेन। एंटी-टीबी डॉट्स उपचार का पूरा कोर्स पूरा करें।",
        "symptoms": ["livestock contact infection", "coughing up blood", "cough", "weight loss", "chest pain"]
    },
    "Anthrax Cutaneous": {
        "severity": "P1", "specialty": "Dermatologist",
        "advice_en": "Infection from livestock/wool spores. Painless ulcer turns black. Seek immediate Ciprofloxacin therapy.",
        "advice_hi": "मवेशियों/ऊन के बीजाणुओं से संक्रमण। दर्द रहित अल्सर काला हो जाता है। तुरंत सिप्रोफ्लोक्सासिन थेरेपी लें।",
        "symptoms": ["livestock contact infection", "severe skin ulcers", "high fever", "weakness"]
    },
    "Rotavirus Gastroenteritis": {
        "severity": "P1", "specialty": "Pediatrician",
        "advice_en": "Severe childhood diarrhea. Give ORS and Zinc solution instantly. Keep child hydrated, see pediatrician.",
        "advice_hi": "बच्चों में गंभीर दस्त। तुरंत ओआरएस और जिंक का घोल दें। बच्चे को हाइड्रेटेड रखें, बाल रोग विशेषज्ञ को दिखाएं।",
        "symptoms": ["childhood severe diarrhea", "vomiting", "dehydration", "weakness", "high fever"]
    },
    "Dracunculiasis": {
        "severity": "P3", "specialty": "General Physician",
        "advice_en": "Neglected water-borne worm complication. Filter drinking water with fine mesh clean cloth.",
        "advice_hi": "उपेक्षित जल-जनित कृमि जटिलता। पीने के पानी को बारीक साफ कपड़े से छान लें।",
        "symptoms": ["fluid blisters", "severe skin ulcers", "body ache"]
    },
    "Nutritional Anemia": {
        "severity": "P3", "specialty": "General Physician",
        "advice_en": "Severe iron intake deficiency. Take iron-folic acid tablets. Eat green vegetables and jaggery.",
        "advice_hi": "गंभीर आयरन की कमी। आयरन-फोलिक एसिड की गोलियां लें। हरी सब्जियां और गुड़ खाएं।",
        "symptoms": ["severe anemia", "weakness", "headache", "yellow skin"]
    },
    "Amoebic Liver Abscess": {
        "severity": "P2", "specialty": "Gastroenterologist",
        "advice_en": "Protozoan water infection causing liver pocket pain. Avoid untreated rural water. Seek Metronidazole.",
        "advice_hi": "प्रोटोजोअन जल संक्रमण जिससे लीवर में दर्द होता है। अनुपचारित ग्रामीण पानी से बचें। मेट्रोनिडाजोल लें।",
        "symptoms": ["liver abscess pain", "high fever", "nausea", "vomiting", "stomach pain"]
    },
    "HFMD Childhood": {
        "severity": "P3", "specialty": "Pediatrician",
        "advice_en": "Highly contagious viral rash in kids. Keep child isolated, give soft fluids, wash toys with soap.",
        "advice_hi": "बच्चों में अत्यधिक संक्रामक वायरल रैश। बच्चे को अलग रखें, हल्का तरल पदार्थ दें, खिलौनों को साबुन से धोएं।",
        "symptoms": ["childhood severe diarrhea", "fluid blisters", "skin rash", "sore throat", "high fever"]
    },
    "Valley Fever": {
        "severity": "P3", "specialty": "Pulmonologist",
        "advice_en": "Fungal spore infection from dry soil/dust inhalation. Rest well, seek antifungal if symptoms worsen.",
        "advice_hi": "सूखी मिट्टी/धूल के सांस में जाने से फंगल संक्रमण। अच्छी तरह आराम करें, लक्षण बिगड़ने पर एंटीफंगल लें।",
        "symptoms": ["dry cough with dust exposure", "high fever", "chest pain", "body ache"]
    },
    "Toxoplasmosis": {
        "severity": "P3", "specialty": "General Physician",
        "advice_en": "Parasitic infection from animal feces contact. Avoid direct handling of pet waste without gloves.",
        "advice_hi": "जानवरों के मल के संपर्क से परजीवी संक्रमण। बिना ग्लव्स के पालतू जानवरों के कचरे को सीधे संभालने से बचें।",
        "symptoms": ["livestock contact infection", "headache", "body ache", "high fever"]
    },
    "Shigellosis": {
        "severity": "P2", "specialty": "General Physician",
        "advice_en": "Bacterial water-borne dysentery. Avoid open source water. Give ORS. Seek antibiotic treatment.",
        "advice_hi": "बैक्टीरियल जल-जनित पेचिश। खुले स्रोत के पानी से बचें। ओआरएस दें। एंटीबायोटिक उपचार लें।",
        "symptoms": ["childhood severe diarrhea", "stomach pain", "vomiting", "nausea"]
    },
    "Listeriosis": {
        "severity": "P2", "specialty": "General Physician",
        "advice_en": "Infection from contaminated food. Extremely hazardous for pregnant women. Eat freshly cooked hot food.",
        "advice_hi": "दूषित भोजन से संक्रमण। गर्भवती महिलाओं के लिए बेहद खतरनाक। ताजा पका हुआ गर्म भोजन खाएं।",
        "symptoms": ["stomach pain", "high fever", "vomiting", "nausea", "body ache"]
    },
    "Murine Typhus": {
        "severity": "P2", "specialty": "General Physician",
        "advice_en": "Flea-borne bacterial infection. Maintain rodent control in rural warehouses. Complete Doxycycline course.",
        "advice_hi": "पिसू जनित जीवाणु संक्रमण। ग्रामीण गोदामों में कृंतक नियंत्रण बनाए रखें। डॉक्सीसाइक्लिन कोर्स पूरा करें।",
        "symptoms": ["rat contact fever", "flea bite", "high fever", "headache", "skin rash", "body ache", "chills"]
    },
    "Skeletal Fluorosis": {
        "severity": "P3", "specialty": "Orthopedic",
        "advice_en": "Bone damage from excessive fluoride in groundwater. Use defluoridated clean drinking water.",
        "advice_hi": "भूजल में अत्यधिक फ्लोराइड से हड्डियों को नुकसान। फ्लोराइड रहित साफ पीने के पानी का प्रयोग करें।",
        "symptoms": ["bone pain due to water fluorosis", "joint pain", "stiff neck", "weakness"]
    },
    "Arsenicosis Chronic": {
        "severity": "P2", "specialty": "Dermatologist",
        "advice_en": "Arsenic poisoning from deep tube wells. Drink only surface treated water. Check skin spots with dermatologist.",
        "advice_hi": "गहरे ट्यूबवेल से आर्सेनिक विषाक्तता। केवल सतही उपचारित पानी पिएं। त्वचा के धब्बों की त्वचा रोग विशेषज्ञ से जांच कराएं।",
        "symptoms": ["skin lesions from arsenic", "severe skin ulcers", "weakness"]
    },
    "Blackfoot Disease": {
        "severity": "P1", "specialty": "Cardiologist",
        "advice_en": "Severe peripheral vascular block from chronic arsenic. Immediately switch to arsenic-free clean water.",
        "advice_hi": "क्रोनिक आर्सेनिक से गंभीर परिधीय संवहनी ब्लॉक। तुरंत आर्सेनिक मुक्त साफ पानी अपनाएं।",
        "symptoms": ["skin lesions from arsenic", "severe leg swelling", "body ache"]
    },
    "Ancylostomiasis": {
        "severity": "P3", "specialty": "General Physician",
        "advice_en": "Soil worm invasion. Do not walk barefoot on rural muddy farms. Deworm with Albendazole.",
        "advice_hi": "मिट्टी के कीड़ों का आक्रमण। ग्रामीण कीचड़ भरे खेतों में नंगे पैर न चलें। एल्बेंडाजोल से डीवर्मिंग करें।",
        "symptoms": ["stomach worms", "severe anemia", "stomach pain", "nausea"]
    },
    "Fatty Liver NAFLD": {
        "severity": "P3", "specialty": "Gastroenterologist",
        "advice_en": "Lifestyle-induced liver fat accumulation. Reduce fast food/sugar intake, exercise daily.",
        "advice_hi": "जीवनशैली के कारण लीवर में वसा का संचय। फास्ट फूड/चीनी का सेवन कम करें, रोजाना व्यायाम करें।",
        "symptoms": ["stomach pain", "weakness", "nausea"]
    },
    "Chronic Kidney Disease": {
        "severity": "P2", "specialty": "Urologist",
        "advice_en": "Gradual kidney function loss. Avoid excessive painkillers. Monitor blood pressure and creatinine levels.",
        "advice_hi": "धीरे-धीरे गुर्दे की कार्यप्रणाली का नुकसान। अत्यधिक दर्द निवारक दवाओं से बचें। रक्तचाप और क्रिएटिनिन स्तर की निगरानी करें।",
        "symptoms": ["severe leg swelling", "dark urine", "weakness", "headache", "nausea"]
    },
    "Gout": {
        "severity": "P3", "specialty": "Orthopedic",
        "advice_en": "Uric acid accumulation in joint. Avoid red meat, alcohol, high-purine foods. Drink plenty of water.",
        "advice_hi": "जोड़ों में यूरिक एसिड का जमा होना। रेड मीट, शराब, उच्च प्यूरीन वाले खाद्य पदार्थों से बचें। खूब पानी पिएं।",
        "symptoms": ["painful big toe", "joint pain", "severe itching"]
    },
    "Hyperthyroidism": {
        "severity": "P3", "specialty": "Endocrinologist",
        "advice_en": "Overactive thyroid gland. Consult endocrinologist for thyroid panel test and beta-blocker treatment.",
        "advice_hi": "अतिसक्रिय थायराइड ग्रंथि। थायराइड पैनल परीक्षण और बीटा-ब्लॉकर उपचार के लिए एंडोक्रिनोलॉजिस्ट से मिलें।",
        "symptoms": ["rapid heart rate and weight loss", "sweating", "shivering", "weakness"]
    },
    "Hypothyroidism": {
        "severity": "P3", "specialty": "Endocrinologist",
        "advice_en": "Underactive thyroid gland. Daily early morning empty stomach Levothyroxine pill is required.",
        "advice_hi": "कम सक्रिय थायराइड ग्रंथि। रोजाना सुबह खाली पेट लेवोथायरोक्सिन की गोली लेना आवश्यक है।",
        "symptoms": ["cold intolerance and fatigue", "weight loss", "weakness", "body ache"]
    },
    "Cholelithiasis": {
        "severity": "P2", "specialty": "Gastroenterologist",
        "advice_en": "Gallstones block. Avoid deep-fried heavy fats. Seek ultrasound diagnostic check.",
        "advice_hi": "पित्त पथरी ब्लॉक। गहरे तले हुए भारी वसा से बचें। अल्ट्रासाउंड डायग्नोस्टिक जांच कराएं।",
        "symptoms": ["right upper abdominal pain", "stomach pain", "nausea", "vomiting"]
    },
    "Panic Disorder": {
        "severity": "P3", "specialty": "Neurologist",
        "advice_en": "Sudden severe anxiety surge. Practice deep breathing exercises, consult mental health counselor.",
        "advice_hi": "अचानक गंभीर घबराहट होना। गहरी सांस लेने का अभ्यास करें, मानसिक स्वास्थ्य परामर्शदाता से सलाह लें।",
        "symptoms": ["palpitations and sudden dread", "sweating", "breathing difficulty", "headache"]
    },
    "Depression Clinical": {
        "severity": "P3", "specialty": "Neurologist",
        "advice_en": "Persistent chemical mood disorder. Reach out to loved ones, consult psychiatrist for safe therapy.",
        "advice_hi": "लगातार रासायनिक मूड विकार। अपनों से संपर्क करें, सुरक्षित थेरेपी के लिए मनोचिकित्सक से सलाह लें।",
        "symptoms": ["persistent low mood", "weakness", "body ache", "headache"]
    },
    "Cervical Spondylosis": {
        "severity": "P4", "specialty": "Orthopedic",
        "advice_en": "Urban desk strain. Maintain ergonomic computer screen height, practice gentle neck movements.",
        "advice_hi": "शहरी डेस्क वर्क का खिंचाव। कंप्यूटर स्क्रीन की सही ऊंचाई बनाए रखें, गर्दन के हल्के व्यायाम करें।",
        "symptoms": ["neck and shoulder stiffness", "headache", "body ache"]
    },
    "Sciatica Lumbar": {
        "severity": "P3", "specialty": "Orthopedic",
        "advice_en": "Punched nerve in lower back. Avoid lifting heavy weights, sit on firm orthopedic chairs.",
        "advice_hi": "पीठ के निचले हिस्से में दबी हुई नस। भारी वजन उठाने से बचें, आर्थोपेडिक कुर्सियों पर बैठें।",
        "symptoms": ["lower back shooting pain", "body ache", "weakness"]
    },
    "Osteoporosis": {
        "severity": "P3", "specialty": "Orthopedic",
        "advice_en": "Weak fragile bones. Take calcium and vitamin D supplements. Prevent home slip and falls.",
        "advice_hi": "कमजोर नाजुक हड्डियां। कैल्शियम और विटामिन डी सप्लीमेंट लें। घर में फिसलने और गिरने से बचें।",
        "symptoms": ["joint pain", "body ache", "weakness"]
    },
    "IBS Stress": {
        "severity": "P4", "specialty": "Gastroenterologist",
        "advice_en": "Stress-related gut hyper-reactivity. Eat high-fiber foods, avoid carbonated drinks.",
        "advice_hi": "तनाव से संबंधित पेट की संवेदनशीलता। उच्च फाइबर वाले खाद्य पदार्थ खाएं, कार्बोनेटेड पेय पदार्थों से बचें।",
        "symptoms": ["stomach pain", "diarrhea", "constipation", "nausea"]
    },
    "Allergic Rhinitis": {
        "severity": "P4", "specialty": "ENT Specialist",
        "advice_en": "Dust and pollen urban allergy trigger. Use saline nasal spray, avoid high pollution areas.",
        "advice_hi": "धूल और पराग से होने वाली शहरी एलर्जी। खारे पानी के नेज़ल स्प्रे का प्रयोग करें, अत्यधिक प्रदूषण वाले क्षेत्रों से बचें।",
        "symptoms": ["sore throat", "cough", "headache", "eye redness"]
    },
    "Psoriatic Arthritis": {
        "severity": "P3", "specialty": "Orthopedic",
        "advice_en": "Inflammatory psoriasis progression. Seek early rheumatology intervention to save joints.",
        "advice_hi": "सूजन संबंधी सोरायसिस का बढ़ना। जोड़ों को सुरक्षित रखने के लिए समय पर रूमेटोलॉजी जांच कराएं।",
        "symptoms": ["skin rash", "severe itching", "joint pain", "body ache"]
    },
    "Chronic Fatigue Syndrome": {
        "severity": "P3", "specialty": "General Physician",
        "advice_en": "Prolonged persistent exhaustion. Pace your activities, maintain regular sleep routine, avoid fatigue triggers.",
        "advice_hi": "लंबे समय तक बनी रहने वाली थकान। अपनी गतिविधियों की गति तय करें, नियमित नींद की दिनचर्या बनाए रखें।",
        "symptoms": ["unexplained persistent exhaustion", "weakness", "body ache", "headache"]
    },
    "Deep Vein Thrombosis": {
        "severity": "P1", "specialty": "Cardiologist",
        "advice_en": "Limb blood clot hazard. Move leg frequently during long sedentary hours. Visit ER for ultrasound immediately.",
        "advice_hi": "पैर में खून का थक्का जमने का खतरा। लंबे समय तक बैठने के दौरान पैर हिलाते रहें। तुरंत अल्ट्रासाउंड के लिए आपातकालीन कक्ष जाएं।",
        "symptoms": ["long sitting swollen leg", "severe leg swelling", "body ache", "weakness"]
    },
    "Acid Esophagitis": {
        "severity": "P4", "specialty": "Gastroenterologist",
        "advice_en": "Severe acid reflux tissue irritation. Take empty stomach antacid, do not sleep after meals.",
        "advice_hi": "गंभीर एसिड रिफ्लक्स से होने वाली जलन। खाली पेट एंटासिड लें, भोजन के तुरंत बाद न सोएं।",
        "symptoms": ["urban severe heartburn", "chest pain", "stomach pain", "nausea"]
    },
    "Dry Eye Syndrome": {
        "severity": "P4", "specialty": "Ophthalmologist",
        "advice_en": "Urban screen strain dry eye. Apply lubricating eye drops, follow the 20-20-20 visual rest rule.",
        "advice_hi": "शहरी स्क्रीन वर्क से सूखी आंखें। लुब्रिकेटिंग आई ड्रॉप्स डालें, 20-20-20 विजुअल रेस्ट नियम का पालन करें।",
        "symptoms": ["urban screen eye fatigue", "eye redness", "severe itching", "headache"]
    },
    "Carpal Tunnel Syndrome": {
        "severity": "P4", "specialty": "Orthopedic",
        "advice_en": "Office desk wrist nerve pressure. Wear wrist splint support, stretch fingers regularly.",
        "advice_hi": "कलाई की नस पर दबाव। रिस्ट स्प्लिंट सपोर्ट पहनें, नियमित रूप से उंगलियों को स्ट्रेच करें।",
        "symptoms": ["wrist pain typing", "body ache", "weakness"]
    },
    "Insomnia Urban": {
        "severity": "P4", "specialty": "Neurologist",
        "advice_en": "Stress sleep onset block. Keep smartphone screen away 1 hour before bedtime, dim room lights.",
        "advice_hi": "तनाव के कारण नींद न आना। सोने से 1 घंटे पहले स्मार्टफोन दूर रखें, कमरे की लाइटें धीमी करें।",
        "symptoms": ["urban stress sleep disorder", "headache", "weakness", "confusion"]
    },
    "PCOS Hormonal": {
        "severity": "P3", "specialty": "Gynecologist",
        "advice_en": "Hormonal insulin-resistant urban profile. Maintain low carb diet, consult gynecologist for cycle control.",
        "advice_hi": "हार्मोनल इंसुलिन-प्रतिरोधी शहरी प्रोफाइल। कम कार्ब वाला आहार लें, स्त्री रोग विशेषज्ञ से सलाह लें।",
        "symptoms": ["hormonal imbalance women", "weight loss", "skin rash", "weakness"]
    },
    "Stroke TIA": {
        "severity": "P1", "specialty": "Emergency Care",
        "advice_en": "CRITICAL EMERGENCY STROKE risk. Act F.A.S.T. (Face drooping, Arm weakness, Speech slurred). Go to ER immediately.",
        "advice_hi": "अत्यधिक आपातकालीन स्ट्रोक का खतरा। तुरंत कार्रवाई करें। आपातकालीन कक्ष में तुरंत डॉक्टर से मिलें।",
        "symptoms": ["sudden numbness slurred speech", "confusion", "headache", "weakness", "breathing difficulty"]
    },
    "Glaucoma Gradual": {
        "severity": "P2", "specialty": "Ophthalmologist",
        "advice_en": "Silent sight stealer. Check intraocular pressure at ophthalmology clinic. Use prescribed drops daily.",
        "advice_hi": "शांत दृष्टि चोर। नेत्र रोग क्लिनिक में आंखों के दबाव की जांच कराएं। निर्धारित ड्रॉप्स का रोज प्रयोग करें।",
        "symptoms": ["gradual vision loss", "headache", "eye pain", "nausea"]
    },
    "B12 Deficiency Anemia": {
        "severity": "P3", "specialty": "General Physician",
        "advice_en": "Common vegetarian nutritional threat. Supplement Methylcobalamin B12 daily. Consume milk, yogurt, paneer.",
        "advice_hi": "सामान्य शाकाहारी पोषण संबंधी खतरा। रोजाना मिथाइलकोबालामिन B12 सप्लीमेंट लें। दूध, दही, पनीर का सेवन करें।",
        "symptoms": ["vegetarian diet numbness", "weakness", "yellow skin", "headache", "confusion"]
    },
    "Vitamin D Deficiency Pain": {
        "severity": "P3", "specialty": "General Physician",
        "advice_en": "Lack of sunlight body bone pain. Take weekly Cholecalciferol (60k IU) for 8 weeks under guidance.",
        "advice_hi": "धूप की कमी से हड्डियों में दर्द। चिकित्सक के मार्गदर्शन में 8 सप्ताह तक साप्ताहिक कोलेकैल्सीफेरोल लें।",
        "symptoms": ["lack of sunlight body pain", "body ache", "joint pain", "weakness"]
    }
}

# ── Dynamic Disease Metadata Builder ──
# Compile the metadata array dynamically for all 101 diseases in all 7 languages using the symptom lexicon
DISEASE_METADATA = {}
for disease, info in DISEASE_ENGLISH_POOLS.items():
    symptoms_dict = {
        "en": info["symptoms"]
    }
    # Translate symptoms into the 6 other languages
    for lang in ["hi", "hinglish", "ta", "te", "mr", "bn"]:
        lang_symptoms = []
        for symp in info["symptoms"]:
            if symp in SYMPTOM_LEXICON:
                lang_symptoms.append(SYMPTOM_LEXICON[symp][lang])
            else:
                # Fallback to English term if not translated
                lang_symptoms.append(symp)
        symptoms_dict[lang] = lang_symptoms
        
    DISEASE_METADATA[disease] = {
        "severity": info["severity"],
        "specialty": info["specialty"],
        "advice_en": info["advice_en"],
        "advice_hi": info["advice_hi"],
        "symptoms": symptoms_dict
    }

# ── Templates to generate natural multilingual symptom descriptions ──
TEMPLATES = {
    "en": [
        "I am having {symptoms}.",
        "Suffering from {symptoms} for the past few days.",
        "The patient is experiencing {symptoms}.",
        "I feel extremely sick with {symptoms} and weakness.",
        "Experiencing {symptoms} and severe fatigue.",
        "Facing issues like {symptoms}.",
        "Since yesterday I have {symptoms}.",
        "Please help, I have {symptoms}.",
        "Showing signs of {symptoms}.",
        "Suffering from severe {symptoms}."
    ],
    "hi": [
        "मुझे {symptoms} की समस्या हो रही है।",
        "मरीज को कुछ दिनों से {symptoms} की शिकायत है।",
        "मैं {symptoms} से बहुत परेशान हूँ।",
        "शरीर में {symptoms} है और बहुत कमजोरी महसूस हो रही है।",
        "कल रात से {symptoms} महसूस हो रहा है।",
        "कृपया मदद करें, मरीज को {symptoms} है।",
        "{symptoms} की वजह से हालत खराब है।",
        "मरीज में {symptoms} के लक्षण दिख रहे हैं।",
        "{symptoms} और थकावट बहुत ज्यादा है।",
        "कई दिनों से {symptoms} हो रहा है।"
    ],
    "hinglish": [
        "mujhe {symptoms} ho raha hai",
        "patient ko {symptoms} hai aur bahut kamzori lag rahi hai",
        "kuch dino se {symptoms} ki shikayat hai sir",
        "body me {symptoms} hai aur thakaan lag rahi hai",
        "sar, kal se {symptoms} ho raha hai",
        "mujhe {symptoms} hai please medicine bataye",
        "kamzori ke sath {symptoms} ho raha hai",
        "mere ghar me kisi ko {symptoms} hai",
        "body me bahut weak lag raha hai aur {symptoms} hai",
        "kuch dino se {symptoms} lag raha hai"
    ],
    "ta": [
        "எனக்கு {symptoms} இருக்கிறது.",
        "நோயாளிக்கு சில நாட்களாக {symptoms} உள்ளது.",
        "நான் {symptoms} காரணமாக மிகவும் சிரமப்படுகிறேன்.",
        "உடலில் {symptoms} மற்றும் கடுமையான பலவீனம் உள்ளது.",
        "நேற்று முதல் {symptoms} இருக்கிறது.",
        "தயவுசெய்து உதவவும், நோயாளிக்கு {symptoms} உள்ளது.",
        "{symptoms} காரணமாக உடல் நலம் சரியில்லை.",
        "நோயாளிக்கு {symptoms} அறிகுறிகள் உள்ளன."
    ],
    "te": [
        "నాకు {symptoms} గా ఉంది.",
        "రోగి కొన్ని రోజులుగా {symptoms} తో బాధపడుతున్నాడు.",
        "నేను {symptoms} తో చాలా ఇబ్బంది పడుతున్నాను.",
        "శరీరంలో {symptoms} మరియు తీవ్రమైన బలహీనత ఉంది.",
        "నిన్నటి నుండి {symptoms} ఉంది.",
        "దయచేసి సహాయం చేయండి, రోగికి {symptoms} ఉంది.",
        "{symptoms} వల్ల ఆరోగ్యం బాగోలేదు.",
        "రోగికి {symptoms} లక్షణాలు ఉన్నాయి."
    ],
    "mr": [
        "मला {symptoms} चा त्रास होत आहे.",
        "रुग्णाला काही दिवसांपासून {symptoms} ची तक्रार आहे.",
        "मी {symptoms} मुळे खूप त्रस्त आहे.",
        "शरीरात {symptoms} आहे आणि खूप अशक्तपणा जाणवत आहे.",
        "काल रात्रीपासून {symptoms} जाणवत आहे.",
        "कृपया मदत करा, रुग्णाला {symptoms} आहे.",
        "{symptoms} मुळे तब्येत खूप खराब आहे.",
        "रुग्णामध्ये {symptoms} ची लक्षणे दिसत आहेत."
    ],
    "bn": [
        "আমার {symptoms} হচ্ছে।",
        "রোগী কিছুদিন ধরে {symptoms} এ ভুগছেন।",
        "আমি {symptoms} এর জন্য খুব সমস্যায় পড়েছি।",
        "শরীরে {symptoms} এবং খুব দুর্বলতা অনুভব করছি।",
        "গতকাল রাত থেকে {symptoms} অনুভব হচ্ছে।",
        "দয়া করে সাহায্য করুন, রোগীর {symptoms} আছে।",
        "{symptoms} এর জন্য অবস্থা খুব খারাপ।",
        "রোগীর মধ্যে {symptoms} এর উপসর্গ দেখা যাচ্ছে।"
    ]
}

def generate_sample(disease, lang):
    meta = DISEASE_METADATA[disease]
    symptom_pool = meta["symptoms"][lang]
    
    # Pick 2-4 symptoms randomly from the pool
    num_symptoms = min(len(symptom_pool), random.randint(2, 4))
    chosen_symptoms = random.sample(symptom_pool, num_symptoms)
    
    # Format symptom list into a sentence-like string
    if lang in ["en", "hinglish"]:
        symptom_str = ", ".join(chosen_symptoms[:-1]) + " and " + chosen_symptoms[-1] if len(chosen_symptoms) > 1 else chosen_symptoms[0]
    elif lang in ["hi", "te", "mr", "bn"]:
        symptom_str = " और ".join(chosen_symptoms) if lang == "hi" else " మరియు ".join(chosen_symptoms) if lang == "te" else " आणि ".join(chosen_symptoms) if lang == "mr" else " এবং ".join(chosen_symptoms)
    else: # tamil
        symptom_str = " மற்றும் ".join(chosen_symptoms)
        
    template = random.choice(TEMPLATES[lang])
    return template.format(symptoms=symptom_str)

# Fix 3: Weak diseases (F1 < 0.45) get 700 samples, others get 500
# These 11 diseases had the lowest F1 scores and need more training data
WEAK_DISEASES_700 = {
    "Covid-19",         # F1=0.14 — added loss of smell/taste
    "Scrub Typhus",     # F1=0.21 — added eschar + mite bite mark
    "Asthma",           # F1=0.28 — added inhaler needed
    "Murine Typhus",    # F1=0.30 — added rat contact + flea bite
    "Chikungunya",      # F1=0.30 — added bilateral joint swelling
    "Appendicitis",     # F1=0.35 — added right lower abdominal pain
    "Pneumonia",        # F1=0.33 — added wet productive cough
    "Heatstroke",       # F1=0.39 — added collapsed in sun + hot dry skin
    "Malaria",          # F1=0.41 — added cyclic fever chills
    "Meningitis",       # F1=0.40 — added light sensitivity
    "Acute Respiratory Infection",  # F1=0.50 — added wet productive cough
    "Food Poisoning",   # F1=0.37 — added sudden food illness
}

def get_lang_distribution(disease: str) -> list:
    """Return language distribution: 700 samples for weak diseases, 500 for others."""
    if disease in WEAK_DISEASES_700:
        # 700 samples: 140 EN + 140 HI + 110 Hinglish + 110 TA + 70 TE + 65 MR + 65 BN = 700
        return (
            ["en"] * 140 +
            ["hi"] * 140 +
            ["hinglish"] * 110 +
            ["ta"] * 110 +
            ["te"] * 70 +
            ["mr"] * 65 +
            ["bn"] * 65
        )
    else:
        # Standard 500 samples distribution
        return (
            ["en"] * 100 +
            ["hi"] * 100 +
            ["hinglish"] * 75 +
            ["ta"] * 75 +
            ["te"] * 50 +
            ["mr"] * 50 +
            ["bn"] * 50
        )

def main():
    import pandas as pd
    rows = []
    
    print("[...] Starting programmatic multilingual dataset generation for 101 diseases in 7 languages...")
    print(f"[INFO] {len(WEAK_DISEASES_700)} weak diseases will get 700 samples; rest get 500.")
    for disease, meta in DISEASE_METADATA.items():
        languages_distribution = get_lang_distribution(disease)
        random.shuffle(languages_distribution)
        
        for lang in languages_distribution:
            symptoms_text = generate_sample(disease, lang)
            rows.append({
                "symptoms": symptoms_text,
                "disease": disease,
                "severity": meta["severity"],
                "doctor_specialty": meta["specialty"]
            })
            
    df = pd.DataFrame(rows)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    weak_count = df[df['disease'].isin(WEAK_DISEASES_700)]['disease'].value_counts()
    normal_count = df[~df['disease'].isin(WEAK_DISEASES_700)]['disease'].value_counts()
    print(f"[OK] Weak diseases ({len(WEAK_DISEASES_700)}): {weak_count.iloc[0]} samples each")
    print(f"[OK] Normal diseases ({len(normal_count)}): {normal_count.iloc[0]} samples each")
    print(f"[OK] Generated {len(df)} total samples across {df['disease'].nunique()} diseases in 7 languages.")
    
    export_path = os.path.join(os.path.dirname(__file__), "symptom_dataset.csv")
    df.to_csv(export_path, index=False, encoding='utf-8')
    print(f"[SAVED] {export_path}")

if __name__ == "__main__":
    main()
