import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import BookingPage from "./pages/BookingPage.jsx";
import CheckBookingPage from "./pages/CheckBookingPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import Terms from "./pages/Terms.jsx";
import "./styles.css";
import "./dashboard.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* The front door. Used to redirect to /nandu, which meant anyone
            opening the bare address landed on a real lab's booking page. */}
        <Route path="/" element={<LandingPage />} />

        {/* The lab's own screens. Listed before /:slug so "dashboard" is
            not mistaken for a lab's address. */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Same reason these sit above /:slug — no lab gets the slug
            "privacy" or "terms". */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />

        {/* Each lab gets its own address: /nandu */}
        <Route path="/:slug" element={<BookingPage />} />
        <Route path="/:slug/check" element={<CheckBookingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
