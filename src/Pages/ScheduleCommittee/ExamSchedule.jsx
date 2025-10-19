import React, { useEffect, useState } from "react";
import apiClient from "../../Services/apiClient";
import ScheduleCommitteeNavbar from "./ScheduleCommitteeNavbar"; // 🟣 أضف هذا السطر

export default function ExamSchedule() {
  const [courses, setCourses] = useState([]);
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Load levels on mount
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const res = await apiClient.get("/dropdowns/levels");
        setLevels(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch levels:", err);
      }
    };
    fetchLevels();
  }, []);

  // Load courses when level changes
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const endpoint = selectedLevel
          ? `/courses/exam-schedule?level_id=${selectedLevel}`
          : `/courses/exam-schedule`;

        const res = await apiClient.get(endpoint);
        setCourses(res.data);
      } catch (err) {
        console.error("❌ Failed to load courses:", err);
      }
    };
    loadCourses();
  }, [selectedLevel]);

  // ✅ Date formatting
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "";
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  // ✅ Date validation & submission
  const handleDateChange = async (courseId, newDate) => {
    if (!newDate) {
      alert("Please enter a valid date");
      return;
    }

    let formattedDate = newDate;
    if (newDate.includes("/")) {
      const parts = newDate.split("/");
      if (parts.length === 3) {
        let [month, day, year] = parts;
        if (year.length === 2) year = `20${year}`;
        formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formattedDate)) {
      alert("Please enter a valid date in YYYY-MM-DD format");
      return;
    }

    const dateObj = new Date(formattedDate);
    const currentYear = new Date().getFullYear();
    if (dateObj.getFullYear() < currentYear - 1 || dateObj.getFullYear() > currentYear + 5) {
      alert("Please enter a valid year (within reasonable range)");
      return;
    }

    setUpdatingId(courseId);
    try {
      await apiClient.put(`/courses/${courseId}/exam-date`, {
        exam_date: formattedDate,
      });

      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, exam_date: formattedDate } : c
        )
      );
    } catch (err) {
      console.error("❌ Failed to update exam date:", err);
      alert(`Failed to update exam date: ${err.response?.data?.message || err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      {/* 🟣 Navbar at the top */}
      <ScheduleCommitteeNavbar />

      <div className="container py-4">
        {/* Header and Filter */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold" style={{ color: "#6f42c1" }}>
            📅 Exam Schedule
          </h4>

          <div className="d-flex align-items-center">
            <label className="me-2 fw-semibold text-muted">Level:</label>
            <select
              className="form-select shadow-sm border-0"
              style={{ width: "180px" }}
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              <option value="">All Levels</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Courses Table */}
        <div className="table-responsive shadow-sm rounded-4">
          <table className="table align-middle text-center mb-0">
            <thead
              style={{
                background: "linear-gradient(90deg, #a18cd1 0%, #fbc2eb 100%)",
                color: "white",
              }}
            >
              <tr>
                <th>Course Code</th>
                <th>Level</th>
                <th>Exam Date</th>
              </tr>
            </thead>
            <tbody>
              {courses.length > 0 ? (
                courses.map((course) => (
                  <tr key={course.id}>
                    <td className="fw-semibold">{course.code}</td>
                    <td>{course.level_name || `Level ${course.level_id}`}</td>
                    <td>
                      <div className="d-flex justify-content-center align-items-center">
                        <input
                          type="date"
                          className="form-control border-0 shadow-sm text-center"
                          style={{ maxWidth: "160px" }}
                          value={formatDate(course.exam_date)}
                          onChange={(e) => handleDateChange(course.id, e.target.value)}
                          disabled={updatingId === course.id}
                        />
                        {updatingId === course.id && (
                          <span className="spinner-border spinner-border-sm ms-2 text-primary"></span>
                        )}
                      </div>
                      <small className="text-muted d-block mt-1">
                        Current: {course.exam_date || "Not set"}
                      </small>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-muted py-3">
                    No courses found
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
