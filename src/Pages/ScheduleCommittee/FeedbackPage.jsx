import React, { useEffect, useState } from "react";
import apiClient from "../../Services/apiClient";
import { Tabs, Tab, Form, Table, Spinner, Badge } from "react-bootstrap";
import { FaTrashAlt } from "react-icons/fa";
import Navbar from "./ScheduleCommitteeNavbar"; // 🟢 adjust the path if needed

export default function FeedbackPage() {
  const [activeRole, setActiveRole] = useState("students");
  const [level, setLevel] = useState("all");
  const [feedbacks, setFeedbacks] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🟢 Load levels from backend (for dropdown)
  const fetchLevels = async () => {
    try {
      const res = await apiClient.get("/dropdowns/levels");
      setLevels(res.data);
    } catch (err) {
      console.error("Failed to fetch levels:", err);
    }
  };

  // 🟢 Load feedback
  const fetchFeedback = async () => {
    setLoading(true);
    try {
      let res;
      if (activeRole === "students" && level !== "all") {
        res = await apiClient.get(`/feedback/level/${level}`);
      } else if (activeRole === "students" && level === "all") {
        res = await apiClient.get(`/feedback/role/student`);
      } else if (activeRole === "faculty") {
        res = await apiClient.get(`/feedback/role/faculty`);
      } else if (activeRole === "load_committee") {
        res = await apiClient.get(`/feedback/role/committee`);
      } else if (activeRole === "registrar") {
        res = await apiClient.get(`/feedback/role/registrar`);
      } else {
        res = await apiClient.get(`/feedback`);
      }
      setFeedbacks(res.data);
    } catch (err) {
      console.error("Failed to load feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [activeRole, level]);

  // 🟢 Delete feedback
  const deleteFeedback = async (id) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;
    try {
      await apiClient.delete(`/feedback/${id}`);
      fetchFeedback();
    } catch (err) {
      console.error("Failed to delete feedback:", err);
    }
  };

  // 🎨 Helper: role badge colors
  const getRoleColor = (role) => {
    switch (role) {
      case "student":
        return "info";
      case "faculty":
        return "primary";
      case "committee":
        return "warning";
      case "registrar":
        return "success";
      default:
        return "secondary";
    }
  };

  return (
    <>
      {/* 🟣 Your global Navbar */}
      <Navbar />

      {/* 🟢 Feedback page content */}
      <div
        className="container-fluid py-5"
        style={{
          background: "linear-gradient(135deg, #f8f5ff 0%, #f0f7ff 100%)",
          minHeight: "100vh",
        }}
      >
        <div className="container">
          <h3
            className="fw-bold mb-4 text-center"
            style={{
              color: "#6f42c1",
              textShadow: "1px 1px 4px rgba(111,66,193,0.2)",
            }}
          >
            💬 Feedback & Comments Dashboard
          </h3>

          {/* Role Tabs */}
          <Tabs
            activeKey={activeRole}
            onSelect={(k) => setActiveRole(k)}
            className="mb-4"
            justify
          >
            <Tab eventKey="students" title="🎓 Students" />
            <Tab eventKey="faculty" title="👩‍🏫 Faculty" />
            <Tab eventKey="load_committee" title="🧩 Load Committee" />
            <Tab eventKey="registrar" title="🏛️ Registrar" />
            <Tab eventKey="all" title="🌍 All" />
          </Tabs>

          {/* Level Filter */}
          {activeRole === "students" && (
            <div className="mb-4 d-flex align-items-center justify-content-center gap-3">
              <Form.Label className="fw-semibold mb-0 fs-6">Select Level:</Form.Label>
              <Form.Select
                style={{
                  width: "260px",
                  borderRadius: "20px",
                  border: "1px solid #b197fc",
                }}
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="all">All Levels</option>
                {levels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name}
                  </option>
                ))}
              </Form.Select>
            </div>
          )}

          {/* Feedback Table */}
          <div
            className="table-responsive shadow-lg rounded-4"
            style={{
              backgroundColor: "#fff",
              border: "1px solid #f1e6ff",
            }}
          >
            <Table hover className="align-middle text-center mb-0">
              <thead
                style={{
                  background: "linear-gradient(90deg, #a18cd1 0%, #fbc2eb 100%)",
                  color: "white",
                }}
              >
                <tr>
                  <th>Sender</th>
                  <th>Role</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-4">
                      <Spinner animation="border" variant="secondary" />
                    </td>
                  </tr>
                ) : feedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-muted py-4">
                      No feedback found
                    </td>
                  </tr>
                ) : (
                  feedbacks.map((f, index) => (
                    <tr
                      key={f.id}
                      style={{
                        backgroundColor:
                          index % 2 === 0 ? "#fafaff" : "#fefaff",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <td className="fw-semibold text-secondary">
                        {f.email || "Unknown"}
                      </td>
                      <td>
                        <Badge bg={getRoleColor(f.role)} className="px-3 py-2 text-uppercase">
                          {f.role}
                        </Badge>
                      </td>
                      <td
                        className="text-start"
                        style={{
                          maxWidth: "500px",
                          whiteSpace: "pre-wrap",
                          fontSize: "0.95rem",
                          color: "#333",
                        }}
                      >
                        {f.text}
                      </td>
                      <td className="text-muted">
                        {new Date(f.created_at).toLocaleString()}
                      </td>
                      <td>
                        <FaTrashAlt
                          size={18}
                          color="#e63946"
                          title="Delete feedback"
                          style={{
                            cursor: "pointer",
                            transition: "transform 0.2s, color 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#ff4d6d")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#e63946")}
                          onClick={() => deleteFeedback(f.id)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {/* Footer */}
          <div className="text-center mt-4 text-muted small">
            Showing <strong>{feedbacks.length}</strong> feedback
            {feedbacks.length !== 1 && "s"}
          </div>
        </div>
      </div>
    </>
  );
}
