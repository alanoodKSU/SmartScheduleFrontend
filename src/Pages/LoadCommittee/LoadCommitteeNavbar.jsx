import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaTable,
  FaListAlt,
  FaLayerGroup,
  FaCommentDots,
} from "react-icons/fa";

export default function StudentLinksBar() {
  const links = [
    {
      path: "/load-committee/dashboard",
      label: "Home",
      icon: <FaTable />,
    },

    {
      path: "/load-committee/feedback",
      label: "Feedback",
      icon: <FaCommentDots />,
    },
  ];

  return (
    <div
      className="d-flex justify-content-center gap-4 py-2"
      style={{
        background: "linear-gradient(90deg, #7C3AED 0%, #EC4899 100%)",
        color: "white",
        fontWeight: "500",
      }}
    >
      {links.map(({ path, label, icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `text-decoration-none d-flex align-items-center gap-2 ${
              isActive ? "fw-bold text-dark" : "text-white"
            }`
          }
          style={{ fontSize: "0.9rem" }}
        >
          {icon}
          {label}
        </NavLink>
      ))}
    </div>
  );
}
