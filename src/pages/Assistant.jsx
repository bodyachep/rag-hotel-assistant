import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Bot, User, Sparkles, ShieldCheck, Zap, BatteryCharging, 
  Star, MapPin, Phone, Coffee, UtensilsCrossed, Waves, Wifi, 
  Car, Wind, Sparkle, Dog, Flame, X, Check, Minus, Settings 
} from "lucide-react";
import { getHotels } from "../services/hotelsService";
import AdminModal from "../components/AdminModal";
import "./Assistant.css";

function TypewriterText({ text, onComplete }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      index++;
      setDisplayedText(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 12);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayedText}</span>;
}

// Автономний рушій RAG-фільтрації
function processHotelQuery(queryText) {
  const hotelsDatabase = getHotels();
  const query = queryText.toLowerCase().trim();
  let filtered = [...hotelsDatabase];

  // 1. Пошук за містом
  const cities = {
    "київ": "Київ", "львів": "Львів", "одес": "Одеса", 
    "дніпр": "Дніпро", "харків": "Харків", "буковел": "Буковель", 
    "вінниц": "Вінниця", "івано-франківськ": "Івано-Франківськ", "яремч": "Яремче"
  };
  let matchedCity = null;
  for (const [prefix, cityName] of Object.entries(cities)) {
    if (query.includes(prefix)) {
      matchedCity = cityName;
      filtered = filtered.filter((h) => h.city.toLowerCase().includes(prefix));
      break;
    }
  }

  // 2. Пошук за бюджетом
  const priceMatches = query.match(/(?:до|бюджет|ціна|\b)\s*(\d{4,6})\s*(?:грн|₴)?/);
  if (priceMatches) {
    const val = parseInt(priceMatches[1], 10);
    if (val >= 500) {
      const priceFiltered = filtered.filter((h) => h.price <= val);
      if (priceFiltered.length > 0) filtered = priceFiltered;
    }
  }

  // 3. Зручності та безпека
  if (/укритт|сховищ|безпеч/.test(query)) {
    const res = filtered.filter((h) => h.shelter);
    if (res.length > 0) filtered = res;
  }
  if (/генератор|світл/.test(query)) {
    const res = filtered.filter((h) => h.generator);
    if (res.length > 0) filtered = res;
  }
  if (/акумулятор|батаре|екофлоу/.test(query)) {
    const res = filtered.filter((h) => h.battery);
    if (res.length > 0) filtered = res;
  }
  if (/сніданок|ланч|харчуван|їжа/.test(query)) {
    const res = filtered.filter((h) => h.breakfast);
    if (res.length > 0) filtered = res;
  }
  if (/басейн/.test(query)) {
    const res = filtered.filter((h) => h.pool);
    if (res.length > 0) filtered = res;
  }
  if (/спа|spa/.test(query)) {
    const res = filtered.filter((h) => h.spa);
    if (res.length > 0) filtered = res;
  }
  if (/тварин|собак|кіт|котик/.test(query)) {
    const res = filtered.filter((h) => h.pets);
    if (res.length > 0) filtered = res;
  }

  // 4. Ключові слова опису
  const descKeywords = [];
  if (/вид|панорам/.test(query)) descKeywords.push("вид", "панорам");
  if (/центр/.test(query)) descKeywords.push("центр");
  if (/парк/.test(query)) descKeywords.push("парк");
  if (/дніпр/.test(query)) descKeywords.push("дніпр");

  if (descKeywords.length > 0) {
    const descMatches = filtered.filter((h) =>
      descKeywords.some((k) => h.description.toLowerCase().includes(k))
    );
    if (descMatches.length > 0) filtered = descMatches;
  }

  let reply = "";
  let results = [];

  if (filtered.length === 0) {
    results = matchedCity
      ? hotelsDatabase.filter((h) => h.city === matchedCity).slice(0, 4)
      : hotelsDatabase.slice(0, 4);
    reply = "Точного збігу за всіма фільтрами не знайдено, але ось найкращі рекомендовані варіанти:";
  } else {
    results = filtered.slice(0, 4);
    reply = matchedCity 
      ? `Знайшов найкращі варіанти у м. ${matchedCity} за вашим запитом:`
      : "Знайшов готелі відповідно до ваших побажань у базі:";
  }

  return { reply, hotels: results };
}

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "ai",
      text: "Привіт! Я ваш інтелектуальний помічник RAG Hotel Assistant. Який готель ви шукаєте сьогодні?",
      hotels: [],
      isFinishedTyping: true,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [bookedStatus, setBookedStatus] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [dbVersion, setDbVersion] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", text: userText, hotels: [], isFinishedTyping: true },
    ]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const { reply, hotels } = processHotelQuery(userText);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          text: reply,
          hotels: hotels,
          isFinishedTyping: false,
        },
      ]);
      setIsTyping(false);
    }, 600);
  };

  const markTypingComplete = (msgId) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, isFinishedTyping: true } : m))
    );
  };

  const amenitiesConfig = (hotel) => [
    { label: "Укриття", active: hotel.shelter, icon: ShieldCheck },
    { label: "Генератор", active: hotel.generator, icon: Zap },
    { label: "Акумулятори", active: hotel.battery, icon: BatteryCharging },
    { label: "Опалення", active: hotel.heating, icon: Flame },
    { label: "Сніданок включено", active: hotel.breakfast, icon: Coffee },
    { label: "Ресторан / Ланч", active: hotel.restaurant, icon: UtensilsCrossed },
    { label: "Басейн", active: hotel.pool, icon: Waves },
    { label: "Wi-Fi", active: hotel.wifi, icon: Wifi },
    { label: "Паркінг", active: hotel.parking, icon: Car },
    { label: "Кондиціонер", active: hotel.ac, icon: Wind },
    { label: "SPA-зона", active: hotel.spa, icon: Sparkle },
    { label: "Можна з тваринами", active: hotel.pets, icon: Dog },
  ];

  return (
    <div className="assistant-layout">
      <div className="chat-container">
        <header className="chat-header">
          <div className="ai-status">
            <Sparkles className="status-icon" size={20} />
            <h2 className="animated-gradient-text">AI Assistant</h2>
          </div>
          <span className="model-badge">Qwen 3 + RAG</span>
        </header>

        <div className="messages-area">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`message-wrapper ${msg.role}`}
              >
                <div className="avatar">
                  {msg.role === "ai" ? <Bot size={20} /> : <User size={20} />}
                </div>

                <div className="message-bubble">
                  <p>
                    {msg.role === "ai" && !msg.isFinishedTyping ? (
                      <TypewriterText
                        text={msg.text}
                        onComplete={() => markTypingComplete(msg.id)}
                      />
                    ) : (
                      msg.text
                    )}
                  </p>

                  {msg.hotels && msg.hotels.length > 0 && (
                    <motion.div
                      className="hotels-results-grid"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: msg.isFinishedTyping ? 1 : 0 }}
                    >
                      {msg.hotels.map((hotel) => (
                        <div key={hotel.id} className="hotel-result-card">
                          <div className="card-top">
                            <span className="card-city">{hotel.city}</span>
                            <div className="card-stars">
                              {[...Array(hotel.stars || 4)].map((_, i) => (
                                <Star key={i} size={13} fill="#eab308" color="#eab308" />
                              ))}
                            </div>
                          </div>
                          <h4>{hotel.name}</h4>
                          <p className="card-desc">{hotel.description}</p>
                          
                          <div className="card-tags">
                            {hotel.shelter && <span className="tag green"><ShieldCheck size={12}/> Укриття</span>}
                            {hotel.generator && <span className="tag orange"><Zap size={12}/> Генератор</span>}
                            {hotel.battery && <span className="tag blue"><BatteryCharging size={12}/> Акумулятор</span>}
                            {hotel.breakfast ? (
                              <span className="tag teal"><Coffee size={12}/> Сніданок</span>
                            ) : (
                              <span className="tag grey"><Minus size={11}/> Без сніданку</span>
                            )}
                            {hotel.restaurant && <span className="tag purple"><UtensilsCrossed size={12}/> Ресторан</span>}
                          </div>

                          <div className="card-footer">
                            <span className="card-price">{hotel.price} грн <span>/ ніч</span></span>
                            <button className="book-mini-btn" onClick={() => setSelectedHotel(hotel)}>
                              Детальніше
                            </button>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ai-thinking-container">
                <div className="ai-3d-loader">
                  <div className="loader-face face-front"></div>
                  <div className="loader-face face-back"></div>
                  <div className="loader-face face-left"></div>
                  <div className="loader-face face-right"></div>
                  <div className="loader-face face-top"></div>
                  <div className="loader-face face-bottom"></div>
                </div>
                <span className="animated-gradient-text">AI аналізує запит через Qwen 3...</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="input-area">
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Наприклад: 'Готель у Києві зі сніданком та укриттям'..."
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

      {/* Модальне вікно з 12 зручностями */}
      <AnimatePresence>
        {selectedHotel && (
          <div className="modal-overlay" onClick={() => setSelectedHotel(null)}>
            <motion.div 
              className="hotel-modal"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close-btn" onClick={() => setSelectedHotel(null)}>
                <X size={20} />
              </button>

              <div className="modal-header">
                <span className="badge-city">{selectedHotel.city}</span>
                <div className="stars-row">
                  {[...Array(selectedHotel.stars || 4)].map((_, i) => (
                    <Star key={i} size={15} fill="#eab308" color="#eab308" />
                  ))}
                </div>
              </div>

              <h2>{selectedHotel.name}</h2>
              <p className="modal-desc">{selectedHotel.description}</p>

              <div className="modal-info-list">
                {selectedHotel.address && (
                  <div className="info-item"><MapPin size={16} /> <span>{selectedHotel.address}</span></div>
                )}
                {selectedHotel.phone && (
                  <div className="info-item"><Phone size={16} /> <span>+{selectedHotel.phone}</span></div>
                )}
                <div className="info-item"><strong>Номер:</strong> {selectedHotel.room_type || "Стандарт"}</div>
              </div>

              <div className="modal-features">
                <h4>Повний перелік послуг та безпеки:</h4>
                <div className="amenities-grid">
                  {amenitiesConfig(selectedHotel).map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className={`amenity-badge ${item.active ? 'available' : 'unavailable'}`}>
                        <Icon size={15} />
                        <span>{item.label}</span>
                        {item.active ? <Check size={14} className="status-check" /> : <Minus size={14} className="status-minus" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="modal-footer">
                <div>
                  <div className="modal-price-label">Вартість за 1 добу:</div>
                  <div className="modal-price">{selectedHotel.price} грн</div>
                </div>

                <button 
                  className={`modal-book-btn ${bookedStatus ? 'success' : ''}`}
                  onClick={() => {
                    setBookedStatus(true);
                    setTimeout(() => { setBookedStatus(false); setSelectedHotel(null); }, 1500);
                  }}
                  disabled={bookedStatus}
                >
                  {bookedStatus ? "Заброньовано!" : "Забронювати номер"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Панель адміністратора */}
      <AdminModal 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
        onDatabaseUpdated={() => setDbVersion((v) => v + 1)}
        totalHotels={getHotels().length}
      />
    </div>
  );
}