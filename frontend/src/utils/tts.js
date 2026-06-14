const translationMap = {
  "Welcome to Guided Healthcare Mode. Tap any option to start checking your health.": "मार्गदर्शित स्वास्थ्य सेवा में आपका स्वागत है। जांच के लिए किसी भी विकल्प को दबाएं।",
  "Fever and viral check. Please answer the simple questions.": "बुखार और सर्दी जांच। कृपया सरल सवालों का जवाब दें।",
  "Pregnancy tracking. Monitor your blood pressure and blood sugar.": "गर्भावस्था देखभाल। अपने रक्तचाप और शुगर की जांच करें।",
  "Emergency support. Tap the red button to call an ambulance.": "आपातकालीन सहायता। एम्बुलेंस बुलाने के लिए लाल बटन दबाएं।",
  "Speak to Sakhi. Ask your health queries.": "सखी चैट से बात करें। अपना सवाल पूछें।",
  "Child growth monitor. Enter child weight and height.": "बाल पोषण जांच। बच्चे का वजन और लंबाई दर्ज करें।",
  "Fever check. Press Next to start.": "बुखार जांच। शुरू करने के लिए अगला दबाएं।",
  "Do you have high fever, above 101 degrees?": "क्या आपको तेज़ बुखार है, एक सौ एक डिग्री से ऊपर?",
  "Are you shivering or feeling very cold?": "क्या आपको कंपकंपी लग रही है या बहुत ठंड लग रही है?",
  "Do you have severe joint pain or pain behind your eyes?": "क्या आपके जोड़ों में तेज़ दर्द है या आँखों के पीछे दर्द है?",
  "Do you have red spots or skin rashes?": "क्या आपके शरीर पर लाल चकत्ते या दाने हैं?",
  "Yes": "हाँ",
  "No": "नहीं",
  "Assessment complete.": "जांच पूरी हो चुकी है।"
};

const findHindiVoice = (list) => {
  return list.find(v => v.lang.includes('hi-IN') && v.name.toLowerCase().includes('neerja'))
    || list.find(v => v.lang.includes('hi-IN') && v.name.toLowerCase().includes('google'))
    || list.find(v => v.lang.includes('hi-IN'))
    || list.find(v => v.name.toLowerCase().includes('hindi'));
};

export const speak = (text, lang = 'hi') => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const doSpeak = (availableVoices) => {
    const hiVoice = findHindiVoice(availableVoices);
    const utterance = new SpeechSynthesisUtterance();

    if (hiVoice) {
      let speechText = text;
      if (translationMap[text]) {
        speechText = translationMap[text];
      } else {
        speechText = speechText
          .replace(/Potential condition:\s*Malaria/i, "संभावित बीमारी मलेरिया है")
          .replace(/Potential condition:\s*Dengue/i, "संभावित बीमारी डेंगू है")
          .replace(/Potential condition:\s*Chickenpox/i, "संभावित बीमारी चेचक है")
          .replace(/Potential condition:\s*Viral Fever & Cold/i, "संभावित बीमारी सामान्य वायरल बुखार है")
          .replace(/Advice:\s*/i, "सलाह: ")
          .replace(/Assessment complete\.\s*Risk:\s*High Risk/i, "गर्भावस्था परीक्षण पूरा हुआ। जोखिम स्तर: अत्यंत उच्च।")
          .replace(/Assessment complete\.\s*Risk:\s*Medium Risk/i, "गर्भावस्था परीक्षण पूरा हुआ। जोखिम स्तर: मध्यम।")
          .replace(/Assessment complete\.\s*Risk:\s*Low Risk/i, "गर्भावस्था परीक्षण पूरा हुआ। जोखिम स्तर: सामान्य और सुरक्षित।")
          .replace(/ALERT:\s*Severe high blood pressure/i, "चेतावनी: आपका ब्लड प्रेशर बहुत अधिक है")
          .replace(/Warning:\s*Slightly high vitals/i, "सावधानी: आपके वाइटल्स थोड़े बढ़े हुए हैं")
          .replace(/Congratulations! Your pregnancy vitals are in the normal range/i, "बधाई हो, आपके वाइटल्स बिल्कुल सामान्य हैं");
      }
      utterance.text = speechText;
      utterance.voice = hiVoice;
      utterance.lang = 'hi-IN';
      utterance.rate = 0.85;
    } else {
      utterance.text = text;
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
    }
    window.speechSynthesis.speak(utterance);
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    doSpeak(voices);
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      doSpeak(window.speechSynthesis.getVoices());
    };
  }
};
