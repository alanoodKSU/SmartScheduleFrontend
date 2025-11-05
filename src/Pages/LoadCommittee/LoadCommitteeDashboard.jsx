import React, { useEffect, useState } from "react";
import {
  Card,
  Spinner,
  Badge,
  Table,
  Form,
  InputGroup,
  Button,
  Row,
  Col,
  Dropdown,
} from "react-bootstrap";
import {
  FaCalendarAlt,
  FaClock,
  FaChalkboardTeacher,
  FaDoorOpen,
  FaUserTie,
  FaTable,
  FaSearch,
  FaFilter,
  FaUsers,
  FaBook,
  FaBuilding,
  FaChartBar,
  FaEdit,
} from "react-icons/fa";
import apiClient from "../../Services/apiClient";
import LoadCommitteeNavbar from "./LoadCommitteeNavbar";
import { useSharedMap } from "../../Hooks/useSharedMap"; // ✅ import real-time hook

// 🎨 Color palette for courses
const COURSE_COLORS = {
  primary: ["#6366F1", "#8B5CF6", "#A855F7", "#D946EF"],
  secondary: ["#EC4899", "#F43F5E", "#EF4444", "#F97316"],
  accent: ["#F59E0B", "#EAB308", "#84CC16", "#22C55E"],
  neutral: ["#06B6D4", "#0EA5E9", "#3B82F6", "#60A5FA"],
};

