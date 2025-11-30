import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../Services/apiClient"; // adjust path if needed

export default function VerifyEmail() {
  const [status, setStatus] = useState("Verifying...");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = new URLSearchParams(window.location.search).get("token");
      if (!token) {
        setError(true);
        setStatus("❌ Invalid or expired verification link.");
        setLoading(false);
        return;
      }

      try {
        const res = await apiClient.get(`/auth/verify?token=${token}`);
        setSuccess(true);
        setStatus(res.data.message || "✅ Email verified successfully!");
        setTimeout(() => navigate("/login"), 2500);
      } catch (err) {
        setError(true);
        setStatus(err.response?.data?.error || "❌ Verification failed.");
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [navigate]);

  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100"
      style={{
        background: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
      }}
    >
      <div
        className="card shadow-lg p-4 border-0 text-center"
        style={{
          minWidth: "400px",
          borderRadius: "18px",
          backgroundColor: "#ffffffee",
          backdropFilter: "blur(10px)",
        }}
      >
        <h3
          className="fw-bold mb-3"
          style={{
            color: "#6f42c1",
            letterSpacing: "0.5px",
          }}
        >
          Email Verification
        </h3>

        {loading && (
          <>
            <div className="spinner-border text-primary mb-3"></div>
            <p className="fw-semibold text-muted">Verifying your email...</p>
          </>
        )}

        {!loading && (
          <>
            {success && (
              <div className="alert alert-success py-2">{status}</div>
            )}
            {error && <div className="alert alert-danger py-2">{status}</div>}

            <button
              className="btn w-100 fw-bold text-white shadow-sm mt-2"
              style={{
                backgroundColor: "#6f42c1",
                transition: "0.3s",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#5b34a3")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#6f42c1")}
              onClick={() => navigate("/login")}
            >
              Go to Login
            </button>

            <small className="d-block mt-3 text-muted">
              You’ll be redirected automatically in a few seconds...
            </small>
          </>
        )}
      </div>
    </div>
  );
}
