const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'LanguageContext.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = 'export const translations = {';
const endMarker = 'export const LanguageProvider';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find translations object');
  process.exit(1);
}

let objStr = content.substring(startIndex + 'export const translations = '.length, endIndex).trim();
if (objStr.endsWith(';')) objStr = objStr.slice(0, -1);

const getTranslations = new Function('return ' + objStr);
let translations = getTranslations();

const newKeys = {
  en: {
    dashboardExt: {
      maternal_pulse: "Maternal Health",
      secure_axis: "Private & Secure",
      terminal_access: "Open Access",
      my_profile: "My Profile",
      profile_desc: "View your health ID, update your name and village.",
      open: "Open",
      skin_ai: "Skin AI Scanner",
      skin_ai_desc: "Check skin infections easily.",
      symptom_checker: "AI Symptom Checker",
      symptom_checker_desc: "Check your symptoms and get advice.",
      greeting: "Hello, how can we help you today?",
    },
    menstrual: {
      title: "Women's Health",
      safe_private: "Safe & Private",
      subtitle: "AI-powered health guidance, symptom checking, and free pad access - completely private and confidential.",
      emergency_help: "Emergency Help",
      ai_assistant: "AI Assistant",
      symptom_check: "Symptom Check",
      request_pads: "Request Pads",
      health_tips: "Health Tips",
      request_pads_title: "Request Sanitary Pads",
      request_pads_desc: "Your ASHA worker will deliver pads privately to your location. This request is completely confidential.",
      private_note: "100% Private — Only your assigned ASHA worker can see this request. No one else will know.",
      your_village: "Your Village / Area",
      village_placeholder: "e.g. Rampur, Sector 4",
      request_btn: "Request Pads from ASHA Worker",
      request_sent: "Request Sent!",
      request_sent_desc: "Your ASHA worker has been notified and will contact you shortly.",
      send_another: "Send Another Request",
      symptom_title: "Symptom Check",
      symptom_desc: "Select any symptoms you are currently experiencing. This is not a diagnosis - always consult a doctor for medical advice.",
      check_btn: "Check My Symptoms",
      tips_title: "Health Tips",
      tips_desc: "Simple, proven advice for your health and wellbeing during your period.",
      ask_anything: "Ask me anything about your health...",
      emergency_title: "Emergency Help",
      emergency_desc: "Press the button below to immediately alert your ASHA worker. She will call you and come to help.",
      alert_asha: "Alert My ASHA Worker Now",
      call_ambulance: "Call 108-Free Ambulance"
    },
    ambulance: {
      title: "Emergency Rescue",
      subtitle: "Need an ambulance or health responder? Click below. Your location is automatically shared.",
      request_team: "Request Emergency Team",
      non_critical: "Non-Critical Medical Transport",
      rescue_dispatched: "RESCUE DISPATCHED",
      call_driver: "Call Driver",
      dispatching: "Dispatching..."
    },
    symptom: {
      title: "AI Symptom Checker",
      subtitle: "Tell us how you feel. We will guide you on what to do next.",
      select_symptoms: "Select your symptoms:",
      check_now: "Check Now",
      fever: "Fever",
      cough: "Cough",
      chest_pain: "Chest Pain",
      breathing: "Breathing Difficulty",
      bleeding: "Bleeding",
      headache: "Headache",
      vomiting: "Vomiting",
      weakness: "Weakness",
      analyzing: "Analyzing...",
      go_hospital: "GO TO HOSPITAL NOW",
      see_doctor: "SEE A DOCTOR TODAY",
      mild: "MILD — Monitor at Home"
    }
  },
  hi: {
    dashboardExt: {
      maternal_pulse: "मातृत्व स्वास्थ्य",
      secure_axis: "सुरक्षित और निजी",
      terminal_access: "खोलें",
      my_profile: "मेरी प्रोफ़ाइल",
      profile_desc: "अपनी स्वास्थ्य आईडी देखें, नाम और गाँव अपडेट करें।",
      open: "खोलें",
      skin_ai: "स्किन एआई स्कैनर",
      skin_ai_desc: "त्वचा के संक्रमण की आसानी से जांच करें।",
      symptom_checker: "लक्षण जांचकर्ता",
      symptom_checker_desc: "अपने लक्षणों की जांच करें और सलाह लें।",
      greeting: "नमस्ते, आज हम आपकी कैसे मदद कर सकते हैं?",
    },
    menstrual: {
      title: "महिला स्वास्थ्य",
      safe_private: "सुरक्षित और निजी",
      subtitle: "एआई स्वास्थ्य मार्गदर्शन, लक्षण जांच और मुफ्त पैड - पूरी तरह से निजी।",
      emergency_help: "आपातकालीन मदद",
      ai_assistant: "एआई सहायक",
      symptom_check: "लक्षण जांच",
      request_pads: "पैड मांगें",
      health_tips: "स्वास्थ्य सुझाव",
      request_pads_title: "सेनेटरी पैड का अनुरोध करें",
      request_pads_desc: "आपकी आशा दीदी आपको निजी तौर पर पैड देंगी। यह अनुरोध पूरी तरह से गोपनीय है।",
      private_note: "100% निजी — केवल आपकी आशा दीदी ही यह अनुरोध देख सकती हैं।",
      your_village: "आपका गाँव / क्षेत्र",
      village_placeholder: "उदा. रामपुर, सेक्टर 4",
      request_btn: "आशा दीदी से पैड मांगें",
      request_sent: "अनुरोध भेजा गया!",
      request_sent_desc: "आपकी आशा दीदी को सूचित कर दिया गया है और वे जल्द ही आपसे संपर्क करेंगी।",
      send_another: "एक और अनुरोध भेजें",
      symptom_title: "लक्षण जांच",
      symptom_desc: "आप जो लक्षण महसूस कर रहे हैं, उन्हें चुनें। यह निदान नहीं है - हमेशा डॉक्टर से सलाह लें।",
      check_btn: "मेरे लक्षणों की जांच करें",
      tips_title: "स्वास्थ्य सुझाव",
      tips_desc: "आपके मासिक धर्म के दौरान स्वास्थ्य के लिए सरल और सिद्ध सलाह।",
      ask_anything: "अपने स्वास्थ्य के बारे में कुछ भी पूछें...",
      emergency_title: "आपातकालीन मदद",
      emergency_desc: "अपनी आशा दीदी को तुरंत अलर्ट करने के लिए नीचे दिए गए बटन को दबाएं। वे आपको कॉल करेंगी और मदद के लिए आएंगी।",
      alert_asha: "मेरी आशा दीदी को अभी अलर्ट करें",
      call_ambulance: "108-मुफ्त एम्बुलेंस कॉल करें"
    },
    ambulance: {
      title: "आपातकालीन बचाव",
      subtitle: "एम्बुलेंस या स्वास्थ्य कर्मी चाहिए? नीचे क्लिक करें। आपका स्थान स्वचालित रूप से साझा किया जाता है।",
      request_team: "आपातकालीन टीम बुलाएं",
      non_critical: "सामान्य चिकित्सा परिवहन",
      rescue_dispatched: "बचाव टीम भेजी गई",
      call_driver: "ड्राइवर को कॉल करें",
      dispatching: "भेजा जा रहा है..."
    },
    symptom: {
      title: "एआई लक्षण जांचकर्ता",
      subtitle: "हमें बताएं कि आप कैसा महसूस कर रहे हैं। हम आपको बताएंगे कि आगे क्या करना है।",
      select_symptoms: "अपने लक्षण चुनें:",
      check_now: "अभी जांचें",
      fever: "बुखार",
      cough: "खांसी",
      chest_pain: "सीने में दर्द",
      breathing: "सांस लेने में तकलीफ",
      bleeding: "खून आना",
      headache: "सिरदर्द",
      vomiting: "उल्टी",
      weakness: "कमजोरी",
      analyzing: "विश्लेषण कर रहा है...",
      go_hospital: "तुरंत अस्पताल जाएं",
      see_doctor: "आज ही डॉक्टर से मिलें",
      mild: "हल्का — घर पर आराम करें"
    }
  },
  mr: {
    dashboardExt: {
      maternal_pulse: "मातृत्व आरोग्य",
      secure_axis: "सुरक्षित आणि खाजगी",
      terminal_access: "उघडा",
      my_profile: "माझी प्रोफाईल",
      profile_desc: "तुमचा हेल्थ आयडी पहा, नाव आणि गाव अपडेट करा.",
      open: "उघडा",
      skin_ai: "त्वचा एआय स्कॅनर",
      skin_ai_desc: "त्वचेच्या संसर्गाची सहज तपासणी करा.",
      symptom_checker: "लक्षणे तपासक",
      symptom_checker_desc: "तुमची लक्षणे तपासा आणि सल्ला मिळवा.",
      greeting: "नमस्कार, आज आम्ही तुम्हाला कशी मदत करू शकतो?",
    },
    menstrual: {
      title: "महिला आरोग्य",
      safe_private: "सुरक्षित आणि खाजगी",
      subtitle: "एआय आरोग्य मार्गदर्शन, लक्षणे तपासणी आणि मोफत पॅड - पूर्णपणे खाजगी.",
      emergency_help: "आपत्कालीन मदत",
      ai_assistant: "एआय असिस्टंट",
      symptom_check: "लक्षणे तपासणी",
      request_pads: "पॅडची विनंती करा",
      health_tips: "आरोग्य टिप्स",
      request_pads_title: "सॅनिटरी पॅडची विनंती करा",
      request_pads_desc: "तुमच्या आशा ताई तुम्हाला खाजगीरित्या पॅड देतील. ही विनंती पूर्णपणे गोपनीय आहे.",
      private_note: "100% खाजगी — फक्त तुमच्या आशा ताई ही विनंती पाहू शकतात.",
      your_village: "तुमचे गाव / क्षेत्र",
      village_placeholder: "उदा. रामपूर, सेक्टर 4",
      request_btn: "आशा ताईंकडून पॅडची विनंती करा",
      request_sent: "विनंती पाठवली!",
      request_sent_desc: "तुमच्या आशा ताईंना सूचित केले आहे आणि त्या लवकरच तुमच्याशी संपर्क साधतील.",
      send_another: "आणखी एक विनंती पाठवा",
      symptom_title: "लक्षणे तपासणी",
      symptom_desc: "तुम्हाला जाणवणारी कोणतीही लक्षणे निवडा. हे निदान नाही - नेहमी डॉक्टरांचा सल्ला घ्या.",
      check_btn: "माझी लक्षणे तपासा",
      tips_title: "आरोग्य टिप्स",
      tips_desc: "मासिक पाळी दरम्यान तुमच्या आरोग्यासाठी सोपा आणि सिद्ध सल्ला.",
      ask_anything: "तुमच्या आरोग्याबद्दल काहीही विचारा...",
      emergency_title: "आपत्कालीन मदत",
      emergency_desc: "तुमच्या आशा ताईंना त्वरित सतर्क करण्यासाठी खालील बटण दाबा. त्या तुम्हाला कॉल करतील आणि मदतीला येतील.",
      alert_asha: "माझ्या आशा ताईंना आता सतर्क करा",
      call_ambulance: "108-मोफत रुग्णवाहिका कॉल करा"
    },
    ambulance: {
      title: "आपत्कालीन बचाव",
      subtitle: "रुग्णवाहिका किंवा आरोग्य कर्मचारी हवा आहे का? खाली क्लिक करा. तुमचे स्थान स्वयंचलितपणे सामायिक केले जाते.",
      request_team: "आपत्कालीन टीमची विनंती करा",
      non_critical: "सामान्य वैद्यकीय वाहतूक",
      rescue_dispatched: "बचाव टीम पाठवली",
      call_driver: "ड्रायव्हरला कॉल करा",
      dispatching: "पाठवत आहे..."
    },
    symptom: {
      title: "एआय लक्षणे तपासक",
      subtitle: "तुम्हाला कसे वाटत आहे ते आम्हाला सांगा. आम्ही तुम्हाला पुढे काय करायचे याचे मार्गदर्शन करू.",
      select_symptoms: "तुमची लक्षणे निवडा:",
      check_now: "आता तपासा",
      fever: "ताप",
      cough: "खोकला",
      chest_pain: "छातीत दुखणे",
      breathing: "श्वास घेण्यास त्रास",
      bleeding: "रक्तस्त्राव",
      headache: "डोकेदुखी",
      vomiting: "उलट्या",
      weakness: "अशक्तपणा",
      analyzing: "विश्लेषण करत आहे...",
      go_hospital: "तात्काळ रुग्णालयात जा",
      see_doctor: "आजच डॉक्टरांना भेटा",
      mild: "सौम्य — घरी विश्रांती घ्या"
    }
  },
  ta: {
    dashboardExt: {
      maternal_pulse: "தாய்மை நலம்",
      secure_axis: "பாதுகாப்பானது",
      terminal_access: "திறக்க",
      my_profile: "என் சுயவிவரம்",
      profile_desc: "உங்கள் சுகாதார ஐடியைப் பார்க்கவும், பெயரைப் புதுப்பிக்கவும்.",
      open: "திறக்க",
      skin_ai: "சரும AI ஸ்கேனர்",
      skin_ai_desc: "சருமத் தொற்றுகளை எளிதாகப் பரிசோதிக்கவும்.",
      symptom_checker: "அறிகுறி பரிசோதகர்",
      symptom_checker_desc: "உங்கள் அறிகுறிகளைப் பரிசோதித்து ஆலோசனை பெறவும்.",
      greeting: "வணக்கம், நாங்கள் உங்களுக்கு எவ்வாறு உதவ முடியும்?",
    },
    menstrual: {
      title: "பெண்கள் நலம்",
      safe_private: "பாதுகாப்பானது",
      subtitle: "AI சுகாதார வழிகாட்டுதல், அறிகுறி பரிசோதனை மற்றும் இலவச பேட் - முற்றிலும் தனிப்பட்டது.",
      emergency_help: "அவசர உதவி",
      ai_assistant: "AI உதவியாளர்",
      symptom_check: "அறிகுறி பரிசோதனை",
      request_pads: "பேட் கோரிக்கை",
      health_tips: "சுகாதார குறிப்புகள்",
      request_pads_title: "சானிட்டரி பேட் கோரிக்கை",
      request_pads_desc: "உங்கள் ஆஷா பணியாளர் உங்களுக்கு பேட்களை வழங்குவார். இந்த கோரிக்கை முற்றிலும் ரகசியமானது.",
      private_note: "100% தனிப்பட்டது — உங்கள் ஆஷா பணியாளர் மட்டுமே இந்த கோரிக்கையை காண முடியும்.",
      your_village: "உங்கள் கிராமம் / பகுதி",
      village_placeholder: "எ.கா. ராம்பூர், செக்டார் 4",
      request_btn: "ஆஷா பணியாளரிடம் பேட் கோரிக்கை",
      request_sent: "கோரிக்கை அனுப்பப்பட்டது!",
      request_sent_desc: "உங்கள் ஆஷா பணியாளருக்கு தெரிவிக்கப்பட்டுள்ளது, அவர் விரைவில் உங்களை தொடர்புகொள்வார்.",
      send_another: "மற்றொரு கோரிக்கையை அனுப்பவும்",
      symptom_title: "அறிகுறி பரிசோதனை",
      symptom_desc: "நீங்கள் உணரும் எந்த அறிகுறிகளையும் தேர்ந்தெடுக்கவும். இது ஒரு நோய் கண்டறிதல் அல்ல - எப்போதும் மருத்துவரை அணுகவும்.",
      check_btn: "என் அறிகுறிகளைப் பரிசோதிக்கவும்",
      tips_title: "சுகாதார குறிப்புகள்",
      tips_desc: "உங்கள் மாதவிடாய் காலத்தில் உங்கள் ஆரோக்கியத்திற்கான எளிய ஆலோசனைகள்.",
      ask_anything: "உங்கள் ஆரோக்கியம் குறித்து எதையும் கேளுங்கள்...",
      emergency_title: "அவசர உதவி",
      emergency_desc: "உங்கள் ஆஷா பணியாளரை உடனடியாக எச்சரிக்க கீழே உள்ள பட்டனை அழுத்தவும். அவர் உங்களை அழைத்து உதவ வருவார்.",
      alert_asha: "என் ஆஷா பணியாளரை இப்போது எச்சரிக்கவும்",
      call_ambulance: "108-இலவச ஆம்புலன்ஸை அழைக்கவும்"
    },
    ambulance: {
      title: "அவசர மீட்பு",
      subtitle: "ஆம்புலன்ஸ் அல்லது சுகாதார பணியாளர் தேவையா? கீழே கிளிக் செய்யவும். உங்கள் இருப்பிடம் தானாகவே பகிரப்படும்.",
      request_team: "அவசர குழுவை அழைக்கவும்",
      non_critical: "சாதாரண மருத்துவ போக்குவரத்து",
      rescue_dispatched: "மீட்பு குழு அனுப்பப்பட்டது",
      call_driver: "ஓட்டுநரை அழைக்கவும்",
      dispatching: "அனுப்புகிறது..."
    },
    symptom: {
      title: "AI அறிகுறி பரிசோதகர்",
      subtitle: "நீங்கள் எப்படி உணருகிறீர்கள் என்பதை எங்களிடம் கூறுங்கள். அடுத்து என்ன செய்ய வேண்டும் என்பதை நாங்கள் உங்களுக்கு வழிகாட்டுவோம்.",
      select_symptoms: "உங்கள் அறிகுறிகளைத் தேர்ந்தெடுக்கவும்:",
      check_now: "இப்போது சரிபார்க்கவும்",
      fever: "காய்ச்சல்",
      cough: "இருமல்",
      chest_pain: "நெஞ்சு வலி",
      breathing: "சுவாசிப்பதில் சிரமம்",
      bleeding: "இரத்தப்போக்கு",
      headache: "தலைவலி",
      vomiting: "வாந்தி",
      weakness: "சோர்வு",
      analyzing: "பகுப்பாய்வு...",
      go_hospital: "உடனடியாக மருத்துவமனைக்குச் செல்லவும்",
      see_doctor: "இன்றே மருத்துவரைப் பார்க்கவும்",
      mild: "லேசானது — வீட்டில் ஓய்வெடுக்கவும்"
    }
  },
  te: {
    dashboardExt: {
      maternal_pulse: "మాతృ ఆరోగ్యం",
      secure_axis: "సురక్షితమైనది",
      terminal_access: "తెరవండి",
      my_profile: "నా ప్రొఫైల్",
      profile_desc: "మీ హెల్త్ ఐడీని చూడండి, పేరును అప్‌డేట్ చేయండి.",
      open: "తెరవండి",
      skin_ai: "స్కిన్ AI స్కానర్",
      skin_ai_desc: "చర్మ ఇన్ఫెక్షన్లను సులభంగా తనిఖీ చేయండి.",
      symptom_checker: "సింప్టమ్ చెకర్",
      symptom_checker_desc: "మీ లక్షణాలను తనిఖీ చేసి సలహా పొందండి.",
      greeting: "నమస్కారం, మేము మీకు ఎలా సహాయపడగలము?",
    },
    menstrual: {
      title: "మహిళల ఆరోగ్యం",
      safe_private: "సురక్షితమైనది",
      subtitle: "AI ఆరోగ్య మార్గదర్శకత్వం, లక్షణాల తనిఖీ మరియు ఉచిత ప్యాడ్ - పూర్తిగా ప్రైవేట్.",
      emergency_help: "అత్యవసర సహాయం",
      ai_assistant: "AI అసిస్టెంట్",
      symptom_check: "లక్షణాల తనిఖీ",
      request_pads: "ప్యాడ్స్ అభ్యర్థన",
      health_tips: "ఆరోగ్య చిట్కాలు",
      request_pads_title: "శానిటరీ ప్యాడ్స్ అభ్యర్థించండి",
      request_pads_desc: "మీ ఆశా వర్కర్ మీకు ప్యాడ్స్ అందిస్తారు. ఈ అభ్యర్థన పూర్తిగా గోప్యమైనది.",
      private_note: "100% ప్రైవేట్ — మీ ఆశా వర్కర్ మాత్రమే ఈ అభ్యర్థనను చూడగలరు.",
      your_village: "మీ గ్రామం / ప్రాంతం",
      village_placeholder: "ఉదా. రాంపూర్, సెక్టార్ 4",
      request_btn: "ఆశా వర్కర్ నుండి ప్యాడ్స్ అభ్యర్థించండి",
      request_sent: "అభ్యర్థన పంపబడింది!",
      request_sent_desc: "మీ ఆశా వర్కర్‌కు తెలియజేయబడింది, వారు త్వరలో మిమ్మల్ని సంప్రదిస్తారు.",
      send_another: "మరొక అభ్యర్థనను పంపండి",
      symptom_title: "లక్షణాల తనిఖీ",
      symptom_desc: "మీకు ఉన్న ఏవైనా లక్షణాలను ఎంచుకోండి. ఇది రోగ నిర్ధారణ కాదు - ఎల్లప్పుడూ వైద్యుడిని సంప్రదించండి.",
      check_btn: "నా లక్షణాలను తనిఖీ చేయండి",
      tips_title: "ఆరోగ్య చిట్కాలు",
      tips_desc: "మీ పీరియడ్స్ సమయంలో మీ ఆరోగ్యానికి సులభమైన మరియు నిరూపితమైన సలహా.",
      ask_anything: "మీ ఆరోగ్యం గురించి ఏదైనా అడగండి...",
      emergency_title: "అత్యవసర సహాయం",
      emergency_desc: "మీ ఆశా వర్కర్‌ను వెంటనే అప్రమత్తం చేయడానికి క్రింది బటన్‌ను నొక్కండి. వారు మీకు కాల్ చేసి సహాయం చేస్తారు.",
      alert_asha: "నా ఆశా వర్కర్‌ను ఇప్పుడే అప్రమత్తం చేయండి",
      call_ambulance: "108-ఉచిత అంబులెన్స్‌కు కాల్ చేయండి"
    },
    ambulance: {
      title: "అత్యవసర రెస్క్యూ",
      subtitle: "అంబులెన్స్ లేదా ఆరోగ్య కార్యకర్త కావాలా? క్రింద క్లిక్ చేయండి. మీ స్థానం స్వయంచాలకంగా భాగస్వామ్యం చేయబడుతుంది.",
      request_team: "ఎమర్జెన్సీ టీమ్‌ను అభ్యర్థించండి",
      non_critical: "సాధారణ వైద్య రవాణా",
      rescue_dispatched: "రెస్క్యూ డిస్పాచ్ చేయబడింది",
      call_driver: "డ్రైవర్‌కు కాల్ చేయండి",
      dispatching: "పంపుతోంది..."
    },
    symptom: {
      title: "AI సింప్టమ్ చెకర్",
      subtitle: "మీకు ఎలా ఉందో మాకు చెప్పండి. తర్వాత ఏమి చేయాలో మేము మీకు మార్గనిర్దేశం చేస్తాము.",
      select_symptoms: "మీ లక్షణాలను ఎంచుకోండి:",
      check_now: "ఇప్పుడే తనిఖీ చేయండి",
      fever: "జ్వరం",
      cough: "దగ్గు",
      chest_pain: "ఛాతీ నొప్పి",
      breathing: "శ్వాస తీసుకోవడంలో ఇబ్బంది",
      bleeding: "రక్తస్రావం",
      headache: "తలనొప్పి",
      vomiting: "వాంతులు",
      weakness: "బలహీనత",
      analyzing: "విశ్లేషిస్తోంది...",
      go_hospital: "వెంటనే ఆసుపత్రికి వెళ్లండి",
      see_doctor: "ఈరోజే వైద్యుడిని కలవండి",
      mild: "తేలికపాటి — ఇంట్లో విశ్రాంతి తీసుకోండి"
    }
  },
  bn: {
    dashboardExt: {
      maternal_pulse: "মাতৃ স্বাস্থ্য",
      secure_axis: "নিরাপদ",
      terminal_access: "খুলুন",
      my_profile: "আমার প্রোফাইল",
      profile_desc: "আপনার স্বাস্থ্য আইডি দেখুন, নাম अपडेट করুন।",
      open: "খুলুন",
      skin_ai: "স্কিন এআই স্ক্যানার",
      skin_ai_desc: "সহজেই ত্বকের সংক্রমণ পরীক্ষা করুন।",
      symptom_checker: "লক্ষণ পরীক্ষক",
      symptom_checker_desc: "আপনার লক্ষণগুলি পরীক্ষা করুন এবং পরামর্শ পান।",
      greeting: "নমস্কার, আজ আমরা আপনাকে কীভাবে সাহায্য করতে পারি?",
    },
    menstrual: {
      title: "নারীর স্বাস্থ্য",
      safe_private: "নিরাপদ",
      subtitle: "এআই স্বাস্থ্য নির্দেশিকা, লক্ষণ পরীক্ষা এবং বিনামূল্যে প্যাড - সম্পূর্ণ ব্যক্তিগত।",
      emergency_help: "জরুরী সাহায্য",
      ai_assistant: "এআই সহকারী",
      symptom_check: "লক্ষণ পরীক্ষা",
      request_pads: "প্যাডের জন্য অনুরোধ",
      health_tips: "স্বাস্থ্য টিপস",
      request_pads_title: "স্যানিটারি প্যাডের জন্য অনুরোধ করুন",
      request_pads_desc: "আপনার আশা দিদি আপনাকে প্যাড সরবরাহ করবেন। এই অনুরোধটি সম্পূর্ণ গোপনীয়।",
      private_note: "100% ব্যক্তিগত — শুধুমাত্র আপনার আশা দিদি এই অনুরোধ দেখতে পারবেন।",
      your_village: "আপনার গ্রাম / এলাকা",
      village_placeholder: "উদাঃ রামপুর, সেক্টর 4",
      request_btn: "আশা দিদির কাছে প্যাডের অনুরোধ করুন",
      request_sent: "অনুরোধ পাঠানো হয়েছে!",
      request_sent_desc: "আপনার আশা দিদিকে জানানো হয়েছে, তিনি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।",
      send_another: "আরেকটি অনুরোধ পাঠান",
      symptom_title: "লক্ষণ পরীক্ষা",
      symptom_desc: "আপনার যেকোনো লক্ষণ নির্বাচন করুন। এটি কোনো রোগ নির্ণয় নয় - সর্বদা একজন ডাক্তারের পরামর্শ নিন।",
      check_btn: "আমার লক্ষণ পরীক্ষা করুন",
      tips_title: "স্বাস্থ্য টিপস",
      tips_desc: "আপনার পিরিয়ড চলাকালীন আপনার স্বাস্থ্যের জন্য সহজ পরামর্শ।",
      ask_anything: "আপনার স্বাস্থ্য সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন...",
      emergency_title: "জরুরী সাহায্য",
      emergency_desc: "আপনার আশা দিদিকে অবিলম্বে সতর্ক করতে নীচের বোতামটি চাপুন। তিনি আপনাকে কল করবেন এবং সাহায্য করতে আসবেন।",
      alert_asha: "আমার আশা দিদিকে এখন সতর্ক করুন",
      call_ambulance: "108-বিনামূল্যে অ্যাম্বুলেন্স কল করুন"
    },
    ambulance: {
      title: "জরুরী উদ্ধার",
      subtitle: "অ্যাম্বুলেন্স বা স্বাস্থ্যকর্মী প্রয়োজন? নিচে ক্লিক করুন। আপনার অবস্থান স্বয়ংক্রিয়ভাবে শেয়ার করা হবে।",
      request_team: "জরুরী দলের জন্য অনুরোধ করুন",
      non_critical: "সাধারণ চিকিৎসা পরিবহন",
      rescue_dispatched: "উদ্ধারকারী দল পাঠানো হয়েছে",
      call_driver: "ড্রাইভারকে কল করুন",
      dispatching: "পাঠানো হচ্ছে..."
    },
    symptom: {
      title: "এআই লক্ষণ পরীক্ষক",
      subtitle: "আপনার কেমন লাগছে তা আমাদের জানান। এরপর কী করতে হবে তা আমরা আপনাকে জানাব।",
      select_symptoms: "আপনার লক্ষণ নির্বাচন করুন:",
      check_now: "এখন পরীক্ষা করুন",
      fever: "জ্বর",
      cough: "কাশি",
      chest_pain: "বুকে ব্যথা",
      breathing: "শ্বাসকষ্ট",
      bleeding: "রক্তপাত",
      headache: "মাথাব্যথা",
      vomiting: "বমি",
      weakness: "দুর্বলতা",
      analyzing: "বিশ্লেষণ করা হচ্ছে...",
      go_hospital: "অবিলম্বে হাসপাতালে যান",
      see_doctor: "আজই একজন ডাক্তারের সাথে দেখা করুন",
      mild: "মৃদু — বাড়িতে বিশ্রাম নিন"
    }
  }
};

for (const lang of Object.keys(newKeys)) {
  if (!translations[lang]) translations[lang] = {};
  for (const module of Object.keys(newKeys[lang])) {
    translations[lang][module] = { ...translations[lang][module], ...newKeys[lang][module] };
  }
}

const newTranslationsStr = 'export const translations = ' + JSON.stringify(translations, null, 2) + '\n';
const newContent = content.substring(0, startIndex) + newTranslationsStr + content.substring(endIndex);

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Translations updated successfully!');
