import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MessageCircle, HeartPulse, Mic, AlertTriangle, Send,
  Zap, Bot, User, Loader, WifiOff, BookMarked, CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { searchOfflineKB } from '../utils/semanticCache';

const OFFLINE_TIPS_BY_LANG = {
  en: [
    { q: 'Heavy bleeding?', a: 'Change pad every hour → Go to hospital now.', src: 'FOGSI Guidelines 2020', urgency: 'P1' },
    { q: 'Severe period pain?', a: 'Take paracetamol or use a hot water bag. If pain is unbearable, see a doctor.', src: 'WHO Reproductive Health', urgency: 'P3' },
    { q: 'How often change pads?', a: 'Every 4-6 hours. Even if flow is light, change regularly to prevent infections.', src: 'MoHFW MHM Scheme 2023', urgency: 'P4' },
    { q: 'Iron-rich foods?', a: 'Jaggery (gur), spinach (palak), lentils, dates, and sesame seeds to replenish lost blood.', src: 'ICMR Dietary Guidelines', urgency: 'P4' },
    { q: 'Prevent rashes & itch?', a: 'Keep genital area clean and dry. Avoid scented soaps; use mild clean water only.', src: 'UNICEF Hygiene Guidelines', urgency: 'P4' },
    { q: 'Irregular/missed periods?', a: 'Common causes include stress, poor diet, or thyroid issues. Track for 3 cycles and visit nearest clinic.', src: 'FOGSI Guidelines 2021', urgency: 'P4' },
    { q: 'Using cloth instead of pads?', a: 'Wash cloth with soap and clean water. Always dry it in direct sunlight to kill bacteria.', src: 'UNICEF MHM 2019', urgency: 'P4' },
    { q: 'Foul smell or unusual discharge?', a: 'This could be an infection. Do not ignore it. See a doctor or ASHA worker immediately.', src: 'MoHFW Guidelines', urgency: 'P2' },
    { q: 'Can I take a bath during periods?', a: 'Yes! Daily bathing with warm water reduces cramps and keeps you clean and healthy.', src: 'WHO Hygiene Guidelines', urgency: 'P4' },
    { q: 'Can I eat sour food or enter the kitchen?', a: 'These are myths! You can eat all regular healthy foods (curd, pickles) and do all normal activities.', src: 'FOGSI Fact Check', urgency: 'P4' },
  ],
  hi: [
    { q: 'बहुत भारी रक्तस्राव (Heavy bleeding)?', a: 'यदि हर घंटे पैड बदलना पड़े → तुरंत अस्पताल जाएं।', src: 'FOGSI गाइडलाइंस 2020', urgency: 'P1' },
    { q: 'पीरियड्स में तेज दर्द?', a: 'गर्म पानी की थैली से सिकाई करें या पैरासिटामोल लें। दर्द असहनीय हो तो डॉक्टर से मिलें।', src: 'WHO रीप्रोडक्टिव हेल्थ', urgency: 'P3' },
    { q: 'पैड कितनी बार बदलना चाहिए?', a: 'हर 4-6 घंटे में। भले ही खून का बहाव कम हो, इन्फेक्शन से बचने के लिए पैड बदलें।', src: 'स्वास्थ्य मंत्रालय MHM योजना 2023', urgency: 'P4' },
    { q: 'आयरन से भरपूर खाद्य पदार्थ?', a: 'शरीर में खून बढ़ाने के लिए गुड़, पालक, दालें, खजूर और तिल खाएं।', src: 'ICMR आहार दिशानिर्देश', urgency: 'P4' },
    { q: 'खुजली और रैशेज से कैसे बचें?', a: 'प्राइवेट अंगों को साफ और सूखा रखें। खुशबूदार साबुन का प्रयोग न करें, केवल साफ पानी का उपयोग करें।', src: 'यूनिसेफ स्वच्छता गाइडलाइंस', urgency: 'P4' },
    { q: 'अनियमित या छूटे हुए पीरियड्स?', a: 'तनाव, खराब खानपान या थायराइड इसके कारण हो सकते हैं। 3 महीनों तक ट्रैक करें और डॉक्टर से सलाह लें।', src: 'FOGSI गाइडलाइंस 2021', urgency: 'P4' },
    { q: 'पैड की जगह कपड़े का उपयोग?', a: 'कपड़े को साबुन और साफ पानी से धोएं। कीटाणुओं को मारने के लिए इसे हमेशा सीधी धूप में सुखाएं।', src: 'यूनिसेफ MHM 2019', urgency: 'P4' },
    { q: 'दुर्गंध या असामान्य सफेद पानी?', a: 'यह इन्फेक्शन हो सकता है। इसे नजरअंदाज न करें। तुरंत डॉक्टर या आशा कार्यकर्ता से मिलें।', src: 'स्वास्थ्य मंत्रालय गाइडलाइंस', urgency: 'P2' },
    { q: 'क्या पीरियड्स में नहाना चाहिए?', a: 'हाँ! रोजाना गुनगुने पानी से नहाने से दर्द कम होता है और शरीर साफ व स्वस्थ रहता है।', src: 'WHO स्वच्छता गाइडलाइंस', urgency: 'P4' },
    { q: 'खट्टी चीजें खाना या रसोई में जाना?', a: 'यह केवल अंधविश्वास है! आप सभी सामान्य पौष्टिक भोजन (दही, अचार) खा सकती हैं और रोजमर्रा के काम कर सकती हैं।', src: 'FOGSI फैक्ट चेक', urgency: 'P4' },
  ],
  mr: [
    { q: 'अति रक्तस्राव (Heavy bleeding)?', a: 'दर तासाला पॅड बदलावे लागत असल्यास → ताबडतोब रुग्णालयात जा.', src: 'FOGSI मार्गदर्शक तत्वे 2020', urgency: 'P1' },
    { q: 'मासिक पाळीचा तीव्र त्रास / पोटदुखी?', a: 'कोमट पाण्याचा शेक घ्या किंवा पॅरासिटामॉल घ्या. जास्त त्रास असल्यास डॉक्टरांना दाखवा.', src: 'WHO पुनरुत्पादक आरोग्य', urgency: 'P3' },
    { q: 'पॅड किती वेळाने बदलावे?', a: 'दर ४ ते ६ तासांनी. रक्तस्राव कमी असला तरी संसर्ग टाळण्यासाठी नियमित पॅड बदला.', src: 'आरोग्य मंत्रालय MHM योजना 2023', urgency: 'P4' },
    { q: 'लोहयुक्त (Iron) अन्नपदार्थ कोणते?', a: 'रक्ताची कमतरता भरून काढण्यासाठी गूळ, पालक, डाळी, खजूर आणि तीळ खा.', src: 'ICMR आहार नियमावली', urgency: 'P4' },
    { q: 'रॅशेस आणि खाज कशी टाळावी?', a: 'गुप्तभाग स्वच्छ आणि कोरडा ठेवा. सुगंधी साबण वापरू नका, फक्त स्वच्छ पाण्याचा वापर करा.', src: 'युनिसेफ स्वच्छता मार्गदर्शक', urgency: 'P4' },
    { q: 'अनियमित मासिक पाळी?', a: 'ताणतणाव, अपुरा आहार किंवा थायरॉईडमुळे पाळी अनियमित होऊ शकते. ३ महिने निरीक्षण करा आणि डॉक्टरांचा सल्ला घ्या.', src: 'FOGSI मार्गदर्शक तत्वे 2021', urgency: 'P4' },
    { q: 'पॅडऐवजी कापड वापरताय?', a: 'कापड साबण आणि स्वच्छ पाण्याने धुवा. जंतू नष्ट करण्यासाठी ते नेहमी थेट उन्हात वाळवा.', src: 'UNICEF MHM 2019', urgency: 'P4' },
    { q: 'दुर्गंधी किंवा असामान्य पांढरा स्राव?', a: 'हा संसर्ग (इन्फेक्शन) असू शकतो. याकडे दुर्लक्ष करू नका. ताबडतोब डॉक्टर किंवा आशा सेविकेला भेटा.', src: 'आरोग्य मंत्रालय मार्गदर्शक तत्वे', urgency: 'P2' },
    { q: 'मासिक पाळीत आंघोळ करावी का?', a: 'होय! रोज कोमट पाण्याने आंघोळ केल्याने वेदना कमी होतात आणि शरीर स्वच्छ व निरोगी राहते.', src: 'WHO स्वच्छता मार्गदर्शक', urgency: 'P4' },
    { q: 'आंबट पदार्थ खाणे किंवा स्वयंपाकघरात जाणे?', a: 'हा फक्त गैरसमज आहे! तुम्ही सर्व सामान्य पौष्टिक आहार (दही, लोणचे) खाऊ शकता आणि रोजची कामे करू शकता.', src: 'FOGSI फॅक्ट चेक', urgency: 'P4' },
  ],
  ta: [
    { q: 'அதிக இரத்தப்போக்கு?', a: 'ஒவ்வொரு மணி நேரமும் பேட் மாற்ற நேர்ந்தால் → உடனடியாக மருத்துவமனைக்குச் செல்லவும்.', src: 'FOGSI வழிகாட்டுதல்கள் 2020', urgency: 'P1' },
    { q: 'கடுமையான மாதவிடாய் வலி?', a: 'வெந்நீர் ஒத்தடம் கொடுக்கவும் அல்லது பாராசிட்டமால் உட்கொள்ளவும். வலி தாங்க முடியாவிட்டால் மருத்துவரை அணுகவும்.', src: 'WHO இனப்பெருக்க ஆரோக்கியம்', urgency: 'P3' },
    { q: 'எவ்வளவு நேரத்திற்கு ஒருமுறை பேட் மாற்ற வேண்டும்?', a: 'ஒவ்வொரு 4-6 மணி நேரத்திற்கு ஒருமுறை. இரத்தம் குறைவாக இருந்தாலும் தொற்றைத் தவிர்க்க மாற்றவும்.', src: 'சுகாதார அமைச்சகம் MHM திட்டம் 2023', urgency: 'P4' },
    { q: 'இரும்புச்சத்து நிறைந்த உணவுகள்?', a: 'இரத்த சோகையைத் தடுக்க வெல்லம், கீரை, பருப்பு வகைகள், பேரீச்சம்பழம் மற்றும் எள் சாப்பிடவும்.', src: 'ICMR உணவு வழிகாட்டி', urgency: 'P4' },
    { q: 'அரிப்பு மற்றும் தடிப்புகளைத் தடுப்பது எப்படி?', a: 'உறுப்புகளை சுத்தமாகவும் உலர்ந்ததாகவும் வைத்திருங்கள். வாசனை சோப்புகளைத் தவிர்த்து, சுத்தமான தண்ணீரை மட்டும் பயன்படுத்தவும்.', src: 'யுனிசெப் சுகாதார வழிகாட்டுதல்கள்', urgency: 'P4' },
    { q: 'முறையற்ற மாதவிடாய் சுழற்சி?', a: 'மன அழுத்தம், ஊட்டச்சத்து குறைபாடு அல்லது தைராய்டு இதற்கு காரணமாக இருக்கலாம். 3 மாதங்கள் கண்காணித்து மருத்துவரை அணுகவும்.', src: 'FOGSI வழிகாட்டுதல்கள் 2021', urgency: 'P4' },
    { q: 'பேட்-க்கு பதிலாக துணி பயன்படுத்துகிறீர்களா?', a: 'துணியை சோப்பு மற்றும் சுத்தமான தண்ணீரால் கழுவவும். கிருமிகளை அழிக்க எப்போதும் நேரடி சூரிய ஒளியில் காயவைக்கவும்.', src: 'UNICEF MHM 2019', urgency: 'P4' },
    { q: 'துர்நாற்றம் அல்லது அசாதாரண வெள்ளைப்படுதல்?', a: 'இது தொற்றாக இருக்கலாம். இதை புறக்கணிக்காதீர்கள். உடனடியாக மருத்துவர் அல்லது ஆஷா பணியாளரை அணுகவும்.', src: 'சுகாதார அமைச்சகம் வழிகாட்டுதல்கள்', urgency: 'P2' },
    { q: 'மாதவிடாய் காலத்தில் குளிக்கலாமா?', a: 'ஆம்! தினமும் வெதுவெதுப்பான நீரில் குளிப்பது வலியைக் குறைத்து, உங்களை சுத்தமாகவும் ஆரோக்கியமாகவும் வைத்திருக்கும்.', src: 'WHO சுகாதார வழிகாட்டுதல்கள்', urgency: 'P4' },
    { q: 'புளிப்பான உணவுகள் சாப்பிடலாமா அல்லது சமையலறைக்குச் செல்லலாమా?', a: 'இவை மூடநம்பிக்கைகள்! நீங்கள் அனைத்து சாதாரண சத்தான உணவுகளையும் (தயிர், ஊறகாய்) சாப்பிடலாம் மற்றும் வழக்கமான வேலைகளை செய்யலாம்.', src: 'FOGSI உண்மை சோதனை', urgency: 'P4' },
  ],
  te: [
    { q: 'అధిక రక్తస్రావం (Heavy bleeding)?', a: 'ప్రతి గంటకూ ప్యాడ్ మార్చాల్సి వస్తే → వెంటనే ఆసుపత్రికి వెళ్ళండి.', src: 'FOGSI నిబంధనలు 2020', urgency: 'P1' },
    { q: 'తీవ్రమైన పీరియడ్స్ నొప్పి?', a: 'వేడి నీటి సంచితో కాపడం పెట్టండి లేదా పారాసిటమాల్ వాడండి. నొప్పి భరించలేకపోతే డాక్టర్‌ను సంప్రదించండి.', src: 'WHO ప్రత్యుత్పత్తి ఆరోగ్యం', urgency: 'P3' },
    { q: 'ప్యాడ్ ఎన్ని గంటలకు ఒకసారి మార్చాలి?', a: 'ప్రతి 4-6 గంటలకు.రకస్రావం తక్కువగా ఉన్నా ఇన్ఫెక్షన్లు రాకుండా క్రమంతప్పకుండా మార్చాలి.', src: 'ఆరోగ్య శాఖ MHM పథకం 2023', urgency: 'P4' },
    { q: 'ఐరన్ (ఇనుము) ఎక్కువగా ఉండే ఆహారాలు?', a: 'రక్తాన్ని పెంచడానికి బెల్లం, పాలకూర, పప్పుధాన్యాలు, ఖర్జూరం మరియు నువ్వులు తీసుకోండి.', src: 'ICMR డైటరీ గైడ్‌లైన్స్', urgency: 'P4' },
    { q: 'దురద మరియు రాషెస్ రాకుండా ఏం చేయాలి?', a: 'రహస్య భాగాలను శుభ్రంగా, పొడిగా ఉంచుకోండి. వాసన గల సబ్బులను వాడకండి, కేవలం శుభ్రమైన నీటితో కడగాలి.', src: 'యునిసెఫ్ పరిశుభ్రత నిబంధనలు', urgency: 'P4' },
    { q: 'క్రమం లేని బహిష్టు సమస్య?', a: 'మానసిక ఒత్తిడి, సరిపడా ఆహారం తీసుకోకపోవడం లేదా థైరాయిడ్ వల్ల కావచ్చు. 3 నెలలు గమనించి డాక్టర్‌ను సంప్రదించండి.', src: 'FOGSI నిబంధనలు 2021', urgency: 'P4' },
    { q: 'ప్యాడ్‌కు బదులుగా వస్త్రం వాడుతున్నారా?', a: 'వస్త్రాన్ని సబ్బు మరియు శుభ్రమైన నీటితో కడగాలి. సూక్ష్మక్రిములను చంపడానికి ఎల్లప్పుడూ ప్రత్యక్ష సూర్యకాంతిలో ఆరబెట్టండి.', src: 'UNICEF MHM 2019', urgency: 'P4' },
    { q: 'దుర్వాసన లేదా అసాధారణ ఉత్సర్గ?', a: 'ఇది ఇన్ఫెక్షన్ కావచ్చు. దీనిని విస్మరించవద్దు. వెంటనే డాక్టర్ లేదా ఆశా కార్యకర్తను సంప్రదించండి.', src: 'ఆరోగ్య శాఖ నిబంధనలు', urgency: 'P2' },
    { q: 'పీరియడ్స్ సమయంలో స్నానం చేయవచ్చా?', a: 'అవును! రోజూ గోరువెచ్చని నీటితో స్నానం చేయడం వల్ల నొప్పి తగ్గుతుంది మరియు మీరు శుభ్రంగా, ఆరోగ్యంగా ఉంటారు.', src: 'WHO పరిశుభ్రత నిబంధనలు', urgency: 'P4' },
    { q: 'పుల్లటి ఆహారం తినవచ్చా లేదా వంటగదిలోకి వెళ్లవచ్చా?', a: 'ఇవి కేవలం అపోహలు! మీరు అన్ని సాధారణ పౌష్టిక ఆహారాలు (పెరుగు, పచ్చళ్లు) తినవచ్చు మరియు రోజువారీ పనులు చేసుకోవచ్చు.', src: 'FOGSI ఫాక్ట్ చెక్', urgency: 'P4' },
  ],
  bn: [
    { q: 'অতিরিক্ত রক্তপাত (Heavy bleeding)?', a: 'প্রতি ঘন্টায় প্যাড পরিবর্তন করতে হলে → অবিলম্বে হাসপাতালে যান।', src: 'FOGSI গাইডলাইন্স ২০২০', urgency: 'P1' },
    { q: 'মাসিকের তীব্র ব্যথা?', a: 'গরম জলের ব্যাগ দিয়ে সেঁক দিন অথবা প্যারাসিটামল নিন। ব্যথা সহ্য না হলে ডাক্তার দেখান।', src: 'WHO প্রজনন স্বাস্থ্য', urgency: 'P3' },
    { q: 'কতক্ষণ পর পর প্যাড পরিবর্তন করা উচিত?', a: 'প্রতি ৪-৬ ঘন্টা পর পর। রক্তপাত কম হলেও ইনফেকশন এড়াতে নিয়মিত প্যাড পরিবর্তন করুন।', src: 'স্বাস্থ্য মন্ত্রক MHM স্কিম ২০২৩', urgency: 'P4' },
    { q: 'আয়রন সমৃদ্ধ খাবার?', a: 'রক্তের ঘাটতি পূরণ করতে গুড়, পালং শাক, ডাল, খেজুর এবং তিল খান।', src: 'ICMR খাদ্য নির্দেশিকা', urgency: 'P4' },
    { q: 'চুলকানি ও র‍্যাশ কীভাবে প্রতিরোধ করবেন?', a: 'প্রাইভেট অঙ্গ পরিষ্কার ও শুকনো রাখুন। সুগন্ধি সাবান এড়িয়ে চলুন, শুধুমাত্র পরিষ্কার জল ব্যবহার করুন।', src: 'ইউনিসেফ স্বাস্থ্যবিধি গাইডলাইন্স', urgency: 'P4' },
    { q: 'অনিয়মিত বা বন্ধ মাসিক?', a: 'মানসিক চাপ, অপুষ্টি বা থাইরয়েড এর কারণ হতে পারে। ৩ মাস ট্র্যাক করুন এবং চিকিৎসকের পরামর্শ নিন।', src: 'FOGSI গাইডলাইন্স ২০২১', urgency: 'P4' },
    { q: 'প্যাডের পরিবর্তে কাপড় ব্যবহার করছেন?', a: 'কাপড় সাবান এবং পরিষ্কার জল দিয়ে ধুয়ে নিন। জীবাণু ধ্বংস করতে সর্বদা সরাসরি সূর্যের আলোতে শুকান।', src: 'UNICEF MHM 2019', urgency: 'P4' },
    { q: 'দুর্গন্ধ বা অস্বাভাবিক সাদা স্রাব?', a: 'এটি ইনফেকশন হতে পারে। এটিকে অবহেলা করবেন না। অবিলম্বে ডাক্তার বা আশা কর্মীর সাথে দেখা করুন।', src: 'স্বাস্থ্য মন্ত্রক গাইডলাইন্স', urgency: 'P2' },
    { q: 'মাসিকের সময় কি স্নান করা উচিত?', a: 'হ্যাঁ! প্রতিদিন হালকা গরম জলে স্নান করলে ব্যথা কমে এবং শরীর পরিষ্কার ও সুস্থ থাকে।', src: 'WHO স্বাস্থ্যবিধি গাইডলাইন্স', urgency: 'P4' },
    { q: 'টক খাবার খাওয়া বা রান্নাঘরে যাওয়া?', a: 'এগুলো কেবল কুসংস্কার! আপনি সমস্ত সাধারণ পুষ্টিকর খাবার (দই, আচার) খেতে পারেন এবং দৈনন্দিন কাজ করতে পারেন।', src: 'FOGSI ফ্যাক্ট চেক', urgency: 'P4' },
  ],
};

