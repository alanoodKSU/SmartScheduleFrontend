import React, { useEffect, useState } from "react";
import apiClient from "../../Services/apiClient";
import { Modal, Button, Form } from "react-bootstrap";
import { FaEdit, FaTrashAlt, FaPlusCircle } from "react-icons/fa";
import Navbar from "./ScheduleCommitteeNavbar";
import { useSharedMap } from "../../Hooks/useSharedMap"; // 🟣 new import

export default function RulesPage() {
  const [rules, setRules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    condition: "",
    value: "",
    type: "manual",
  });

  // 🟣 shared map for real-time sync
  const { data: sharedData, updateField } = useSharedMap("committee_rules");

  const loadRules = async () => {
    try {
      const res = await apiClient.get("/committee/rules");
      setRules(res.data);
    } catch (err) {
      console.error("❌ Failed to load rules:", err);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  // 🟣 Listen for remote changes
  useEffect(() => {
    if (!sharedData?.lastChange) return;
    const { type } = sharedData.lastChange;
    console.log("📡 RulesPage update:", type);
    if (["created", "updated", "deleted", "toggled"].includes(type)) loadRules();
  }, [sharedData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setForm({
        name: rule.name,
        description: rule.description || "",
        condition: rule.condition || "",
        value: JSON.stringify(rule.value || {}, null, 2),
        type: rule.type || "manual",
      });
    } else {
      setEditingRule(null);
      setForm({
        name: "",
        description: "",
        condition: "",
        value: "",
        type: "manual",
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, value: JSON.parse(form.value || "{}") };
      if (editingRule) {
        await apiClient.put(`/committee/rules/${editingRule.id}`, payload);
        updateField("lastChange", { type: "updated", timestamp: Date.now() });
      } else {
        await apiClient.post("/committee/rules", payload);
        updateField("lastChange", { type: "created", timestamp: Date.now() });
      }
      setShowModal(false);
      loadRules();
    } catch (err) {
      alert("❌ Failed to save rule");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this rule?")) return;
    try {
      await apiClient.delete(`/committee/rules/${id}`);
      updateField("lastChange", { type: "deleted", timestamp: Date.now() });
      loadRules();
    } catch (err) {
      alert("❌ Failed to delete rule");
      console.error(err);
    }
  };

  const handleToggle = async (id, currentState) => {
    try {
      await apiClient.put(`/committee/rules/${id}/toggle`, {
        active: !currentState,
      });
      updateField("lastChange", { type: "toggled", timestamp: Date.now() });
      loadRules();
    } catch (err) {
      alert("❌ Failed to toggle rule");
    }
  };

  return (
    <>
      <Navbar />

      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold" style={{ color: "#6f42c1" }}>
            ⚙️ Scheduling Rules
          </h4>
          <Button variant="primary" onClick={() => openModal()}>
            <FaPlusCircle className="me-2" /> New Rule
          </Button>
        </div>

        <div className="table-responsive shadow-sm rounded-4">
          <table className="table table-hover align-middle text-center mb-0">
            <thead
              style={{
                background: "linear-gradient(90deg, #a18cd1 0%, #fbc2eb 100%)",
                color: "white",
              }}
            >
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Condition</th>
                <th>Type</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.length > 0 ? (
                rules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="fw-semibold">{rule.name}</td>
                    <td>{rule.description}</td>
                    <td>{rule.condition}</td>
                    <td>
                      <span
                        className={`badge ${
                          rule.type === "manual" ? "bg-primary" : "bg-success"
                        }`}
                      >
                        {rule.type}
                      </span>
                    </td>
                    <td>
                      <div className="form-check form-switch d-flex justify-content-center">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={rule.is_active}
                          onChange={() =>
                            handleToggle(rule.id, rule.is_active)
                          }
                        />
                      </div>
                    </td>
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        <Button
                          variant="outline-warning"
                          size="sm"
                          title="Edit"
                          onClick={() => openModal(rule)}
                          style={{
                            borderRadius: "50%",
                            padding: "6px 8px",
                            border: "none",
                            backgroundColor: "rgba(255, 193, 7, 0.15)",
                          }}
                        >
                          <FaEdit size={16} color="#ffc107" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          title="Delete"
                          onClick={() => handleDelete(rule.id)}
                          style={{
                            borderRadius: "50%",
                            padding: "6px 8px",
                            border: "none",
                            backgroundColor: "rgba(220, 53, 69, 0.15)",
                          }}
                        >
                          <FaTrashAlt size={15} color="#dc3545" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-muted py-3">
                    No rules found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              {editingRule ? "Edit Rule" : "Create New Rule"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter rule name"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Short description"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Condition</Form.Label>
                <Form.Control
                  type="text"
                  name="condition"
                  value={form.condition}
                  onChange={handleChange}
                  placeholder="Example: Monday & Wednesday reserved 12:00–14:00"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Value (JSON)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="value"
                  value={form.value}
                  onChange={handleChange}
                  placeholder='{"days":["Mon","Wed"],"start":"12:00","end":"14:00"}'
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Type</Form.Label>
                <Form.Select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                >
                  <option value="manual">Manual</option>
                  <option value="ai">AI</option>
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingRule ? "Save Changes" : "Create Rule"}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
}
