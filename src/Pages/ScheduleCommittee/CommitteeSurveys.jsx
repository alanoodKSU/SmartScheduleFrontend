import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../../Services/apiClient";
import { useAuth } from "../../Hooks/AuthContext";
import Select from "react-select";
import ScheduleCommitteeNavbar from "./ScheduleCommitteeNavbar";
import { useSharedMap } from "../../Hooks/useSharedMap"; // 🟣 real-time sync

export default function CommitteeSurveys() {
  const { user } = useAuth();
  const [levels, setLevels] = useState([]);
  const [courses, setCourses] = useState([]);
  const [surveys, setSurveys] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [closingDate, setClosingDate] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // 🟣 Y.js shared document
  const { data: sharedData, updateField } = useSharedMap("committee_surveys");

  const canSubmit = useMemo(
    () => !!title.trim() && selectedLevels.length > 0 && !loading,
    [title, selectedLevels, loading]
  );

  // 🔹 Load dropdowns
  useEffect(() => {
    const loadLevels = async () => {
      try {
        const res = await apiClient.get("/dropdowns/levels");
        setLevels(res.data || []);
      } catch {
        setFetchError("Unable to load levels");
      }
    };
    const loadCourses = async () => {
      try {
        const res = await apiClient.get("/courses/electives");
        setCourses(res.data || []);
      } catch {
        setCourses([]);
      }
    };
    loadLevels();
    loadCourses();
  }, []);

  // 🔹 Fetch surveys
  const fetchSurveys = async () => {
    try {
      const res = await apiClient.get("/surveys");
      setSurveys(res.data || []);
    } catch {
      setSurveys([]);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  // 🟣 Listen for updates from other committee members
  useEffect(() => {
    if (!sharedData?.lastChange) return;
    const { type } = sharedData.lastChange;
    console.log("📨 Survey Yjs update:", sharedData.lastChange);

    if (["created", "deleted", "published", "closed"].includes(type)) {
      fetchSurveys(); // refresh data
    }
  }, [sharedData]);

  // 🔹 Toggle courses
  const toggleCourse = (courseId) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  // 🔹 Create survey
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    if (!canSubmit) return;

    setLoading(true);
    try {
      const createBody = {
        title,
        description,
        level_ids: selectedLevels.map((l) => l.value),
        created_by: user?.id,
      };

      const createRes = await apiClient.post("/surveys", createBody);
      const created = createRes.data;

      if (selectedCourses.length > 0) {
        await apiClient.post("/surveys/add-courses", {
          survey_id: created.id,
          course_ids: selectedCourses.map(Number),
        });
      }

      setSubmitSuccess("Survey created successfully ✅");
      setTitle("");
      setDescription("");
      setSelectedLevels([]);
      setSelectedCourses([]);
      setClosingDate("");
      setNotes("");
      fetchSurveys();

      // 🟣 Notify others
      updateField("lastChange", { type: "created", timestamp: Date.now() });
    } catch (err) {
      setSubmitError(err?.response?.data?.error || "Failed to create survey");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Publish, close, delete (with real-time signals)
  const handlePublish = async (id) => {
    try {
      await apiClient.put(`/surveys/${id}/publish`);
      fetchSurveys();
      updateField("lastChange", { type: "published", timestamp: Date.now() });
    } catch {
      alert("Failed to publish survey");
    }
  };

  const handleClose = async (id) => {
    try {
      await apiClient.put(`/surveys/${id}/close`);
      fetchSurveys();
      updateField("lastChange", { type: "closed", timestamp: Date.now() });
    } catch {
      alert("Failed to close survey");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this survey?")) return;
    try {
      await apiClient.delete(`/surveys/${id}`);
      fetchSurveys();
      updateField("lastChange", { type: "deleted", timestamp: Date.now() });
    } catch {
      alert("Failed to delete survey");
    }
  };

  return (
    <>
      <ScheduleCommitteeNavbar />

      <div className="container py-3">
        {fetchError && (
          <div className="alert alert-danger py-2 mb-3">{fetchError}</div>
        )}

        {/* ======= Create New Survey Card ======= */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="fw-bold mb-3" style={{ color: "#047857" }}>
              Create New Survey
            </h5>

            {submitSuccess && (
              <div className="alert alert-success py-2">{submitSuccess}</div>
            )}
            {submitError && (
              <div className="alert alert-danger py-2">{submitError}</div>
            )}

            <form onSubmit={handleCreate}>
              {/* Title */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Survey Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter survey title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Description</label>
                <textarea
                  rows="3"
                  className="form-control"
                  placeholder="Explain how students should rank electives"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Levels Dropdown */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Target Levels *
                </label>
                <Select
                  isMulti
                  isSearchable
                  placeholder="Search or select levels..."
                  options={levels.map((lv) => ({
                    value: lv.id,
                    label: lv.name,
                  }))}
                  value={selectedLevels}
                  onChange={(opt) => setSelectedLevels(opt || [])}
                />
              </div>

              {/* Courses */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Select Elective Courses
                </label>
                <div
                  className="border rounded p-2"
                  style={{ maxHeight: "200px", overflowY: "auto" }}
                >
                  {courses.length > 0 ? (
                    courses.map((c) => (
                      <div key={c.id} className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`course-${c.id}`}
                          checked={selectedCourses.includes(c.id)}
                          onChange={() => toggleCourse(c.id)}
                        />
                        <label
                          className="form-check-label"
                          htmlFor={`course-${c.id}`}
                        >
                          {c.code ? `${c.code} — ${c.name}` : c.name}
                        </label>
                      </div>
                    ))
                  ) : (
                    <span className="text-muted small">
                      No elective courses available.
                    </span>
                  )}
                </div>
              </div>

              {/* Dates & Notes */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Closing Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Internal Notes
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Internal notes (not published to students)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn text-white fw-bold w-100"
                disabled={!canSubmit}
                style={{
                  backgroundColor: "#2563eb",
                  padding: "10px",
                }}
              >
                {loading ? "Saving..." : "Create Survey"}
              </button>
            </form>
          </div>
        </div>

        {/* ======= Surveys Table ======= */}
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h6 className="fw-bold mb-3" style={{ color: "#047857" }}>
              All Surveys
            </h6>

            {surveys?.length === 0 ? (
              <div className="text-muted">No surveys created yet</div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Title</th>
                      <th>Levels</th>
                      <th>Created</th>
                      <th>Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surveys.map((s) => (
                      <tr key={s.id}>
                        <td className="fw-semibold">{s.title}</td>
                        <td>{s.level_names || "-"}</td>
                        <td>
                          {s.created_at
                            ? new Date(s.created_at).toLocaleDateString()
                            : "-"}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              s.is_closed
                                ? "text-bg-secondary"
                                : s.is_published
                                ? "text-bg-success"
                                : "text-bg-warning"
                            }`}
                          >
                            {s.is_closed
                              ? "Closed"
                              : s.is_published
                              ? "Published"
                              : "Draft"}
                          </span>
                        </td>
                        <td className="text-center">
                          {!s.is_published && !s.is_closed && (
                            <button
                              className="btn btn-sm btn-primary me-2"
                              onClick={() => handlePublish(s.id)}
                            >
                              Publish
                            </button>
                          )}
                          {s.is_published && !s.is_closed && (
                            <button
                              className="btn btn-sm btn-warning me-2"
                              onClick={() => handleClose(s.id)}
                            >
                              Close
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(s.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
