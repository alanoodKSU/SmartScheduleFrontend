import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../Services/apiClient";
import { validatePassword } from "../../utils/validatePassword"; // ✅ shared password utility

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordInfo, setPasswordInfo] = useState({
    missing: [],
    strength: "",
    color: "#dee2e6",
    progress: 0,
    isValid: false,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ get token from URL
  const token = new URLSearchParams(window.location.search).get("token");

  useEffect(() => {
    if (!token) {
      setError("❌ Invalid or expired password reset link.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // ✅ validate password
    if (!passwordInfo.isValid) {
      setError("Please make sure your password meets all the rules.");
      return;
    }

    // ✅ confirm match
    if (newPassword !== confirmPassword) {
      setError("❌ Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/auth/reset-password", {
        resetToken: token,
        newPassword,
      });
      setMessage(res.data.message || "✅ Password reset successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "❌ Failed to reset password");
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
          Reset Password
        </h3>

        {message && (
          <div className="alert alert-success text-center py-2">{message}</div>
        )}
        {error && (
          <div className="alert alert-danger text-center py-2">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ✅ New Password with strength meter */}
          <div className="mb-3">
            <label className="form-label fw-semibold">New Password</label>
            <input
              type="password"
              className="form-control border-0 shadow-sm"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordInfo(validatePassword(e.target.value));
              }}
              required
            />

            {newPassword && (
              <>
                {/* progress bar */}
                <div
                  className="progress mt-2"
                  style={{ height: "8px", borderRadius: "10px" }}
                >
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{
                      width: `${passwordInfo.progress}%`,
                      backgroundColor: passwordInfo.color,
                      transition: "width 0.4s ease",
                    }}
                  ></div>
                </div>

                {/* feedback */}
                <div className="d-flex justify-content-between small mt-1">
                  <span
                    className="fw-semibold"
                    style={{ color: passwordInfo.color }}
                  >
                    {passwordInfo.strength}
                  </span>
                  {!passwordInfo.isValid &&
                    passwordInfo.missing.length > 0 && (
                      <span className="text-danger text-end small">
                        {passwordInfo.missing.join(", ")}
                      </span>
                    )}
                </div>
              </>
            )}
          </div>

          {/* ✅ Confirm Password */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Confirm Password</label>
            <input
              type="password"
              className="form-control border-0 shadow-sm"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Submit */}
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
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <div className="text-center mt-3">
            <small className="text-muted">
              Already reset?{" "}
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
        </form>
      </div>
    </div>
  );
}
