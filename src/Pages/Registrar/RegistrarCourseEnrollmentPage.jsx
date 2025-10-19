import React, { useEffect, useState } from "react";
import { Table, Button, Form, Spinner, Badge } from "react-bootstrap";
import { FaEdit, FaSave } from "react-icons/fa";
import apiClient from "../../Services/apiClient";
import RegistrarNavbar from "./RegistrarNavbar";
import { useToast } from "../../Hooks/ToastContext";

export default function RegistrarCourseEnrollmentPage() {
  const { success, error, warning, info } = useToast();
  const [courses, setCourses] = useState([]);
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expectedInput, setExpectedInput] = useState({});

  // 🟣 Load levels for filtering
  const fetchLevels = async () => {
    try {
      const res = await apiClient.get("/dropdowns/levels");
      setLevels(res.data);
    } catch (err) {
      console.error("Failed to load levels:", err);
      error("Failed to load levels");
    }
  };

  // 🟢 Load courses with optional level filter
  const fetchCourses = async (levelId = "") => {
    setLoading(true);
    try {
      const params = {};
      if (levelId) {
        params.level_id = levelId;
      }
      
      console.log("Fetching courses with params:", params);
      
      const res = await apiClient.get("/courses", { params });
      console.log("Courses response:", res.data);
      setCourses(res.data);
    } catch (err) {
      console.error("Failed to load courses:", err);
      error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchCourses(selectedLevel);
  }, [selectedLevel]);

  // 🟢 Handle filter change
  const handleLevelChange = (e) => {
    const levelId = e.target.value;
    setSelectedLevel(levelId);
  };

  // 🟢 Handle editing state
  const handleEdit = (course) => {
    setEditingId(course.id);
    setExpectedInput((prev) => ({
      ...prev,
      [course.id]: course.expected_students || 0,
    }));
  };

  // 🟢 Handle save update
  const handleSave = async (courseId) => {
    try {
      const expected = expectedInput[courseId] || 0;
      await apiClient.put(`/courses/${courseId}/expected-students`, {
        expected_students: Number(expected),
      });
      setEditingId(null);
      success("Expected students count updated successfully");
      fetchCourses(selectedLevel);
    } catch (err) {
      error("Failed to update expected students count");
      console.error(err);
    }
  };

  return (
    <div className="container py-4">
      <RegistrarNavbar />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold" style={{ color: "#6f42c1" }}>
          🧮 Student Enrollment per Course
        </h4>
      </div>

      {/* Filters */}
      <div className="d-flex gap-3 mb-3">
        <Form.Select
          style={{ maxWidth: "200px" }}
          value={selectedLevel}
          onChange={handleLevelChange}
        >
          <option value="">All Levels</option>
          {levels.map((lvl) => (
            <option key={lvl.id} value={lvl.id}>
              {lvl.name}
            </option>
          ))}
        </Form.Select>
      </div>

      {/* Debug info */}
      <div className="mb-2 text-muted small">
        Showing courses for: {selectedLevel ? `Level ${selectedLevel}` : 'All Levels'} 
        ({courses.length} courses found)
      </div>

      {/* Table */}
      <div className="table-responsive shadow-sm rounded-4">
        <Table hover className="align-middle text-center mb-0">
          <thead
            style={{
              background: "linear-gradient(90deg, #a18cd1 0%, #fbc2eb 100%)",
              color: "white",
            }}
          >
            <tr>
              <th>Course</th>
              <th>Level</th>
              <th>Current</th>
              <th>Expected</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  <Spinner animation="border" variant="secondary" />
                  <div className="mt-2">Loading courses...</div>
                </td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-muted py-4 text-center">
                  No courses found for the selected level
                </td>
              </tr>
            ) : (
              courses.map((c) => (
                <tr key={c.id}>
                  <td>{c.code}</td>
                  <td>
                    <Badge bg="primary">{c.level_name || c.level_id}</Badge>
                  </td>
                  <td>{c.current_enrolled || 0}</td>
                  <td>
                    {editingId === c.id ? (
                      <Form.Control
                        type="number"
                        style={{ width: "80px", margin: "0 auto" }}
                        value={expectedInput[c.id] || ""}
                        onChange={(e) =>
                          setExpectedInput((prev) => ({
                            ...prev,
                            [c.id]: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      c.expected_students || 0
                    )}
                  </td>
                  <td>
                    {editingId === c.id ? (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleSave(c.id)}
                      >
                        <FaSave className="me-1" />
                        Save
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => handleEdit(c)}
                      >
                        <FaEdit className="me-1" />
                        Edit
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}