const OFFLINE_FALLBACK_CHAT_REPLIES = {
  en: "Hello! I am Sakhi. You are currently offline, so I cannot search for a detailed reply. Please check the verified offline tips above or contact your ASHA worker.",
  hi: "नमस्ते! मैं सखी हूँ। अभी आपका इंटरनेट ऑफलाइन है, इसलिए मैं पूरा जवाब नहीं खोज पा रही हूँ। कृपया ऊपर दिए गए वेरिफाइड टिप्स को देखें या अपनी आशा कार्यकर्ता से संपर्क करें।",
  mr: "नमस्ते! मी सखी आहे. सध्या तुमचे इंटरनेट बंद (offline) आहे, त्यामुळे मी सविस्तर उत्तर शोधू शकत नाही. कृपया वरील पडताळलेले सल्ले पहा किंवा तुमच्या आशा सेविकेशी संपर्क साधा.",
  ta: "வணக்கம்! நான் சகி. நீங்கள் தற்போது ஆஃப்லைனில் உள்ளீர்கள், எனவே என்னால் விரிவான பதிலைத் தேட முடியவில்லை. தயவுசெய்து மேலே உள்ள சரிபார்க்கப்பட்ட ஆஃப்லைன் உதவிக்குறிப்புகளைப் பார்க்கவும் அல்லது உங்கள் ஆஷா பணியாளரைத் தொடர்பு கொள்ளவும்.",
  te: "నమస్తే! నేను సఖిని. ప్రస్తుతం మీ ఇంటర్నెట్ ఆఫ్‌లైన్‌లో ఉంది, కాబట్టి నేను పూర్తి సమాధానాన్ని శోధించలేకపోతున్నాను. దయచేసి పైన పేర్కొన్న ధృవీకరించబడిన చిట్కాలను చూడండి లేదా మీ ఆశా కార్యకర్తను సంప్రదించండి.",
  bn: "নমস্কার! আমি সখী। আপনার ইন্টারনেট বর্তমানে অফলাইন রয়েছে, তাই আমি বিস্তারিত উত্তর খুঁজতে পারছি না। অনুগ্রহ করে উপরের যাচাইকৃত অফলাইন টিপসগুলি দেখুন বা আপনার আশা কর্মীর সাথে যোগাযোগ করুন."
};

