import React, { useEffect, useState } from "react";
import { Table, Spinner, Card, Badge, Form, InputGroup, Button } from "react-bootstrap";
import { FaBell, FaTable, FaCalendarAlt, FaUserGraduate, FaSearch } from "react-icons/fa";
import apiClient from "../../Services/apiClient";
import StudentLinksBar from "./StudentNavbar";
import { useAuth } from "../../Hooks/AuthContext"; // Import auth context

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
const TIME_SLOTS = [
  ["08:00", "09:00"],
  ["09:00", "10:00"],
  ["10:00", "11:00"],
  ["11:00", "12:00"],
  ["12:00", "13:00"],
  ["13:00", "14:00"],
  ["14:00", "15:00"],
  ["15:00", "16:00"],
];

// 🎨 Color palette for courses
const COURSE_COLORS = {
  primary: ["#6366F1", "#8B5CF6", "#A855F7", "#D946EF"],
  secondary: ["#EC4899", "#F43F5E", "#EF4444", "#F97316"],
  accent: ["#F59E0B", "#EAB308", "#84CC16", "#22C55E"],
  neutral: ["#06B6D4", "#0EA5E9", "#3B82F6", "#60A5FA"],
};

export default function StudentSchedulePage() {
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!userId) {
        console.log("Waiting for user ID...");
        return;
      }

      setLoading(true);
      try {
        console.log("🔍 Fetching schedule for user ID:", userId);
        const { data } = await apiClient.get(`/sections/schedule/${userId}`);
        setSections(data.sections);
        setFilteredSections(data.sections);
        setStudentInfo(data.student);
      } catch (err) {
        console.error("Failed to load schedule", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [userId]);

  // 🟣 Filter sections by search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredSections(sections);
      return;
    }

    const lower = searchTerm.toLowerCase();
    const filtered = sections.filter(
      (s) =>
        s.course_name?.toLowerCase().includes(lower) ||
        s.course_code?.toLowerCase().includes(lower) ||
        s.faculty_name?.toLowerCase().includes(lower)
    );
    setFilteredSections(filtered);
  }, [searchTerm, sections]);

  const grid = {};
  for (const s of filteredSections) {
    if (!grid[s.day]) grid[s.day] = {};
    grid[s.day][s.start_time_hhmm] = s;
  }

  // 🎨 Enhanced color mapping
  const colorForCourse = (code, type) => {
    if (!code) return "#F3F4F6";

    const hash = code.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    const colorGroups = Object.values(COURSE_COLORS).flat();
    const colorIndex = Math.abs(hash) % colorGroups.length;

    let baseColor = colorGroups[colorIndex];

    if (type === "lab") {
      return baseColor;
    }

    return baseColor;
  };

  const getTextColor = (bgColor) => {
    const color = bgColor.replace("#", "");
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#1F2937" : "#FFFFFF";
  };

  return (
    <div
      className="container-fluid p-0"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        minHeight: "100vh",
      }}
    >
      <StudentLinksBar />

      <div className="container-fluid py-4">
        <div className="row">
          {/* 🔹 Left Notifications */}
          <div className="col-md-3 mb-4">
            <Card
              style={{
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                height: "100%",
              }}
            >
              <Card.Body className="p-4">
                {/* Student Info Card */}
                {studentInfo && (
                  <Card
                    className="border-0 mb-4"
                    style={{
                      background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                      borderRadius: "16px",
                    }}
                  >
                    <Card.Body className="p-4 text-white">
                      <div className="text-center">
                        <FaUserGraduate size={24} className="mb-2" />
                        <h6 className="fw-bold mb-1">{studentInfo.name}</h6>
                        <p className="small opacity-90 mb-2">Student Profile</p>
                        <div className="d-flex justify-content-around">
                          <div className="text-center">
                            <div className="h5 fw-bold mb-1">
                              {filteredSections.length}
                            </div>
                            <div className="small opacity-90">Sections</div>
                          </div>
                          <div className="text-center">
                            <div className="h5 fw-bold mb-1">
                              {
                                [...new Set(filteredSections.map((s) => s.course_code))]
                                  .length
                              }
                            </div>
                            <div className="small opacity-90">Courses</div>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                )}

                {/* 🔍 Search Bar */}
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-semibold text-gray-700">
                    <FaSearch className="me-2" />
                    Search Course / Faculty
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Type course or faculty name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ borderRadius: "8px" }}
                    />
                  </InputGroup>
                  {searchTerm && (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="w-100 mt-2"
                      onClick={() => setSearchTerm("")}
                      style={{ borderRadius: "8px" }}
                    >
                      Clear Search
                    </Button>
                  )}
                </Form.Group>

                {/* 🔔 Notifications Header */}
                <div className="d-flex align-items-center mb-4">
                  <div
                    style={{
                      background: "linear-gradient(135deg, #EC4899, #F43F5E)",
                      borderRadius: "12px",
                      padding: "12px",
                      marginRight: "12px",
                    }}
                  >
                    <FaBell size={20} color="white" />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0 text-gray-800">Notifications</h6>
                    <small className="text-muted">Latest updates</small>
                  </div>
                </div>

                {/* 📨 Dynamic Notifications */}
                <NotificationsList userRole={user?.role} />
              </Card.Body>
            </Card>
          </div>

          {/* 🔹 Right Content */}
          <div className="col-md-9">
            <Card
              style={{
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                minHeight: "600px",
              }}
            >
              <Card.Body className="p-4">
                {!userId && (
                  <div className="text-center py-5">
                    <div className="text-warning mb-3">
                      <FaUserGraduate size={48} />
                    </div>
                    <h5 className="text-gray-700 mb-2">User Not Found</h5>
                    <p className="text-muted">
                      Unable to load user information. Please try logging in
                      again.
                    </p>
                  </div>
                )}

                {userId && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div>
                        <h4 className="fw-bold text-gray-800 mb-1">
                          {showDetails ? (
                            <>
                              <FaTable
                                className="me-3"
                                style={{ color: "#6366F1" }}
                              />
                              Schedule Details
                              {studentInfo && (
                                <span style={{ color: "#6366F1" }}>
                                  {" "}
                                  • {studentInfo.name}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <FaCalendarAlt
                                className="me-3"
                                style={{ color: "#6366F1" }}
                              />
                              My Weekly Schedule
                              {studentInfo && (
                                <span style={{ color: "#6366F1" }}>
                                  {" "}
                                  • {studentInfo.name}
                                </span>
                              )}
                            </>
                          )}
                        </h4>
                        <p className="text-muted mb-0">
                          {showDetails
                            ? "Detailed section information"
                            : "Visual weekly timetable view"}
                          {searchTerm && ` • Searching: "${searchTerm}"`}
                        </p>
                      </div>

                      <button
                        className="btn px-4 py-2"
                        onClick={() => setShowDetails((prev) => !prev)}
                        disabled={filteredSections.length === 0}
                        style={{
                          borderRadius: "12px",
                          background: showDetails
                            ? "linear-gradient(135deg, #6366F1, #8B5CF6)"
                            : "linear-gradient(135deg, #EC4899, #F43F5E)",
                          color: "white",
                          border: "none",
                          fontWeight: "600",
                          opacity: filteredSections.length === 0 ? 0.6 : 1,
                        }}
                      >
                        {showDetails ? "📅 Weekly View" : "📊 Table View"}
                      </button>
                    </div>

                    {/* 🟣 Conditional Views */}
                    {loading ? (
                      <div className="text-center py-5">
                        <Spinner
                          animation="border"
                          style={{
                            color: "#6366F1",
                            width: "3rem",
                            height: "3rem",
                          }}
                        />
                        <div className="mt-3 text-muted">
                          Loading your schedule...
                        </div>
                      </div>
                    ) : filteredSections.length === 0 ? (
                      <div className="text-center py-5">
                        <div
                          style={{
                            background:
                              "linear-gradient(135deg, #F59E0B, #EAB308)",
                            borderRadius: "50%",
                            width: "80px",
                            height: "80px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 20px",
                          }}
                        >
                          <FaCalendarAlt size={32} color="white" />
                        </div>
                        <h5 className="text-gray-700 mb-2">
                          No Matching Sections
                        </h5>
                        <p className="text-muted">
                          Try adjusting your search term.
                        </p>
                      </div>
                    ) : showDetails ? (
                      // 🔹 Schedule Details Table
                      <div className="table-responsive">
                        <Table
                          hover
                          className="align-middle"
                          style={{ borderRadius: "12px", overflow: "hidden" }}
                        >
                          <thead
                            style={{
                              background:
                                "linear-gradient(135deg, #6366F1, #8B5CF6)",
                              color: "white",
                            }}
                          >
                            <tr>
                              <th>Course</th>
                              <th>Section</th>
                              <th>Type</th>
                              <th>Day</th>
                              <th>Time</th>
                              <th>Faculty</th>
                              <th>Room</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSections.map((s) => {
                              const bgColor = colorForCourse(
                                s.course_code,
                                s.type
                              );
                              const textColor = getTextColor(bgColor);

                              return (
                                <tr key={s.id}>
                                  <td className="fw-bold" style={{ color: "#6366F1" }}>
                                    {s.course_code}
                                  </td>
                                  <td>
                                    <small className="text-muted">
                                      #{s.section_number}
                                    </small>
                                  </td>
                                  <td>
                                    <Badge
                                      style={{
                                        background:
                                          s.type === "lab"
                                            ? "linear-gradient(135deg, #F59E0B, #EAB308)"
                                            : "linear-gradient(135deg, #06B6D4, #0EA5E9)",
                                        color: "white",
                                        borderRadius: "20px",
                                        padding: "6px 12px",
                                      }}
                                    >
                                      {s.type}
                                    </Badge>
                                  </td>
                                  <td>{s.day}</td>
                                  <td>
                                    <span
                                      style={{
                                        color: "#6366F1",
                                        fontWeight: "600",
                                      }}
                                    >
                                      {s.start_time_hhmm} - {s.end_time_hhmm}
                                    </span>
                                  </td>
                                  <td>{s.faculty_name || "-"}</td>
                                  <td>{s.room_name || "-"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </div>
                    ) : (
                      // 🔹 Weekly Schedule Table
                      <div className="table-responsive">
                        <Table
                          bordered
                          className="text-center align-middle"
                          style={{ borderRadius: "12px", overflow: "hidden" }}
                        >
                          <thead
                            style={{
                              background:
                                "linear-gradient(135deg, #6366F1, #8B5CF6)",
                              color: "white",
                            }}
                          >
                            <tr>
                              <th style={{ width: 120 }}>Time</th>
                              {DAYS.map((d) => (
                                <th key={d}>{d}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {TIME_SLOTS.map(([start, end]) => (
                              <tr key={start}>
                                <td
                                  className="fw-bold"
                                  style={{
                                    background:
                                      "linear-gradient(135deg, #F8FAFC, #F1F5F9)",
                                    color: "#475569",
                                  }}
                                >
                                  {start}-{end}
                                </td>
                                {DAYS.map((day) => {
                                  const sec = grid[day]?.[start];
                                  const bgColor = sec
                                    ? colorForCourse(sec.course_code, sec.type)
                                    : "#FFFFFF";
                                  const textColor = getTextColor(bgColor);

                                  return (
                                    <td
                                      key={day + start}
                                      style={{
                                        height: 80,
                                        background: bgColor,
                                        color: textColor,
                                        border: "2px solid #F8FAFC",
                                      }}
                                    >
                                      {sec ? (
                                        <div>
                                          <div className="fw-bold mb-1">
                                            {sec.course_code}
                                          </div>
                                          <small className="opacity-90">
                                            {sec.type} • {sec.room_name}
                                          </small>
                                          {sec.faculty_name && (
                                            <small className="opacity-90 mt-1 d-block">
                                              {sec.faculty_name}
                                            </small>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-muted">-</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 📨 Notification Component
// ============================================================
function NotificationsList({ userRole }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userRole) return;
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get(`/notifications`, {
          params: { role: userRole, t: Date.now() },
          headers: { "Cache-Control": "no-cache" },
        });
        setNotifications(data);
      } catch (err) {
        console.error("❌ Error loading notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [userRole]);

  if (loading) {
    return (
      <div className="text-center py-3">
        <Spinner animation="border" size="sm" variant="primary" />
        <div className="small text-muted mt-2">Loading notifications...</div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center text-muted small">
        No notifications found
      </div>
    );
  }

  const typeColors = {
    schedule: { bg: "linear-gradient(135deg, #EEF2FF, #E0E7FF)", border: "#6366F1" },
    update: { bg: "linear-gradient(135deg, #DBEAFE, #E0F2FE)", border: "#3B82F6" },
    reminder: { bg: "linear-gradient(135deg, #FEF3C7, #FDE68A)", border: "#F59E0B" },
    general: { bg: "linear-gradient(135deg, #D1FAE5, #A7F3D0)", border: "#10B981" },
  };

  return (
    <div
      className="d-flex flex-column gap-3"
      style={{ maxHeight: "400px", overflowY: "auto" }}
    >
      {notifications.map((n) => {
        const colorSet = typeColors[n.type] || typeColors.general;
        return (
          <div
            key={n.id}
            className="p-3 rounded-3"
            style={{
              background: colorSet.bg,
              borderLeft: `4px solid ${colorSet.border}`,
            }}
          >
            <strong className="text-gray-800">{n.title}</strong>
            <p className="mb-0 small text-muted mt-1">{n.body}</p>
          </div>
        );
      })}
    </div>
  );
}
