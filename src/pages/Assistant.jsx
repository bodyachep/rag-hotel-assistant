import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { askHotelConcierge } from "../services/aiService";
import { 
  Send, 
  Sparkles, 
  Star, 
  Check, 
  X, 
  CheckCircle2, 
  Wifi, 
  Car, 
  Coffee, 
  UtensilsCrossed, 
  Waves, 
  ShieldCheck, 
  Zap, 
  BatteryCharging, 
  Flame, 
  Wind, 
  HeartHandshake, 
  Dog,
  CalendarDays
} from "lucide-react";
import { getHotels, createBooking } from "../services/hotelsService";
import "./Assistant.css";

const QUICK_PROMPTS = [
  "Готелі в Києві",
  "Готелі з басейном та спа",
  "Готелі з укриттям та генератором",
  "Де зупинитися у Львові?",
  "VIP готелі в Одесі"
];

const normalizeCityQuery = (text) => {
  const t = text.toLowerCase();
  if (t.includes("києв") || t.includes("київ")) return "київ";
  if (t.includes("львів") || t.includes("львов")) return "львів";
  if (t.includes("одес")) return "одеса";
  if (t.includes("буковель") || t.includes("буков")) return "буковель";
  if (t.includes("харків") || t.includes("харков")) return "харків";
  if (t.includes("дніпр") || t.includes("днепр")) return "дніпро";
  if (t.includes("яремч")) return "яремче";
  if (t.includes("вінниц")) return "вінниця";
  if (t.includes("черніг")) return "чернігів";
  if (t.includes("полтав")) return "полтава";
  return null;
};

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "ai",
      text: "Вітаю! Я допоможу підібрати і забронювати номер. Вкажіть місто або необхідні зручності."
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [dbHotels, setDbHotels] = useState([]);
  
  // Контекст активного фільтра при уточненні
  const [pendingFilter, setPendingFilter] = useState(null);

  // Стан бронювання
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [bookingForm, setBookingForm] = useState({ 
    name: "", 
    phone: "", 
    checkIn: "", 
    checkOut: "" 
  });
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      const hotels = await getHotels();
      if (isMounted) setDbHotels(hotels || []);
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleOpenHotel = (hotel) => {
    setSelectedHotel(hotel);
    setBookingSuccess(null);
    setBookingError("");
    
    // Встановлюємо дати за замовчуванням (сьогодні та завтра)
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    setBookingForm({ name: "", phone: "", checkIn: today, checkOut: tomorrow });

    if (hotel.room_categories && hotel.room_categories.length > 0) {
      setSelectedCategory(hotel.room_categories[0]);
    } else {
      setSelectedCategory({
        id: "standard",
        title: "Стандартний номер",
        price: hotel.price || 1500,
        available: hotel.available_rooms || 10,
        tier: "basic",
        badge: "Базовий",
        capacity: "1-2 гостей"
      });
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isThinking) return;

    const newHistory = [
      ...messages,
      { id: Date.now().toString(), role: "user", text: query }
    ];

    setMessages(newHistory);
    setInputValue("");
    setIsThinking(true);

    try {
      // Виклик локального автономного рушія
      const aiResponse = await askHotelConcierge({
        messagesHistory: newHistory,
        availableHotels: dbHotels
      });

      const msgId = (Date.now() + 1).toString();
      setIsThinking(false);

      // Створюємо порожнє повідомлення для ефекту друку
      setMessages((prev) => [
        ...prev,
        {
          id: msgId,
          role: "ai",
          text: "",
          isTyping: true,
          suggestions: aiResponse.suggestions || null,
          hotels: null
        }
      ]);

      // Ефект живого друку по літерах
      const fullText = aiResponse.reply;
      let currentText = "";
      for (let i = 0; i < fullText.length; i++) {
        currentText += fullText[i];
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, text: currentText } : m))
        );
        await new Promise((res) => setTimeout(res, 18));
      }

      // Відображаємо підібрані готелі після завершення друку
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                isTyping: false,
                hotels: aiResponse.hotels
              }
            : m
        )
      );
    } catch (e) {
      setIsThinking(false);
    }
  };

  const processUserIntent = (query) => {
    const qLower = query.toLowerCase();
    let city = normalizeCityQuery(qLower);

    let filter = pendingFilter || {};

    if (qLower.includes("басейн") || qLower.includes("pool")) filter.pool = true;
    if (qLower.includes("спа") || qLower.includes("spa")) filter.spa = true;
    if (qLower.includes("укритт") || qLower.includes("сховищ")) filter.shelter = true;
    if (qLower.includes("генератор") || qLower.includes("світл") || qLower.includes("автоном")) filter.generator = true;
    if (qLower.includes("vip") || qLower.includes("люкс") || qLower.includes("преміум")) filter.vip = true;

    // Якщо місто не назване, а користувач запитав про масштабні зручності: запитуємо місто!
    if (!city && (filter.pool || filter.shelter || filter.generator || filter.spa || filter.vip)) {
      setPendingFilter(filter);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          text: "Чудовий вибір! Маємо багато таких перевірених готелів. У якому місті шукаємо?",
          suggestions: ["Київ", "Львів", "Одеса", "Буковель"]
        }
      ]);
      return;
    }

    // Скидаємо збережений фільтр після знаходження міста
    setPendingFilter(null);

    const results = dbHotels.filter((hotel) => {
      const hCity = (hotel.city || "").toLowerCase();
      const hName = (hotel.name || "").toLowerCase();

      const matchCity = city ? hCity.includes(city) : true;
      const matchName = hName.includes(qLower);

      let matchFilter = true;
      if (filter.pool && hotel.pool !== "Так" && hotel.pool !== true) matchFilter = false;
      if (filter.spa && hotel.spa !== "Так" && hotel.spa !== true) matchFilter = false;
      if (filter.shelter && hotel.shelter !== "Так" && hotel.shelter !== true) matchFilter = false;
      if (filter.generator && hotel.generator !== "Так" && hotel.generator !== true) matchFilter = false;
      if (filter.vip && hotel.stars < 4) matchFilter = false;

      if (city) {
        return matchCity && matchFilter;
      }
      return matchName || matchFilter;
    });

    // Обмежуємо показ рівно 4-5 топовими варіантами замість 100
    const topResults = results.slice(0, 4);

    if (topResults.length > 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          text: `Ось ${topResults.length} найкращих варіантів${city ? ` у місті ${city.toUpperCase()}` : ""}:`,
          hotels: topResults
        }
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          text: `На жаль, за цими параметрами не знайдено вільних готелів. Спробуйте змінити місто або прибрати частину вимог.`
        }
      ]);
    }
  };

  // Розрахунок ночей
  const calculateNights = () => {
    if (!bookingForm.checkIn || !bookingForm.checkOut) return 1;
    const start = new Date(bookingForm.checkIn);
    const end = new Date(bookingForm.checkOut);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const nights = calculateNights();
  const totalPrice = (selectedCategory?.price || 0) * nights;

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError("");

    if (!bookingForm.name.trim() || !bookingForm.phone.trim()) {
      setBookingError("Будь ласка, вкажіть контактне ім'я та телефон");
      return;
    }

    if (new Date(bookingForm.checkOut) <= new Date(bookingForm.checkIn)) {
      setBookingError("Дата виїзду має бути пізнішою за дату заїзду");
      return;
    }

    setIsSubmitting(true);

    try {
      const datesStr = `${bookingForm.checkIn} — ${bookingForm.checkOut} (${nights} ноч.)`;
      const res = await createBooking({
        hotelId: selectedHotel.id,
        hotelName: selectedHotel.name,
        guestName: bookingForm.name,
        guestPhone: bookingForm.phone,
        dates: datesStr,
        roomCategory: selectedCategory,
        pricePerNight: selectedCategory.price
      });

      setBookingSuccess({ ...res.booking, calculatedTotal: totalPrice, nightsCount: nights });

      setSelectedHotel((prev) => ({
        ...prev,
        room_categories: res.updatedCategories,
        available_rooms: res.remainingRooms
      }));

      setDbHotels((prev) =>
        prev.map((h) =>
          h.id === selectedHotel.id
            ? { ...h, room_categories: res.updatedCategories, available_rooms: res.remainingRooms }
            : h
        )
      );
    } catch (err) {
      setBookingError(err.message || "Не вдалося виконати бронювання");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="assistant-layout">
      <div className="chat-container">
        <header className="chat-header">
          <div className="ai-status">
            <Sparkles size={20} className="status-icon" />
            <h2 className="animated-gradient-text">RAG Hotel Concierge</h2>
            <div className="status-indicator-dot" title="Онлайн" />
          </div>
        </header>

        <div className="quick-prompts-container">
          <span className="quick-title">Швидкий вибір:</span>
          <div className="quick-chips">
            {QUICK_PROMPTS.map((prompt, index) => (
              <button
                key={index}
                className="quick-chip-btn"
                onClick={() => handleSendMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="messages-area">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-wrapper ${msg.role}`}>
              <div className="avatar">
                {msg.role === "ai" ? <Sparkles size={18} /> : "👤"}
              </div>
              <div className="message-bubble">
                <p>
                  {msg.text}
                  {msg.isTyping && <span className="typing-cursor">|</span>}
                </p>

                {/* Швидкі кнопки міст (якщо модель просить уточнити місто) */}
                {!msg.isTyping && msg.suggestions && (
                  <div className="clarification-chips">
                    {msg.suggestions.map((city, idx) => (
                      <button
                        key={idx}
                        className="clarification-btn"
                        onClick={() => handleSendMessage(city)}
                      >
                        📍 {city}
                      </button>
                    ))}
                  </div>
                )}

                {/* Сітка знайдених готелів (викликається лише за наявності даних) */}
                {!msg.isTyping && msg.hotels && msg.hotels.length > 0 && (
                  <div className="hotels-results-grid">
                    {msg.hotels.map((hotel) => (
                      <div key={hotel.id} className="hotel-result-card">
                        <div className="card-top">
                          <span className="card-city">{hotel.city}</span>
                          <div className="card-stars">
                            {Array.from({ length: hotel.stars || 4 }).map((_, i) => (
                              <Star key={i} size={12} fill="#eab308" color="#eab308" />
                            ))}
                          </div>
                        </div>

                        <h4>{hotel.name}</h4>
                        <p className="card-desc">{hotel.description}</p>

                        <div className="card-tags">
                          {(hotel.shelter === "Так" || hotel.shelter === true) && (
                            <span className="tag green"><ShieldCheck size={12} /> Укриття</span>
                          )}
                          {(hotel.generator === "Так" || hotel.generator === true) && (
                            <span className="tag orange"><Zap size={12} /> Генератор</span>
                          )}
                          {(hotel.pool === "Так" || hotel.pool === true) && (
                            <span className="tag blue"><Waves size={12} /> Басейн</span>
                          )}
                          {(hotel.spa === "Так" || hotel.spa === true) && (
                            <span className="tag purple"><HeartHandshake size={12} /> SPA</span>
                          )}
                        </div>

                        <div className="card-footer">
                          <div className="card-price">
                            від {hotel.price} <span>грн/ніч</span>
                          </div>
                          <button
                            className="book-mini-btn"
                            onClick={() => handleOpenHotel(hotel)}
                          >
                            Детальніше
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="message-wrapper ai">
              <div className="avatar"><Sparkles size={18} /></div>
              <div className="ai-thinking-container">
                <div className="ai-3d-loader">
                  <div className="loader-face face-front" />
                  <div className="loader-face face-back" />
                  <div className="loader-face face-left" />
                  <div className="loader-face face-right" />
                  <div className="loader-face face-top" />
                  <div className="loader-face face-bottom" />
                </div>
                <span className="thinking-text">Аналізую базу та підбираю варіанти...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="input-wrapper"
          >
            <input
              type="text"
              placeholder="Напишіть запит або оберіть підказку вище..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button type="submit" disabled={!inputValue.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* МОДАЛЬНЕ ВІКНО З КАЛЕНДАРЕМ ТА НОМЕРАМИ */}
      <AnimatePresence>
        {selectedHotel && (
          <div className="modal-overlay" onClick={() => setSelectedHotel(null)}>
            <motion.div
              className="hotel-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
            >
              <button className="modal-close-btn" onClick={() => setSelectedHotel(null)}>
                <X size={18} />
              </button>

              <div className="modal-header-info">
                <span className="modal-city">{selectedHotel.city}</span>
                <h2>{selectedHotel.name}</h2>
                <p className="modal-desc">{selectedHotel.description}</p>
              </div>

              <h3 className="section-title">Зручності:</h3>
              <div className="amenities-grid">
                <div className={`amenity-badge ${selectedHotel.wifi ? "available" : "unavailable"}`}>
                  <Wifi size={14} /> <span>Швидкісний Wi-Fi</span> {selectedHotel.wifi ? <Check size={14} className="status-check" /> : <X size={14} className="status-minus" />}
                </div>
                <div className={`amenity-badge ${selectedHotel.parking ? "available" : "unavailable"}`}>
                  <Car size={14} /> <span>Паркінг</span> {selectedHotel.parking ? <Check size={14} className="status-check" /> : <X size={14} className="status-minus" />}
                </div>
                <div className={`amenity-badge ${selectedHotel.generator ? "available" : "unavailable"}`}>
                  <Zap size={14} /> <span>Генератор</span> {selectedHotel.generator ? <Check size={14} className="status-check" /> : <X size={14} className="status-minus" />}
                </div>
                <div className={`amenity-badge ${selectedHotel.shelter ? "available" : "unavailable"}`}>
                  <ShieldCheck size={14} /> <span>Облаштоване укриття</span> {selectedHotel.shelter ? <Check size={14} className="status-check" /> : <X size={14} className="status-minus" />}
                </div>
                <div className={`amenity-badge ${selectedHotel.pool ? "available" : "unavailable"}`}>
                  <Waves size={14} /> <span>Басейн</span> {selectedHotel.pool ? <Check size={14} className="status-check" /> : <X size={14} className="status-minus" />}
                </div>
                <div className={`amenity-badge ${selectedHotel.spa ? "available" : "unavailable"}`}>
                  <HeartHandshake size={14} /> <span>СПА</span> {selectedHotel.spa ? <Check size={14} className="status-check" /> : <X size={14} className="status-minus" />}
                </div>
                <div className={`amenity-badge ${selectedHotel.restaurant ? "available" : "unavailable"}`}>
                  <UtensilsCrossed size={14} /> <span>Ресторан</span> {selectedHotel.restaurant ? <Check size={14} className="status-check" /> : <X size={14} className="status-minus" />}
                </div>
                <div className={`amenity-badge ${selectedHotel.breakfast ? "available" : "unavailable"}`}>
                  <Coffee size={14} /> <span>Сніданок</span> {selectedHotel.breakfast ? <Check size={14} className="status-check" /> : <X size={14} className="status-minus" />}
                </div>
                <div className={`amenity-badge ${selectedHotel.ac ? "available" : "unavailable"}`}>
                  <Wind size={14} /> <span>Кондиціонер</span> {selectedHotel.ac ? <Check size={14} className="status-check" /> : <X size={14} className="status-minus" />}
                </div>
                <div className={`amenity-badge ${selectedHotel.heating ? "available" : "unavailable"}`}>
                  <Flame size={14} /> <span>Автономне опалення</span> {selectedHotel.heating ? <Check size={14} className="status-check" /> : <X size={14} className="status-minus" />}
                </div>
                <div className={`amenity-badge ${selectedHotel.battery ? "available" : "unavailable"}`}>
                  <BatteryCharging size={14} /> <span>EcoFlow/Акумулятори</span> {selectedHotel.battery ? <Check size={14} className="status-check" /> : <X size={14} className="status-minus" />}
                </div>
                <div className={`amenity-badge ${selectedHotel.pets ? "available" : "unavailable"}`}>
                  <Dog size={14} /> <span>З тваринами</span> {selectedHotel.pets ? <Check size={14} className="status-check" /> : <X size={14} className="status-minus" />}
                </div>
              </div>

              {bookingSuccess ? (
                <div className="booking-confirmed-card">
                  <CheckCircle2 size={36} color="#16a34a" />
                  <div>
                    <h4 style={{ margin: 0, color: "#166534", fontSize: "16px" }}>
                      Бронювання підтверджено!
                    </h4>
                    <p style={{ margin: "4px 0", fontSize: "13px", color: "#334155" }}>
                      Номер: <strong>{bookingSuccess.room_category}</strong>
                    </p>
                    <p style={{ margin: "2px 0", fontSize: "13px", color: "#334155" }}>
                      Період: <strong>{bookingSuccess.dates}</strong>
                    </p>
                    <p style={{ margin: 0, fontSize: "14px", color: "#0f172a", fontWeight: "700" }}>
                      Разом: {bookingSuccess.calculatedTotal} грн
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="section-title">Оберіть категорію номера:</h3>
                  <div className="rooms-tier-grid">
                    {(selectedHotel.room_categories || []).map((cat) => {
                      const isSelected = selectedCategory?.id === cat.id;
                      const isGold = cat.tier === "gold";

                      return (
                        <div
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat)}
                          className={`tier-card ${isGold ? "gold-card" : ""} ${isSelected ? "selected" : ""}`}
                        >
                          <div className="tier-header">
                            <span className={`tier-badge ${isGold ? "gold-badge" : ""}`}>
                              {cat.badge}
                            </span>
                            <span className="tier-capacity">{cat.capacity}</span>
                          </div>
                          <div className="tier-name">{cat.title}</div>
                          <div className="tier-bottom">
                            <span className="tier-price">{cat.price} грн</span>
                            <span className="tier-left">Вільних: {cat.available}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={handleBookingSubmit} className="booking-form-tiered">
                    {/* Вибір дат проживання (Міні-календар) */}
                    <div className="dates-picker-container">
                      <div className="input-field-group">
                        <label><CalendarDays size={12} /> Дата заїзду</label>
                        <input
                          type="date"
                          className="calendar-input"
                          value={bookingForm.checkIn}
                          onChange={(e) => setBookingForm({ ...bookingForm, checkIn: e.target.value })}
                          required
                        />
                      </div>
                      <div className="input-field-group">
                        <label><CalendarDays size={12} /> Дата виїзду</label>
                        <input
                          type="date"
                          className="calendar-input"
                          value={bookingForm.checkOut}
                          onChange={(e) => setBookingForm({ ...bookingForm, checkOut: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="booking-inputs-grid">
                      <div className="input-field-group">
                        <label>Ваше ім'я</label>
                        <input
                          type="text"
                          placeholder="Тарас Шевченко"
                          value={bookingForm.name}
                          onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="input-field-group">
                        <label>Номер телефону</label>
                        <input
                          type="tel"
                          placeholder="+380 97 123 45 67"
                          value={bookingForm.phone}
                          onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {bookingError && <div className="booking-error-text">{bookingError}</div>}

                    <button
                      type="submit"
                      disabled={isSubmitting || selectedCategory?.available <= 0}
                      className={`modal-book-btn ${selectedCategory?.tier === "gold" ? "gold-btn" : ""}`}
                    >
                      {isSubmitting
                        ? "Збереження броні..."
                        : selectedCategory?.available <= 0
                        ? "Номери закінчились"
                        : `Забронювати ${selectedCategory?.title} • ${totalPrice} грн (${nights} ноч.)`}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}