import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../../Services/apiClient";
import { validatePassword } from "../../utils/validatePassword"; // ✅ import the utility

export default function SignUp() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "",
    name: "",
    level_id: "",
  });

  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordInfo, setPasswordInfo] = useState({
    missing: [],
    strength: "",
    color: "#dee2e6",
    progress: 0,
    isValid: false,
  });

  const navigate = useNavigate();

  // ✅ Fetch levels
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const res = await apiClient.get("/dropdowns/levels");
        setLevels(res.data);
      } catch {
        setLevels([]);
      }
    };
    fetchLevels();
  }, []);

  // =========================================================
  // ✅ Validate Email + Auto Detect Student Role
  // =========================================================
  const validateEmail = (email, role) => {
    if (!email) {
      setEmailError("");
      return;
    }

    const studentEmailRegex = /^\d{9}@student\.ksu\.edu\.sa$/;

    // Auto-set student role if email matches student format
    if (studentEmailRegex.test(email)) {
      setFormData((prev) => ({ ...prev, role: "student" }));
      setEmailError("");
      return;
    }

    // Faculty/staff validation
    if (!email.endsWith("@ksu.edu.sa")) {
      setEmailError("Email must belong to KSU domain");
      return;
    }

    setEmailError("");
  };

  // =========================================================
  // ✅ Handle input changes
  // =========================================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      validateEmail(value, formData.role);
    }

    if (name === "password") {
      const analysis = validatePassword(value);
      setPasswordInfo(analysis);
    }
  };

  // =========================================================
  // ✅ Handle submit
  // =========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (emailError) {
      setError(emailError);
      return;
    }

    if (!passwordInfo.isValid) {
      setError("Please make sure your password meets all the rules.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === "student") {
        payload.name = formData.name;
        payload.level_id = formData.level_id;
      } else {
        payload.name = formData.name;
      }

      await apiClient.post("/auth/register", payload);

      setSuccess("✅ Account created successfully! Redirecting...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "❌ Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // ✅ UI Rendering
  // =========================================================

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
          minWidth: "400px",
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
          Sign Up
        </h3>

        {success && (
          <div className="alert alert-success py-2 text-center">{success}</div>
        )}
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
          <div className="mb-3">
            <label className="form-label fw-semibold">Password</label>
            <input
              type="password"
              className="form-control border-0 shadow-sm"
              placeholder="Create a strong password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            {formData.password && (
              <>
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

                <div className="d-flex justify-content-between small mt-1">
                  <span
                    className="fw-semibold"
                    style={{ color: passwordInfo.color }}
                  >
                    {passwordInfo.strength}
                  </span>

                  {!passwordInfo.isValid && passwordInfo.missing.length > 0 && (
                    <span className="text-danger text-end small">
                      {passwordInfo.missing.join(", ")}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Role */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Role</label>
            <select
              className="form-select border-0 shadow-sm"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">Select your role</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="schedule-committee">Schedule Committee</option>
              <option value="load-committee">Load Committee</option>
              <option value="registrar">Registrar</option>
            </select>
          </div>

          {/* Name */}
          {(formData.role === "student" || formData.role === "faculty") && (
            <div className="mb-3">
              <label className="form-label fw-semibold">Full Name</label>
              <input
                type="text"
                className="form-control border-0 shadow-sm"
                placeholder="Enter your full name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {/* Level (only for students) */}
          {formData.role === "student" && (
            <div className="mb-3">
              <label className="form-label fw-semibold">Level</label>
              <select
                className="form-select border-0 shadow-sm"
                name="level_id"
                value={formData.level_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Level</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <div className="text-center mt-3">
          <small className="text-muted">
            Already have an account?{" "}
            <Link
              to="/login"
              className="fw-semibold"
              style={{ color: "#6f42c1", textDecoration: "none" }}
            >
              Login here
            </Link>
          </small>
        </div>
      </div>
    </div>
  );
}