const URGENCY_COLORS = {
  P1: 'bg-red-50 border-red-200 text-red-700',
  P2: 'bg-orange-50 border-orange-200 text-orange-700',
  P3: 'bg-amber-50 border-amber-200 text-amber-700',
  P4: 'bg-emerald-50 border-emerald-200 text-emerald-700',
};

const OFFLINE_KNOWLEDGE_HEADERS = {
  en: {
    title: 'No Internet — Using Offline Knowledge Base',
    subtitle: 'Verified WHO/MoHFW guidelines loaded on your device'
  },
  hi: {
    title: 'इंटरनेट नहीं है — ऑफलाइन ज्ञानकोश का उपयोग',
    subtitle: 'आपके डिवाइस पर लोड किए गए वेरिफाइड WHO/MoHFW दिशानिर्देश'
  },
  mr: {
    title: 'इंटरनेट नाही — ऑफलाइन ज्ञानकोश वापरत आहे',
    subtitle: 'तुमच्या उपकरणावर लोड केलेली अधिकृत WHO/MoHFW मार्गदर्शक तत्वे'
  },
  ta: {
    title: 'இணையம் இல்லை — ஆஃப்லைன் அறிவுத் தளத்தைப் பயன்படுத்துதல்',
    subtitle: 'உங்கள் சாதனத்தில் சரிபார்க்கப்பட்ட WHO/MoHFW வழிகாட்டுதல்கள்'
  },
  te: {
    title: 'ఇంటర్నెట్ లేదు — ఆఫ్‌లైన్ నాలెడ్జ్ బేస్ ఉపయోగించబడుతోంది',
    subtitle: 'మీ పరికరంలో లోడ్ చేయబడిన ధృవీకరించబడిన WHO/MoHFW మార్గదర్శకాలు'
  },
  bn: {
    title: 'ইন্টারনেট নেই — অফলাইন জ্ঞানকোষ ব্যবহার করা হচ্ছে',
    subtitle: 'আপনার ডিভাইসে লোড করা যাচাইকৃত WHO/MoHFW নির্দেশাবলী'
  }
};

