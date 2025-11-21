import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Card,
  Modal,
  Form,
  Spinner,
  Badge,
  Row,
  Col,
  Alert,
} from "react-bootstrap";
import {
  FaHistory,
  FaSync,
  FaDownload,
  FaExclamationTriangle,
  FaClock,
  FaUser,
} from "react-icons/fa";
import apiClient from "../../Services/apiClient";
import Navbar from "./ScheduleCommitteeNavbar";

export default function ScheduleHistoryPage() {
  const [levels, setLevels] = useState([]);
  const [levelId, setLevelId] = useState("");
  const [versions, setVersions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  const showAlert = (message, type = "info") => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 4000);
  };

  // Load levels
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get("/dropdowns/levels");
        setLevels(res.data || []);
      } catch {
        showAlert("Failed to load levels", "danger");
      }
    })();
  }, []);

  // Load versions for selected level
  const fetchVersions = async () => {
    if (!levelId) return;

    setLoading(true);
    try {
      const res = await apiClient.get(
        `/schedule-history/${levelId}/versions`
      );
      setVersions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch versions:", err);
      showAlert("Failed to load schedule versions", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (levelId) fetchVersions();
  }, [levelId]);

  // Restore version
  const restoreVersion = async (id) => {
    if (!window.confirm("Are you sure you want to restore this version?"))
      return;

    try {
      await apiClient.post(`/schedule-history/restore/${id}`);
      showAlert("Version restored successfully!", "success");
    } catch {
      showAlert("Restore failed", "danger");
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const diffMs = Date.now() - date;
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);

    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(dateString);
  };

  return (
    <>
      <Navbar />

      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: "#6f42c1" }}>
              📋 Schedule Versions
            </h2>
            <p className="text-muted mb-0">
              View and restore schedule versions for each level
            </p>
          </div>

          <Badge bg="light" text="dark" className="fs-6 px-3 py-2">
            {versions.length} Version{versions.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {alert.show && (
          <Alert variant={alert.type}>{alert.message}</Alert>
        )}

        <Card className="shadow-sm border-0 mb-4">
          <Card.Body className="p-4">
            <Row className="g-3 align-items-end">
              <Col md={4}>
                <Form.Label className="fw-semibold">Level</Form.Label>
                <Form.Select
                  value={levelId}
                  onChange={(e) => setLevelId(e.target.value)}
                >
                  <option value="">Select Level</option>
                  {levels.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={2}>
                <Button
                  variant="outline-secondary"
                  onClick={fetchVersions}
                  disabled={!levelId}
                  className="w-100"
                >
                  <FaDownload className="me-1" /> Refresh
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="shadow-sm border-0">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                  }}
                >
                  <tr>
                    <th className="ps-4">VERSION</th>
                    <th>CREATED BY</th>
                    <th>DATE</th>
                    <th className="text-center pe-4">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5">
                        <Spinner animation="border" />
                      </td>
                    </tr>
                  ) : versions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5">
                        <FaExclamationTriangle
                          size={32}
                          className="text-muted mb-3"
                        />
                        <p className="text-muted mb-1">
                          No schedule versions found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    versions.map((v) => (
                      <tr key={v.id}>
                        <td className="ps-4">
                          <strong className="text-primary">
                            Version #{v.version}
                          </strong>
                          <br />
                          <small className="text-muted">ID: {v.id}</small>
                        </td>

                        <td>
                          <div className="d-flex align-items-center">
                            <FaUser className="text-muted me-2" />
                            <span>System</span>
                          </div>
                        </td>

                        <td>
                          <div className="d-flex align-items-center">
                            <FaClock className="text-muted me-2" />
                            <div>
                              <div className="fw-medium">
                                {formatDate(v.created_at)}
                              </div>
                              <small className="text-muted">
                                {getTimeAgo(v.created_at)}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td className="text-center pe-4">
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => restoreVersion(v.id)}
                          >
                            <FaHistory /> Restore
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </div>
    </>
  );
}
