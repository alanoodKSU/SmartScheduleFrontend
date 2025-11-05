import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaTable,
  FaCommentDots,
  FaBell,
} from "react-icons/fa";
import { Dropdown, Badge, Spinner } from "react-bootstrap";
import apiClient from "../../Services/apiClient";
import { useAuth } from "../../Hooks/AuthContext";

export default function StudentLinksBar() {
  const { user } = useAuth(); // ✅ user = { id, role }
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // ✅ Fetch notifications for current user role
  const fetchNotifications = async () => {
    if (!user?.role || !user?.id) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/notifications`, {
        params: {
          userId: user.id,
          role: user.role,
          t: Date.now(), // prevent cache
        },
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });

      console.log("🔔 Notifications fetched:", data);

      const list = Array.isArray(data)
        ? data
        : data.notifications || data.results || [];

      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error("❌ Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.id, user?.role]);

  // ✅ Handle dropdown open/close
  const toggleDropdown = async (isOpen) => {
    setShowDropdown(isOpen);
    if (isOpen) await fetchNotifications();
  };

  const links = [
    { path: "/load-committee/dashboard", label: "Home", icon: <FaTable /> },
    { path: "/load-committee/feedback", label: "Feedback", icon: <FaCommentDots /> },
  ];

  return (
    <div
      className="d-flex justify-content-center align-items-center gap-4 py-2 position-relative"
      style={{
        background: "linear-gradient(90deg, #7C3AED 0%, #EC4899 100%)",
        color: "white",
        fontWeight: "500",
      }}
    >
      {/* 🔗 Navigation Links */}
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

      {/* 🔔 Notification Bell */}
      <Dropdown align="end" show={showDropdown} onToggle={toggleDropdown}>
        <Dropdown.Toggle
          variant="link"
          className="text-white position-relative"
          id="student-notifications-dropdown"
          style={{ textDecoration: "none" }}
        >
          <FaBell size={18} />
          {unreadCount > 0 && (
            <Badge
              bg="danger"
              pill
              className="position-absolute top-0 start-100 translate-middle"
            >
              {unreadCount}
            </Badge>
          )}
        </Dropdown.Toggle>

        <Dropdown.Menu
          style={{
            minWidth: "320px",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          <Dropdown.Header>Notifications</Dropdown.Header>

          {loading ? (
            <div className="text-center py-2">
              <Spinner animation="border" size="sm" /> Loading...
            </div>
          ) : notifications.length === 0 ? (
            <Dropdown.ItemText className="text-muted text-center">
              No notifications
            </Dropdown.ItemText>
          ) : (
            notifications.map((n) => (
              <Dropdown.ItemText
                key={n.id}
                className={`d-block px-3 py-2 ${
                  !n.is_read ? "fw-bold" : ""
                }`}
              >
                <div className="text-dark">{n.title}</div>
                <small className="text-muted">{n.body}</small>
                <hr className="my-1" />
              </Dropdown.ItemText>
            ))
          )}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}
