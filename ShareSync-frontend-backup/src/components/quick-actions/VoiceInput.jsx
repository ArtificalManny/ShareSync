import React, { useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import useVoiceRecognition from '../../hooks/useVoiceRecognition';

const VoiceInput = ({ onTranscript, value, onChange }) => {
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition();

  // Update parent when transcript changes
  useEffect(() => {
    if (transcript) {
      const newValue = value ? `${value} ${transcript}` : transcript;
      onChange(newValue);
      onTranscript?.(transcript);
      resetTranscript();
    }
  }, [transcript]);

  if (!isSupported) {
    return null; // Hide if not supported
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        className={`p-3 rounded-xl transition-all ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : 'bg-purple-600 hover:bg-purple-700'
        } text-white shadow-lg active:scale-95`}
        title={isListening ? 'Stop recording' : 'Start voice input'}
      >
        {isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {/* Recording indicator */}
      {isListening && (
        <div className="absolute -bottom-2 -right-2">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
      )}

      {/* Interim transcript preview */}
      {isListening && interimTranscript && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-slate-800 border border-purple-500/30 rounded-lg p-3 shadow-xl z-50">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            <span className="text-xs text-purple-400 font-semibold">Listening...</span>
          </div>
          <p className="text-sm text-slate-300 italic">"{interimTranscript}"</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-red-500/10 border border-red-500/30 rounded-lg p-2 shadow-xl z-50">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
