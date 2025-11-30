import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../../Services/apiClient";
import { useAuth } from "../../Hooks/AuthContext";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateEmail = (email) => {
    if (!email) {
      setEmailError("");
      return;
    }

    if (
      !email.endsWith("@student.ksu.edu.sa") &&
      !email.endsWith("@ksu.edu.sa")
    ) {
      setEmailError("Email must end with @student.ksu.edu.sa or @ksu.edu.sa");
    } else {
      setEmailError("");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "email") validateEmail(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/auth/login", formData);
      const token = res.data.token;
      if (!token) throw new Error("No token received from server");

      login(token);

      let decoded;
      try {
        decoded = JSON.parse(atob(token.split(".")[1]));
      } catch (err) {
        console.error("Token decode failed:", err);
        throw new Error("Invalid token received");
      }

      const role = decoded?.role;

      if (role === "student") navigate("/student/schedule");
      else if (role === "faculty") navigate("/faculty/schedule");
      else if (role === "schedule-committee") navigate("/schedule-committee");
      else if (role === "registrar") navigate("/registrar/irregular-students");
      else if (role === "load-committee") navigate("/load-committee/dashboard");
      else navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "❌ Invalid email or password");
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
          Login
        </h3>

        {error && (
          <div className="alert alert-danger py-2 text-center">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Email</label>
            <input
              type="email"
              className={`form-control border-0 shadow-sm ${
                emailError ? "is-invalid" : ""
              }`}
              placeholder="Enter your university email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {emailError && (
              <div className="invalid-feedback d-block">{emailError}</div>
            )}
          </div>

          {/* Password */}
          <div className="mb-2">
            <label className="form-label fw-semibold">Password</label>
            <input
              type="password"
              className="form-control border-0 shadow-sm"
              placeholder="Enter your password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* 🔗 Forgot password link */}
          <div className="text-end mb-3">
            <Link
              to="/forgot-password"
              className="fw-semibold"
              style={{ color: "#6f42c1", textDecoration: "none" }}
            >
              Forgot your password?
            </Link>
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
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="text-center mt-3">
          <small className="text-muted">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="fw-semibold"
              style={{ color: "#6f42c1", textDecoration: "none" }}
            >
              Sign up here
            </Link>
          </small>
        </div>
      </div>
    </div>
  );
}
