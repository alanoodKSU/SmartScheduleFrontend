import React, { useEffect, useState } from "react";
import { Table, Button, Form, Spinner, Card, Badge } from "react-bootstrap";
import apiClient from "../../Services/apiClient";
import StudentLinksBar from "./StudentNavbar";
import { FaStar, FaBookOpen } from "react-icons/fa";
import { useAuth } from "../../Hooks/AuthContext"; // 🟢 استدعاء الـ hook

export default function StudentElectivePreferencesPage() {
  const { user } = useAuth(); // 🧠 نجيب المستخدم من الـ AuthContext
  const [survey, setSurvey] = useState(null);
  const [courses, setCourses] = useState([]);
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("info"); // success | danger | warning

  // 🟢 تحميل الاستبيان الخاص بالطالب
  useEffect(() => {
    if (!user?.id) return; // نتأكد أن المستخدم موجود قبل الطلب

    const fetchSurvey = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get(`/surveys/student/${user.id}`, {
          headers: { "Cache-Control": "no-cache" },
        });

        setSurvey(data.survey);
        setCourses(data.courses || []);
      } catch (err) {
        console.error("Failed to load survey:", err);
        setMessage("❌ Failed to load the survey. Please try again later.");
        setMessageType("danger");
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [user?.id]);

  const handleRankChange = (courseId, value) => {
    setPreferences((prev) => ({
      ...prev,
      [courseId]: Number(value),
    }));
  };

  const handleSubmit = async () => {
    if (!user?.id || !survey) return;

    const prefs = Object.entries(preferences).map(([course_id, rank]) => ({
      course_id: Number(course_id),
      rank,
    }));

    if (prefs.length === 0) {
      setMessage("⚠️ Please rank at least one course before submitting!");
      setMessageType("warning");
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await apiClient.post(
        `/surveys/${survey.survey_id}/submit`,
        {
          student_id: user.id,
          preferences: prefs,
        }
      );

      setMessage(data.message || "✅ Preferences submitted successfully!");
      setMessageType("success");
    } catch (err) {
      console.error("Failed to submit preferences:", err);
      const backendMsg =
        err.response?.data?.error ||
        "❌ Something went wrong while submitting your preferences.";
      setMessage(backendMsg);
      setMessageType("danger");
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 6000);
    }
  };

  return (
    <div
      className="container-fluid p-0"
      style={{ background: "#faf8fc", minHeight: "100vh" }}
    >
      <StudentLinksBar />

      <div className="container py-5">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="secondary" />
          </div>
        ) : !survey ? (
          <div className="text-center mt-5 text-muted">
            <FaBookOpen size={36} className="mb-3 text-secondary" />
            <h5>No active elective survey available for your level.</h5>
          </div>
        ) : (
          <Card className="shadow-sm border-0 p-4 rounded-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h4 className="fw-bold text-primary mb-0">{survey.title}</h4>
                <small className="text-muted">{survey.description}</small>
              </div>
              <Badge
                bg="info"
                className="p-2 rounded-pill"
                style={{ fontSize: "0.85rem" }}
              >
                {survey.level_name}
              </Badge>
            </div>

            {message && (
              <div
                className={`alert alert-${messageType} text-center fw-semibold rounded-3`}
                style={{
                  fontSize: "0.95rem",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
              >
                {message}
              </div>
            )}

            <div className="table-responsive">
              <Table hover bordered className="align-middle text-center">
                <thead
                  style={{
                    background:
                      "linear-gradient(90deg, #a78bfa 0%, #ec4899 100%)",
                    color: "white",
                  }}
                >
                  <tr>
                    <th>Code</th>
                    <th>Course Name</th>
                    <th>Credits</th>
                    <th>Preference Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.course_id}>
                      <td>
                        <Badge bg="secondary">{course.code}</Badge>
                      </td>
                      <td className="fw-semibold">{course.name}</td>
                      <td>{course.credits}</td>
                      <td>
                        <Form.Select
                          style={{ width: "130px", margin: "0 auto" }}
                          value={preferences[course.course_id] || ""}
                          onChange={(e) =>
                            handleRankChange(course.course_id, e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          <option value="1">1st Choice</option>
                          <option value="2">2nd Choice</option>
                          <option value="3">3rd Choice</option>
                        </Form.Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div className="text-center mt-4">
              <Button
                variant="primary"
                size="lg"
                className="px-5 py-2 fw-bold"
                style={{
                  background:
                    "linear-gradient(90deg, #7C3AED 0%, #EC4899 100%)",
                  border: "none",
                  borderRadius: "12px",
                }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" /> Submitting...
                  </>
                ) : (
                  <>
                    <FaStar className="me-2" /> Submit Preferences
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
