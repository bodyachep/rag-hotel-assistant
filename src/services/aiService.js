// frontend/src/services/aiService.js

// Словник міст та їх відмінків
const CITIES = {
  "київ": ["київ", "києв", "києві", "києва", "столиц"],
  "львів": ["львів", "львов", "львові", "львова"],
  "одеса": ["одес", "одесі", "одесу", "море", "моря"],
  "буковель": ["буковел", "буковелі", "карпат", "гори", "горах"],
  "яремче": ["яремч", "яремче"],
  "харків": ["харків", "харков", "харкові"],
  "дніпро": ["дніпр", "днепр", "дніпрі"],
  "вінниця": ["вінниц", "вінниці"],
  "полтава": ["полтав", "полтаві"]
};

// Аналізатор вхідного тексту
function extractIntent(text) {
  const t = text.toLowerCase();
  
  // 1. Пошук міста
  let detectedCity = null;
  for (const [canonical, aliases] of Object.entries(CITIES)) {
    if (aliases.some(alias => t.includes(alias))) {
      detectedCity = canonical.charAt(0).toUpperCase() + canonical.slice(1);
      break;
    }
  }

  // 2. Бюджет
  const wantsCheap = t.includes("дешев") || t.includes("бюджет") || t.includes("недорог") || t.includes("економ");
  const wantsLuxury = t.includes("люкс") || t.includes("vip") || t.includes("віп") || t.includes("дорог") || t.includes("преміум") || t.includes("голд");

  // 3. Зручності
  const pool = t.includes("басейн") || t.includes("плава") || t.includes("купат");
  const spa = t.includes("спа") || t.includes("spa") || t.includes("саун") || t.includes("масаж");
  const shelter = t.includes("укритт") || t.includes("бомбосховищ") || t.includes("безпеч");
  const generator = t.includes("генератор") || t.includes("світл") || t.includes("електрик") || t.includes("автоном");
  const breakfast = t.includes("сніданок") || t.includes("сніданк") || t.includes("харчуван") || t.includes("їж");
  const pets = t.includes("собак") || t.includes("кіт") || t.includes("пес") || t.includes("тварин") || t.includes("улюблен");

  // 4. Склад подорожі / контекст
  const family = t.includes("сім'ї") || t.includes("сім'я") || t.includes("діт") || t.includes("родин");
  const business = t.includes("робот") || t.includes("відряджен") || t.includes("ноутбук") || t.includes("вайфай");

  return {
    city: detectedCity,
    wantsCheap,
    wantsLuxury,
    pool,
    spa,
    shelter,
    generator,
    breakfast,
    pets,
    family,
    business,
    hasFilters: pool || spa || shelter || generator || breakfast || pets || wantsCheap || wantsLuxury
  };
}

// Збирання контексту з усієї історії діалогу
function aggregateHistory(messagesHistory) {
  const userMessages = messagesHistory
    .filter(m => m.role === "user")
    .map(m => m.text)
    .join(" ");
  return extractIntent(userMessages);
}

