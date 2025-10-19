import React, { useEffect, useState } from "react";
import { Table, Spinner, Card, Badge } from "react-bootstrap";
import { FaBell, FaTable, FaCalendarAlt, FaUserGraduate } from "react-icons/fa";
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
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);

  // ✅ CORRECT: Get user from auth context
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    const fetchSchedule = async () => {
      // ✅ Check if userId is available
      if (!userId) {
        console.log("Waiting for user ID...");
        return;
      }

      setLoading(true);
      try {
        console.log("🔍 Fetching schedule for user ID:", userId);
        const { data } = await apiClient.get(`/sections/schedule/${userId}`);
        setSections(data.sections);
        setStudentInfo(data.student);
      } catch (err) {
        console.error("Failed to load schedule", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [userId]); // ✅ Add userId as dependency

  const grid = {};
  for (const s of sections) {
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

  // 🎨 Get complementary text color
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
                {!userId && (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" variant="primary" />
                    <div className="small text-muted mt-2">
                      Loading user data...
                    </div>
                  </div>
                )}

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
                    <h6 className="fw-bold mb-0 text-gray-800">
                      Notifications
                    </h6>
                    <small className="text-muted">Latest updates</small>
                  </div>
                </div>

                <div
                  className="d-flex flex-column gap-3"
                  style={{ maxHeight: "400px", overflowY: "auto" }}
                >
                  <div
                    className="p-3 rounded-3"
                    style={{
                      background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)",
                      borderLeft: "4px solid #6366F1",
                    }}
                  >
                    <strong className="text-gray-800">Schedule Released</strong>
                    <p className="mb-0 small text-muted mt-1">
                      You can now view your assigned schedule and sections.
                    </p>
                  </div>

                  <div
                    className="p-3 rounded-3"
                    style={{
                      background: "linear-gradient(135deg, #DBEAFE, #E0F2FE)",
                      borderLeft: "4px solid #3B82F6",
                    }}
                  >
                    <strong className="text-gray-800">Update Notice</strong>
                    <p className="mb-0 small text-muted mt-1">
                      MATH 151 lecture room changed to 402.
                    </p>
                  </div>

                  <div
                    className="p-3 rounded-3"
                    style={{
                      background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
                      borderLeft: "4px solid #F59E0B",
                    }}
                  >
                    <strong className="text-gray-800">Reminder</strong>
                    <p className="mb-0 small text-muted mt-1">
                      Submit elective preferences before Oct 20.
                    </p>
                  </div>

                  <div
                    className="p-3 rounded-3"
                    style={{
                      background: "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
                      borderLeft: "4px solid #10B981",
                    }}
                  >
                    <strong className="text-gray-800">Welcome Back!</strong>
                    <p className="mb-0 small text-muted mt-1">
                      New semester starts next week. Check your schedule.
                    </p>
                  </div>
                </div>
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
                          No Schedule Found
                        </h5>
                        <p className="text-muted">
                          No schedule sections found for your account. <br />
                          Check back later for schedule updates.
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
      background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
      color: "white",
    }}
  >
    <tr>
      <th className="py-3">Course</th>
      <th className="py-3">Section</th>
      <th className="py-3">Type</th>
     
      <th className="py-3">Day</th>
      <th className="py-3">Time</th>
      <th className="py-3">Faculty</th>
      <th className="py-3">Room</th>
    </tr>
  </thead>
  <tbody>
    {sections.map((s) => {
      const bgColor = colorForCourse(s.course_code, s.type);
      const textColor = getTextColor(bgColor);

      return (
        <tr key={s.id} style={{ transition: "all 0.2s" }}>
          <td className="fw-bold py-3" style={{ color: "#6366F1" }}>
            {s.course_code}
          </td>
          
         
          {/* ✅ Show Section Number Instead of ID */}
          <td className="py-3">
            <small className="text-muted">#{s.section_number}</small>
          </td>
           <td className="py-3">
            <Badge
              style={{
                background:
                  s.type === "lab"
                    ? "linear-gradient(135deg, #F59E0B, #EAB308)"
                    : "linear-gradient(135deg, #06B6D4, #0EA5E9)",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "20px",
              }}
            >
              {s.type}
            </Badge>
          </td>
          <td className="py-3 fw-semibold">{s.day}</td>
          <td className="py-3">
            <span
              style={{
                color: "#6366F1",
                fontWeight: "600",
              }}
            >
              {s.start_time_hhmm} - {s.end_time_hhmm}
            </span>
          </td>
          <td className="py-3">{s.faculty_name || "-"}</td>
          <td className="py-3">{s.room_name || "-"}</td>
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
                              <th style={{ width: 120, padding: "16px" }}>
                                Time
                              </th>
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
                                          e.target.style.transform =
                                            "scale(1.02)";
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
                                          {sec.faculty_name && (
                                            <small className="opacity-90 mt-1">
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
