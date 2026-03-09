// src/components/mentor/MentorDock.jsx
import React, { useState, useRef, useEffect } from "react";
import { Sparkles } from "lucide-react"; // ADDED: For modern AI iconography
import { useToast } from "../../context/ToastContext";
import { getTodayPlan } from "../../services/planner";
import { askAiChat } from "../../api/ai";

const MentorDock = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [plan, setPlan] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const chatEndRef = useRef(null);

  const recognitionRef = useRef(null);
  const { addToast } = useToast();

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
        {/* THE REDESIGNED BUTTON */}
        <button 
          className={`mentor-toggle ${isOpen ? 'active' : ''}`} 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle AI Coach"
        >
          <div className="glow-aura"></div>
          <Sparkles className="sparkle-icon" strokeWidth={2.5} />
        </button>

        <div className="mentor-panel">
          <div className="mentor-header">
            <h3>AI Coach</h3>
            <button className="close" onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="mentor-body">
            
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
          bottom: 24px;
          right: 24px;
          z-index: 1000;
        }

        /* ════════════════════════════════════════════════════════════════════════
           NEW DESIGN: The "Living Orb" Button 
        ════════════════════════════════════════════════════════════════════════ */
        .mentor-toggle {
          position: relative;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4f46e5, #ec4899); /* Deep indigo to hot pink */
          border: 2px solid rgba(255, 255, 255, 0.2);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          
          /* Beaird's Depth: Outer drop shadow + Inner bevel highlight */
          box-shadow: 
            0 10px 25px -5px rgba(236, 72, 153, 0.4),
            0 8px 10px -6px rgba(79, 70, 229, 0.5),
            inset 0 2px 4px rgba(255, 255, 255, 0.3);
            
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
        }

        /* The Breathing Aura */
        .glow-aura {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #ec4899);
          z-index: -1;
          filter: blur(12px);
          opacity: 0.5;
          animation: breathe 3s infinite alternate ease-in-out;
        }

        /* Robbins' Interactive States */
        .mentor-toggle:hover { 
          transform: translateY(-4px) scale(1.05); 
          box-shadow: 
            0 20px 30px -10px rgba(236, 72, 153, 0.5),
            inset 0 2px 4px rgba(255, 255, 255, 0.4);
        }
        .mentor-toggle:active {
          transform: translateY(2px) scale(0.95);
        }
        .mentor-toggle.active {
          background: #1e293b; /* Turn dark when open to contrast the white panel */
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .mentor-toggle.active .glow-aura {
          display: none;
        }
        
        .sparkle-icon {
          width: 28px;
          height: 28px;
          color: white;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .mentor-toggle:hover .sparkle-icon {
          transform: rotate(15deg) scale(1.1);
        }

        @keyframes breathe {
          0% { transform: scale(0.95); opacity: 0.4; }
          100% { transform: scale(1.1); opacity: 0.7; }
        }
        /* ════════════════════════════════════════════════════════════════════════ */

        .mentor-panel {
          position: absolute;
          bottom: 84px;
          right: 0;
          width: 380px;
          border-radius: 20px;
          background: #ffffff;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
          overflow: hidden;
          transform: scale(0);
          transform-origin: bottom right;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
          opacity: 0;
          display: flex;
          flex-direction: column;
        }
        .mentor-dock.open .mentor-panel {
          transform: scale(1);
          opacity: 1;
        }
        
        /* Rest of the styles are perfectly preserved below */
        .mentor-header {
          padding: 16px 20px;
          background: linear-gradient(135deg, #4f46e5, #ec4899);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .mentor-header h3 { margin: 0; font-size: 16px; font-weight: 600; letter-spacing: 0.3px; }
        .close { background: none; border: none; color: white; font-size: 26px; cursor: pointer; opacity: 0.8; transition: opacity 0.2s; }
        .close:hover { opacity: 1; }
        .mentor-body { 
          padding: 20px; 
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
        .chat-container::-webkit-scrollbar { width: 6px; }
        .chat-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .chat-bubble {
          max-width: 85%;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.5;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .chat-bubble.user {
          align-self: flex-end;
          background: #f1f5f9;
          color: #334155;
          border-bottom-right-radius: 4px;
        }
        .chat-bubble.ai {
          align-self: flex-start;
          background: linear-gradient(135deg, rgba(79,70,229,0.08), rgba(236,72,153,0.08));
          color: #1e293b;
          border-bottom-left-radius: 4px;
        }
        .loading .dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          margin: 0 2px;
          background: #4f46e5;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .loading .dot:nth-child(1) { animation-delay: -0.32s; }
        .loading .dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
        
        .chat-controls {
          border-top: 1px solid #f1f5f9;
          padding-top: 16px;
          background: white;
        }
        .text-input-row {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        .chat-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .chat-input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
        .send-btn {
          padding: 0 20px;
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .send-btn:hover:not(:disabled) { background: #4338ca; }
        .send-btn:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }
        
        .plan-container { margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; }
        .outcomes, .blocks { margin-bottom: 16px; }
        .outcomes h4, .blocks h4 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
        .outcomes ol { margin: 0; padding-left: 20px; }
        .outcomes li { margin: 6px 0; font-size: 14px; color: #334155;}
        .block {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: #f8fafc;
          border-radius: 8px;
          font-size: 13px;
          margin: 6px 0;
          color: #334155;
          border: 1px solid #f1f5f9;
        }
        .voice-btn {
          width: 100%;
          padding: 14px;
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          background: #f8fafc;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .voice-btn:hover:not(:disabled) { border-color: #94a3b8; color: #475569; }
        .voice-btn.listening {
          border-color: #ec4899;
          color: #ec4899;
          background: rgba(236, 72, 153, 0.05);
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(236,72,153, 0.4); } 50% { box-shadow: 0 0 0 8px rgba(236,72,153, 0); } }
        .transcript { margin: 12px 0 0; font-style: italic; color: #94a3b8; font-size: 13px; text-align: center;}
        .btn { width: 100%; padding: 12px; border-radius: 12px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s;}
        .btn--primary { background: #4f46e5; color: white; }
        .btn--primary:hover { background: #4338ca; }
        .btn--outline { background: transparent; border: 1px solid #cbd5e1; color: #475569; }
        .btn--outline:hover { background: #f8fafc; }
        .mb-4 { margin-bottom: 16px; }
        .mt-2 { margin-top: 8px; }
      `}</style>
    </>
  );
};

export default MentorDock;
