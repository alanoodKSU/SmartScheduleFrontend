import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Nav, Dropdown, Badge, Spinner, Button } from "react-bootstrap";
import { FaUserGraduate, FaUsersCog, FaBook, FaBell } from "react-icons/fa";
import apiClient from "../../Services/apiClient";

export default function RegistrarNavbar() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 🟣 Get logged user info (from auth context or localStorage)
  const user = JSON.parse(localStorage.getItem("user")) || {
    role: "registrar",
  };

  const tabs = [
    {
      name: "Irregular Students",
      path: "/registrar/irregular-students",
      icon: <FaUserGraduate className="me-1" />,
    },
    {
      name: "Section Capacity",
      path: "/registrar/sections",
      icon: <FaUsersCog className="me-1" />,
    },
    {
      name: "Course Enrollments",
      path: "/registrar/course-enrollment",
      icon: <FaBook className="me-1" />,
    },
  ];

  // 🟢 Load notifications for logged user
  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Get unread count
  const loadUnreadCount = async () => {
    try {
      const res = await apiClient.get("/notifications/unread/count");
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error("Failed to load unread count:", err);
    }
  };

  // 🟢 Mark one as read
  const markAsRead = async (id) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(c - 1, 0));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // 🟢 Mark all as read
  const markAllAsRead = async () => {
    try {
      await apiClient.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  return (
    <div className="bg-white shadow-sm rounded-4 px-3 py-2 mb-3 d-flex justify-content-between align-items-center">
      {/* Navigation Tabs */}
      <Nav variant="tabs" className="border-0">
        {tabs.map((tab) => (
          <Nav.Item key={tab.path} className="me-2">
            <Nav.Link
              as={NavLink}
              to={tab.path}
              className={({ isActive }) =>
                `fw-semibold px-3 py-2 rounded ${
                  isActive ? "active-tab text-white" : "text-secondary bg-light"
                }`
              }
            >
              {tab.icon}
              {tab.name}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      {/* 🔔 Notifications Dropdown */}
      <Dropdown align="end">
        <Dropdown.Toggle
          variant="light"
          className="border-0 position-relative"
          id="notifications-dropdown"
        >
          <FaBell size={20} color="#6f42c1" />
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
            width: "320px",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          <Dropdown.Header className="d-flex justify-content-between align-items-center">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Button
                variant="link"
                size="sm"
                className="text-decoration-none p-0"
                onClick={markAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </Dropdown.Header>

          {loading ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-muted py-3">
              No notifications found
            </div>
          ) : (
            notifications.map((n) => (
              <Dropdown.Item
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`border-bottom small ${
                  n.is_read ? "text-muted" : "fw-bold text-dark"
                }`}
              >
                <div>{n.title}</div>
                <small className="text-secondary">{n.body}</small>
                <div className="text-end">
                  <small className="text-muted">
                    {new Date(n.created_at).toLocaleString()}
                  </small>
                </div>
              </Dropdown.Item>
            ))
          )}
        </Dropdown.Menu>
      </Dropdown>

      <style jsx="true">{`
        .nav-tabs .nav-link {
          border: none;
          transition: all 0.25s ease;
        }
        .nav-tabs .nav-link:hover {
          background-color: #f8f9fa;
          color: #6f42c1;
        }
        .active-tab {
          background: linear-gradient(90deg, #a18cd1 0%, #fbc2eb 100%);
          border-radius: 10px;
          color: white !important;
          box-shadow: 0 0 6px rgba(111, 66, 193, 0.4);
        }
      `}</style>
    </div>
  );
}
