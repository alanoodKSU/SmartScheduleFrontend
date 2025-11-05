import React, { useEffect, useState } from "react";
import { Navbar, Nav, Container, Badge, Dropdown, Spinner } from "react-bootstrap";
import {
  FaClipboardList,
  FaChartBar,
  FaPlusCircle,
  FaCalendarAlt,
  FaUserGraduate,
  FaCogs,
  FaComments,
  FaHistory,
  FaBell,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import apiClient from "../../Services/apiClient";
import { useAuth } from "../../Hooks/AuthContext";

export default function ScheduleCommitteeNavbar() {
  const { user } = useAuth(); // { id, role }
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // ✅ Fetch notifications for the current role
  const fetchNotifications = async () => {
    if (!user?.role) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/notifications`, {
        params: { role: user.role, t: Date.now() },
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      console.log("🔔 Notifications fetched:", data);
      setNotifications(data);
      const unread = data.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("❌ Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.role]);

  const toggleDropdown = async (isOpen) => {
    setShowDropdown(isOpen);
    if (isOpen) await fetchNotifications();
  };

  return (
    <Navbar
      bg="light"
      expand="lg"
      className="shadow-sm border-bottom"
      style={{ fontWeight: "500" }}
    >
      <Container fluid>
        <Navbar.Toggle aria-controls="committee-navbar" />
        <Navbar.Collapse id="committee-navbar">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/schedule-committee">
              <FaClipboardList className="me-2 text-secondary" />
              Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/schedule-committee/surveys">
              <FaClipboardList className="me-2 text-secondary" />
              Surveys
            </Nav.Link>
            <Nav.Link as={Link} to="/schedule-committee/survey-analytics">
              <FaChartBar className="me-2 text-success" />
              Survey Analytics
            </Nav.Link>
            <Nav.Link as={Link} to="/schedule-committee/external-slots">
              <FaPlusCircle className="me-2 text-purple" />
              External Slots
            </Nav.Link>
            <Nav.Link as={Link} to="/schedule-committee/schedule-builder">
              <FaCalendarAlt className="me-2 text-warning" />
              Schedule Builder
            </Nav.Link>
            <Nav.Link as={Link} to="/schedule-committee/exam-schedule">
              <FaCalendarAlt className="me-2 text-danger" />
              Exam Dates
            </Nav.Link>
            <Nav.Link as={Link} to="/schedule-committee/irregular-students">
              <FaUserGraduate className="me-2 text-dark" />
              Irregular Students
            </Nav.Link>
            <Nav.Link as={Link} to="/schedule-committee/rules">
              <FaCogs className="me-2 text-secondary" />
              Rules
            </Nav.Link>
            <Nav.Link as={Link} to="/schedule-committee/feedback">
              <FaComments className="me-2 text-pink" />
              Feedback
            </Nav.Link>
            <Nav.Link as={Link} to="/schedule-committee/history">
              <FaHistory className="me-2 text-muted" />
              History
            </Nav.Link>
          </Nav>

          {/* 🔔 Notification Bell */}
          <Dropdown align="end" show={showDropdown} onToggle={toggleDropdown} className="me-3">
            <Dropdown.Toggle
              variant="link"
              className="text-dark position-relative"
              id="notifications-dropdown"
              style={{ textDecoration: "none" }}
            >
              <FaBell size={20} />
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
                minWidth: "340px",
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
                <Dropdown.ItemText className="text-muted">
                  No notifications
                </Dropdown.ItemText>
              ) : (
                notifications.map((n) => (
                  <Dropdown.ItemText
                    key={n.id}
                    className={`d-block ${!n.is_read ? "fw-bold" : ""}`}
                  >
                    <div>{n.title}</div>
                    <small className="text-muted">{n.body}</small>
                    <hr className="my-1" />
                  </Dropdown.ItemText>
                ))
              )}
            </Dropdown.Menu>
          </Dropdown>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
