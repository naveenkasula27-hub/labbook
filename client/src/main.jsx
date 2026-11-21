import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
const LandingPage = lazy(() => import("./pages/LandingPage.jsx"));
const BookingPage = lazy(() => import("./pages/BookingPage.jsx"));
const AudiencePage = lazy(() => import("./pages/AudiencePage.jsx"));
const CheckBookingPage = lazy(() => import("./pages/CheckBookingPage.jsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const SignupPage = lazy(() => import("./pages/SignupPage.jsx"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.jsx"));
const Terms = lazy(() => import("./pages/Terms.jsx"));
import "./styles.css";
import RouteMetadata from "./components/RouteMetadata.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <RouteMetadata />
      <Suspense fallback={<main className="center" role="status">Loading LabBook…</main>}>
      <Routes>
        {/* The front door. Used to redirect to /nandu, which meant anyone
            opening the bare address landed on a real lab's booking page. */}
        <Route path="/" element={<LandingPage />} />

        {/* The lab's own screens. Listed before /:slug so "dashboard" is
            not mistaken for a lab's address. */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Same reason these sit above /:slug — no lab gets the slug
            "privacy" or "terms". */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />

        {/* Each lab gets its own address: /nandu */}
        <Route path="/:slug" element={<BookingPage />}>
          <Route index />
          <Route path="tests" />
          <Route path="checkups" />
        </Route>
        <Route path="/:slug/check" element={<CheckBookingPage />} />
        <Route path="/:slug/for/:audience" element={<AudiencePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>
);
