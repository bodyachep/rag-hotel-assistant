import { useState, useEffect } from "react";
import { Lock, KeyRound, ArrowLeft, BookmarkCheck, Database } from "lucide-react";
import { Link } from "react-router-dom";
import { getHotels, getBookings } from "../services/hotelsService";
import "./Admin.css";

const ADMIN_SECRET = "admin2026";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [hotelsCount, setHotelsCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      async function loadData() {
        const hData = await getHotels();
        setHotelsCount(hData.length);
        const bData = await getBookings();
        setBookings(bData);
      }
      loadData();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_SECRET) {
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-auth-wrapper">
        <div className="admin-auth-card">
          <div className="auth-icon-circle"><Lock size={28} /></div>
          <h2>Панель адміністратора</h2>
          <p>Введіть пароль для доступу до бронювань (Supabase):</p>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-input-box">
              <KeyRound size={18} color="#94a3b8" />
              <input
                type="password"
                placeholder="Введіть пароль..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
              />
            </div>
            {loginError && <span className="auth-error">Невірний пароль!</span>}
            <button type="submit" className="auth-btn">Увійти</button>
          </form>

          <Link to="/assistant" className="back-link">
            <ArrowLeft size={15} /> До чату
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <div className="admin-main-card">
        <div className="admin-top-bar">
          <div>
            <h2>Журнал бронювань</h2>
            <span className="badge-count">
              <Database size={14} style={{ marginRight: '4px' }}/> Готелів у базі: {hotelsCount}
            </span>
          </div>
          <Link to="/assistant" className="exit-btn">У чат</Link>
        </div>

        <div className="bookings-table-container" style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '15px', color: '#64748b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
             <BookmarkCheck size={16} /> Синхронізовано з хмарою Supabase
          </div>

          {bookings.length === 0 ? (
            <p className="no-bookings">Поки що немає створених бронювань.</p>
          ) : (
            <div className="bookings-list">
              {bookings.map((b) => (
                <div key={b.id} className="booking-item-card">
                  <div className="b-header">
                    <strong>Бронь #{b.id.split('-')[0]}</strong> — <span>{new Date(b.created_at).toLocaleString("uk-UA")}</span>
                  </div>
                  <div className="b-hotel">Готель: <strong>{b.hotel_name}</strong></div>
                  <div className="b-guest">Гість: <strong>{b.guest_name}</strong> | Тел: <strong>{b.guest_phone}</strong></div>
                  <div className="b-price">Вартість: {b.price_per_night} грн/ніч</div>
                  <div className="b-price" style={{color: '#64748b'}}>Дати: {b.dates}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-footer-reset" style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '15px', fontSize: '13px', color: '#94a3b8' }}>
          * Керування списком готелів (додавання, видалення) тепер здійснюється безпосередньо через інтерфейс Supabase (Table Editor).
        </div>
      </div>
    </div>
  );
}