import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Outlet } from "react-router-dom"; // لعرض الصفحات الفرعية داخل الـ Layout

export default function Layout() {
  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{
        background:
          "linear-gradient(135deg, rgba(161,140,209,0.15) 0%, rgba(251,194,235,0.15) 100%)",
      }}
    >
      {/* ✅ Navbar */}
      <Navbar />

      {/* ✅ Main content area */}
      <main
        className="flex-grow-1 container py-4"
        style={{
          minHeight: "70vh",
        }}
      >
        <Outlet />
      </main>

      {/* ✅ Footer */}
      <Footer />
    </div>
  );
}
