import initialHotels from "../data/hotelsData.json";
import * as XLSX from "xlsx";

const STORAGE_KEY = "rag_hotels_db";

// Завантаження поточної бази (з localStorage або дефолтних 140 готелів)
export function getHotels() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return initialHotels;
    }
  }
  return initialHotels;
}

// Додавання одного нового готелю вручну
export function addHotel(hotelData) {
  const current = getHotels();
  const newHotel = {
    ...hotelData,
    id: current.length > 0 ? Math.max(...current.map((h) => h.id || 0)) + 1 : 1,
  };
  const updated = [newHotel, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

// Завантаження та парсинг файлу Excel (.xlsx) прямо в браузері
export function importFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet);

        const isYes = (val) => String(val || "").trim().toLowerCase() === "так";

        const parsedHotels = jsonRows.map((row, idx) => ({
          id: row["ID"] || idx + 1,
          name: String(row["Назва готелю"] || `Готель #${idx + 1}`).trim(),
          city: String(row["Місто"] || "Україна").trim(),
          address: String(row["Адреса"] || "").trim(),
          price: Number(row["Ціна за ніч (грн)"]) || 2000,
          stars: Number(row["Кількість зірок"]) || 4,
          room_type: String(row["Тип номера"] || "Стандарт").trim(),
          phone: String(row["Телефон"] || "").trim(),
          email: String(row["Email"] || "").trim(),
          description: String(row["Опис"] || "").trim(),
          shelter: isYes(row["Укриття"]),
          generator: isYes(row["Генератор"]),
          battery: isYes(row["Акумулятор"]),
          heating: isYes(row["Опалення"]),
          breakfast: isYes(row["Сніданок"]),
          restaurant: isYes(row["Ресторан"]),
          pool: isYes(row["Басейн"]),
          wifi: isYes(row["Wi-Fi"]),
          parking: isYes(row["Паркінг"]),
          ac: isYes(row["Кондиціонер"]),
          spa: isYes(row["SPA"]),
          pets: isYes(row["Дозволено тварин"]),
        }));

        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedHotels));
        resolve(parsedHotels);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

// Скидання до початкових 140 готелів
export function resetToDefaults() {
  localStorage.removeItem(STORAGE_KEY);
  return initialHotels;
}