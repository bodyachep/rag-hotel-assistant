import { useParams } from "react-router-dom";

export default function HotelDetails() {
  const { id } = useParams();
  return (
    <div style={{ padding: "40px", textAlign: "center", fontFamily: "Inter" }}>
      <h2>Деталі готелю {id}</h2>
      <p>Тут буде розгорнута інформація про обраний готель.</p>
    </div>
  );
}