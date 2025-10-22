import React, { useEffect, useState } from "react";
import { Table, Button, Form, Spinner, Badge } from "react-bootstrap";
import { FaEdit, FaSave } from "react-icons/fa";
import apiClient from "../../Services/apiClient";
import RegistrarNavbar from "./RegistrarNavbar";
import { useToast } from "../../Hooks/ToastContext";

export default function RegistrarSectionCapacityPage() {
  const { success, error, warning } = useToast();
  const [sections, setSections] = useState([]);
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [capacityInput, setCapacityInput] = useState({});

  // 🟣 Load levels for filter dropdown
  const fetchLevels = async () => {
    try {
      const res = await apiClient.get("/dropdowns/levels");
      setLevels(res.data);
    } catch (err) {
      console.error("Failed to load levels:", err);
      error("Failed to load levels");
    }
  };

  // 🟢 Load sections
  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/sections", {
        params: { level_id: selectedLevel || null },
        headers: { "Cache-Control": "no-cache" },
      });
      setSections(res.data || []);
    } catch (err) {
      console.error("Failed to load sections:", err);
      error("Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
    fetchSections();
  }, []);

  useEffect(() => {
    fetchSections();
  }, [selectedLevel]);

  // 🟢 Enable editing mode
  const handleEdit = (section) => {
    setEditingId(section.id);
    setCapacityInput((prev) => ({
      ...prev,
      [section.id]: section.capacity || 0,
    }));
  };

  // 🟢 Save updated capacity
  const handleSave = async (sectionId) => {
    try {
      const capacity = capacityInput[sectionId];
      if (!capacity && capacity !== 0) {
        warning("Please enter a valid capacity");
        return;
      }

      await apiClient.put(`/sections/${sectionId}/capacity`, {
        capacity: Number(capacity),
      });

      setEditingId(null);
      success("Section capacity updated successfully");
      fetchSections();
    } catch (err) {
      error("Failed to update section capacity");
      console.error(err);
    }
  };

  return (
    <div className="container py-4">
      <RegistrarNavbar />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold" style={{ color: "#6f42c1" }}>
          🧩 Section Capacity Management
        </h4>
      </div>

      {/* Filters */}
      <div className="d-flex gap-3 mb-3">
        <Form.Select
          style={{ maxWidth: "200px" }}
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
        >
          <option value="">All Levels</option>
          {levels.map((lvl) => (
            <option key={lvl.id} value={lvl.id}>
              {lvl.name}
            </option>
          ))}
        </Form.Select>
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
              <th>Section</th>
              <th>Course</th>
              <th>Level</th>
              <th>Type</th>
              <th>Current</th>
              <th>Capacity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7">
                  <Spinner animation="border" variant="secondary" />
                </td>
              </tr>
            ) : sections.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-muted py-3">
                  No sections found
                </td>
              </tr>
            ) : (
              sections.map((s) => (
                <tr key={s.id}>
                  {/* Section Number or External ID */}
                  <td>
                    {s.section_number ? (
                      s.section_number
                    ) : s.is_external ? (
                      <Badge bg="dark" className="px-2">
                        EXT-{s.id}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* 🟣 Course Name */}
                  <td>
                    <div className="fw-semibold">{s.course_code || "—"}</div>
                    <div className="text-muted small">{s.course_name}</div>
                  </td>

                  {/* Level */}
                  <td>
                    <Badge
                      bg="primary"
                      className="px-3 py-2"
                      style={{
                        fontSize: "0.85rem",
                        backgroundColor: s.is_external ? "#6610f2" : "#0d6efd",
                      }}
                    >
                      {s.level_display || s.level_name || "—"}
                      {s.is_external && (
                        <span className="ms-1 fw-light">(external)</span>
                      )}
                    </Badge>
                  </td>

                  {/* Type */}
                  <td>
                    <Badge
                      bg={
                        s.type === "lab"
                          ? "warning"
                          : s.type === "lecture"
                          ? "info"
                          : "secondary"
                      }
                      text={s.type === "lab" ? "dark" : "light"}
                    >
                      {s.type || "—"}
                    </Badge>
                  </td>

                  {/* Current */}
                  <td>{s.enrolled_expected || 0}</td>

                  {/* Capacity */}
                  <td>
                    {editingId === s.id ? (
                      <Form.Control
                        type="number"
                        style={{ width: "80px", margin: "0 auto" }}
                        value={capacityInput[s.id] ?? ""}
                        onChange={(e) =>
                          setCapacityInput((prev) => ({
                            ...prev,
                            [s.id]: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      s.capacity || 0
                    )}
                  </td>

                  {/* Actions */}
                  <td>
                    {editingId === s.id ? (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleSave(s.id)}
                      >
                        <FaSave className="me-1" />
                        Save
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => handleEdit(s)}
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
