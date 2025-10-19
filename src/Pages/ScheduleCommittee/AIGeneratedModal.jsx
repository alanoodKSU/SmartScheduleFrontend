import React from "react";

export default function AIGeneratedModal({ show, onClose, data }) {
  if (!show || !data) return null;

  // Handle both array and grouped object formats
  const groupedSchedule = Array.isArray(data.schedule)
    ? Object.groupBy
      ? Object.groupBy(data.schedule, (s) => s.day)
      : data.schedule.reduce((acc, s) => {
          (acc[s.day] = acc[s.day] || []).push(s);
          return acc;
        }, {})
    : data.schedule;

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      style={{ background: "rgba(0,0,0,.35)" }}
    >
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">AI-Suggested Schedule (Preview)</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body">
            {Object.entries(groupedSchedule || {}).map(([day, slots]) => (
              <div key={day} className="mb-3">
                <h6 className="text-primary">{day}</h6>
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Faculty</th>
                      <th>Room Name</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((s, i) => (
                      <tr key={i}>
                        {/* ✅ Using course code + room name instead of IDs */}
                        <td>{s.course || s.course_code || "-"}</td>
                        <td>{s.faculty || s.faculty_name || "-"}</td>
                        <td>{s.room || s.room_name || "-"}</td>
                        <td>{s.start_time}</td>
                        <td>{s.end_time}</td>
                        <td>{s.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-outline-secondary"
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
