import React, { useState } from "react";
import { useAuth } from "../Hooks/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav
      className="navbar navbar-expand-lg shadow-sm"
      style={{
        background: "linear-gradient(90deg, #a18cd1 0%, #fbc2eb 100%)",
        padding: "10px 20px",
      }}
    >
      <div className="container-fluid d-flex justify-content-between align-items-center">
        {/* ✅ Logo / title */}
        <span
          className="navbar-brand fw-bold text-white"
          style={{ cursor: "pointer", fontSize: "1.3rem" }}
          onClick={() => navigate("/")}
        >
          SmartSchedule
        </span>

        {/* ✅ User dropdown */}
        <div className="dropdown">
          <button
            className="btn text-white fw-semibold dropdown-toggle"
            style={{ border: "none" }}
            onClick={() => setOpen(!open)}
          >
            {user?.email || "User"}
          </button>

          {open && (
            <ul
              className="dropdown-menu dropdown-menu-end show shadow-sm"
              style={{ borderRadius: "10px" }}
            >
              <li>
                <button
                  className="dropdown-item text-danger fw-semibold"
                  onClick={() => {
                    logout();
                    navigate("/login"); // ✅ إعادة توجيه فورية بعد تسجيل الخروج
                  }}
                >
                  Logout
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}
