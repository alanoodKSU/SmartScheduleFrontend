import React from "react";
import { useAuth } from "../../Hooks/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ScheduleCommitteeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const modules = [
    {
      title: "SURVEYS",
      desc: "Manage student surveys",
      color: "#3b82f6",
      icon: "📋",
      path: "/schedule-committee/surveys",
    },
    {
      title: "SURVEY ANALYTICS",
      desc: "View survey results",
      color: "#22c55e",
      icon: "📊",
      path: "/schedule-committee/survey-analytics",
    },
    {
      title: "EXTERNAL SLOTS",
      desc: "Manage external course slots",
      color: "#8b5cf6",
      icon: "➕",
      path: "/schedule-committee/external-slots",
    },
    {
      title: "SCHEDULE BUILDER",
      desc: "Build weekly schedules",
      color: "#10b981",
      icon: "📅",
      path: "/schedule-committee/schedule-builder",
    },
    {
      title: "EXAM DATES",
      desc: "Set final exam dates",
      color: "#f97316",
      icon: "📝",
      path: "/schedule-committee/exam-schedule",
    },
    {
      title: "IRREGULAR STUDENTS",
      desc: "Manage irregular students",
      color: "#ef4444",
      icon: "👥",
      path: "/schedule-committee/irregular-students",
    },
    {
      title: "RULES",
      desc: "Configure scheduling rules",
      color: "#6366f1",
      icon: "⚙️",
      path: "/schedule-committee/rules",
    },
    {
      title: "FEEDBACK",
      desc: "View and manage feedback",
      color: "#ec4899",
      icon: "💬",
      path: "/schedule-committee/feedback",
    },
    {
      title: "HISTORY",
      desc: "Schedule version history",
      color: "#6b7280",
      icon: "📜",
      path: "/schedule-committee/history",
    },
  ];

  return (
    <div className="container py-4">
      {/* ✅ Header */}
      <div className="mb-4">
        <h2
          className="fw-bold"
          style={{
            color: "#047857",
            textTransform: "capitalize",
          }}
        >
          Welcome, {user?.email || "schedule.committee@ksu.edu.sa"}!
        </h2>
        <p className="text-muted mb-4">Pick an action to continue.</p>
      </div>

      {/* ✅ Grid of Modules */}
      <div className="row g-3">
        {modules.map((mod, index) => (
          <div key={index} className="col-12 col-sm-6 col-lg-4">
            <div
              className="card shadow-sm border-0 h-100"
              role="button"
              style={{
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onClick={() => navigate(mod.path)}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "translateY(-5px)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <div className="card-body d-flex align-items-center">
                {/* Icon */}
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    backgroundColor: mod.color,
                    color: "white",
                    width: "50px",
                    height: "50px",
                    fontSize: "1.5rem",
                  }}
                >
                  {mod.icon}
                </div>

                {/* Text */}
                <div>
                  <h6 className="fw-bold mb-1" style={{ color: "#047857" }}>
                    {mod.title}
                  </h6>
                  <p className="text-muted mb-0 small">{mod.desc}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
