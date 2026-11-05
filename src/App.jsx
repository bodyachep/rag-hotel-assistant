import { Routes, Route, Navigate } from "react-router-dom";
import Assistant from "./pages/Assistant";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/assistant" replace />} />
      <Route path="/assistant" element={<Assistant />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}