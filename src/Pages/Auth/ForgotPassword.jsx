import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../Services/apiClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await apiClient.post("/auth/request-password-reset", {
        email,
      });
      setMessage(
        res.data.message ||
          "✅ A reset link has been sent to your email. Please check your inbox."
      );
    } catch (err) {
      setError(err.response?.data?.error || "❌ Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100"
      style={{
        background: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
      }}
    >
      <div
        className="card shadow-lg p-4 border-0"
        style={{
          minWidth: "380px",
          borderRadius: "18px",
          backgroundColor: "#ffffffee",
          backdropFilter: "blur(10px)",
        }}
      >
        <h3
          className="text-center fw-bold mb-3"
          style={{
            color: "#6f42c1",
            letterSpacing: "0.5px",
          }}
        >
          Forgot Password
        </h3>

        {message && (
          <div className="alert alert-success text-center py-2">{message}</div>
        )}
        {error && (
          <div className="alert alert-danger text-center py-2">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Email</label>
            <input
              type="email"
              className="form-control border-0 shadow-sm"
              placeholder="Enter your university email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn w-100 fw-bold text-white shadow-sm"
            style={{
              backgroundColor: "#6f42c1",
              transition: "0.3s",
            }}
            disabled={loading}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#5b34a3")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#6f42c1")}
          >
            {loading && (
              <span className="spinner-border spinner-border-sm me-2"></span>
            )}
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <div className="text-center mt-3">
            <small className="text-muted">
              Remembered your password?{" "}
              <button
                type="button"
                className="btn btn-link fw-semibold p-0"
                style={{
                  color: "#6f42c1",
                  textDecoration: "none",
                }}
                onClick={() => navigate("/login")}
              >
                Back to Login
              </button>
            </small>
          </div>

          <div className="text-center mt-2">
            <button
              type="button"
              className="btn btn-link fw-semibold p-0"
              style={{
                color: "#6f42c1",
                textDecoration: "none",
              }}
              onClick={() => navigate("/reset-password")}
            >
              Go to Reset Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
