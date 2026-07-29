import { apiClient } from './ApiClient';

/**
 * Activates browser-native SpeechRecognition, triggers callback with the transcript,
 * and automatically logs speech transcripts to backend databases.
 */
export const startSpeechToText = (onTranscript, onStateChange, userEmail) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-IN'; // Indian English (good for Tamil-accents too)
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    if (onStateChange) onStateChange(true);
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    if (onTranscript) onTranscript(transcript);
    
    // Log speech conversion to backend DB
    if (userEmail) {
      try {
        await apiClient.logSpeechText(userEmail, transcript);
      } catch (err) {
        console.warn("[STT Utility] Failed to log speech text:", err);
      }
    }
  };

  recognition.onerror = (event) => {
    console.error("[STT Utility] Recognition error:", event.error);
    if (onStateChange) onStateChange(false);
  };

  recognition.onend = () => {
    if (onStateChange) onStateChange(false);
  };

  recognition.start();
  return recognition;
};
