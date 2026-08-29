// src/components/mentor/MentorDock.jsx
import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Mic, Send, Zap } from "lucide-react"; 
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
      console.log("🧠 RAW AI RESPONSE:", response); 
      
      // ══════════════════════════════════════════════════════════
      // BULLETPROOF STRING EXTRACTOR
      // ══════════════════════════════════════════════════════════
      let aiText = "";
      
      if (typeof response === "string") {
        aiText = response;
      } else if (response?.data?.text) {
        aiText = response.data.text;
      } else if (response?.text) {
        aiText = response.text;
      } else if (response?.message) {
        aiText = response.message;
      } else if (response?.data) {
        aiText = response.data;
      } else {
        aiText = response;
      }

      // React Crash Prevention: If it's still an object, extract its properties or stringify
      if (typeof aiText === "object" && aiText !== null) {
        aiText = aiText.text || aiText.message || JSON.stringify(aiText);
      }
      
      // Ultimate fallback to guarantee a string type
      if (typeof aiText !== "string") {
        aiText = JSON.stringify(aiText);
      }
      // ══════════════════════════════════════════════════════════

      setMessages((prev) => [...prev, { role: "ai", content: aiText }]);
    } catch (err) {
      console.error("AI Error:", err);
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
      <div className={`mentor-dock ${isOpen ? "open" : ""}`}>
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
            <div className="header-title">
              <Sparkles className="w-4 h-4 text-violet-200" />
              <h3>AI Coach</h3>
            </div>
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

                <button className="btn-sprint" onClick={startSprint}>
                  <Zap className="w-4 h-4 fill-current" />
                  Start Sprint: "{plan.suggestedFocusTask?.title || "Top Task"}"
                </button>
              </div>
            )}

            <div className="chat-container">
              {messages.length === 0 && !plan && (
                <div className="empty-state">
                  <div className="empty-icon-wrap">
                    <Sparkles className="w-6 h-6 text-violet-500" />
                  </div>
                  <p>How can I help you build momentum today?</p>
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
              {transcript && (
                <div className="transcript-bubble">
                  <p>"{transcript}"</p>
                </div>
              )}

              <div className="input-arena">
                <button
                  className={`mic-btn ${isListening ? "listening" : ""}`}
                  onClick={startListening}
                  disabled={isListening}
                  title="Use voice input"
                >
                  <Mic className="w-5 h-5" />
                </button>

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
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {messages.length === 0 && !plan && (
                <button className="generate-plan-btn" onClick={generatePlan}>
                  Generate Daily Plan
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .mentor-dock { position: fixed; bottom: 24px; right: 24px; z-index: 1000; }
        .mentor-toggle { position: relative; width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #4f46e5); border: 2px solid rgba(255, 255, 255, 0.2); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.4), 0 8px 10px -6px rgba(79, 70, 229, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.3); transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease; }
        .glow-aura { position: absolute; inset: -6px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #ec4899); z-index: -1; filter: blur(14px); opacity: 0.6; animation: breathe 3s infinite alternate ease-in-out; }
        .mentor-toggle:hover { transform: translateY(-4px) scale(1.05); box-shadow: 0 20px 30px -10px rgba(124, 58, 237, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.4); }
        .mentor-toggle:active { transform: translateY(2px) scale(0.95); }
        .mentor-toggle.active { background: #1e293b; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .mentor-toggle.active .glow-aura { display: none; }
        .sparkle-icon { width: 28px; height: 28px; color: white; transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .mentor-toggle:hover .sparkle-icon { transform: rotate(15deg) scale(1.1); }
        @keyframes breathe { 0% { transform: scale(0.95); opacity: 0.4; } 100% { transform: scale(1.1); opacity: 0.7; } }
        .mentor-panel { position: absolute; bottom: 84px; right: 0; width: 400px; border-radius: 24px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(226, 232, 240, 0.8); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05); overflow: hidden; transform: scale(0); transform-origin: bottom right; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease; opacity: 0; display: flex; flex-direction: column; }
        .mentor-dock.open .mentor-panel { transform: scale(1); opacity: 1; }
        .mentor-header { padding: 16px 24px; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; display: flex; justify-content: space-between; align-items: center; }
        .header-title { display: flex; align-items: center; gap: 8px; }
        .mentor-header h3 { margin: 0; font-size: 16px; font-weight: 600; letter-spacing: 0.3px; }
        .close { background: none; border: none; color: white; font-size: 28px; font-weight: 300; line-height: 1; cursor: pointer; opacity: 0.7; transition: opacity 0.2s, transform 0.2s; }
        .close:hover { opacity: 1; transform: scale(1.1); }
        .mentor-body { padding: 24px; height: 500px; max-height: 70vh; display: flex; flex-direction: column; }
        .chat-container { flex-grow: 1; overflow-y: auto; margin-bottom: 20px; display: flex; flex-direction: column; gap: 16px; padding-right: 8px; }
        .chat-container::-webkit-scrollbar { width: 6px; }
        .chat-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .empty-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #64748b; font-size: 14px; font-weight: 500; gap: 12px; opacity: 0.8; }
        .empty-icon-wrap { width: 48px; height: 48px; border-radius: 50%; background: #f5f3ff; display: flex; align-items: center; justify-content: center; }
        .chat-bubble { max-width: 85%; padding: 14px 18px; font-size: 14.5px; line-height: 1.6; }
        .chat-bubble.user { align-self: flex-end; background: #f1f5f9; color: #1e293b; border-radius: 18px 18px 4px 18px; font-weight: 500; }
        .chat-bubble.ai { align-self: flex-start; background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px -4px rgba(0,0,0,0.05); color: #334155; border-radius: 18px 18px 18px 4px; white-space: pre-wrap; word-break: break-word; }
        .loading .dot { display: inline-block; width: 6px; height: 6px; margin: 0 2px; background: #7c3aed; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
        .loading .dot:nth-child(1) { animation-delay: -0.32s; }
        .loading .dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); opacity: 0.3;} 40% { transform: scale(1); opacity: 1; } }
        .chat-controls { display: flex; flex-direction: column; gap: 12px; }
        .transcript-bubble { align-self: flex-end; background: rgba(124, 58, 237, 0.1); color: #7c3aed; padding: 8px 14px; border-radius: 12px; font-size: 13px; font-style: italic; animation: fadeIn 0.3s ease; }
        .input-arena { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px; border-radius: 16px; transition: border-color 0.2s, box-shadow 0.2s; }
        .input-arena:focus-within { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1); background: #ffffff; }
        .mic-btn { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; border: none; background: transparent; color: #64748b; cursor: pointer; transition: all 0.2s; }
        .mic-btn:hover:not(:disabled) { background: #e2e8f0; color: #1e293b; }
        .mic-btn.listening { background: #fdf2f8; color: #ec4899; animation: pulse-mic 1.5s infinite; }
        .chat-input { flex: 1; border: none; background: transparent; font-size: 14.5px; color: #1e293b; padding: 8px 4px; outline: none; }
        .chat-input::placeholder { color: #94a3b8; }
        .send-btn { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #7c3aed; color: white; border: none; border-radius: 12px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 10px -2px rgba(124, 58, 237, 0.3); }
        .send-btn:hover:not(:disabled) { background: #6d28d9; transform: translateY(-1px); }
        .send-btn:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; box-shadow: none; }
        .plan-container { margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; }
        .outcomes h4, .blocks h4 { margin: 0 0 10px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; }
        .outcomes ol { margin: 0 0 16px; padding-left: 20px; }
        .outcomes li { margin: 8px 0; font-size: 14px; font-weight: 500; color: #334155; }
        .block { display: flex; justify-content: space-between; padding: 10px 14px; background: #f8fafc; border-radius: 10px; font-size: 13.5px; font-weight: 500; margin: 8px 0; color: #334155; border: 1px solid #e2e8f0; }
        .block .time { color: #64748b; font-size: 13px; }
        .btn-sprint { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px; background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; border: none; border-radius: 14px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 6px 15px -3px rgba(124, 58, 237, 0.3); margin-top: 16px; }
        .btn-sprint:hover { box-shadow: 0 10px 20px -5px rgba(124, 58, 237, 0.4); transform: translateY(-2px); }
        .generate-plan-btn { width: 100%; padding: 14px; background: white; border: 2px solid #e2e8f0; color: #475569; border-radius: 14px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; }
        .generate-plan-btn:hover { border-color: #cbd5e1; background: #f8fafc; color: #1e293b; }
        @keyframes pulse-mic { 0%, 100% { box-shadow: 0 0 0 0 rgba(236,72,153, 0.3); } 50% { box-shadow: 0 0 0 6px rgba(236,72,153, 0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        /* openshare-native-mentor-position-v1 */
        @media (max-width: 767px) {
          .mentor-dock {
            right: 16px;
            bottom:
              calc(
                5.25rem +
                env(safe-area-inset-bottom, 0px)
              );
            z-index: 140;
          }

          .mentor-toggle {
            width: 52px;
            height: 52px;
            border-width: 1px;
            box-shadow:
              0 14px 32px -8px
                rgba(124, 58, 237, 0.48),
              inset 0 1px 2px
                rgba(255, 255, 255, 0.28);
          }

          .glow-aura {
            inset: -4px;
            filter: blur(10px);
            opacity: 0.48;
          }

          .sparkle-icon {
            width: 24px;
            height: 24px;
          }

          .mentor-panel {
            position: fixed;
            left: 12px;
            right: 12px;
            bottom:
              calc(
                9.25rem +
                env(safe-area-inset-bottom, 0px)
              );
            width: auto;
            max-width: none;
            max-height:
              calc(
                100dvh -
                env(safe-area-inset-top, 0px) -
                10.5rem -
                env(safe-area-inset-bottom, 0px)
              );
            border-radius: 24px;
            transform-origin: bottom right;
          }

          .mentor-body {
            height: min(58dvh, 500px);
            max-height:
              calc(
                100dvh -
                env(safe-area-inset-top, 0px) -
                15rem -
                env(safe-area-inset-bottom, 0px)
              );
            padding: 16px;
          }

          .mentor-header {
            padding: 14px 16px;
          }

          .chat-container {
            margin-bottom: 12px;
            gap: 12px;
          }

          .chat-bubble {
            max-width: 90%;
            padding: 11px 14px;
            font-size: 14px;
          }
        }

      `}</style>
    </>
  );
};

export default MentorDock;
