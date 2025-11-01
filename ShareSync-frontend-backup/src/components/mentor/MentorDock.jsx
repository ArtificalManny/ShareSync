// src/components/mentor/MentorDock.jsx
import React, { useState, useRef, useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import { getTodayPlan } from "../../services/planner";

const MentorDock = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [plan, setPlan] = useState(null);
  const recognitionRef = useRef(null);
  const { addToast } = useToast();

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (e) => {
        const result = Array.from(e.results)
          .map((r) => r[0])
          .map((r) => r.transcript)
          .join("");
        setTranscript(result);
      };

      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => {
        setIsListening(false);
        addToast({ title: "Voice input failed", variant: "destructive" });
      };
    }
  }, [addToast]);

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript("");
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const generatePlan = async () => {
    try {
      const data = await getTodayPlan({ includeAI: true });
      setPlan(data);
      addToast({ title: "Plan generated!", variant: "default" });
    } catch (err) {
      addToast({ title: "Failed to generate plan", variant: "destructive" });
    }
  };

  const startSprint = () => {
    window.dispatchEvent(new CustomEvent("start-tenx-sprint"));
    addToast({ title: "25:00 sprint started!", variant: "default" });
  };

  return (
    <>
      <div className={`mentor-dock glass ${isOpen ? "open" : ""}`}>
        <button className="mentor-toggle" onClick={() => setIsOpen(!isOpen)}>
          <span className="icon">AI</span>
        </button>

        <div className="mentor-panel">
          <div className="mentor-header">
            <h3>Predictive Mentor</h3>
            <button className="close" onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="mentor-body">
            {plan ? (
              <>
                <div className="outcomes">
                  <h4>Top 3 Outcomes</h4>
                  <ol>
                    {plan.outcomes.map((o, i) => (
                      <li key={i}>{o.title}</li>
                    ))}
                  </ol>
                </div>

                <div className="blocks">
                  <h4>Time Blocks</h4>
                  {plan.blocks.map((b, i) => (
                    <div key={i} className="block">
                      <span>{b.label}</span>
                      <span className="time">
                        {new Date(b.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}–
                        {new Date(b.end).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>

                <button className="btn btn--primary full" onClick={startSprint}>
                  Start Sprint on "{plan.suggestedFocusTask?.title || "Top Task"}"
                </button>
              </>
            ) : (
              <div className="voice-input">
                <button
                  className={`voice-btn ${isListening ? "listening" : ""}`}
                  onClick={startListening}
                  disabled={isListening}
                >
                  <span className="mic">Microphone</span>
                  {isListening ? "Listening..." : "Hold to speak"}
                </button>
                <p className="transcript">{transcript || "Say: “Plan my day”"}</p>
                <button className="btn btn--outline full" onClick={generatePlan}>
                  Generate Plan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .mentor-dock {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }
        .mentor-toggle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #ec4899);
          color: white;
          border: none;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }
        .mentor-toggle:hover { transform: scale(1.1); }
        .mentor-panel {
          position: absolute;
          bottom: 70px;
          right: 0;
          width: 340px;
          border-radius: 16px;
          overflow: hidden;
          transform: scale(0);
          transform-origin: bottom right;
          transition: transform 0.25s ease;
        }
        .mentor-dock.open .mentor-panel {
          transform: scale(1);
        }
        .mentor-header {
          padding: 12px 16px;
          background: var(--accent, #6366f1);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .mentor-header h3 { margin: 0; font-size: 16px; }
        .close { background: none; border: none; color: white; font-size: 20px; cursor: pointer; }
        .mentor-body { padding: 16px; max-height: 60vh; overflow-y: auto; }
        .outcomes, .blocks { margin-bottom: 16px; }
        .outcomes h4, .blocks h4 { margin: 0 0 8px; font-size: 14px; color: var(--text); }
        .outcomes ol { margin: 0; padding-left: 20px; }
        .outcomes li { margin: 4px 0; font-size: 13px; }
        .block {
          display: flex;
          justify-content: space-between;
          padding: 6px 8px;
          background: var(--bg, #f9f9f9);
          border-radius: 8px;
          font-size: 13px;
          margin: 4px 0;
        }
        .voice-btn {
          width: 100%;
          padding: 16px;
          border: 2px dashed var(--border, #ddd);
          border-radius: 12px;
          background: transparent;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .voice-btn.listening {
          border-color: #ec4899;
          background: rgba(236, 72, 153, 0.05);
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .transcript { margin: 12px 0; font-style: italic; color: var(--muted); min-height: 20px; }
        .btn { width: 100%; margin-top: 8px; }
        .full { width: 100%; }
      `}</style>
    </>
  );
};

export default MentorDock;