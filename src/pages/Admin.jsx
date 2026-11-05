import { useState } from "react";
import { Lock, KeyRound, Plus, Upload, RotateCcw, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { getHotels, addHotel, importFromExcel, resetToDefaults } from "../services/hotelsService";
import "./Admin.css";

// Встановіть ваш секретний пароль адміна тут:
const ADMIN_SECRET = "admin2026";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [activeTab, setActiveTab] = useState("add");
  const [successMsg, setSuccessMsg] = useState("");
  const [hotelsCount, setHotelsCount] = useState(getHotels().length);

  const [form, setForm] = useState({
    name: "",
    city: "Київ",
    price: 2500,
    stars: 4,
    description: "",
    address: "",
    phone: "",
    shelter: true,
    generator: true,
    battery: false,
    breakfast: true,
    restaurant: true,
    pool: false,
    wifi: true,
    parking: true,
  });

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_SECRET) {
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    addHotel(form);
    setHotelsCount(getHotels().length);
    setSuccessMsg(`Готель «${form.name}» успішно додано!`);
    setTimeout(() => setSuccessMsg(""), 2500);

    setForm({
      name: "",
      city: "Київ",
      price: 2500,
      stars: 4,
      description: "",
      address: "",
      phone: "",
      shelter: true,
      generator: true,
      battery: false,
      breakfast: true,
      restaurant: true,
      pool: false,
      wifi: true,
      parking: true,
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const updated = await importFromExcel(file);
      setHotelsCount(updated.length);
      setSuccessMsg(`Успішно завантажено ${updated.length} готелів з Excel!`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      alert("Помилка читання Excel: " + err.message);
    }
  };

  const handleReset = () => {
    if (confirm("Скинути базу даних до початкових 140 готелів?")) {
      resetToDefaults();
      setHotelsCount(140);
      setSuccessMsg("Базу повернено до початкових 140 готелів.");
      setTimeout(() => setSuccessMsg(""), 2500);
    }
  };

  // Екран авторизації, якщо не введено пароль
  if (!isAuthenticated) {
    return (
      <div className="admin-auth-wrapper">
        <div className="admin-auth-card">
          <div className="auth-icon-circle">
            <Lock size={28} />
          </div>
          <h2>Панель адміністратора</h2>
          <p>Вхід захищено. Введіть пароль доступу до бази даних:</p>

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
            {loginError && <span className="auth-error">Невірний пароль доступу!</span>}
            <button type="submit" className="auth-btn">Увійти в панель</button>
          </form>

          <Link to="/assistant" className="back-link">
            <ArrowLeft size={15} /> Повернутися до асистента
          </Link>
        </div>
      </div>
    );
  }

  // Робоча зона адміна після успішного входу
  return (
    <div className="admin-page-container">
      <div className="admin-main-card">
        <div className="admin-top-bar">
          <div>
            <h2>Панель керування базою готелів</h2>
            <span className="badge-count">Усього в базі: {hotelsCount} готелів</span>
          </div>
          <Link to="/assistant" className="exit-btn">
            Перейти в чат
          </Link>
        </div>

        {successMsg && (
          <div className="admin-alert-success">
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        <div className="admin-tabs">
          <button
            className={`admin-tab-btn ${activeTab === "add" ? "active" : ""}`}
            onClick={() => setActiveTab("add")}
          >
            <Plus size={16} /> Додати готель вручну
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "upload" ? "active" : ""}`}
            onClick={() => setActiveTab("upload")}
          >
            <Upload size={16} /> Імпорт файлу Excel (.xlsx)
          </button>
        </div>

        {activeTab === "add" ? (
          <form onSubmit={handleManualSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Назва готелю *</label>
                <input
                  type="text"
                  required
                  placeholder="напр. Dnipro Grand Hotel"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Місто</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Ціна за добу (грн)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Кількість зірок (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={form.stars}
                  onChange={(e) => setForm({ ...form, stars: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Опис готелю</label>
              <textarea
                rows="2"
                placeholder="Вид на річку, центр міста, тераса..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <label className="section-label">Параметри безпеки та зручностей:</label>
            <div className="admin-checkboxes">
              <label><input type="checkbox" checked={form.shelter} onChange={(e) => setForm({ ...form, shelter: e.target.checked })} /> Укриття</label>
              <label><input type="checkbox" checked={form.generator} onChange={(e) => setForm({ ...form, generator: e.target.checked })} /> Генератор</label>
              <label><input type="checkbox" checked={form.battery} onChange={(e) => setForm({ ...form, battery: e.target.checked })} /> Акумулятори</label>
              <label><input type="checkbox" checked={form.breakfast} onChange={(e) => setForm({ ...form, breakfast: e.target.checked })} /> Сніданок</label>
              <label><input type="checkbox" checked={form.restaurant} onChange={(e) => setForm({ ...form, restaurant: e.target.checked })} /> Ресторан</label>
              <label><input type="checkbox" checked={form.pool} onChange={(e) => setForm({ ...form, pool: e.target.checked })} /> Басейн</label>
            </div>

            <button type="submit" className="admin-save-btn">
              <Plus size={16} /> Зберегти готель у базі
            </button>
          </form>
        ) : (
          <div className="admin-upload-box">
            <Upload size={40} color="#6366f1" />
            <p>Виберіть новий файл <strong>hotels.xlsx</strong>:</p>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
            <small>Таблиця буде перерахована й збережена у браузері.</small>
          </div>
        )}

        <div className="admin-footer-reset">
          <button type="button" className="btn-reset" onClick={handleReset}>
            <RotateCcw size={14} /> Скинути базу до стандартних 140 готелів
          </button>
        </div>
      </div>
    </div>
  );
}