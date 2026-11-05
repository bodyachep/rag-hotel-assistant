import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";
import "./Assistant.css"; // Підключаємо стилі

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "ai",
      text: "Привіт! Я ваш інтелектуальний помічник RAG Hotel Assistant. Який готель ви шукаєте сьогодні?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Автоматична прокрутка до останнього повідомлення
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Імітація запиту до бекенду (Python FastAPI + Qwen 3)
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          text: "Шукаю найкращі варіанти у базі даних... (Тут буде відповідь від вашого RAG-бекенду з картками готелів).",
        },
      ]);
    }, 2000);
  };

  return (
    <div className="assistant-layout">
      <div className="chat-container">
        <header className="chat-header">
          <div className="ai-status">
            <Sparkles className="status-icon" size={20} />
            <h2>AI Assistant</h2>
          </div>
          <span className="model-badge">Qwen 3 + RAG</span>
        </header>

        <div className="messages-area">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`message-wrapper ${msg.role}`}
              >
                <div className="avatar">
                  {msg.role === "ai" ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className="message-bubble">
                  <p>{msg.text}</p>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="message-wrapper ai typing-indicator"
              >
                <div className="avatar"><Bot size={20} /></div>
                <div className="message-bubble typing-dots">
                  <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} />
                  <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                  <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="input-area">
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Опишіть готель вашої мрії (наприклад, 'в Одесі з генератором')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
            />
            <button type="submit" disabled={!input.trim() || isTyping}>
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}