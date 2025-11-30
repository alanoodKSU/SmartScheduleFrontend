import React, { useEffect, useState } from "react";
import { Card, Spinner, Badge, Table } from "react-bootstrap";
import {
  FaCalendarAlt,
  FaClock,
  FaChalkboardTeacher,
  FaDoorOpen,
  FaUserTie,
  FaTable,
} from "react-icons/fa";
import apiClient from "../../Services/apiClient";
import FacultyNavbar from "./FacultyNavbar";
import { useAuth } from "../../Hooks/AuthContext";

// 🎨 Color palette for courses
const COURSE_COLORS = {
  primary: ["#6366F1", "#8B5CF6", "#A855F7", "#D946EF"],
  secondary: ["#EC4899", "#F43F5E", "#EF4444", "#F97316"],
  accent: ["#F59E0B", "#EAB308", "#84CC16", "#22C55E"],
  neutral: ["#06B6D4", "#0EA5E9", "#3B82F6", "#60A5FA"],
};

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

export default function FacultySectionsPage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [facultyInfo, setFacultyInfo] = useState(null);

  const { user } = useAuth();
  const facultyId = user?.id;

  // 🟣 Load faculty sections
  const fetchSections = async () => {
    if (!facultyId) {
      console.log("Waiting for faculty user ID...");
      return;
    }

    setLoading(true);
    try {
      console.log("🔍 Fetching sections for faculty ID:", facultyId);
      const { data } = await apiClient.get(`/sections/faculty/${facultyId}`);
      setSections(data.sections || data || []);
      
      // Set faculty info
      setFacultyInfo({
        name: data.facultyName || user?.name || "Faculty Member",
        id: facultyId
      });
    } catch (err) {
      console.error("Failed to load faculty sections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [facultyId]);

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

  // 🎨 Get complementary text color
  const getTextColor = (bgColor) => {
    const color = bgColor.replace("#", "");
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#1F2937" : "#FFFFFF";
  };

  // Create grid for weekly schedule
  const grid = {};
  for (const s of sections) {
    if (!grid[s.day]) grid[s.day] = {};
    grid[s.day][s.start_time_hhmm] = s;
  }

  return (
    <div
      className="container-fluid p-0"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        minHeight: "100vh",
      }}
    >
      <FacultyNavbar />

      <div className="container-fluid py-4">
        <div className="row">
          {/* 🔹 Left Sidebar - Faculty Info */}
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
                <div className="d-flex align-items-center mb-4">
                  <div
                    style={{
                      background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                      borderRadius: "12px",
                      padding: "12px",
                      marginRight: "12px",
                    }}
                  >
                    <FaUserTie size={20} color="white" />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0 text-gray-800">
                      Teaching Schedule
                    </h6>
                    <small className="text-muted">Faculty overview</small>
                  </div>
                </div>

                {/* Faculty Info Card */}
                {facultyInfo && (
                  <Card
                    className="border-0 mb-4"
                    style={{
                      background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                      borderRadius: "16px",
                    }}
                  >
                    <Card.Body className="p-4 text-white">
                      <div className="text-center">
                        <FaChalkboardTeacher size={24} className="mb-2" />
                        <h6 className="fw-bold mb-1">{facultyInfo.name}</h6>
                        <p className="small opacity-90 mb-2">Faculty Profile</p>
                        <div className="d-flex justify-content-around">
                          <div className="text-center">
                            <div className="h5 fw-bold mb-1">
                              {sections.length}
                            </div>
                            <div className="small opacity-90">Sections</div>
                          </div>
                          <div className="text-center">
                            <div className="h5 fw-bold mb-1">
                              {
                                [...new Set(sections.map((s) => s.course_code))]
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

                {/* Show loading if no user ID */}
                {!facultyId && (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" variant="primary" />
                    <div className="small text-muted mt-2">
                      Loading faculty data...
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                {facultyId && sections.length > 0 && (
                  <div className="mt-4">
                    <h6 className="fw-semibold text-gray-700 mb-3">
                      📊 Teaching Stats
                    </h6>
                    <div className="small text-muted">
                      <div className="mb-2 d-flex justify-content-between">
                        <span>Lectures:</span>
                        <strong className="text-primary">
                          {sections.filter((s) => s.type === "lecture").length}
                        </strong>
                      </div>
                      <div className="mb-2 d-flex justify-content-between">
                        <span>Labs:</span>
                        <strong className="text-warning">
                          {sections.filter((s) => s.type === "lab").length}
                        </strong>
                      </div>
                      <div className="mb-2 d-flex justify-content-between">
                        <span>Levels:</span>
                        <strong className="text-info">
                          {
                            [...new Set(sections.map((s) => s.level_name))]
                              .length
                          }
                        </strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Days:</span>
                        <strong className="text-success">
                          {[...new Set(sections.map((s) => s.day))].length}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
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
                {/* Show message if no user ID */}
                {!facultyId && (
                  <div className="text-center py-5">
                    <div className="text-warning mb-3">
                      <FaUserTie size={48} />
                    </div>
                    <h5 className="text-gray-700 mb-2">Faculty Not Found</h5>
                    <p className="text-muted">
                      Unable to load faculty information. Please try logging in
                      again.
                    </p>
                  </div>
                )}

                {facultyId && (
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
                              Teaching Schedule Details
                              {facultyInfo && (
                                <span style={{ color: "#6366F1" }}>
                                  {" "}
                                  • {facultyInfo.name}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <FaCalendarAlt
                                className="me-3"
                                style={{ color: "#6366F1" }}
                              />
                              My Teaching Schedule
                              {facultyInfo && (
                                <span style={{ color: "#6366F1" }}>
                                  {" "}
                                  • {facultyInfo.name}
                                </span>
                              )}
                            </>
                          )}
                        </h4>
                        <p className="text-muted mb-0">
                          {showDetails
                            ? "Detailed section information"
                            : "Weekly timetable view"}
                        </p>
                      </div>

                      <button
                        className="btn px-4 py-2"
                        onClick={() => setShowDetails((prev) => !prev)}
                        disabled={sections.length === 0}
                        style={{
                          borderRadius: "12px",
                          background: showDetails
                            ? "linear-gradient(135deg, #6366F1, #8B5CF6)"
                            : "linear-gradient(135deg, #EC4899, #F43F5E)",
                          color: "white",
                          border: "none",
                          fontWeight: "600",
                          opacity: sections.length === 0 ? 0.6 : 1,
                        }}
                      >
                        {showDetails ? "📅 Weekly View" : "📊 Table View"}
                      </button>
                    </div>

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
                          Loading your teaching schedule...
                        </div>
                      </div>
                    ) : sections.length === 0 ? (
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
                          No Assigned Sections
                        </h5>
                        <p className="text-muted">
                          You don't have any teaching assignments yet. <br />
                          Check back later for your schedule updates.
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
                              <th className="py-3">Course Code</th>
                              <th className="py-3">Course Name</th>
                              <th className="py-3">Type</th>
                              <th className="py-3">Day</th>
                              <th className="py-3">Time</th>
                              <th className="py-3">Room</th>
                              <th className="py-3">Level</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sections.map((sec) => {
                              const bgColor = colorForCourse(
                                sec.course_code,
                                sec.type
                              );
                              const textColor = getTextColor(bgColor);

                              return (
                                <tr
                                  key={sec.id}
                                  style={{ transition: "all 0.2s" }}
                                >
                                  <td className="py-3">
                                    <div
                                      className="fw-bold"
                                      style={{ color: "#6366F1" }}
                                    >
                                      {sec.course_code}
                                    </div>
                                  </td>
                                  <td className="py-3 fw-semibold">
                                    {sec.course_name}
                                  </td>
                                  <td className="py-3">
                                    <Badge
                                      style={{
                                        background:
                                          sec.type === "lab"
                                            ? "linear-gradient(135deg, #F59E0B, #EAB308)"
                                            : "linear-gradient(135deg, #06B6D4, #0EA5E9)",
                                        color: "white",
                                        border: "none",
                                        padding: "6px 12px",
                                        borderRadius: "20px",
                                      }}
                                    >
                                      {sec.type}
                                    </Badge>
                                  </td>
                                  <td className="py-3 fw-semibold">
                                    {sec.day}
                                  </td>
                                  <td className="py-3">
                                    <span
                                      style={{
                                        color: "#6366F1",
                                        fontWeight: "600",
                                      }}
                                    >
                                      {sec.start_time_hhmm} - {sec.end_time_hhmm}
                                    </span>
                                  </td>
                                  <td className="py-3">
                                    {sec.room_name || "-"}
                                  </td>
                                  <td className="py-3">
                                    <Badge
                                      bg="secondary"
                                      style={{
                                        borderRadius: "12px",
                                        padding: "6px 12px",
                                      }}
                                    >
                                      {sec.level_name}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </div>
                    ) : (
                      // 🔹 Weekly Schedule Table (مثل جدول الطالب)
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
                              <th style={{ width: 120, padding: "16px" }}>Time</th>
                              {DAYS.map((d) => (
                                <th key={d} style={{ padding: "16px" }}>
                                  {d}
                                </th>
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
                                    padding: "16px",
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
                                        padding: "8px",
                                        border: "2px solid #F8FAFC",
                                        transition: "all 0.2s",
                                        cursor: sec ? "pointer" : "default",
                                      }}
                                      onMouseEnter={(e) => {
                                        if (sec)
                                          e.target.style.transform = "scale(1.02)";
                                      }}
                                      onMouseLeave={(e) => {
                                        if (sec)
                                          e.target.style.transform = "scale(1)";
                                      }}
                                    >
                                      {sec ? (
                                        <div className="d-flex flex-column align-items-center justify-content-center h-100">
                                          <div
                                            className="fw-bold mb-1"
                                            style={{ fontSize: "0.9rem" }}
                                          >
                                            {sec.course_code}
                                          </div>
                                          <small className="opacity-90">
                                            {sec.type} • {sec.room_name}
                                          </small>
                                          <small className="opacity-90 mt-1">
                                            {sec.level_name}
                                          </small>
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