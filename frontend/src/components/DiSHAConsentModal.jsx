/**
 * DiSHA Consent Modal — SwasthAI Guardian
 *
 * Shown once on first login. Persisted in localStorage so it never
 * appears again after consent is given.
 *
 * Aligns with:
 *   • Digital Information Security in Healthcare Act (DISHA) 2023 — India
 *   • IT (Amendment) Act 2008 — Sensitive Personal Data & Information Rules
 *   • WHO Data Privacy in Digital Health 2023
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Eye, CheckCircle, Heart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const STORAGE_KEY = 'swasthai_disha_consent_v1';

export function useConsentGiven() {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function markConsentGiven() {
  localStorage.setItem(STORAGE_KEY, 'true');
}

const DISHA_TEXTS = {
  en: {
    tag: 'DISHA 2023 · DATA PRIVACY',
    title: 'Your Data, Your Right',
    subtitle: 'Your Health Data is Safe and Protected',
    points: [
      {
        icon: Lock,
        color: 'bg-emerald-50 text-emerald-600',
        title: 'Your Data Belongs to You',
        body: 'We store only the health information you choose to share. No data is sold or shared with any third party without your explicit permission.',
        legal: 'Your health data is never sold.'
      },
      {
        icon: Eye,
        color: 'bg-blue-50 text-blue-600',
        title: 'Who Can See Your Data?',
        body: 'Only your assigned ASHA worker, your village NGO, and the government health system can view your records — no one else.',
        legal: 'Only your ASHA worker and Health Dept.'
      },
      {
        icon: ShieldCheck,
        color: 'bg-rose-50 text-rose-600',
        title: 'DISHA Compliance',
        body: "SwasthAI follows India's Digital Information Security in Healthcare Act (DISHA 2023) and IT Act data protection rules.",
        legal: 'In compliance with digital health privacy laws.'
      },
      {
        icon: Heart,
        color: 'bg-pink-50 text-pink-600',
        title: 'You Are in Control',
        body: 'You can request deletion of all your data at any time by contacting your ASHA worker or visiting the nearest PHC.',
        legal: 'Delete your data at any time.'
      }
    ],
    checkbox_title: 'I understand and give my consent',
    checkbox_body: 'I understand and consent to SwasthAI storing my health information as described above, in compliance with DISHA 2023 and the IT Act.',
    btn_agree: 'Yes, I Agree',
    btn_success: 'Consent Recorded — Welcome!',
    footer: 'SwasthAI Guardian · DISHA 2023 Compliant · IT Act 2008 · WHO Digital Health Privacy 2023'
  },
  hi: {
    tag: 'दिशा 2023 · डेटा गोपनीयता',
    title: 'आपका डेटा, आपका हक',
    subtitle: 'आपका स्वास्थ्य डेटा सुरक्षित और संरक्षित है',
    points: [
      {
        icon: Lock,
        color: 'bg-emerald-50 text-emerald-600',
        title: 'आपका डेटा सिर्फ आपका है',
        body: 'हम केवल वही स्वास्थ्य जानकारी संग्रहीत करते हैं जिसे आप साझा करना चुनते हैं। आपकी स्पष्ट अनुमति के बिना कोई भी डेटा किसी तीसरे पक्ष को बेचा या साझा नहीं किया जाता है।',
        legal: 'आपका स्वास्थ्य डेटा कभी नहीं बेचा जाता।'
      },
      {
        icon: Eye,
        color: 'bg-blue-50 text-blue-600',
        title: 'कौन देख सकता है आपका डेटा?',
        body: 'केवल आपकी असाइन की गई आशा कार्यकर्ता (ASHA Worker), आपके गाँव के एनजीओ और सरकारी स्वास्थ्य प्रणाली ही आपके रिकॉर्ड देख सकते हैं — कोई और नहीं।',
        legal: 'केवल आपकी आशा दीदी और स्वास्थ्य विभाग।'
      },
      {
        icon: ShieldCheck,
        color: 'bg-rose-50 text-rose-600',
        title: 'दिशा 2023 अनुपालन',
        body: 'स्वास्थ-एआई भारत के डिजिटल सूचना सुरक्षा स्वास्थ्य सेवा अधिनियम (DISHA 2023) और आईटी अधिनियम के डेटा सुरक्षा नियमों का पालन करता है।',
        legal: 'भारत के डिजिटल स्वास्थ्य डेटा कानून के अनुसार।'
      },
      {
        icon: Heart,
        color: 'bg-pink-50 text-pink-600',
        title: 'नियंत्रण आपके हाथ में है',
        body: 'आप अपनी आशा कार्यकर्ता से संपर्क करके या निकटतम पीएचसी पर जाकर किसी भी समय अपना सारा डेटा हटाने का अनुरोध कर सकते हैं।',
        legal: 'कभी भी अपना डेटा हटवा सकते हैं।'
      }
    ],
    checkbox_title: 'मैं समझता/समझती हूँ और सहमति देता/देती हूँ',
    checkbox_body: 'मैं समझता/समझती हूँ और स्वास्थ-एआई को दिशा 2023 और आईटी अधिनियम के अनुपालन में ऊपर बताए अनुसार मेरी स्वास्थ्य जानकारी संग्रहीत करने की सहमति देता/देती हूँ।',
    btn_agree: 'हाँ, मैं सहमत हूँ',
    btn_success: 'सहमতি दर्ज की गई — स्वागत है!',
    footer: 'स्वास्थ-एआई गार्जियन · दिशा 2023 अनुपालित · आईटी अधिनियम 2008 · डब्ल्यूएचओ डिजिटल स्वास्थ्य गोपनीयता 2023'
  },
  mr: {
    tag: 'दिशा २०२३ · डेटा गोपनीयता',
    title: 'तुमचा डेटा, तुमचा हक्क',
    subtitle: 'तुमचा आरोग्य डेटा सुरक्षित आणि संरक्षित आहे',
    points: [
      {
        icon: Lock,
        color: 'bg-emerald-50 text-emerald-600',
        title: 'तुमचा डेटा फक्त तुमचाच आहे',
        body: 'आम्ही फक्त तुम्ही शेअर करू इच्छित असलेली आरोग्य माहिती साठवतो. तुमच्या स्पष्ट परवानगीशिवाय कोणताही डेटा विकला किंवा कोणत्याही तिसऱ्या पक्षाला दिला जात नाही.',
        legal: 'तुमचा आरोग्य डेटा कधीही विकला जात नाही.'
      },
      {
        icon: Eye,
        color: 'bg-blue-50 text-blue-600',
        title: 'तुमचा डेटा कोण पाहू शकते?',
        body: 'केवळ तुमची नेमलेली आशा सेविका (ASHA Worker), तुमच्या गावातील स्वयंसेवी संस्था (NGO) आणि सरकारी आरोग्य यंत्रणाच तुमचे रेकॉर्ड पाहू शकतात — इतर कोणीही नाही.',
        legal: 'केवळ तुमची आशा ताई आणि आरोग्य विभाग.'
      },
      {
        icon: ShieldCheck,
        color: 'bg-rose-50 text-rose-600',
        title: 'दिशा २०२३ अनुपालन',
        body: 'स्वास्थ-एआई भारताच्या डिजिटल माहिती सुरक्षा आरोग्य कायदा (DISHA 2023) आणि आयटी कायद्याच्या डेटा संरक्षण नियमांचे पालन करते.',
        legal: 'भारताच्या डिजिटल आरोग्य डेटा कायद्यानुसार.'
      },
      {
        icon: Heart,
        color: 'bg-pink-50 text-pink-600',
        title: 'नियंत्रण तुमच्या हातात आहे',
        body: 'तुम्ही तुमच्या आशा सेविकेशी संपर्क साधून किंवा जवळच्या प्राथमिक आरोग्य केंद्राला (PHC) भेट देऊन कधीही तुमचा सर्व डेटा हटवण्याची विनंती करू शकता.',
        legal: 'कधीही तुमचा डेटा काढून घेऊ शकता.'
      }
    ],
    checkbox_title: 'मला समजले आहे आणि मी संमती देत आहे',
    checkbox_body: 'मला समजले आहे आणि दिशा २०२३ आणि आयटी कायद्याच्या अनुपालनामध्ये स्वास्थ-एआई ला वर वर्णन केल्यानुसार माझी आरोग्य माहिती साठवण्याची संमती देत आहे.',
    btn_agree: 'होय, मी सहमत आहे',
    btn_success: 'संमती नोंदवली गेली — स्वागत आहे!',
    footer: 'स्वास्थ-एआई गार्डियन · दिशा २०२३ अनुपालित · आयटी कायदा २००८ · डब्ल्यूएचओ डिजिटल आरोग्य गोपनीयता २०२३'
  },
  ta: {
    tag: 'திஷா 2023 · தரவு தனியுரிமை',
    title: 'உங்கள் தரவு, உங்கள் உரிமை',
    subtitle: 'உங்கள் சுகாதார தரவு பாதுகாப்பாக உள்ளது',
    points: [
      {
        icon: Lock,
        color: 'bg-emerald-50 text-emerald-600',
        title: 'உங்கள் தரவு உங்களுக்கே சொந்தம்',
        body: 'நீங்கள் பகிரத் தேர்ந்தெடுக்கும் சுகாதார தகவல்களை மட்டுமே நாங்கள் சேமிக்கிறோம். உங்கள் அனுமதியின்றி எந்தவொரு தரவும் விற்கப்படாது அல்லது யாருடனும் பகிரப்படாது.',
        legal: 'உங்கள் சுகாதார தரவு ஒருபோதும் விற்கப்படாது.'
      },
      {
        icon: Eye,
        color: 'bg-blue-50 text-blue-600',
        title: 'உங்கள் தரவை யார் பார்க்க முடியும்?',
        body: 'உங்களுக்கு நியமிக்கப்பட்ட ஆஷா (ASHA) பணியாளர், உங்கள் கிராம தொண்டு நிறுவனம் மற்றும் அரசு சுகாதார அமைப்பு மட்டுமே உங்கள் பதிவுகளைப் பார்க்க முடியும் — வேறு யாரும் இல்லை.',
        legal: 'உங்கள் ஆஷா பணியாளர் மற்றும் சுகாதார துறை மட்டுமே.'
      },
      {
        icon: ShieldCheck,
        color: 'bg-rose-50 text-rose-600',
        title: 'திஷா 2023 இணக்கம்',
        body: 'இந்தியாவின் டிஜிட்டல் தகவல் பாதுகாப்பு சுகாதார சட்டம் (DISHA 2023) மற்றும் ஐடி சட்ட தரவு பாதுகாப்பு விதிகளின்படி ஸ்வஸ்த்-AI செயல்படுகிறது.',
        legal: 'டிஜிட்டல் சுகாதார தனியுரிமை சட்டங்களின்படி.'
      },
      {
        icon: Heart,
        color: 'bg-pink-50 text-pink-600',
        title: 'கட்டுப்பாடு உங்கள் கையில்',
        body: 'உங்கள் ஆஷா பணியாளரைத் தொடர்புகொண்டு அல்லது அருகிலுள்ள சுகாதார நிலையத்திற்குச் சென்று எப்போது வேண்டுமானாலும் உங்கள் தரவை நீக்கக் கோரலாம்.',
        legal: 'எப்போது வேண்டுமானாலும் தரவை நீக்கலாம்.'
      }
    ],
    checkbox_title: 'நான் புரிந்து கொண்டு எனது ஒப்புதலை அளிக்கிறேன்',
    checkbox_body: 'திஷா 2023 மற்றும் ஐடி சட்டத்திற்கு இணங்க எனது சுகாதார தகவல்களை சேமிக்க ஸ்வஸ்த்-AI க்கான ஒப்புதலை நான் வழங்குகிறேன்.',
    btn_agree: 'ஆம், நான் ஒப்புக்கொள்கிறேன்',
    btn_success: 'ஒப்புதல் பதிவு செய்யப்பட்டது — வருக!',
    footer: 'ஸ்வஸ்த்-AI கார்டியன் · திஷா 2023 இணக்கம் · ஐடி சட்டம் 2008 · WHO டிஜிட்டல் சுகாதார தனியுரிமை 2023'
  },
  te: {
    tag: 'దిశా 2023 · డేటా గోప్యత',
    title: 'మీ డేటా, మీ హక్కు',
    subtitle: 'మీ ఆరోగ్య సమాచారం సురక్షితంగా ఉంటుంది',
    points: [
      {
        icon: Lock,
        color: 'bg-emerald-50 text-emerald-600',
        title: 'మీ డేటా మీకే సొంతం',
        body: 'మీరు పంచుకోవాలని అనుకున్న ఆరోగ్య సమాచారాన్ని మాత్రమే మేము నిల్వ చేస్తాము. మీ అనుమతి లేకుండా ఏ డేటా అమ్మబడదు లేదా ఇతరులతో పంచుకోబడదు.',
        legal: 'మీ ఆరోగ్య సమాచారం ఎప్పుడూ అమ్మబడదు.'
      },
      {
        icon: Eye,
        color: 'bg-blue-50 text-blue-600',
        title: 'మీ డేటాని ఎవరు చూడగలరు?',
        body: 'మీకు కేటాయించిన ఆశా (ASHA) కార్యకర్త, మీ గ్రామ స్వచ్ఛంద సంస్థ మరియు ప్రభుత్వ ఆరోగ్య వ్యవస్థ మాత్రమే మీ రికార్డులను చూడగలరు — ఇంకెవరూ చూడలేరు.',
        legal: 'మీ ఆశా దీదీ మరియు ఆరోగ్య శాఖ మాత్రమే.'
      },
      {
        icon: ShieldCheck,
        color: 'bg-rose-50 text-rose-600',
        title: 'దిశా 2023 నిబంధనల అమలు',
        body: 'స్వస్థ్-AI భారతదేశ డిజిటల్ సమాచార భద్రతా ఆరోగ్య చట్టం (DISHA 2023) మరియు ఐటి చట్టం డేటా రక్షణ నిబంధనలను పాటిస్తుంది.',
        legal: 'డిజిటల్ ఆరోగ్య డేటా చట్టాల ప్రకారం.'
      },
      {
        icon: Heart,
        color: 'bg-pink-50 text-pink-600',
        title: 'నియంత్రణ మీ చేతుల్లోనే ఉంది',
        body: 'మీరు మీ ఆశా కార్యకర్తను సంప్రదించడం ద్వారా లేదా సమీపంలోని పిహెచ్‌సిని సందర్శించడం ద్వారా ఎప్పుడైనా మీ డేటాను తొలగించమని కోరవచ్చు.',
        legal: 'ఎప్పుడైనా మీ డేటాను తొలగించవచ్చు.'
      }
    ],
    checkbox_title: 'నేను అర్థం చేసుకున్నాను మరియు సమ్మతి ఇస్తున్నాను',
    checkbox_body: 'దిశా 2023 మరియు ఐటి చట్టానికి అనుగుణంగా స్వస్థ్-AI నా ఆరోగ్య సమాచారాన్ని పైన తెలిపిన విధంగా నిల్వ చేయడానికి నేను అంగీకరిస్తున్నాను.',
    btn_agree: 'అవును, నేను అంగీకరిస్తున్నాను',
    btn_success: 'సమ్మతి నమోదు చేయబడింది — స్వాగతం!',
    footer: 'స్వస్థ్-AI గార్డియన్ · దిశా 2023 అనుకూలత · ఐటి చట్టం 2008 · WHO డిజిటల్ హెల్త్ ప్రైవసీ 2023'
  },
  bn: {
    tag: 'দিশা ২০২৩ · ডেটা গোপনীয়তা',
    title: 'আপনার ডেটা, আপনার অধিকার',
    subtitle: 'আপনার স্বাস্থ্যের ডেটা সম্পূর্ণ সুরক্ষিত',
    points: [
      {
        icon: Lock,
        color: 'bg-emerald-50 text-emerald-600',
        title: 'আপনার ডেটা শুধুই আপনার',
        body: 'আমরা কেবল আপনার শেয়ার করা স্বাস্থ্যের তথ্য সংরক্ষণ করি। আপনার স্পষ্ট অনুমতি ছাড়া কোনও ডেটা তৃতীয় পক্ষকে বিক্রি বা শেয়ার করা হয় না।',
        legal: 'আপনার স্বাস্থ্যের ডেটা কখনোই বিক্রি করা হয় না।'
      },
      {
        icon: Eye,
        color: 'bg-blue-50 text-blue-600',
        title: 'কে আপনার ডেটা দেখতে পারে?',
        body: 'শুধুমাত্র আপনার নিযুক্ত আশা কর্মী (ASHA Worker), আপনার গ্রামের এনজিও এবং সরকারি স্বাস্থ্য বিভাগই আপনার রেকর্ড দেখতে পাবে — অন্য কেউ নয়।',
        legal: 'শুধুমাত্র আপনার আশা দিদি এবং স্বাস্থ্য বিভাগ।'
      },
      {
        icon: ShieldCheck,
        color: 'bg-rose-50 text-rose-600',
        title: 'দিশা ২০২৩ মেনে চলা',
        body: 'স্বাস্থ-AI ভারতের ডিজিটাল তথ্য সুরক্ষা স্বাস্থ্য পরিষেবা আইন (DISHA 2023) এবং আইটি আইনের ডেটা সুরক্ষা নিয়ম মেনে চলে।',
        legal: 'ভারতের ডিজিটাল স্বাস্থ্য ডেটা আইন অনুযায়ী।'
      },
      {
        icon: Heart,
        color: 'bg-pink-50 text-pink-600',
        title: 'নিয়ন্ত্রণ আপনার হাতে',
        body: 'আপনি যেকোনো সময় আপনার আশা কর্মীর সাথে যোগাযোগ করে বা নিকটস্থ পিএইচসিতে গিয়ে আপনার সমস্ত ডেটা মুছে ফেলার অনুরোধ করতে পারেন।',
        legal: 'যেকোনো সময় আপনার ডেটা মুছে ফেলতে পারেন।'
      }
    ],
    checkbox_title: 'আমি বুঝতে পেরেছি এবং সম্মতি দিচ্ছি',
    checkbox_body: 'আমি বুঝতে পেরেছি এবং দিশা ২০২৩ ও আইটি আইন মেনে স্বাস্থ-AI-কে উপরে বর্ণিত উপায়ে আমার স্বাস্থ্য সংক্রান্ত তথ্য সংরক্ষণ করার সম্মতি দিচ্ছি।',
    btn_agree: 'হ্যাঁ, আমি সম্মত',
    btn_success: 'সম্মতি নথিভুক্ত করা হয়েছে — স্বাগত!',
    footer: 'স্বাস্থ-AI গার্ডিয়ান · দিশা ২০২৩ অনুগত · আইটি আইন ২০০৮ · হু ডিজিটাল স্বাস্থ্য গোপনীয়তা ২০২৩'
  }
};

export default function DiSHAConsentModal({ onConsent }) {
  const [checked, setChecked] = useState(false);
  const [animating, setAnimating] = useState(false);
  const { lang } = useLanguage();

  const activeTexts = DISHA_TEXTS[lang] || DISHA_TEXTS['en'];

  const handleAccept = () => {
    if (!checked) return;
    setAnimating(true);
    markConsentGiven();
    // Brief success pause before closing
    setTimeout(() => onConsent(), 800);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.88, y: 32 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-lg p-5 sm:p-8 my-4 relative"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-5 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-3 sm:mb-4 ring-4 ring-emerald-100">
            <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
          </div>
          <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] rounded-full border border-emerald-100 mb-2 sm:mb-3">
            {activeTexts.tag}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter">
            {activeTexts.title}
          </h2>
          <p className="text-slate-400 font-bold text-xs sm:text-sm mt-0.5 sm:mt-1">
            {activeTexts.subtitle}
          </p>
        </div>

        {/* Consent Points */}
        <div className="space-y-2 sm:space-y-3 mb-5 sm:mb-7">
          {activeTexts.points.map(({ icon: Icon, color, title, body, legal }) => (
            <div key={title} className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-black text-slate-800 mb-0.5">{title}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-snug">{body}</p>
                <p className="text-[9px] sm:text-[10px] text-emerald-600 font-bold mt-1">{legal}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Checkbox */}
        <label className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all mb-5 sm:mb-6 ${
          checked ? 'bg-emerald-50 border-emerald-400' : 'bg-slate-50 border-slate-200 hover:border-emerald-200'
        }`}>
          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
            checked ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'
          }`}>
            {checked && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
          </div>
          <input type="checkbox" className="hidden" checked={checked} onChange={e => setChecked(e.target.checked)} />
          <div>
            <p className="text-[11px] sm:text-xs font-black text-slate-800">
              {activeTexts.checkbox_title}
            </p>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-0.5">
              {activeTexts.checkbox_body}
            </p>
          </div>
        </label>

        {/* CTA */}
        <button
          onClick={handleAccept}
          disabled={!checked || animating}
          className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg ${
            checked && !animating
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100 active:scale-[0.98]'
              : 'bg-slate-100 text-slate-300 cursor-not-allowed'
          }`}
        >
          {animating ? (
            <><CheckCircle className="w-4 h-4" /> {activeTexts.btn_success}</>
          ) : (
            <><ShieldCheck className="w-4 h-4" /> {activeTexts.btn_agree}</>
          )}
        </button>

        <p className="text-center text-[9px] text-slate-300 font-medium mt-4">
          {activeTexts.footer}
        </p>
      </motion.div>
    </div>
  );
}
