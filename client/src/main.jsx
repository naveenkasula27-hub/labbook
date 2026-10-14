import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import BookingPage from "./pages/BookingPage.jsx";
import CheckBookingPage from "./pages/CheckBookingPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import "./styles.css";
import "./dashboard.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* The lab's own screens. Listed before /:slug so "dashboard" is
            not mistaken for a lab's address. */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Each lab gets its own address: /nandu */}
        <Route path="/:slug" element={<BookingPage />} />
        <Route path="/:slug/check" element={<CheckBookingPage />} />
        <Route path="*" element={<Navigate to="/nandu" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
