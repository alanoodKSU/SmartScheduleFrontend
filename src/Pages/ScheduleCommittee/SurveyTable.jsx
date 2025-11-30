import React, { useEffect, useState } from "react";
import api from "../../Services/apiClient";
import SurveyDetailsModal from "./SurveyDetailsModal";
import Navbar from "./ScheduleCommitteeNavbar"; // 🟣 Import Navbar

export default function SurveyTable() {
  const [surveys, setSurveys] = useState([]);
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  useEffect(() => {
    (async () => {
      const lv = await api.get("/dropdowns/levels");
      setLevels(lv.data || []);

      const res = await api.get("/surveys");
      setSurveys(res.data || []);
    })();
  }, []);

  // ✅ Compute statistics
  const stats = {
    total: surveys.length,
    published: surveys.filter((s) => s.is_published).length,
    closed: surveys.filter((s) => s.is_closed).length,
  };

  // ✅ Filter by level
  const filtered =
    selectedLevel === "all"
      ? surveys
      : surveys.filter((s) => s.level_id === Number(selectedLevel));

  return (
    <>
      {/* 🟣 Global Navbar */}
      <Navbar />

      {/* 🟢 Page Content */}
      <div className="container py-3">
        {/* Header */}
        <h4 className="mb-3" style={{ color: "#0f766e", fontWeight: 800 }}>
          Surveys Overview
        </h4>

        {/* ✅ Statistics Cards */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card shadow-sm border-success">
              <div className="card-body text-center">
                <h6 className="text-muted">Total Surveys</h6>
                <h3 className="fw-bold text-success">{stats.total}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm border-primary">
              <div className="card-body text-center">
                <h6 className="text-muted">Published Surveys</h6>
                <h3 className="fw-bold text-primary">{stats.published}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm border-secondary">
              <div className="card-body text-center">
                <h6 className="text-muted">Closed Surveys</h6>
                <h3 className="fw-bold text-secondary">{stats.closed}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="d-flex gap-2 mb-3 align-items-center">
          <label className="fw-semibold text-muted">Filter by Level:</label>
          <select
            className="form-select w-auto"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
          >
            <option value="all">All Levels</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <table className="table table-bordered shadow-sm">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Level</th>
              <th>Published</th>
              <th>Closed</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.title}</td>
                  <td>{s.level_name}</td>
                  <td>{s.is_published ? "✅" : "❌"}</td>
                  <td>{s.is_closed ? "✅" : "❌"}</td>
                  <td>{new Date(s.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setSelectedSurvey(s)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center text-muted">
                  No surveys found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Modal */}
        {selectedSurvey && (
          <SurveyDetailsModal
            survey={selectedSurvey}
            onClose={() => setSelectedSurvey(null)}
          />
        )}
      </div>
    </>
  );
}
