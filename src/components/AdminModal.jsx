import { useState } from "react";
import { X, Upload, Plus, RotateCcw, CheckCircle2 } from "lucide-react";
import { addHotel, importFromExcel, resetToDefaults } from "../services/hotelsService";

export default function AdminModal({ isOpen, onClose, onDatabaseUpdated, totalHotels }) {
  const [activeTab, setActiveTab] = useState("add"); // "add" | "upload"
  const [successMsg, setSuccessMsg] = useState("");

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

  if (!isOpen) return null;

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    addHotel(form);
    setSuccessMsg(`Готель «${form.name}» успішно додано до бази!`);
    onDatabaseUpdated();
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
      setSuccessMsg(`Успішно імпортовано ${updated.length} готелів з Excel!`);
      onDatabaseUpdated();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      alert("Помилка при читанні Excel-файлу: " + err.message);
    }
  };

  const handleReset = () => {
    if (confirm("Скинути базу даних до початкових 140 готелів з файлу?")) {
      resetToDefaults();
      onDatabaseUpdated();
      setSuccessMsg("Базу скинуто до початкових значень.");
      setTimeout(() => setSuccessMsg(""), 2500);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="hotel-modal admin-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>

        <div className="admin-header">
          <h2>Управління базою готелів</h2>
          <span className="badge-count">У базі: {totalHotels} готелів</span>
        </div>

        {successMsg && (
          <div className="admin-alert-success">
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        <div className="admin-tabs">
          <button 
            className={`admin-tab-btn ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            <Plus size={16} /> Додати готель вручну
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={16} /> Імпорт нового Excel (.xlsx)
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
                  placeholder="напр. Dnipro Grand"
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
                <label>Зірки (1-5)</label>
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
              <label>Короткий опис</label>
              <textarea 
                rows="2" 
                placeholder="Вид на море, тераса, зручне розташування..."
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
              />
            </div>

            <label className="section-label">Зручності та безпека:</label>
            <div className="admin-checkboxes">
              <label><input type="checkbox" checked={form.shelter} onChange={(e) => setForm({ ...form, shelter: e.target.checked })} /> Укриття</label>
              <label><input type="checkbox" checked={form.generator} onChange={(e) => setForm({ ...form, generator: e.target.checked })} /> Генератор</label>
              <label><input type="checkbox" checked={form.battery} onChange={(e) => setForm({ ...form, battery: e.target.checked })} /> Акумулятори</label>
              <label><input type="checkbox" checked={form.breakfast} onChange={(e) => setForm({ ...form, breakfast: e.target.checked })} /> Сніданок</label>
              <label><input type="checkbox" checked={form.restaurant} onChange={(e) => setForm({ ...form, restaurant: e.target.checked })} /> Ресторан</label>
              <label><input type="checkbox" checked={form.pool} onChange={(e) => setForm({ ...form, pool: e.target.checked })} /> Басейн</label>
            </div>

            <button type="submit" className="admin-save-btn">
              <Plus size={16} /> Додати готель у базу
            </button>
          </form>
        ) : (
          <div className="admin-upload-box">
            <Upload size={36} color="#6366f1" />
            <p>Оберіть оновлений файл <strong>hotels.xlsx</strong> з комп'ютера:</p>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
            <small>Таблиця буде миттєво розібрана і збережена у браузері без перезапуску серверів.</small>
          </div>
        )}

        <div className="admin-footer-reset">
          <button type="button" className="btn-reset" onClick={handleReset}>
            <RotateCcw size={14} /> Скинути до дефолтних 140 готелів
          </button>
        </div>
      </div>
    </div>
  );
}