export async function askHotelConcierge({ messagesHistory, availableHotels }) {
  // Симуляція обробки даних (природна пауза 600 мс)
  await new Promise(r => setTimeout(r, 600));

  const lastUserMsg = messagesHistory.filter(m => m.role === "user").slice(-1)[0]?.text || "";
  const currentIntent = extractIntent(lastUserMsg);
  const totalContext = aggregateHistory(messagesHistory);

  // СЦЕНАРІЙ 1: Користувач ще не вказав місто
  if (!totalContext.city) {
    if (totalContext.pool || totalContext.spa) {
      return {
        reply: "Водні процедури та повний релакс — чудовий вибір! Маємо розкішні спа-комплекси з відкритими й підігріваними басейнами. В якому саме місті чи куточку України ви плануєте зупинитися? (Наприклад: Буковель, Київ, Одеса чи Львів?)",
        hotels: null,
        suggestions: ["Київ", "Львів", "Одеса", "Буковель"]
      };
    }

    if (totalContext.shelter || totalContext.generator) {
      return {
        reply: "Безпека та безперебійне живлення — це наш пріоритет. Усі наші перевірені готелі обладнані потужними генераторами та сертифікованими укриттями. Підкажіть, яке місто вас цікавить?",
        hotels: null,
        suggestions: ["Київ", "Львів", "Одеса", "Буковель"]
      };
    }

    if (totalContext.pets) {
      return {
        reply: "Завжди раді чотирилапим гостям! Ми маємо чудові pet-friendly варіанти зі зручними умовами для вигулу. Де саме планується поїздка?",
        hotels: null,
        suggestions: ["Київ", "Львів", "Одеса", "Буковель"]
      };
    }

    return {
      reply: "Привіт! Я ваш персональний готельний гід. Щоб я підібрав для вас дійсно найкращий варіант: підкажіть, куди саме плануєте подорож (Київ, Буковель, Львів, Одеса...) і що для вас найважливіше в номері?",
      hotels: null,
      suggestions: ["Київ", "Львів", "Одеса", "Буковель"]
    };
  }

  // СЦЕНАРІЙ 2: Місто є, але діалог короткий і користувач не уточнював компанію чи дати
  if (messagesHistory.length <= 2 && !totalContext.hasFilters) {
    return {
      reply: `Чудово, плануємо поїздку в ${totalContext.city}! Підкажіть, якою компанією вирушаєте (один, пара чи сім'я з дітьми) та чи потрібні додаткові зручності: басейн, спа або включений сніданок?`,
      hotels: null,
      suggestions: ["З басейном та спа", "Зі сніданком", "З укриттям та генератором", "Для сім'ї"]
    };
  }

  // СЦЕНАРІЙ 3: Місто відоме + фільтруємо базу готелів
  let filtered = availableHotels.filter(h => 
    (h.city || "").toLowerCase().includes(totalContext.city.toLowerCase())
  );

  // Фільтрація за зручностями
  if (totalContext.pool) filtered = filtered.filter(h => h.pool === "Так" || h.pool === true);
  if (totalContext.spa) filtered = filtered.filter(h => h.spa === "Так" || h.spa === true);
  if (totalContext.shelter) filtered = filtered.filter(h => h.shelter === "Так" || h.shelter === true);
  if (totalContext.generator) filtered = filtered.filter(h => h.generator === "Так" || h.generator === true);
  if (totalContext.breakfast) filtered = filtered.filter(h => h.breakfast === "Так" || h.breakfast === true);
  if (totalContext.pets) filtered = filtered.filter(h => h.pets === "Так" || h.pets === true);

  // Сортування
  if (totalContext.wantsCheap) {
    filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (totalContext.wantsLuxury) {
    filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else {
    filtered.sort((a, b) => (b.stars || 0) - (a.stars || 0));
  }

  // Якщо через жорсткі фільтри нічого не лишилося, повертаємо топові готелі обраного міста
  const resultHotels = (filtered.length > 0 ? filtered : availableHotels.filter(h => 
    (h.city || "").toLowerCase().includes(totalContext.city.toLowerCase())
  )).slice(0, 3);

  // Формування живої відповіді
  let responseText = `Підібрав для вас найкращі варіанти у місті ${totalContext.city}`;
  if (totalContext.breakfast) responseText += " зі смачним сніданком";
  if (totalContext.wantsCheap) responseText += " за найбільш доступною ціною";
  if (totalContext.generator || totalContext.shelter) responseText += " з повною автономністю (генератор та укриття)";
  responseText += ". У кожному готелі доступні різні категорії — від Стандарту до нашого розкішного «Royal Gold VIP». Натисніть «Детальніше», щоб обрати дати у календарі та оформити бронь:";

  return {
    reply: responseText,
    hotels: resultHotels,
    suggestions: null
  };
}