// 🎨 Status colors and configuration
const STATUS_CONFIG = {
  Draft: {
    color: "#6B7280", // gray
    bgColor: "#F3F4F6",
    textColor: "#374151",
    borderColor: "#D1D5DB",
  },
  Accepted: {
    color: "#10B981", // green
    bgColor: "#ECFDF5",
    textColor: "#065F46",
    borderColor: "#A7F3D0",
  },
  Rejected: {
    color: "#EF4444", // red
    bgColor: "#FEF2F2",
    textColor: "#991B1B",
    borderColor: "#FECACA",
  },
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

export default function LoadCommitteeDashboard() {
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [facultyStats, setFacultyStats] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // 🔗 connect to shared map (all committee members share this)
  const { data: sharedData, updateField } = useSharedMap("committee_dashboard");

  // 🔄 whenever someone else updates status
  useEffect(() => {
    if (!sharedData?.lastUpdate) return;
    const { sectionId, newStatus } = sharedData.lastUpdate;
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, status: newStatus } : s))
    );
    setFilteredSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, status: newStatus } : s))
    );
    console.log(`🟣 Synced section ${sectionId} → ${newStatus}`);
  }, [sharedData]);

  // 🟣 Load all sections
  const fetchAllSections = async () => {
    setLoading(true);
    try {
      console.log("🔍 Fetching all sections for committee...");
      const { data } = await apiClient.get(`/sections`);
      setSections(data);
      setFilteredSections(data);
      console.log("📊 Total sections loaded:", data.length);
    } catch (err) {
      console.error("Failed to load sections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSections();
  }, []);

  // 🟣 Update section status (sync + broadcast)
  const updateSectionStatus = async (sectionId, newStatus) => {
    setUpdatingStatus(sectionId);
    try {
      console.log(`🔄 Updating section ${sectionId} status to: ${newStatus}`);
      await apiClient.patch(`/sections/update_section_status/${sectionId}`, {
        status: newStatus,
      });

      // Update local state
      setSections((prevSections) =>
        prevSections.map((section) =>
          section.id === sectionId ? { ...section, status: newStatus } : section
        )
      );

      setFilteredSections((prevSections) =>
        prevSections.map((section) =>
          section.id === sectionId ? { ...section, status: newStatus } : section
        )
      );

      // 🔊 broadcast to everyone in real time
      updateField("lastUpdate", {
        sectionId,
        newStatus,
        timestamp: Date.now(),
      });

      console.log("✅ Status updated & synced");
    } catch (err) {
      console.error("Failed to update section status:", err);
      alert("Failed to update section status. Please try again.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  // 🟣 Filter sections based on search and faculty selection
  useEffect(() => {
    let filtered = sections;

    if (searchTerm) {
      filtered = filtered.filter(
        (section) =>
          section.faculty_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          section.course_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          section.course_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedFaculty) {
      filtered = filtered.filter(
        (section) => section.faculty_name === selectedFaculty
      );
    }

    setFilteredSections(filtered);
  }, [searchTerm, selectedFaculty, sections]);

  // 🟣 Calculate faculty statistics when faculty is selected
  useEffect(() => {
    if (selectedFaculty && filteredSections.length > 0) {
      const facultySections = filteredSections.filter(
        (s) => s.faculty_name === selectedFaculty
      );

      // Calculate weekly hours
      const weeklyHours = facultySections.reduce((total, section) => {
        const start = new Date(`1970-01-01T${section.start_time}`);
        const end = new Date(`1970-01-01T${section.end_time}`);
        const duration = (end - start) / (1000 * 60 * 60);
        return total + duration;
      }, 0);

      // Get level distribution
      const levelDistribution = facultySections.reduce((acc, section) => {
        acc[section.level_name] = (acc[section.level_name] || 0) + 1;
        return acc;
      }, {});

      // Get course distribution
      const courseDistribution = facultySections.reduce((acc, section) => {
        const courseKey = `${section.course_code} - ${section.course_name}`;
        acc[courseKey] = (acc[courseKey] || 0) + 1;
        return acc;
      }, {});

      const stats = {
        name: selectedFaculty,
        totalSections: facultySections.length,
        totalCourses: Object.keys(courseDistribution).length,
        totalLevels: Object.keys(levelDistribution).length,
        lectures: facultySections.filter((s) => s.type === "lecture").length,
        labs: facultySections.filter((s) => s.type === "lab").length,
        days: [...new Set(facultySections.map((s) => s.day))].length,
        weeklyHours: weeklyHours.toFixed(1),
        levelDistribution,
        courseDistribution,
      };
      setFacultyStats(stats);
    } else {
      setFacultyStats(null);
    }
  }, [selectedFaculty, filteredSections]);

  // 🟣 Get unique faculty names for filter dropdown
  const uniqueFaculties = [
    ...new Set(sections.map((s) => s.faculty_name).filter(Boolean)),
  ].sort();

  // 🟣 Get overall statistics
  const overallStats = {
    totalSections: sections.length,
    totalFaculties: uniqueFaculties.length,
    totalCourses: [...new Set(sections.map((s) => s.course_code))].length,
    totalLevels: [...new Set(sections.map((s) => s.level_name))].length,
    lectures: sections.filter((s) => s.type === "lecture").length,
    labs: sections.filter((s) => s.type === "lab").length,
    assignedSections: sections.filter((s) => s.faculty_name).length,
    unassignedSections: sections.filter((s) => !s.faculty_name).length,
  };

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

  // 🎨 Get background color based on status
  const getStatusBackgroundColor = (status) => {
    return STATUS_CONFIG[status]?.bgColor || STATUS_CONFIG.Draft.bgColor;
  };

  // 🎨 Get status text color
  const getStatusTextColor = (status) => {
    return STATUS_CONFIG[status]?.textColor || STATUS_CONFIG.Draft.textColor;
  };

  // 🎨 Get status border color
  const getStatusBorderColor = (status) => {
    return (
      STATUS_CONFIG[status]?.borderColor || STATUS_CONFIG.Draft.borderColor
    );
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
  for (const s of filteredSections) {
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
      <LoadCommitteeNavbar />

      <div className="container-fluid py-4">
        <div className="row">
          {/* 🔹 Left Sidebar - Statistics & Filters */}
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
                    <FaChartBar size={20} color="white" />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0 text-gray-800">
                      Load Committee
                    </h6>
                    <small className="text-muted">Dashboard Overview</small>
                  </div>
                </div>

                {/* 🔹 Search and Filter Section */}
                <div className="mb-4">
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold text-gray-700">
                      <FaSearch className="me-2" />
                      Search Faculty/Course
                    </Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Search by faculty or course..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ borderRadius: "8px" }}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group>
                    <Form.Label className="small fw-semibold text-gray-700">
                      <FaFilter className="me-2" />
                      Filter by Faculty
                    </Form.Label>
                    <Form.Select
                      value={selectedFaculty || ""}
                      onChange={(e) =>
                        setSelectedFaculty(e.target.value || null)
                      }
                      style={{ borderRadius: "8px" }}
                    >
                      <option value="">All Faculty Members</option>
                      {uniqueFaculties.map((faculty) => (
                        <option key={faculty} value={faculty}>
                          {faculty}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  {/* Clear Filters Button */}
                  {(searchTerm || selectedFaculty) && (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="w-100 mt-2"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedFaculty(null);
                      }}
                      style={{ borderRadius: "8px" }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* 🔹 Overall Statistics Card */}
                <Card
                  className="border-0 mb-4"
                  style={{
                    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    borderRadius: "16px",
                  }}
                >
                  <Card.Body className="p-3 text-white">
                    <div className="text-center">
                      <FaUsers size={20} className="mb-2" />
                      <h6 className="fw-bold mb-1">Overall Statistics</h6>
                      <p className="small opacity-90 mb-2">System Overview</p>

                      <Row className="g-2 text-center">
                        <Col xs={6}>
                          <div className="p-2">
                            <div className="h6 fw-bold mb-0">
                              {overallStats.totalSections}
                            </div>
                            <div className="small opacity-90">Sections</div>
                          </div>
                        </Col>
                        <Col xs={6}>
                          <div className="p-2">
                            <div className="h6 fw-bold mb-0">
                              {overallStats.totalFaculties}
                            </div>
                            <div className="small opacity-90">Faculty</div>
                          </div>
                        </Col>
                        <Col xs={6}>
                          <div className="p-2">
                            <div className="h6 fw-bold mb-0">
                              {overallStats.totalCourses}
                            </div>
                            <div className="small opacity-90">Courses</div>
                          </div>
                        </Col>
                        <Col xs={6}>
                          <div className="p-2">
                            <div className="h6 fw-bold mb-0">
                              {overallStats.totalLevels}
                            </div>
                            <div className="small opacity-90">Levels</div>
                          </div>
                        </Col>
                        <Col xs={6}>
                          <div className="p-2">
                            <div className="h6 fw-bold mb-0">
                              {overallStats.lectures}
                            </div>
                            <div className="small opacity-90">Lectures</div>
                          </div>
                        </Col>
                        <Col xs={6}>
                          <div className="p-2">
                            <div className="h6 fw-bold mb-0">
                              {overallStats.labs}
                            </div>
                            <div className="small opacity-90">Labs</div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </Card.Body>
                </Card>

                {/* 🔹 Selected Faculty Statistics */}
                {facultyStats && (
                  <>
                    <Card
                      className="border-0 mb-3"
                      style={{
                        background: "linear-gradient(135deg, #EC4899, #F43F5E)",
                        borderRadius: "16px",
                      }}
                    >
                      <Card.Body className="p-3 text-white">
                        <div className="text-center">
                          <FaChalkboardTeacher size={20} className="mb-2" />
                          <h6 className="fw-bold mb-1">{facultyStats.name}</h6>
                          <p className="small opacity-90 mb-2">Teaching Load</p>

                          <Row className="g-2 text-center">
                            <Col xs={6}>
                              <div className="p-2">
                                <div className="h6 fw-bold mb-0">
                                  {facultyStats.totalSections}
                                </div>
                                <div className="small opacity-90">Sections</div>
                              </div>
                            </Col>
                            <Col xs={6}>
                              <div className="p-2">
                                <div className="h6 fw-bold mb-0">
                                  {facultyStats.totalCourses}
                                </div>
                                <div className="small opacity-90">Courses</div>
                              </div>
                            </Col>
                            <Col xs={6}>
                              <div className="p-2">
                                <div className="h6 fw-bold mb-0">
                                  {facultyStats.totalLevels}
                                </div>
                                <div className="small opacity-90">Levels</div>
                              </div>
                            </Col>
                            <Col xs={6}>
                              <div className="p-2">
                                <div className="h6 fw-bold mb-0">
                                  {facultyStats.weeklyHours}h
                                </div>
                                <div className="small opacity-90">
                                  Hours/Week
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </Card.Body>
                    </Card>

                    {/* 🔹 Level Distribution */}
                    <Card
                      className="border-0 mb-3"
                      style={{ borderRadius: "12px" }}
                    >
                      <Card.Body className="p-3">
                        <h6 className="fw-semibold text-gray-700 mb-3">
                          <FaBuilding className="me-2" />
                          Level Distribution
                        </h6>
                        <div className="small text-muted">
                          {Object.entries(facultyStats.levelDistribution).map(
                            ([level, count]) => (
                              <div
                                key={level}
                                className="mb-2 d-flex justify-content-between align-items-center"
                              >
                                <span>{level}:</span>
                                <Badge
                                  bg="primary"
                                  style={{ borderRadius: "8px" }}
                                >
                                  {count}
                                </Badge>
                              </div>
                            )
                          )}
                        </div>
                      </Card.Body>
                    </Card>

                    {/* 🔹 Course Distribution */}
                    <Card className="border-0" style={{ borderRadius: "12px" }}>
                      <Card.Body className="p-3">
                        <h6 className="fw-semibold text-gray-700 mb-3">
                          <FaBook className="me-2" />
                          Course Distribution
                        </h6>
                        <div
                          className="small text-muted"
                          style={{ maxHeight: "200px", overflowY: "auto" }}
                        >
                          {Object.entries(facultyStats.courseDistribution).map(
                            ([course, count]) => (
                              <div key={course} className="mb-2">
                                <div className="fw-semibold text-gray-800">
                                  {course.split(" - ")[0]}
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                  <small className="text-muted">
                                    {course.split(" - ")[1]}
                                  </small>
                                  <Badge
                                    bg="success"
                                    style={{ borderRadius: "8px" }}
                                  >
                                    {count}
                                  </Badge>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </>
                )}

                {/* 🔹 Current View Stats */}
                {!facultyStats && (
                  <div className="mt-4">
                    <h6 className="fw-semibold text-gray-700 mb-3">
                      📊 Current View
                    </h6>
                    <div className="small text-muted">
                      <div className="mb-2 d-flex justify-content-between">
                        <span>Showing Sections:</span>
                        <strong className="text-primary">
                          {filteredSections.length}
                        </strong>
                      </div>
                      <div className="mb-2 d-flex justify-content-between">
                        <span>Faculty Members:</span>
                        <strong className="text-info">
                          {
                            [
                              ...new Set(
                                filteredSections
                                  .map((s) => s.faculty_name)
                                  .filter(Boolean)
                              ),
                            ].length
                          }
                        </strong>
                      </div>
                      <div className="mb-2 d-flex justify-content-between">
                        <span>Courses:</span>
                        <strong className="text-success">
                          {
                            [
                              ...new Set(
                                filteredSections.map((s) => s.course_code)
                              ),
                            ].length
                          }
                        </strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Levels:</span>
                        <strong className="text-warning">
                          {
                            [
                              ...new Set(
                                filteredSections.map((s) => s.level_name)
                              ),
                            ].length
                          }
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* 🔹 Right Content - Schedule */}
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
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h4 className="fw-bold text-gray-800 mb-1">
                      {showDetails ? (
                        <>
                          <FaTable
                            className="me-3"
                            style={{ color: "#6366F1" }}
                          />
                          All Sections Details
                          {selectedFaculty && (
                            <span style={{ color: "#6366F1" }}>
                              {" "}
                              • {selectedFaculty}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <FaCalendarAlt
                            className="me-3"
                            style={{ color: "#6366F1" }}
                          />
                          Complete Schedule Overview
                          {selectedFaculty && (
                            <span style={{ color: "#6366F1" }}>
                              {" "}
                              • {selectedFaculty}
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
                      Loading all sections...
                    </div>
                  </div>
                ) : filteredSections.length === 0 ? (
                  <div className="text-center py-5">
                    <div
                      style={{
                        background: "linear-gradient(135deg, #F59E0B, #EAB308)",
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
                      {sections.length === 0
                        ? "No Sections Found"
                        : "No Matching Sections"}
                    </h5>
                    <p className="text-muted">
                      {sections.length === 0
                        ? "No sections have been scheduled yet."
                        : "No sections match your current filters. Try adjusting your search criteria."}
                    </p>
                    {(searchTerm || selectedFaculty) && (
                      <Button
                        variant="primary"
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedFaculty(null);
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
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
                          <th className="py-3">Faculty</th>
                          <th className="py-3">Type</th>
                          <th className="py-3">Day</th>
                          <th className="py-3">Time</th>
                          <th className="py-3">Room</th>
                          <th className="py-3">Level</th>
                          <th className="py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSections.map((sec) => {
                          const bgColor = colorForCourse(
                            sec.course_code,
                            sec.type
                          );
                          const textColor = getTextColor(bgColor);
                          const currentStatus = sec.status || "Draft";
                          const statusConfig = STATUS_CONFIG[currentStatus];

                          return (
                            <tr key={sec.id} style={{ transition: "all 0.2s" }}>
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
                                  bg="info"
                                  style={{
                                    borderRadius: "12px",
                                    padding: "6px 12px",
                                  }}
                                >
                                  {sec.faculty_name || "Unassigned"}
                                </Badge>
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
                              <td className="py-3 fw-semibold">{sec.day}</td>
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
                              <td className="py-3">{sec.room_name || "-"}</td>
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
                              <td className="py-3">
                                <div className="d-flex align-items-center gap-2">
                                  <Badge
                                    style={{
                                      background: statusConfig.bgColor,
                                      color: statusConfig.textColor,
                                      border: `1px solid ${statusConfig.color}`,
                                      padding: "6px 12px",
                                      borderRadius: "20px",
                                      minWidth: "100px",
                                      textAlign: "center",
                                    }}
                                  >
                                    {currentStatus}
                                  </Badge>
                                  <Dropdown drop="up">
                                    <Dropdown.Toggle
                                      variant="link"
                                      size="sm"
                                      disabled={updatingStatus === sec.id}
                                      style={{
                                        color: "#6B7280",
                                        border: "none",
                                        padding: "4px",
                                        background: "transparent",
                                      }}
                                    >
                                      {updatingStatus === sec.id ? (
                                        <Spinner animation="border" size="sm" />
                                      ) : (
                                        <FaEdit size={14} />
                                      )}
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu style={{ zIndex: 9999 }}>
                                      <Dropdown.Header>
                                        Change Status
                                      </Dropdown.Header>
                                      {Object.keys(STATUS_CONFIG).map(
                                        (status) => (
                                          <Dropdown.Item
                                            key={status}
                                            onClick={() =>
                                              updateSectionStatus(
                                                sec.id,
                                                status
                                              )
                                            }
                                            style={{
                                              color:
                                                STATUS_CONFIG[status].textColor,
                                              background:
                                                currentStatus === status
                                                  ? STATUS_CONFIG[status]
                                                      .bgColor
                                                  : "transparent",
                                            }}
                                          >
                                            {status}
                                            {currentStatus === status && " ✓"}
                                          </Dropdown.Item>
                                        )
                                      )}
                                    </Dropdown.Menu>
                                  </Dropdown>
                                </div>
                              </td>
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
                              const currentStatus = sec?.status || "Draft";
                              const statusBgColor =
                                getStatusBackgroundColor(currentStatus);
                              const statusTextColor =
                                getStatusTextColor(currentStatus);
                              const statusBorderColor =
                                getStatusBorderColor(currentStatus);

                              return (
                                <td
                                  key={day + start}
                                  style={{
                                    height: 80,
                                    background: statusBgColor,
                                    color: statusTextColor,
                                    padding: "8px",
                                    border: `2px solid ${statusBorderColor}`,
                                    transition: "all 0.2s",
                                    cursor: sec ? "pointer" : "default",
                                    position: "relative",
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
                                        {sec.course_code} {sec.type}
                                      </div>
                                      <small className="opacity-90">
                                        {sec.room_name} •{" "}
                                        {sec.faculty_name || "Unassigned"}
                                      </small>
                                      <div className="d-flex align-items-center gap-1 mt-1">
                                        <small
                                          className="fw-bold"
                                          style={{
                                            fontSize: "0.7rem",
                                          }}
                                        >
                                          {currentStatus}
                                        </small>
                                        <Dropdown drop="up">
                                          <Dropdown.Toggle
                                            variant="link"
                                            size="sm"
                                            disabled={updatingStatus === sec.id}
                                            style={{
                                              color: statusTextColor,
                                              border: "none",
                                              padding: "1px",
                                              background: "transparent",
                                              opacity: 0.7,
                                            }}
                                          >
                                            {updatingStatus === sec.id ? (
                                              <Spinner
                                                animation="border"
                                                size="sm"
                                              />
                                            ) : (
                                              <FaEdit size={10} />
                                            )}
                                          </Dropdown.Toggle>

                                          <Dropdown.Menu
                                            style={{ zIndex: 9999 }}
                                          >
                                            <Dropdown.Header>
                                              Change Status
                                            </Dropdown.Header>
                                            {Object.keys(STATUS_CONFIG).map(
                                              (status) => (
                                                <Dropdown.Item
                                                  key={status}
                                                  onClick={() =>
                                                    updateSectionStatus(
                                                      sec.id,
                                                      status
                                                    )
                                                  }
                                                  style={{
                                                    color:
                                                      STATUS_CONFIG[status]
                                                        .textColor,
                                                    background:
                                                      currentStatus === status
                                                        ? STATUS_CONFIG[status]
                                                            .bgColor
                                                        : "transparent",
                                                  }}
                                                >
                                                  {status}
                                                  {currentStatus === status &&
                                                    " ✓"}
                                                </Dropdown.Item>
                                              )
                                            )}
                                          </Dropdown.Menu>
                                        </Dropdown>
                                      </div>
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
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