const findOfflineTip = (msg, lang) => {
  const offlineTips = OFFLINE_TIPS_BY_LANG[lang] || OFFLINE_TIPS_BY_LANG['hi'];
  const cleanMsg = msg.toLowerCase();
  if (cleanMsg.includes('pain') || cleanMsg.includes('dard') || cleanMsg.includes('cramp') || cleanMsg.includes('pet') || cleanMsg.includes('peth') || cleanMsg.includes('வலி') || cleanMsg.includes('నొప్పి') || cleanMsg.includes('ব্যথা') || cleanMsg.includes('पोटदुखी')) return offlineTips[1];
  if (cleanMsg.includes('heavy') || cleanMsg.includes('bleed') || cleanMsg.includes('khoon') || cleanMsg.includes('bahaw') || cleanMsg.includes('रक्त') || cleanMsg.includes('இரத்த') || cleanMsg.includes('రక్త') || cleanMsg.includes('রক্ত')) return offlineTips[0];
  if (cleanMsg.includes('often') || cleanMsg.includes('change') || cleanMsg.includes('pad') || cleanMsg.includes('hours') || cleanMsg.includes('ghante') || cleanMsg.includes('पॅड') || cleanMsg.includes('பேட்') || cleanMsg.includes('ప్యాడ్') || cleanMsg.includes('প্যাড')) return offlineTips[2];
  if (cleanMsg.includes('food') || cleanMsg.includes('iron') || cleanMsg.includes('eat') || cleanMsg.includes('diet') || cleanMsg.includes('nutrition') || cleanMsg.includes('पालक') || cleanMsg.includes('गुड़') || cleanMsg.includes('गूळ') || cleanMsg.includes('உணவு') || cleanMsg.includes('ఆహారం') || cleanMsg.includes('খাবার')) return offlineTips[3];
  if (cleanMsg.includes('rash') || cleanMsg.includes('itch') || cleanMsg.includes('clean') || cleanMsg.includes('khujli') || cleanMsg.includes('खुजली') || cleanMsg.includes('खाज') || cleanMsg.includes('அரிப்பு') || cleanMsg.includes('దురద') || cleanMsg.includes('চুলকানি')) return offlineTips[4];
  if (cleanMsg.includes('miss') || cleanMsg.includes('late') || cleanMsg.includes('irregular') || cleanMsg.includes('cycle') || cleanMsg.includes('deeri') || cleanMsg.includes('चक्र') || cleanMsg.includes('முறையற்ற') || cleanMsg.includes('క్రమం') || cleanMsg.includes('অনিয়মিত')) return offlineTips[5];
  if (cleanMsg.includes('cloth') || cleanMsg.includes('wash') || cleanMsg.includes('dry') || cleanMsg.includes('sun') || cleanMsg.includes('kapd') || cleanMsg.includes('dho') || cleanMsg.includes('sukha') || cleanMsg.includes('कापड') || cleanMsg.includes('துணி') || cleanMsg.includes('వస్త్రం') || cleanMsg.includes('কাপড়')) return offlineTips[6];
  if (cleanMsg.includes('smell') || cleanMsg.includes('foul') || cleanMsg.includes('white') || cleanMsg.includes('discharge') || cleanMsg.includes('infection') || cleanMsg.includes('badbu') || cleanMsg.includes('gandh') || cleanMsg.includes('safed') || cleanMsg.includes('pani') || cleanMsg.includes('दुर्गंध') || cleanMsg.includes('துர்நாற்றம்') || cleanMsg.includes('వాసన') || cleanMsg.includes('গন্ধ')) return offlineTips[7];
  if (cleanMsg.includes('bath') || cleanMsg.includes('bathe') || cleanMsg.includes('nahana') || cleanMsg.includes('snan') || cleanMsg.includes('आंघोळ') || cleanMsg.includes('குளிக்க') || cleanMsg.includes('స్నానం') || cleanMsg.includes('স্নান')) return offlineTips[8];
  if (cleanMsg.includes('sour') || cleanMsg.includes('pickle') || cleanMsg.includes('curd') || cleanMsg.includes('kitchen') || cleanMsg.includes('achar') || cleanMsg.includes('khatta') || cleanMsg.includes('rasoi') || cleanMsg.includes('myth') || cleanMsg.includes('अंधविश्वास') || cleanMsg.includes('लोणचे') || cleanMsg.includes('ஊறகாய்') || cleanMsg.includes('పుల్లటి') || cleanMsg.includes('আচার')) return offlineTips[9];
  return null;
};

