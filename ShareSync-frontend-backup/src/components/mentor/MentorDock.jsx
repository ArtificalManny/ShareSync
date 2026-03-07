// src/components/mentor/MentorDock.jsx
import React, { useState, useRef, useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import { getTodayPlan } from "../../services/planner";
import { askAiChat } from "../../api/ai"; // ADDED: New AI Client

const MentorDock = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [plan, setPlan] = useState(null);
  
  // ADDED: Chat State
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const chatEndRef = useRef(null);

  const recognitionRef = useRef(null);
  const { addToast } = useToast();

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoadingAI]);

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

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => {
        setIsListening(false);
        addToast({ title: "Voice input failed", variant: "destructive" });
      };
    }
  }, [addToast]);

  // ADDED: Send Message Handler (Wires up the actual AI)
  const handleSendMessage = async (textToSend = chatInput) => {
    if (!textToSend.trim() || isLoadingAI) return;

    const newMsg = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    setTranscript("");
    setIsLoadingAI(true);

    try {
      const response = await askAiChat({ prompt: textToSend });
      setMessages((prev) => [...prev, { role: "ai", content: response.text }]);
    } catch (err) {
      addToast({ title: "AI Coach offline", variant: "destructive" });
      setMessages((prev) => [...prev, { role: "ai", content: "Sorry, I'm having trouble connecting to the brain right now." }]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript("");
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // If voice transcript finishes, automatically send it to chat
  useEffect(() => {
    if (!isListening && transcript.trim().length > 0) {
       handleSendMessage(transcript);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

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
            <h3>AI Coach</h3>
            <button className="close" onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="mentor-body">
            
            {/* EXISTING FEATURE: Predictive Plan */}
            {plan && (
              <div className="plan-container">
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

                <button className="btn btn--primary full mb-4" onClick={startSprint}>
                  Start Sprint on "{plan.suggestedFocusTask?.title || "Top Task"}"
                </button>
              </div>
            )}

            {/* NEW FEATURE: AI Chat Interface */}
            <div className="chat-container">
              {messages.length === 0 && !plan && (
                <div className="text-center text-slate-500 mb-4 text-sm">
                  How can I help you build momentum today?
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.role}`}>
                  {msg.content}
                </div>
              ))}
              
              {isLoadingAI && (
                <div className="chat-bubble ai loading">
                  <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-controls">
              <div className="voice-input">
                <button
                  className={`voice-btn ${isListening ? "listening" : ""}`}
                  onClick={startListening}
                  disabled={isListening}
                >
                  <span className="mic">🎙️</span>
                  {isListening ? "Listening..." : "Hold to speak"}
                </button>
                {transcript && <p className="transcript">{transcript}</p>}
              </div>

              <div className="text-input-row">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask the coach..."
                  className="chat-input"
                  disabled={isLoadingAI}
                />
                <button 
                  onClick={() => handleSendMessage()} 
                  disabled={isLoadingAI || !chatInput.trim()}
                  className="send-btn"
                >
                  Send
                </button>
              </div>

              {messages.length === 0 && !plan && (
                <button className="btn btn--outline full mt-2" onClick={generatePlan}>
                  Generate Daily Plan
                </button>
              )}
            </div>

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
          font-size: 20px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          transition: transform 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mentor-toggle:hover { transform: scale(1.1); }
        .mentor-panel {
          position: absolute;
          bottom: 70px;
          right: 0;
          width: 360px;
          border-radius: 16px;
          background: white;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          overflow: hidden;
          transform: scale(0);
          transform-origin: bottom right;
          transition: transform 0.25s ease;
          display: flex;
          flex-direction: column;
        }
        .mentor-dock.open .mentor-panel {
          transform: scale(1);
        }
        .mentor-header {
          padding: 16px;
          background: #6366f1;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .mentor-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
        .close { background: none; border: none; color: white; font-size: 24px; cursor: pointer; }
        .mentor-body { 
          padding: 16px; 
          max-height: 65vh; 
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .chat-container {
          flex-grow: 1;
          overflow-y: auto;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-right: 4px;
        }
        .chat-bubble {
          max-width: 85%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.4;
        }
        .chat-bubble.user {
          align-self: flex-end;
          background: #f1f5f9;
          color: #334155;
          border-bottom-right-radius: 4px;
        }
        .chat-bubble.ai {
          align-self: flex-start;
          background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(236,72,153,0.1));
          color: #1e293b;
          border-bottom-left-radius: 4px;
        }
        .loading .dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          margin: 0 2px;
          background: #6366f1;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .loading .dot:nth-child(1) { animation-delay: -0.32s; }
        .loading .dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
        
        .chat-controls {
          border-top: 1px solid #e2e8f0;
          padding-top: 16px;
          background: white;
        }
        .text-input-row {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .chat-input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
        }
        .chat-input:focus { border-color: #6366f1; }
        .send-btn {
          padding: 0 16px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
        }
        .send-btn:disabled { background: #cbd5e1; cursor: not-allowed; }
        
        /* Preserved Plan Styles */
        .plan-container { margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
        .outcomes, .blocks { margin-bottom: 16px; }
        .outcomes h4, .blocks h4 { margin: 0 0 8px; font-size: 14px; color: #334155; }
        .outcomes ol { margin: 0; padding-left: 20px; }
        .outcomes li { margin: 4px 0; font-size: 13px; color: #475569;}
        .block {
          display: flex;
          justify-content: space-between;
          padding: 6px 8px;
          background: #f8fafc;
          border-radius: 8px;
          font-size: 13px;
          margin: 4px 0;
          color: #475569;
        }
        .voice-btn {
          width: 100%;
          padding: 12px;
          border: 2px dashed #cbd5e1;
          border-radius: 8px;
          background: transparent;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .voice-btn.listening {
          border-color: #ec4899;
          background: rgba(236, 72, 153, 0.05);
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .transcript { margin: 8px 0; font-style: italic; color: #94a3b8; font-size: 13px;}
        .btn { width: 100%; padding: 10px; border-radius: 8px; font-weight: 500; cursor: pointer; border: none;}
        .btn--primary { background: #6366f1; color: white; }
        .btn--outline { background: transparent; border: 1px solid #cbd5e1; color: #475569; }
        .mb-4 { margin-bottom: 16px; }
        .mt-2 { margin-top: 8px; }
      `}</style>
    </>
  );
};

export default MentorDock;
