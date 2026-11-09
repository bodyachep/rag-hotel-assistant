import { supabase } from "../supabaseClient";

export async function getHotels() {
  const { data, error } = await supabase
    .from("hotels")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Помилка завантаження готелів:", error);
    return [];
  }
  return data;
}

export async function createBooking({
  hotelId,
  hotelName,
  guestName,
  guestPhone,
  dates,
  roomCategory,
  pricePerNight,
}) {
  const { data: hotel, error: fetchError } = await supabase
    .from("hotels")
    .select("room_categories, available_rooms")
    .eq("id", hotelId)
    .single();

  if (fetchError || !hotel) {
    throw new Error("Не вдалося завантажити актуальні дані готелю.");
  }

  const categories = hotel.room_categories || [];
  const catIdx = categories.findIndex((c) => c.id === roomCategory.id);

  if (catIdx === -1) {
    throw new Error("Категорію номера не знайдено.");
  }
  if (categories[catIdx].available <= 0) {
    throw new Error(`Номери категорії "${roomCategory.title}" закінчилися!`);
  }

  // Зменшуємо залишок для обраного типу
  categories[catIdx].available -= 1;
  const newTotal = Math.max(0, (hotel.available_rooms || 1) - 1);

  const { error: updateError } = await supabase
    .from("hotels")
    .update({
      room_categories: categories,
      available_rooms: newTotal,
    })
    .eq("id", hotelId);

  if (updateError) {
    throw new Error("Помилка оновлення залишку номерів.");
  }

  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert([
      {
        hotel_id: hotelId,
        hotel_name: hotelName,
        guest_name: guestName,
        guest_phone: guestPhone,
        dates: dates || "Найближчі дати",
        room_category: roomCategory.title,
        price_per_night: pricePerNight,
      },
    ])
    .select()
    .single();

  if (insertError) {
    throw new Error("Помилка створення бронювання в базі.");
  }

  return {
    booking,
    updatedCategories: categories,
    remainingRooms: newTotal,
  };
}

export async function getBookings() {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Помилка завантаження бронювань:", error);
    return [];
  }
  return data;
}