export default function SakhiChatbot() {
  const { lang, t } = useLanguage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('sakhi_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { role: 'ai', text: t.menstrual?.sakhi_welcome || "Hello! I'm Sakhi, your Women's Health Assistant. I'm here to answer any questions about menstrual health, hygiene, pain, or when to see a doctor. Everything you share is completely private. How can I help you today?" }
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const langVoiceMap = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN' };
  const speakLang = langVoiceMap[lang] || 'hi-IN';

  useEffect(() => {
    sessionStorage.setItem('sakhi_chat_history', JSON.stringify(messages.slice(-20)));
  }, [messages]);

  const speakResponse = (text, langCode = 'hi-IN', urgency = 'P4') => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    let limit = 300;
    if (urgency === 'P1' || urgency === 'P2') limit = 500;
    else if (urgency === 'P4') limit = 200;

    const utterance = new SpeechSynthesisUtterance(text.slice(0, limit));
    utterance.lang = langCode;
    utterance.rate = 0.85;
    utterance.pitch = 1.1;

    const voices = window.speechSynthesis.getVoices();
    const l = langCode.toLowerCase().split('-')[0];
    
    let femaleVoice = null;
    if (l === 'hi') {
      femaleVoice = voices.find(v => 
        v.lang.toLowerCase().replace('_', '-').startsWith('hi') && 
        v.name.toLowerCase().includes('neerja')
      );
    }
    
    if (!femaleVoice) {
      femaleVoice = voices.find(v => 
        v.lang.toLowerCase().replace('_', '-').startsWith(l) && 
        (v.name.toLowerCase().includes('female') || 
         v.name.toLowerCase().includes('swara') || 
         v.name.toLowerCase().includes('heera') || 
         v.name.toLowerCase().includes('kalpana') || 
         v.name.toLowerCase().includes('google') ||
         (v.name.toLowerCase().includes('microsoft') && 
          !v.name.toLowerCase().includes('david') && 
          !v.name.toLowerCase().includes('ravi') && 
          !v.name.toLowerCase().includes('karan') && 
          !v.name.toLowerCase().includes('hemant')))
      );
    }

    if (!femaleVoice) {
      femaleVoice = voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(l));
    }

    if (!femaleVoice) {
      femaleVoice = voices.find(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('zira') || 
        v.name.toLowerCase().includes('hazel') || 
        v.name.toLowerCase().includes('samantha')
      );
    }

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (overrideText = null) => {
    const userMsg = (overrideText || input).trim();
    if (!userMsg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }].slice(-100));
    setLoading(true);

    if (!isOnline) {
      // Run IndexedDB token-weighted fuzzy keyword search
      searchOfflineKB(userMsg, lang).then(matchedTip => {
        if (matchedTip) {
          setMessages(prev => [...prev, {
            role:    'ai',
            text:    `[Offline Mode] ${matchedTip.a}`,
            sources: [matchedTip.src],
            urgency: matchedTip.urgency,
            grounded: true, // Marked true because it matched official seeded guidelines!
          }].slice(-100));
        } else {
          const fallbackText = OFFLINE_FALLBACK_CHAT_REPLIES[lang] || OFFLINE_FALLBACK_CHAT_REPLIES['hi'];
          setMessages(prev => [...prev, {
            role:    'ai',
            text:    fallbackText,
            sources: ["Sakhi Local Memory (Offline)"],
            urgency: "P4",
            grounded: false,
          }].slice(-100));
        }
        setLoading(false);
      }).catch(err => {
        console.error("Offline search failed:", err);
        setLoading(false);
      });
      return;
    }

    try {
      const res = await api.post('/health-assistant', { message: userMsg });
      setMessages(prev => [...prev, {
        role:    'ai',
        text:    res.data.reply,
        sources: res.data.sources  || [],
        urgency: res.data.urgency  || 'P4',
        grounded: res.data.grounded,
      }].slice(-100));
    } catch (err) {
      const matchedTip = await searchOfflineKB(userMsg, lang);
      if (matchedTip) {
        setMessages(prev => [...prev, {
          role:    'ai',
          text:    `[Connection Slow - Local Fallback] ${matchedTip.a}`,
          sources: [matchedTip.src],
          urgency: matchedTip.urgency,
          grounded: true,
        }].slice(-100));
      } else {
        setMessages(prev => [...prev, {
          role: 'ai',
          text: t.menstrual?.sakhi_error || 'I could not process your question right now. Please try again.',
          isError: true,
          grounded: false,
        }].slice(-100));
      }
    } finally {
      setLoading(false);
    }
  };

  const LANG_CHAIN = {
    hi: ['hi-IN', 'en-IN', 'ta-IN', 'mr-IN', 'te-IN', 'bn-IN'],
    ta: ['ta-IN', 'en-IN', 'hi-IN', 'te-IN'],
    en: ['en-IN', 'hi-IN', 'ta-IN', 'mr-IN', 'te-IN', 'bn-IN'],
    bn: ['bn-IN', 'hi-IN', 'en-IN'],
    te: ['te-IN', 'hi-IN', 'en-IN', 'ta-IN'],
    mr: ['mr-IN', 'hi-IN', 'en-IN'],
  };

  const recognitionRef = useRef(null);

  const stopVoice = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startVoiceAttempt = useCallback((langChain, attemptIdx = 0) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Voice input is not supported on this device. Please use Chrome or Edge.', isError: true }].slice(-100));
      return;
    }
    if (attemptIdx >= langChain.length) {
      setIsListening(false);
      return;
    }

    const currentLang = langChain[attemptIdx];
    try {
      const rec = new SR();
      rec.lang = currentLang;
      rec.continuous = false;
      rec.interimResults = false;
      
      recognitionRef.current = rec;
      setIsListening(true);

      rec.onstart = () => setIsListening(true);
      rec.onresult = (e) => { 
        const text = e.results[0][0].transcript;
        setInput(text); 
        setIsListening(false); 
        if (text.trim()) {
          handleSend(text);
        }
      };
      rec.onerror = (e) => {
        console.error('[Sakhi Voice Error]', e.error);
        if ((e.error === 'no-speech' || e.error === 'language-not-supported' || e.error === 'network') && attemptIdx + 1 < langChain.length) {
          setTimeout(() => startVoiceAttempt(langChain, attemptIdx + 1), 200);
        } else {
          setIsListening(false);
          if (e.error === 'not-allowed') {
            setMessages(prev => [...prev, { role: 'ai', text: 'Microphone access denied. Please enable microphone permissions in your browser settings.', isError: true }].slice(-100));
          }
        }
        recognitionRef.current = null;
      };
      rec.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };
      rec.start();
    } catch (err) {
      console.error('[Sakhi Start Error]', err);
      setIsListening(false);
    }
  }, [handleSend]);

  const startVoice = useCallback(() => {
    if (isListening) {
      stopVoice();
      return;
    }
    const chain = LANG_CHAIN[lang] || ['hi-IN', 'en-IN', 'ta-IN'];
    startVoiceAttempt(chain, 0);
  }, [isListening, lang, startVoiceAttempt, stopVoice]);

  const suggestions = t.menstrual?.sakhi_suggestions || ['How do I manage period pain?', 'What is heavy bleeding?', 'How often should I change pads?', 'My periods are irregular'];

  return (
    <div className="flex flex-col">
      {!isOnline && (() => {
        const headerText = OFFLINE_KNOWLEDGE_HEADERS[lang] || OFFLINE_KNOWLEDGE_HEADERS['hi'];
        const activeOfflineTips = OFFLINE_TIPS_BY_LANG[lang] || OFFLINE_TIPS_BY_LANG['hi'];
        return (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-2xl border-2 border-amber-200 bg-amber-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-amber-100 flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-black text-amber-800">{headerText.title}</p>
                <p className="text-[10px] text-amber-500 font-medium">{headerText.subtitle}</p>
              </div>
            </div>
            <div className="divide-y divide-amber-100">
              {activeOfflineTips.map((tip, i) => (
                <div key={i} className="px-4 py-3">
                  <p className="text-xs font-black text-amber-900 mb-0.5">{tip.q}</p>
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">{tip.a}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <BookMarked className="w-3 h-3 text-amber-400" />
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">📚 {tip.src}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })()}

      <div className="mb-4 p-2.5 sm:p-3 bg-rose-50 border border-rose-100 rounded-xl sm:rounded-2xl flex items-center gap-2.5 sm:gap-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-rose-600 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
          <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </div>
        <div>
          <p className="font-black text-rose-900 text-[10px] sm:text-xs uppercase tracking-widest leading-none sm:leading-normal">Sakhi-AI · Health Assistant</p>
          <p className="text-[8px] sm:text-[9px] text-rose-400 font-medium leading-none sm:leading-normal mt-0.5 sm:mt-0">Verified WHO/MoHFW guidelines</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {isSpeaking && (
            <button onClick={() => window.speechSynthesis.cancel()}
              className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-amber-100 border border-amber-200 text-amber-700 rounded-md sm:rounded-lg text-[7px] sm:text-[9px] font-black uppercase tracking-widest animate-pulse">
              🔊 Speaking
            </button>
          )}
          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse ${isOnline ? 'bg-emerald-500' : 'bg-amber-400'}`} />
          <span className={`text-[8px] sm:text-[10px] font-black uppercase ${isOnline ? 'text-emerald-700' : 'text-amber-600'}`}>
            {isOnline ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[420px] min-h-[250px]">
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'ai' && (
              <div className="w-8 h-8 bg-rose-600 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-md shadow-rose-100">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="max-w-[85%] sm:max-w-[80%] space-y-1.5">
              <div className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[12px] sm:text-[13px] font-medium leading-relaxed relative ${
                m.role === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-sm'
                  : m.isError
                  ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-sm'
                  : 'bg-white border border-slate-100 text-slate-700 shadow-sm rounded-tl-sm'
              }`}>
                {m.text}
                {m.role === 'ai' && !m.isError && (
                  <div className={`absolute -right-1.5 -top-1.5 w-4.5 h-4.5 sm:w-5 sm:h-5 text-white rounded-full flex items-center justify-center shadow-sm border-2 border-white ${
                    m.grounded === false ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}>
                    {m.grounded === false ? (
                      <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white animate-bounce" />
                    ) : (
                      <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    )}
                  </div>
                )}
              </div>
              {m.role === 'ai' && !m.isError && (
                <div className="flex flex-wrap gap-1.5 pl-1">
                  {m.grounded === false ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[8px] font-black uppercase tracking-tighter border border-amber-100 animate-pulse">
                      ⚠️ RAG Offline · Fallback Mode
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[8px] font-black uppercase tracking-tighter border border-emerald-100">
                      Grounded Protocol Match
                    </span>
                  )}
                  {m.urgency && m.urgency !== 'P4' && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                      URGENCY_COLORS[m.urgency] || URGENCY_COLORS.P4
                    }`}>
                      <Zap className="w-2 h-2" />{m.urgency}
                    </span>
                  )}
                  {(m.sources || []).map((src, si) => (
                    <span key={si} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full text-[8px] font-bold text-slate-400">
                      📚 {src}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center shrink-0 mt-1">
                <User className="w-3.5 h-3.5 text-slate-600" />
              </div>
            )}
            {m.role === 'ai' && !m.isError && (
              <button
                onClick={() => speakResponse(m.text, speakLang, m.urgency)}
                title="Listen to this response"
                className="w-6 h-6 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center shrink-0 mt-1 hover:bg-rose-100 transition-colors opacity-60 hover:opacity-100"
              >
                <span className="text-[10px]">🔊</span>
              </button>
            )}
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="px-4 py-3 bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm">
              <div className="flex gap-1">
                {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}
              </div>
              <p className="text-[9px] text-slate-300 font-medium mt-1">Searching verified guidelines...</p>
            </div>
          </div>
        )}
      </div>

      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {suggestions.map(s => (
            <button key={s} onClick={() => setInput(s)}
              className="px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold rounded-full hover:bg-rose-100 transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 p-2 bg-white border-2 border-slate-100 rounded-2xl focus-within:border-rose-300 transition-all relative z-10">
        <button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            startVoice();
          }}
          className={`p-3 rounded-xl transition-all active:scale-90 relative z-20 ${
            isListening 
              ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-200' 
              : 'bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500'
          }`}
          title="Speak now"
        >
          <Mic className="w-5 h-5" />
        </button>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={isOnline ? 'Ask me anything about your health...' : 'Ask Sakhi (Offline local memory active)...'}
          className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-700 placeholder:text-slate-300 h-11" 
        />
        <button 
          type="button"
          onClick={() => handleSend()} 
          disabled={loading || !input.trim()}
          className="p-3 bg-slate-900 text-white rounded-xl hover:bg-rose-600 transition-all disabled:opacity-30 active:scale-95 shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
