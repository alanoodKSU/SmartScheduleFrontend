import React, { useState, useEffect } from "react";
import { Card, Button, Form, Spinner } from "react-bootstrap";
import { FaCommentDots, FaPaperPlane, FaCalendarAlt } from "react-icons/fa";
import StudentLinksBar from "./LoadCommitteeNavbar";
import apiClient from "../../Services/apiClient";
import { useAuth } from "../../Hooks/AuthContext"; // ✅ get user from context

export default function StudentFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ✅ use the authenticated user
  const { user } = useAuth();
  const userId = user?.id;
  const levelId = user?.level_id || null;

  // 🔹 Fetch feedbacks for the logged-in user
  const fetchFeedback = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/feedback/user/${userId}`);
      setFeedbacks(data);
    } catch (err) {
      console.error("❌ Failed to load feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [userId]);

  // ✨ Submit new feedback
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim())
      return alert("Please write your feedback before submitting.");

    try {
      setSubmitting(true);
      await apiClient.post("/feedback", {
        text,
        level_id: levelId,
      });
      setText("");
      await fetchFeedback();
      alert("✅ Feedback submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="container-fluid p-0"
      style={{ background: "#faf8fc", minHeight: "100vh" }}
    >
      {/* 🟣 Navbar */}
      <StudentLinksBar />

      <div className="container py-5">
        <h4 className="fw-bold text-primary mb-4 d-flex align-items-center">
          <FaCommentDots className="me-2" /> Student Feedback
        </h4>

        {/* 🟢 Feedback Form */}
        <Card className="border-0 shadow-sm rounded-4 mb-5 p-4">
          <h5 className="fw-semibold text-secondary mb-3">
            Submit New Feedback
          </h5>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Your Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Write your feedback or suggestion here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </Form.Group>

            <Button
              type="submit"
              disabled={submitting}
              className="fw-bold px-4 py-2 rounded-pill border-0"
              style={{
                background: "linear-gradient(90deg, #7C3AED 0%, #EC4899 100%)",
              }}
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" /> Sending...
                </>
              ) : (
                <>
                  <FaPaperPlane className="me-2" /> Submit Feedback
                </>
              )}
            </Button>
          </Form>
        </Card>

        {/* 🟣 Feedback History */}
        <Card className="border-0 shadow-sm rounded-4 p-4">
          <h5 className="fw-semibold text-secondary mb-3">
            My Submitted Feedback
          </h5>

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="secondary" />
            </div>
          ) : feedbacks.length === 0 ? (
            <p className="text-muted text-center">No feedback submitted yet.</p>
          ) : (
            <div className="list-group">
              {feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="list-group-item border-0 border-bottom py-3 px-2 d-flex justify-content-between align-items-start"
                  style={{ backgroundColor: "#fdfbff" }}
                >
                  <div>
                    <div className="fw-semibold text-dark mb-1">{fb.text}</div>
                    {fb.level_name && (
                      <div className="small text-muted">
                        Level: {fb.level_name}
                      </div>
                    )}
                  </div>
                  <div className="text-end d-flex align-items-center gap-1 text-secondary small">
                    <FaCalendarAlt size={12} />
                    {new Date(fb.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
