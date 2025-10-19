import React, { useState, useEffect } from "react";
import Select from "react-select";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { Modal, Button } from "react-bootstrap";
import apiClient from "../../Services/apiClient";
import ScheduleCommitteeNavbar from "./ScheduleCommitteeNavbar";
import { useToast } from "../../Hooks/ToastContext"; // Fixed import path

export default function ExternalSlots() {
  const { success, error, warning, info } = useToast(); // Destructure the functions

  const [formData, setFormData] = useState({
    course_id: "",
    levels: [],
    faculty_id: "",
    room_id: "",
    type: "",
    day: "",
    start_time: "",
    end_time: "",
    capacity: "",
    limit_students: false,
    students: [],
  });

  const [levels, setLevels] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [editingSlot, setEditingSlot] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadDropdowns();
    loadSlots();
  }, []);

  const loadDropdowns = async () => {
    try {
      const [lvl, crs, fac, rms] = await Promise.all([
        apiClient.get("/dropdowns/levels"),
        apiClient.get("/dropdowns/courses"),
        apiClient.get("/dropdowns/faculty"),
        apiClient.get("/dropdowns/rooms"),
      ]);
      setLevels(lvl.data);
      setCourses(crs.data);
      setFaculty(fac.data);
      setRooms(rms.data);
    } catch (e) {
      console.error("Dropdown load failed", e);
      error("❌ Failed to load dropdown data"); // Fixed: use error function directly
    }
  };

  const loadStudents = async (levelIds = []) => {
    try {
      if (!levelIds.length) {
        const { data } = await apiClient.get(`/dropdowns/students`);
        setStudents(data || []);
      } else {
        const ids = levelIds.join(",");
        const { data } = await apiClient.get(`/dropdowns/students?level_id=${ids}`);
        setStudents(data || []);
      }
    } catch (error) {
      console.error("Failed to load students", error);
      setStudents([]);
    }
  };

  const loadSlots = async () => {
    try {
      const res = await apiClient.get("/sections/external");
      setSlots(res.data);
    } catch (e) {
      console.error("Failed to load external slots", e);
      error("❌ Failed to load external slots"); // Fixed: use error function directly
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "levels") {
      const ids = value.map((v) => v.value);
      loadStudents(ids);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setEditingSlot(null);
    setFormData({
      course_id: "",
      levels: [],
      faculty_id: "",
      room_id: "",
      type: "",
      day: "",
      start_time: "",
      end_time: "",
      capacity: "",
      limit_students: false,
      students: [],
    });
    setShowEditModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const payload = {
        ...formData,
        is_external: true,
        levels: formData.levels.map((l) => l.value),
        students: formData.limit_students ? formData.students : [],
      };

      if (editingSlot) {
        await apiClient.put(`/sections/${editingSlot.id}`, payload);
        success("✅ Slot updated successfully!"); // Fixed: use success function directly
        setShowEditModal(false);
      } else {
        await apiClient.post("/sections", payload);
        success("✅ Slot created successfully!"); // Fixed: use success function directly
      }

      await loadSlots();
      resetForm();
    } catch (error) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message;
      setErr(msg);
      error(`❌ ${msg}`); // Fixed: use error function directly
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (slot) => {
    setEditingSlot(slot);
    
    // Find the actual course, faculty, and room IDs
    const course = courses.find((c) => c.code === slot.course_code);
    const facultyMember = faculty.find((f) => f.name === slot.faculty_name);
    const room = rooms.find((r) => r.name === slot.room_name);
    
    // Parse level names to level IDs
    const levelOptions = slot.level_names
      .split(", ")
      .map((levelName) => {
        const level = levels.find((l) => l.name === levelName);
        return level ? { value: level.id, label: level.name } : null;
      })
      .filter(Boolean);

    setFormData({
      course_id: course?.id || "",
      levels: levelOptions,
      faculty_id: facultyMember?.id || "",
      room_id: room?.id || "",
      type: slot.type,
      day: slot.day,
      start_time: slot.start_time,
      end_time: slot.end_time,
      capacity: slot.capacity,
      limit_students: false,
      students: [],
    });

    // Load students for the selected levels
    if (levelOptions.length > 0) {
      const levelIds = levelOptions.map((l) => l.value);
      loadStudents(levelIds);
    }

    setShowEditModal(true);
    info("✏️ Editing mode activated"); // Fixed: use info function directly
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this external slot?")) return;

    try {
      await apiClient.delete(`/sections/${id}`);
      success("🗑️ Slot deleted successfully"); // Fixed: use success function directly
      await loadSlots();
    } catch (error) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message;
      error(`❌ Failed to delete slot: ${msg}`); // Fixed: use error function directly
    }
  };

  const selectOptions = {
    courses: courses.map((c) => ({
      value: c.id,
      label: `${c.code || ""} ${c.name || ""}`,
    })),
    levels: levels.map((l) => ({ value: l.id, label: l.name })),
    faculty: faculty.map((f) => ({ value: f.id, label: f.name })),
    rooms: rooms.map((r) => ({ value: r.id, label: r.name })),
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"].map((d) => ({
      value: d,
      label: d,
    })),
    types: [
      { value: "tutorial", label: "Tutorial" },
      { value: "lab", label: "Lab" },
      { value: "lecture", label: "Lecture" },
    ],
    students: students.map((s) => ({ value: s.id, label: s.name })),
  };

  const customFilterOption = (option, inputValue) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase());

  return (
    <>
      <ScheduleCommitteeNavbar />

      <div className="container py-4">
        <h4 className="fw-bold mb-3">External Slots Management</h4>

        {/* Add New Slot Form */}
        <form
          onSubmit={handleSubmit}
          className="card shadow-sm p-4 mb-4"
          style={{ borderRadius: "12px" }}
        >
          {err && <div className="alert alert-danger">{err}</div>}

          <div className="row g-3">
            {/* Course */}
            <div className="col-md-3">
              <label className="form-label">Course</label>
              <Select
                options={selectOptions.courses}
                value={selectOptions.courses.find(
                  (o) => o.value === formData.course_id
                )}
                onChange={(opt) => handleChange("course_id", opt?.value || "")}
                placeholder="Select course…"
                isSearchable
                filterOption={customFilterOption}
              />
            </div>

            {/* Levels Multi-Select */}
            <div className="col-md-3">
              <label className="form-label">Levels</label>
              <Select
                isMulti
                options={selectOptions.levels}
                value={formData.levels}
                onChange={(opt) => handleChange("levels", opt || [])}
                placeholder="Select levels…"
                isSearchable
                filterOption={customFilterOption}
              />
            </div>

            {/* Instructor */}
            <div className="col-md-3">
              <label className="form-label">Instructor</label>
              <Select
                options={selectOptions.faculty}
                value={selectOptions.faculty.find(
                  (o) => o.value === formData.faculty_id
                )}
                onChange={(opt) => handleChange("faculty_id", opt?.value || "")}
                placeholder="Select instructor…"
                isSearchable
                filterOption={customFilterOption}
              />
            </div>

            {/* Room */}
            <div className="col-md-2">
              <label className="form-label">Room</label>
              <Select
                options={selectOptions.rooms}
                value={selectOptions.rooms.find(
                  (o) => o.value === formData.room_id
                )}
                onChange={(opt) => handleChange("room_id", opt?.value || "")}
                placeholder="Select room…"
                isSearchable
                filterOption={customFilterOption}
              />
            </div>

            {/* Type */}
            <div className="col-md-2">
              <label className="form-label">Type</label>
              <Select
                options={selectOptions.types}
                value={selectOptions.types.find(
                  (o) => o.value === formData.type
                )}
                onChange={(opt) => handleChange("type", opt?.value || "")}
                placeholder="Select type…"
                isSearchable
                filterOption={customFilterOption}
              />
            </div>

            {/* Day */}
            <div className="col-md-2">
              <label className="form-label">Day</label>
              <Select
                options={selectOptions.days}
                value={selectOptions.days.find(
                  (o) => o.value === formData.day
                )}
                onChange={(opt) => handleChange("day", opt?.value || "")}
                placeholder="Select day…"
                isSearchable
                filterOption={customFilterOption}
              />
            </div>

            {/* Time */}
            <div className="col-md-2">
              <label className="form-label">Start</label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">End</label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                className="form-control"
                required
              />
            </div>

            {/* Capacity + Limit */}
            <div className="col-md-3 d-flex align-items-end">
              <div className="w-100">
                <label className="form-label">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className="form-control no-spinner"
                  min="1"
                />
              </div>

              <div className="form-check ms-3 mb-2 d-flex align-items-center">
                <input
                  type="checkbox"
                  name="limit_students"
                  id="limit_students"
                  checked={formData.limit_students}
                  onChange={handleInputChange}
                  className="form-check-input me-2"
                />
                <label
                  htmlFor="limit_students"
                  className="form-check-label small"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Limit to students
                </label>
              </div>
            </div>

            {/* Students */}
            {formData.limit_students && (
              <div className="col-12">
                <label className="form-label">Select Students</label>
                <Select
                  isMulti
                  options={selectOptions.students}
                  value={selectOptions.students.filter((o) =>
                    formData.students.includes(o.value)
                  )}
                  onChange={(selected) =>
                    setFormData((p) => ({
                      ...p,
                      students: selected.map((s) => s.value),
                    }))
                  }
                  placeholder="Search or select students…"
                  isSearchable
                  filterOption={customFilterOption}
                />
              </div>
            )}
          </div>

          <div className="mt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 fw-semibold py-2 shadow-sm"
              style={{
                fontSize: "1rem",
                backgroundColor: "#6f42c1",
                transition: "0.3s",
              }}
            >
              {loading
                ? "Saving..."
                : editingSlot
                ? "Update Slot"
                : "Save Slot"}
            </button>
          </div>
        </form>

        {/* External Slots Table */}
        <div className="card shadow-sm p-3">
          <h6 className="fw-bold mb-3">Published External Slots</h6>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Levels</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Instructor</th>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {slots.length ? (
                  slots.map((s) => (
                    <tr key={s.id}>
                      <td>{s.course_code}</td>
                      <td>{s.level_names}</td>
                      <td>{s.day}</td>
                      <td>
                        {s.start_time} - {s.end_time}
                      </td>
                      <td>{s.faculty_name}</td>
                      <td>{s.room_name}</td>
                      <td>{s.type}</td>
                      <td>{s.capacity}</td>
                      <td className="text-center">
                        <button
                          className="btn btn-outline-primary btn-sm me-2"
                          onClick={() => handleEdit(s)}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(s.id)}
                          title="Delete"
                        >
                          <FaTrashAlt />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center text-muted">
                      No external slots found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        <Modal show={showEditModal} onHide={resetForm} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Edit External Slot</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form onSubmit={handleSubmit}>
              {err && <div className="alert alert-danger">{err}</div>}
              
              <div className="row g-3">
                {/* Course */}
                <div className="col-md-6">
                  <label className="form-label">Course</label>
                  <Select
                    options={selectOptions.courses}
                    value={selectOptions.courses.find(
                      (o) => o.value === formData.course_id
                    )}
                    onChange={(opt) => handleChange("course_id", opt?.value || "")}
                    placeholder="Select course…"
                    isSearchable
                    filterOption={customFilterOption}
                  />
                </div>

                {/* Levels Multi-Select */}
                <div className="col-md-6">
                  <label className="form-label">Levels</label>
                  <Select
                    isMulti
                    options={selectOptions.levels}
                    value={formData.levels}
                    onChange={(opt) => handleChange("levels", opt || [])}
                    placeholder="Select levels…"
                    isSearchable
                    filterOption={customFilterOption}
                  />
                </div>

                {/* Instructor */}
                <div className="col-md-6">
                  <label className="form-label">Instructor</label>
                  <Select
                    options={selectOptions.faculty}
                    value={selectOptions.faculty.find(
                      (o) => o.value === formData.faculty_id
                    )}
                    onChange={(opt) => handleChange("faculty_id", opt?.value || "")}
                    placeholder="Select instructor…"
                    isSearchable
                    filterOption={customFilterOption}
                  />
                </div>

                {/* Room */}
                <div className="col-md-6">
                  <label className="form-label">Room</label>
                  <Select
                    options={selectOptions.rooms}
                    value={selectOptions.rooms.find(
                      (o) => o.value === formData.room_id
                    )}
                    onChange={(opt) => handleChange("room_id", opt?.value || "")}
                    placeholder="Select room…"
                    isSearchable
                    filterOption={customFilterOption}
                  />
                </div>

                {/* Type */}
                <div className="col-md-4">
                  <label className="form-label">Type</label>
                  <Select
                    options={selectOptions.types}
                    value={selectOptions.types.find(
                      (o) => o.value === formData.type
                    )}
                    onChange={(opt) => handleChange("type", opt?.value || "")}
                    placeholder="Select type…"
                    isSearchable
                    filterOption={customFilterOption}
                  />
                </div>

                {/* Day */}
                <div className="col-md-4">
                  <label className="form-label">Day</label>
                  <Select
                    options={selectOptions.days}
                    value={selectOptions.days.find(
                      (o) => o.value === formData.day
                    )}
                    onChange={(opt) => handleChange("day", opt?.value || "")}
                    placeholder="Select day…"
                    isSearchable
                    filterOption={customFilterOption}
                  />
                </div>

                {/* Capacity */}
                <div className="col-md-4">
                  <label className="form-label">Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className="form-control no-spinner"
                    min="1"
                  />
                </div>

                {/* Time */}
                <div className="col-md-6">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="mt-4 d-flex gap-2">
                <Button
                  variant="secondary"
                  onClick={resetForm}
                  className="flex-fill"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  className="flex-fill"
                >
                  {loading ? "Updating..." : "Update Slot"}
                </Button>
              </div>
            </form>
          </Modal.Body>
        </Modal>
      </div>
    </>
  );
}