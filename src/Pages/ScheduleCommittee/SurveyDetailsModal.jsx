import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import api from "../../Services/apiClient";
import { FaCrown } from "react-icons/fa";

export default function SurveyDetailsModal({ survey, onClose }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/surveys/${survey.id}/results`);
        setResults(res.data || []);
      } catch (err) {
        console.error("Failed to load survey results:", err);
      }
    })();
  }, [survey]);

  // 🔹 Find the highest score for visual highlighting
  const topScore = Math.max(...results.map((r) => Number(r.score || 0)), 0);

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      style={{ background: "rgba(0,0,0,.35)" }}
    >
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content rounded-4 overflow-hidden">
          {/* Header */}
          <div
            className="modal-header text-white"
            style={{
              background: "linear-gradient(90deg, #7C3AED 0%, #EC4899 100%)",
            }}
          >
            <h5 className="modal-title">
              Survey Results — {survey.title}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body">
            {results.length === 0 ? (
              <div className="alert alert-info text-center fw-semibold py-4">
                No responses yet.
              </div>
            ) : (
              <>
                {/* Chart */}
                <h6 className="text-primary fw-bold mb-3">
                  Top Ranked Courses
                </h6>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={results}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="course_name" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        background: "#f9fafb",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                      }}
                      formatter={(value, name) => [
                        value,
                        name === "score"
                          ? "Weighted Score (3×1st + 2×2nd + 1×3rd)"
                          : name,
                      ]}
                    />
                    <Bar
                      dataKey="score"
                      fill="#7C3AED"
                      radius={[6, 6, 0, 0]}
                      label={{ position: "top", fill: "#333" }}
                    >
                      <LabelList
                        dataKey="score"
                        position="top"
                        fill="#333"
                        fontSize={12}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Table */}
                <div className="mt-4">
                  <h6 className="fw-bold text-secondary mb-2">
                    Detailed Ranking Breakdown
                  </h6>
                  <table className="table table-sm table-bordered align-middle text-center shadow-sm">
                    <thead
                      style={{
                        background:
                          "linear-gradient(90deg, #a78bfa 0%, #ec4899 100%)",
                        color: "white",
                      }}
                    >
                      <tr>
                        <th>Course</th>
                        <th>1st Choice</th>
                        <th>2nd</th>
                        <th>3rd</th>
                        <th>Total Votes</th>
                        <th>
                          Weighted Score{" "}
                          <small className="fw-normal">(3×1 + 2×2 + 1×3)</small>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r) => (
                        <tr
                          key={r.course_id}
                          className={
                            Number(r.score) === topScore
                              ? "table-success fw-bold"
                              : ""
                          }
                        >
                          <td className="text-start ps-3">
                            {r.course_name}
                            {Number(r.score) === topScore && (
                              <FaCrown
                                className="ms-2 text-warning"
                                title="Most Preferred Course"
                              />
                            )}
                          </td>
                          <td>{r.first_choice}</td>
                          <td>{r.second_choice}</td>
                          <td>{r.third_choice}</td>
                          <td>{r.total_votes}</td>
                          <td>
                            <strong>{r.score}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              className="btn btn-outline-secondary rounded-pill px-4"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
