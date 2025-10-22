import React, { useEffect, useState } from "react";
import apiClient from "../../Services/apiClient";
import Navbar from "./ScheduleCommitteeNavbar"; // 🟢 adjust path if needed

export default function IrregularStudents() {
  const [students, setStudents] = useState([]);
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [search, setSearch] = useState("");

  // 🧩 Load levels
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get("/dropdowns/levels");
        setLevels(res.data);
      } catch (err) {
        console.error("❌ Failed to load levels:", err);
      }
    })();
  }, []);

  // 🧩 Load irregular students
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams();
        if (selectedLevel) params.append("level_id", selectedLevel);
        if (search) params.append("search", search);

        const res = await apiClient.get(`/irregular-students?${params.toString()}`);
        setStudents(res.data || []);
      } catch (err) {
        console.error("❌ Failed to load irregular students:", err);
        setStudents([]);
      }
    })();
  }, [selectedLevel, search]);

  return (
    <>
      {/* 🟣 Global Navbar */}
      <Navbar />

      <div className="container py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="fw-bold" style={{ color: "#2563eb" }}>
              Irregular Students
            </h4>
            <small className="text-muted">
              View all irregular students by level
            </small>
          </div>

          <div className="d-flex align-items-center gap-2">
            <input
              type="text"
              className="form-control shadow-sm"
              placeholder="Search by name..."
              style={{ width: "220px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="form-select shadow-sm"
              style={{ width: "160px" }}
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              <option value="">All Levels</option>
              {levels.map((lv) => (
                <option key={lv.id} value={lv.id}>
                  {lv.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive shadow-sm rounded-4">
          <table className="table align-middle text-center mb-0">
            <thead
              style={{
                background: "linear-gradient(90deg, #60a5fa 0%, #93c5fd 100%)",
                color: "white",
              }}
            >
              <tr>
                <th>ID</th>
                <th>University ID</th>
                <th>Name</th>
                <th>Level</th>
                <th>Remaining Courses</th>
                <th>Required Courses</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td className="fw-semibold text-primary">
                      {s.university_id || "—"}
                    </td>
                    <td className="fw-semibold">{s.student_name}</td>
                    <td>{s.level_name}</td>
                    <td>
                      {Array.isArray(s.remaining_courses)
                        ? s.remaining_courses.join(", ")
                        : s.remaining_courses}
                    </td>
                    <td>
                      {Array.isArray(s.required_courses)
                        ? s.required_courses.join(", ")
                        : s.required_courses}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-muted py-3">
                    No irregular students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
