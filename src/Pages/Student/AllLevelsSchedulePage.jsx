import React, { useEffect, useState } from "react";
import { Table, Spinner, Card, Form, Button, Badge, InputGroup } from "react-bootstrap";
import {
  FaTable,
  FaFilter,
  FaSync,
  FaCalendarAlt,
  FaUsers,
  FaSearch,
} from "react-icons/fa";
import apiClient from "../../Services/apiClient";
import StudentNavbar from "./StudentNavbar"; // ✅ Navbar

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

export default function AllLevelsSchedulePage() {
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [levels, setLevels] = useState([]);
  const [groups, setGroups] = useState([]); // 🆕 Groups
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(""); // 🆕 Group filter
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 🟢 Load levels
  const fetchLevels = async () => {
    try {
      const res = await apiClient.get("/dropdowns/levels");
      setLevels(res.data);
      if (res.data.length > 0 && !selectedLevel) {
        setSelectedLevel(res.data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch levels:", err);
    }
  };

  // 🟢 Load groups for the selected level
  const fetchGroups = async (levelId) => {
    if (!levelId) {
      setGroups([]);
      return;
    }
    try {
      const { data } = await apiClient.get("/dropdowns/groups", {
        params: { level_id: levelId },
      });
      setGroups(data || []);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
      setGroups([]);
    }
  };

  // 🟢 Load sections for selected level (and group if selected)
  const fetchSections = async () => {
    if (!selectedLevel) return;

    setLoading(true);
    try {
      const params = { level_id: selectedLevel };
      if (selectedGroup) params.group_id = selectedGroup; // 🆕 group_id filter

      const { data } = await apiClient.get("/sections", { params });
      setSections(data);
      setFilteredSections(data);
    } catch (err) {
      console.error("Failed to load sections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  useEffect(() => {
    fetchGroups(selectedLevel);
    fetchSections();
  }, [selectedLevel, selectedGroup]); // 🆕 Reload when group changes

  // 🔍 Filter by search term
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

  // 🎨 Color utilities
  const colorForCourse = (code, type) => {
    if (!code) return "#F3F4F6";
    const hash = code.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    const colorGroups = Object.values(COURSE_COLORS).flat();
    const colorIndex = Math.abs(hash) % colorGroups.length;
    let baseColor = colorGroups[colorIndex];
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
      <StudentNavbar />

      <div className="container-fluid py-4">
        <div className="row">
          {/* 🔹 Left Sidebar - Filters */}
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
                    <FaFilter size={20} color="white" />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0 text-gray-800">Filters</h6>
                    <small className="text-muted">Select Level and Group</small>
                  </div>
                </div>

                {/* 🟣 Level Selector */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-gray-700">
                    Select Level
                  </Form.Label>
                  <Form.Select
                    value={selectedLevel}
                    onChange={(e) => {
                      setSelectedLevel(e.target.value);
                      setSelectedGroup("");
                    }}
                    style={{
                      borderRadius: "12px",
                      border: "2px solid #E5E7EB",
                      padding: "12px",
                      background: "white",
                    }}
                  >
                    <option value="">Choose a level...</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* 🆕 Group Selector */}
                {groups.length > 0 && (
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold text-gray-700">
                      Select Group
                    </Form.Label>
                    <Form.Select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      style={{
                        borderRadius: "12px",
                        border: "2px solid #E5E7EB",
                        padding: "12px",
                        background: "white",
                      }}
                    >
                      <option value="">All Groups</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
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

                {/* Level Info */}
                {selectedLevel && (
                  <Card
                    className="border-0 mb-4"
                    style={{
                      background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                      borderRadius: "16px",
                    }}
                  >
                    <Card.Body className="p-4 text-white">
                      <div className="text-center">
                        <FaCalendarAlt size={24} className="mb-2" />
                        <h5 className="fw-bold mb-2">
                          {levels.find((l) => l.id == selectedLevel)?.name}
                        </h5>
                        {selectedGroup && (
                          <p className="opacity-90">
                            Group:{" "}
                            <strong>
                              {groups.find((g) => g.id == selectedGroup)?.name}
                            </strong>
                          </p>
                        )}
                        <div className="d-flex justify-content-around mt-3">
                          <div>
                            <div className="h4 fw-bold mb-1">
                              {filteredSections.length}
                            </div>
                            <div className="small opacity-90">Sections</div>
                          </div>
                          <div>
                            <div className="h4 fw-bold mb-1">
                              {
                                [
                                  ...new Set(
                                    filteredSections.map((s) => s.course_code)
                                  ),
                                ].length
                              }
                            </div>
                            <div className="small opacity-90">Courses</div>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                )}

                {/* Refresh Button */}
                <Button
                  variant="primary"
                  className="w-100 py-3"
                  onClick={fetchSections}
                  disabled={loading}
                  style={{
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #10B981, #059669)",
                    border: "none",
                    fontWeight: "600",
                  }}
                >
                  <FaSync className="me-2" />
                  {loading ? "Loading..." : "Refresh Schedule"}
                </Button>
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
                {/* 🔹 Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h4 className="fw-bold text-gray-800 mb-1">
                      <FaTable className="me-3" style={{ color: "#6366F1" }} />
                      Weekly Schedule -{" "}
                      <span style={{ color: "#6366F1" }}>
                        {levels.find((l) => l.id == selectedLevel)?.name ||
                          "All Levels"}
                      </span>{" "}
                      {selectedGroup &&
                        `(${groups.find((g) => g.id == selectedGroup)?.name})`}
                    </h4>
                    <p className="text-muted mb-0">
                      Visual weekly timetable view
                      {searchTerm && ` • Searching: "${searchTerm}"`}
                    </p>
                  </div>

                  <button
                    className="btn px-4 py-2"
                    onClick={() => setShowDetails((prev) => !prev)}
                    disabled={!selectedLevel}
                    style={{
                      borderRadius: "12px",
                      background: showDetails
                        ? "linear-gradient(135deg, #6366F1, #8B5CF6)"
                        : "linear-gradient(135deg, #EC4899, #F43F5E)",
                      color: "white",
                      border: "none",
                      fontWeight: "600",
                    }}
                  >
                    {showDetails ? "📅 Weekly View" : "📊 Table View"}
                  </button>
                </div>

                {/* 🔹 Conditional Rendering */}
                {!selectedLevel ? (
                  <div className="text-center py-5 text-white">
                    <h5>Select a level to view schedule</h5>
                  </div>
                ) : loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="text-muted mt-2">Loading schedule data...</p>
                  </div>
                ) : filteredSections.length === 0 ? (
                  <div className="text-center py-5">
                    <h5>No matching sections</h5>
                    <p className="text-muted">
                      Try adjusting your filters or search term
                    </p>
                  </div>
                ) : showDetails ? (
                  // 🔹 Table View
                  <div className="table-responsive">
                    <Table hover bordered>
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
                        {filteredSections.map((s) => (
                          <tr key={s.id}>
                            <td>
                              {s.course_code} - {s.course_name}
                            </td>
                            <td className="fw-semibold text-secondary">
                              #{s.id}
                            </td>
                            <td>
                              <Badge
                                bg={s.type === "lab" ? "warning" : "info"}
                                text="dark"
                                style={{
                                  borderRadius: "20px",
                                  padding: "6px 12px",
                                }}
                              >
                                {s.type}
                              </Badge>
                            </td>
                            <td>{s.day}</td>
                            <td>
                              {s.start_time_hhmm} - {s.end_time_hhmm}
                            </td>
                            <td>{s.faculty_name || "-"}</td>
                            <td>{s.room_name || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  // 🔹 Weekly Schedule
                  <div className="table-responsive">
                    <Table bordered className="text-center align-middle">
                      <thead
                        style={{
                          background:
                            "linear-gradient(135deg, #6366F1, #8B5CF6)",
                          color: "white",
                        }}
                      >
                        <tr>
                          <th>Time</th>
                          {DAYS.map((d) => (
                            <th key={d}>{d}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {TIME_SLOTS.map(([start, end]) => (
                          <tr key={start}>
                            <td
                              style={{
                                fontWeight: "600",
                                background: "#F8FAFC",
                              }}
                            >
                              {start}-{end}
                            </td>
                            {DAYS.map((day) => {
                              const sec = grid[day]?.[start];
                              const bg = sec
                                ? colorForCourse(sec.course_code, sec.type)
                                : "#FFFFFF";
                              const text = getTextColor(bg);
                              return (
                                <td
                                  key={day + start}
                                  style={{
                                    background: bg,
                                    color: text,
                                    border: "2px solid #F1F5F9",
                                  }}
                                >
                                  {sec ? (
                                    <>
                                      <strong>{sec.course_code}</strong>
                                      <br />
                                      <small>
                                        {sec.type} • {sec.room_name}
                                      </small>
                                    </>
                                  ) : (
                                    "-"
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
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
