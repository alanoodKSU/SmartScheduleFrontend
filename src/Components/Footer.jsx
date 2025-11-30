import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="text-center text-white py-3 mt-auto"
      style={{
        background: "linear-gradient(90deg, #a18cd1 0%, #fbc2eb 100%)",
        fontSize: "0.95rem",
        letterSpacing: "0.5px",
        boxShadow: "0 -2px 5px rgba(0,0,0,0.1)",
      }}
    >
      <span className="fw-semibold">
        © {year} SmartSchedule — All rights reserved.
      </span>
    </footer>
  );
}
