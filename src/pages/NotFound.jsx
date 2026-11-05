import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ padding: "40px", textAlign: "center", fontFamily: "Inter" }}>
      <h2>404 - Сторінку не знайдено</h2>
      <Link to="/" style={{ color: "#4f46e5" }}>Повернутися на головну</Link>
    </div>
  );
}