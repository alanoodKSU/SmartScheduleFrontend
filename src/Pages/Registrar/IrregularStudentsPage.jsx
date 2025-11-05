import React, { useEffect, useState } from "react";
import { Table, Button, Form, Modal, Spinner, Badge } from "react-bootstrap";
import { FaEdit, FaTrashAlt, FaPlus } from "react-icons/fa";
import Select from "react-select";
import apiClient from "../../Services/apiClient";
import RegistrarNavbar from "./RegistrarNavbar";
import { useToast } from "../../Hooks/ToastContext";
import { useSharedMap } from "../../Hooks/useSharedMap"; // 🟣 real-time sync

export default function RegistrarIrregularStudentsPage() {
  const { success, error, warning, info } = useToast();
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [levels, setLevels] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    student_id: "",
    remaining_courses: [],
    required_courses: [],
  });

  // 🟣 Connect to Y.js shared map
  const { data: sharedData, updateField } = useSharedMap("irregular_students");

  // 🟣 React to incoming Y.js updates from other users
  useEffect(() => {
    if (!sharedData?.lastChange) return;
    const { type } = sharedData.lastChange;

    console.log("📨 Yjs update received:", sharedData.lastChange);

    if (type === "reload") {
      fetchIrregularStudents();
    }
  }, [sharedData]);

  // 🟢 Load all courses
  const fetchCourses = async () => {
    try {
      const res = await apiClient.get("/courses");
      setCourses(res.data);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      error("Failed to fetch courses");
    }
  };

  // 🟢 Load all students for dropdown
  const fetchAllStudents = async () => {
    try {
      const res = await apiClient.get("/dropdowns/students");
      setAllStudents(res.data || []);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      error("Failed to fetch students");
    }
  };

  // 🟢 Load irregular students list
  const fetchIrregularStudents = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/irregular-students");
      const data = res.data;
      setStudents(data);

      // Extract unique levels
      const uniqueLevels = [];
      const levelMap = new Map();
      data.forEach((s) => {
        if (s.level_name && !levelMap.has(s.level_name)) {
          levelMap.set(s.level_name, true);
          uniqueLevels.push({ id: s.level_name, name: s.level_name });
        }
      });
      setLevels(uniqueLevels);
    } catch (err) {
      console.error("Failed to load irregular students:", err);
      error("Failed to load irregular students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchAllStudents();
    fetchIrregularStudents();
  }, []);

  // 🟢 Filter list
  const filteredStudents = students.filter((s) => {
    const matchesLevel = !selectedLevel || s.level_name === selectedLevel;
    const matchesSearch =
      !search ||
      s.student_name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id?.toString().includes(search) ||
      s.university_id?.toString().includes(search);
    return matchesLevel && matchesSearch;
  });

  // 🟢 Open modal
  const openModal = (student = null) => {
    if (student) {
      setEditing(student);
      setForm({
        student_id: student.student_id,
        remaining_courses: student.remaining_courses.map(
          (c) => courses.find((x) => x.code === c)?.id
        ),
        required_courses: student.required_courses.map(
          (c) => courses.find((x) => x.code === c)?.id
        ),
      });
    } else {
      setEditing(null);
      setForm({
        student_id: "",
        remaining_courses: [],
        required_courses: [],
      });
    }
    setShowModal(true);
  };

  // 🟢 Save
  const handleSave = async () => {
    try {
      const payload = { ...form };

      if (editing) {
        await apiClient.put(`/irregular-students/${editing.id}`, payload);
        success("Student updated successfully");
      } else {
        await apiClient.post(`/irregular-students`, payload);
        success("Student added successfully");
      }

      setShowModal(false);
      fetchIrregularStudents();

      // 🔊 Broadcast change to other users
      updateField("lastChange", { type: "reload", timestamp: Date.now() });
    } catch (err) {
      console.error("❌ Failed to save student:", err);

      const backendMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.response?.data ||
        "Something went wrong.";

      error(backendMsg);
    }
  };

  // 🟢 Delete student
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?"))
      return;
    try {
      await apiClient.delete(`/irregular-students/${id}`);
      success("Student deleted successfully");
      fetchIrregularStudents();

      // 🔊 Notify others to refresh
      updateField("lastChange", { type: "reload", timestamp: Date.now() });
    } catch (err) {
      console.error("❌ Failed to delete student:", err);
      error("Failed to delete student");
    }
  };

  // 🟢 Toggle course checkbox
  const handleCourseToggle = (type, id) => {
    setForm((prev) => {
      const updated = prev[type].includes(id)
        ? prev[type].filter((c) => c !== id)
        : [...prev[type], id];
      return { ...prev, [type]: updated };
    });
  };

  // 🟢 Dropdown student options
  const studentOptions = allStudents.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.university_id || "No ID"})`,
  }));

  const remainingCourses = courses.map((c) => ({ id: c.id, code: c.code }));
  const neededCourses = courses.map((c) => ({ id: c.id, code: c.code }));

  return (
    <div className="container py-4">
      <RegistrarNavbar />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold" style={{ color: "#6f42c1" }}>
          🎓 Irregular Students Management
        </h4>
        <Button variant="primary" onClick={() => openModal()}>
          <FaPlus className="me-1" /> Add Irregular Student
        </Button>
      </div>

      {/* Filters */}
      <div className="d-flex gap-3 mb-3">
        <Form.Control
          style={{ maxWidth: "250px" }}
          placeholder="🔍 Search by name, ID, or University ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
              <th>University ID</th>
              <th>Student Name</th>
              <th>Level</th>
              <th>Remaining Courses</th>
              <th>Needed Courses</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6">
                  <Spinner animation="border" variant="secondary" />
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-muted py-3">
                  No irregular students found
                  {(selectedLevel || search) && " matching your filters"}
                </td>
              </tr>
            ) : (
              filteredStudents.map((st) => (
                <tr key={st.id}>
                  <td className="fw-semibold text-primary">
                    {st.university_id || "—"}
                  </td>
                  <td>{st.student_name}</td>
                  <td>{st.level_name}</td>
                  <td>
                    {st.remaining_courses.length > 0 ? (
                      st.remaining_courses.map((c) => (
                        <Badge
                          key={c}
                          bg="warning"
                          text="dark"
                          className="me-1"
                        >
                          {c}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {st.required_courses.length > 0 ? (
                      st.required_courses.map((c) => (
                        <Badge key={c} bg="info" text="dark" className="me-1">
                          {c}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex justify-content-center gap-2">
                      <FaEdit
                        color="#0d6efd"
                        size={18}
                        style={{ cursor: "pointer" }}
                        onClick={() => openModal(st)}
                      />
                      <FaTrashAlt
                        color="#dc3545"
                        size={16}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleDelete(st.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editing ? "Edit Irregular Student" : "Add Irregular Student"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Student</Form.Label>
              <Select
                options={studentOptions}
                value={
                  studentOptions.find((opt) => opt.value === form.student_id) ||
                  null
                }
                onChange={(opt) =>
                  setForm({ ...form, student_id: opt?.value || "" })
                }
                placeholder="Search or select a student..."
                isClearable
              />
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Label className="fw-bold">Remaining Courses</Form.Label>
                <div
                  className="border rounded p-2"
                  style={{ maxHeight: 200, overflowY: "auto" }}
                >
                  {remainingCourses.map((c) => (
                    <Form.Check
                      key={c.id}
                      type="checkbox"
                      label={c.code}
                      checked={form.remaining_courses.includes(c.id)}
                      onChange={() =>
                        handleCourseToggle("remaining_courses", c.id)
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="col-md-6">
                <Form.Label className="fw-bold">Needed Courses</Form.Label>
                <div
                  className="border rounded p-2"
                  style={{ maxHeight: 200, overflowY: "auto" }}
                >
                  {neededCourses.map((c) => (
                    <Form.Check
                      key={c.id}
                      type="checkbox"
                      label={c.code}
                      checked={form.required_courses.includes(c.id)}
                      onChange={() =>
                        handleCourseToggle("required_courses", c.id)
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {editing ? "Save Changes" : "Add Student"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
