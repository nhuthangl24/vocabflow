export function playTTS(text: string, lang: string = "en-US") {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  
  // Clear any stuck utterances
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Basic language mapping if needed
  const langLower = lang.toLowerCase();
  if (langLower.includes('english') || langLower.includes('anh') || langLower.startsWith('en')) {
    utterance.lang = "en-US";
  } else if (langLower.includes('chinese') || langLower.includes('trung') || langLower.startsWith('zh')) {
    utterance.lang = "zh-CN";
  } else if (langLower.includes('japanese') || langLower.includes('nhật') || langLower.startsWith('ja')) {
    utterance.lang = "ja-JP";
  } else if (langLower.includes('korean') || langLower.includes('hàn') || langLower.startsWith('ko')) {
    utterance.lang = "ko-KR";
  } else if (langLower.includes('french') || langLower.includes('pháp') || langLower.startsWith('fr')) {
    utterance.lang = "fr-FR";
  } else {
    utterance.lang = lang; // fallback to raw string
  }

  // Find a female voice
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    // Priority: matching language AND female
    const langPrefix = utterance.lang.split('-')[0];
    const langVoices = voices.filter(v => v.lang.startsWith(langPrefix));
    
    // Look for female indicators in name
    const femaleKeywords = ['female', 'samantha', 'zira', 'victoria', 'karen', 'moira', 'tessa', 'ava', 'allison', 'susan'];
    const femaleVoice = langVoices.find(v => femaleKeywords.some(kw => v.name.toLowerCase().includes(kw)));
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    } else if (langVoices.length > 0) {
      // Fallback to first voice in that language
      utterance.voice = langVoices[0];
    }
  }
  
  window.speechSynthesis.speak(utterance);
}
