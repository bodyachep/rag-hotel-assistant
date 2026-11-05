import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from pathlib import Path
import pandas as pd
import re

app = FastAPI(title="RAG Hotel Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
EXCEL_PATH = BASE_DIR / "data" / "hotels.xlsx"

print(f"--> Завантаження бази готелів: {EXCEL_PATH}")

df_hotels = pd.DataFrame()
if EXCEL_PATH.exists():
    try:
        df_hotels = pd.read_excel(EXCEL_PATH)
        print(f"✅ База готелів завантажена: {len(df_hotels)} рядків!")
    except Exception as e:
        print(f"❌ Помилка читання Excel: {e}")
else:
    print(f"⚠️ Файл не знайдено за шляхом: {EXCEL_PATH}")

class ChatRequest(BaseModel):
    message: str

class HotelItem(BaseModel):
    id: int
    name: str
    city: str
    price: int
    stars: int
    shelter: bool
    generator: bool
    battery: bool
    description: str
    address: str = ""
    phone: str = ""
    room_type: str = ""
    breakfast: bool = False
    parking: bool = False

@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    query = req.message.lower().strip()

    if df_hotels.empty:
        return {"reply": "База даних наразі недоступна.", "hotels": []}

    filtered = df_hotels.copy()

    # 1. Місто
    cities = {
        "київ": "Київ",
        "львів": "Львів",
        "одес": "Одеса",
        "дніпр": "Дніпро",
        "харків": "Харків",
        "буковел": "Буковель",
        "івано-франківськ": "Івано-Франківськ",
        "яремч": "Яремче",
    }
    matched_city = None
    for prefix, full_city in cities.items():
        if prefix in query:
            matched_city = full_city
            filtered = filtered[filtered["Місто"].astype(str).str.lower().str.contains(prefix, na=False)]
            break

    # 2. Ціна
    price_matches = re.findall(r'(?:до|бюджет|ціна|\b)\s*(\d{4,6})\s*(?:грн|₴)?', query)
    if price_matches:
        try:
            val = int(price_matches[-1])
            if val >= 500:
                filtered = filtered[filtered["Ціна за ніч (грн)"] <= val]
        except Exception:
            pass

    # 3. Укриття, Генератор, Акумулятор, Сніданок
    if any(w in query for w in ["укритт", "сховищ", "безпеч"]):
        filtered = filtered[filtered["Укриття"].astype(str).str.strip().str.lower() == "так"]

    if any(w in query for w in ["генератор", "світл"]):
        filtered = filtered[filtered["Генератор"].astype(str).str.strip().str.lower() == "так"]

    if any(w in query for w in ["акумулятор", "батаре", "екофлоу"]):
        filtered = filtered[filtered["Акумулятор"].astype(str).str.strip().str.lower() == "так"]

    if "сніданок" in query or "сніданком" in query:
        filtered = filtered[filtered["Сніданок"].astype(str).str.strip().str.lower() == "так"]

    # 4. Пошук за ключовими словами в описі
    keywords = []
    if "вид" in query or "панорам" in query:
        keywords.extend(["вид", "панорам"])
    if "центр" in query:
        keywords.append("центр")
    if "парк" in query:
        keywords.append("парк")

    if keywords:
        pattern = "|".join(keywords)
        matched_desc = filtered[filtered["Опис"].astype(str).str.lower().str.contains(pattern, na=False)]
        if not matched_desc.empty:
            filtered = matched_desc

    # Вибір результатів
    if filtered.empty:
        results_df = df_hotels.head(4)
        reply = "Точних збігів не знайдено, але ось популярні перевірені варіанти з автономністю та укриттям:"
    else:
        results_df = filtered.head(4)
        if matched_city:
            reply = f"Знайшов найкращі варіанти у м. {matched_city} за вашим запитом:"
        elif len(query) < 10:
            reply = "Ось кілька рекомендованих готелів з автономним живленням та укриттям:"
        else:
            reply = f"Знайшов готелі відповідно до ваших побажань:"

    hotels_list = []
    for _, row in results_df.iterrows():
        hotels_list.append({
            "id": int(row["ID"]),
            "name": str(row["Назва готелю"]).strip(),
            "city": str(row["Місто"]).strip(),
            "price": int(row["Ціна за ніч (грн)"]),
            "stars": int(row["Кількість зірок"]) if pd.notnull(row["Кількість зірок"]) else 4,
            "shelter": str(row["Укриття"]).strip().lower() == "так",
            "generator": str(row["Генератор"]).strip().lower() == "так",
            "battery": str(row["Акумулятор"]).strip().lower() == "так",
            "description": str(row["Опис"]).strip() if pd.notnull(row["Опис"]) else "Комфортабельний готель.",
            "address": str(row.get("Адреса", "")).strip(),
            "phone": str(row.get("Телефон", "")).strip(),
            "room_type": str(row.get("Тип номера", "Стандарт")).strip(),
            "breakfast": str(row.get("Сніданок", "")).strip().lower() == "так",
            "parking": str(row.get("Паркінг", "")).strip().lower() == "так",
        })

    return {
        "reply": reply,
        "hotels": hotels_list
    }

if __name__ == "__main__":
    print("--> Запуск Uvicorn на http://127.0.0.1:8000...")
    uvicorn.run(app, host="127.0.0.1", port=8000)