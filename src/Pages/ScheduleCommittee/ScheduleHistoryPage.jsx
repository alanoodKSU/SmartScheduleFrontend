import React, { useEffect, useState, useMemo } from "react";
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
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap";
import {
  FaTrashAlt,
  FaHistory,
  FaSync,
  FaEye,
  FaDownload,
  FaFilter,
  FaExclamationTriangle,
  FaInfoCircle,
  FaClock,
  FaUser,
} from "react-icons/fa";
import apiClient from "../../Services/apiClient";
import Navbar from "./ScheduleCommitteeNavbar"; // 🟣 Import your Navbar

export default function ScheduleHistoryPage() {
  const [allVersions, setAllVersions] = useState([]);
  const [versions, setVersions] = useState([]);
  const [levels, setLevels] = useState([]);
  const [level, setLevel] = useState("all");

  const [loading, setLoading] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [compareData, setCompareData] = useState(null);
  const [compareIds, setCompareIds] = useState({ a: "", b: "" });
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  const showAlert = (message, type = "info") => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
  };

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/history");
      const data = res.data || [];

      setAllVersions(data);

      const uniqueLevels = [
        ...new Set(
          data
            .map((v) => v.level_name)
            .filter((name) => name && name.trim() !== "")
        ),
      ].map((name) => ({ id: name, name }));

      setLevels(uniqueLevels);
    } catch (err) {
      console.error("Failed to fetch versions:", err);
      showAlert("Failed to load schedule versions", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  useEffect(() => {
    const filtered =
      level === "all"
        ? allVersions
        : allVersions.filter((v) => v.level_name === level);
    setVersions(filtered);
  }, [level, allVersions]);

  const viewVersionDetails = async (versionId) => {
    try {
      const res = await apiClient.get(`/history/${versionId}`);
      setSelectedVersion(res.data);
      setShowDetails(true);
    } catch (err) {
      console.error("Failed to load version details:", err);
      showAlert("Failed to load version details", "danger");
    }
  };

  const compareVersions = async () => {
    if (!compareIds.a || !compareIds.b) {
      showAlert("Please select both versions to compare!", "warning");
      return;
    }
    if (compareIds.a === compareIds.b) {
      showAlert("Please select two different versions to compare!", "warning");
      return;
    }
    try {
      const res = await apiClient.get("/history/compare/versions", {
        params: { a: compareIds.a, b: compareIds.b },
      });
      setCompareData(res.data);
      setShowCompare(true);
    } catch (err) {
      console.error("Failed to compare versions:", err);
      showAlert("Failed to compare versions", "danger");
    }
  };

  const restoreVersion = async (id, levelName) => {
    if (
      !window.confirm(
        `Are you sure you want to restore schedule version #${id} for ${levelName}? This will replace the current schedule.`
      )
    )
      return;
    try {
      await apiClient.post(`/history/restore/${id}`);
      showAlert(`✅ Schedule version #${id} restored successfully!`, "success");
      fetchVersions();
    } catch (err) {
      console.error("Failed to restore version:", err);
      showAlert("Failed to restore schedule version", "danger");
    }
  };

  const deleteVersion = async (id, levelName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete schedule version #${id} for ${levelName}? This action cannot be undone.`
      )
    )
      return;
    try {
      await apiClient.delete(`/history/${id}`);
      showAlert(`🗑️ Schedule version #${id} deleted successfully!`, "success");
      fetchVersions();
    } catch (err) {
      console.error("Failed to delete version:", err);
      showAlert("Failed to delete schedule version", "danger");
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
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const generateVersionHash = (id) => id.toString().padStart(8, "0").slice(-8);

  const compareList = useMemo(() => versions, [versions]);

  return (
    <>
      {/* 🟣 Global Navbar */}
      <Navbar />

      {/* 🟢 Page Content */}
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: "#6f42c1" }}>
              📋 Schedule History
            </h2>
            <p className="text-muted mb-0">
              Manage and compare different versions of your schedules
            </p>
          </div>
          <Badge bg="light" text="dark" className="fs-6 px-3 py-2">
            {versions.length} Version{versions.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {alert.show && (
          <Alert
            variant={alert.type}
            dismissible
            onClose={() => setAlert({ ...alert, show: false })}
          >
            {alert.message}
          </Alert>
        )}

        {/* Controls */}
        <Card className="shadow-sm border-0 mb-4">
          <Card.Body className="p-4">
            <Row className="g-3 align-items-end">
              <Col md={4}>
                <Form.Label className="fw-semibold">
                  <FaFilter className="me-2" />
                  Filter by Level
                </Form.Label>
                <Form.Select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="border-0 shadow-sm"
                >
                  <option value="all">All Levels</option>
                  {levels.map((lvl) => (
                    <option key={lvl.id} value={lvl.name}>
                      {lvl.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={6}>
                <Form.Label className="fw-semibold">
                  <FaSync className="me-2" />
                  Compare Versions
                </Form.Label>
                <div className="d-flex gap-2 align-items-center">
                  <Form.Select
                    value={compareIds.a}
                    onChange={(e) =>
                      setCompareIds({ ...compareIds, a: e.target.value })
                    }
                    className="border-0 shadow-sm"
                  >
                    <option value="">Select Version A</option>
                    {compareList.map((v) => (
                      <option key={v.id} value={v.id}>
                        #{v.id} – {v.level_name} ({getTimeAgo(v.created_at)})
                      </option>
                    ))}
                  </Form.Select>
                  <span className="text-muted">vs</span>
                  <Form.Select
                    value={compareIds.b}
                    onChange={(e) =>
                      setCompareIds({ ...compareIds, b: e.target.value })
                    }
                    className="border-0 shadow-sm"
                  >
                    <option value="">Select Version B</option>
                    {compareList.map((v) => (
                      <option key={v.id} value={v.id}>
                        #{v.id} – {v.level_name} ({getTimeAgo(v.created_at)})
                      </option>
                    ))}
                  </Form.Select>
                  <Button
                    variant="primary"
                    onClick={compareVersions}
                    disabled={!compareIds.a || !compareIds.b}
                  >
                    <FaSync className="me-1" /> Compare
                  </Button>
                </div>
              </Col>

              <Col md={2}>
                <Button
                  variant="outline-secondary"
                  onClick={fetchVersions}
                  className="w-100"
                >
                  <FaDownload className="me-1" /> Refresh
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Versions Table */}
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
                    <th>LEVEL</th>
                    <th>CREATED BY</th>
                    <th>DATE</th>
                    <th className="text-center pe-4">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
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
                      <tr key={v.id} className="border-bottom">
                        <td className="ps-4">
                          <strong className="text-primary">#{v.id}</strong>
                          <br />
                          <small className="text-muted">
                            {generateVersionHash(v.id)}
                          </small>
                        </td>
                        <td>
                          <Badge bg="light" text="dark" className="px-3 py-2">
                            {v.level_name}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaUser className="text-muted me-2" />
                            <div>
                              <div className="fw-medium">
                                {v.created_by_email || "System"}
                              </div>
                              <small className="text-muted">Creator</small>
                            </div>
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
                          <div className="d-flex justify-content-center gap-2">
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>View Details</Tooltip>}
                            >
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => viewVersionDetails(v.id)}
                              >
                                <FaEye />
                              </Button>
                            </OverlayTrigger>

                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Restore Version</Tooltip>}
                            >
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() =>
                                  restoreVersion(v.id, v.level_name)
                                }
                              >
                                <FaHistory />
                              </Button>
                            </OverlayTrigger>

                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Delete Version</Tooltip>}
                            >
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() =>
                                  deleteVersion(v.id, v.level_name)
                                }
                              >
                                <FaTrashAlt />
                              </Button>
                            </OverlayTrigger>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* 🔍 Version Details Modal */}
        <Modal
          show={showDetails}
          onHide={() => setShowDetails(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton className="border-0">
            <Modal.Title>
              <FaInfoCircle className="me-2 text-primary" />
              Version Details #{selectedVersion?.id}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedVersion && (
              <div>
                <Row className="mb-4">
                  <Col md={6}>
                    <Card className="border-0 bg-light">
                      <Card.Body>
                        <h6 className="text-muted mb-2">Level</h6>
                        <p className="fw-bold mb-0">
                          {selectedVersion.level_name}
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="border-0 bg-light">
                      <Card.Body>
                        <h6 className="text-muted mb-2">Created</h6>
                        <p className="fw-bold mb-0">
                          {formatDate(selectedVersion.created_at)}
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <h6 className="text-muted mb-3">Sections in this Version</h6>
                {selectedVersion.sections &&
                selectedVersion.sections.length > 0 ? (
                  <div className="table-responsive">
                    <Table size="sm" bordered>
                      <thead>
                        <tr>
                          <th>Section</th>
                          <th>Type</th>
                          <th>Day</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedVersion.sections
                          .slice(0, 10)
                          .map((section, i) => (
                            <tr key={i}>
                              <td>{section.section_number}</td>
                              <td>
                                <Badge
                                  bg={
                                    section.type === "lab" ? "warning" : "info"
                                  }
                                >
                                  {section.type}
                                </Badge>
                              </td>
                              <td>{section.day}</td>
                              <td>
                                {section.start_time} - {section.end_time}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </Table>
                    {selectedVersion.sections.length > 10 && (
                      <p className="text-muted text-center mt-2">
                        ... and {selectedVersion.sections.length - 10} more
                        sections
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted text-center py-3">
                    No sections found in this version
                  </p>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={() => setShowDetails(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* 🔄 Compare Modal */}
        <Modal
          show={showCompare}
          onHide={() => setShowCompare(false)}
          size="xl"
          centered
        >
          <Modal.Header closeButton className="border-0">
            <Modal.Title>
              <FaSync className="me-2 text-primary" />
              Compare Versions
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {compareData ? (
              <div>
                <Row className="mb-4">
                  <Col md={4}>
                    <Card className="border-0 bg-success bg-opacity-10">
                      <Card.Body className="text-center">
                        <h3 className="text-success mb-1">
                          {compareData.summary?.added ?? 0}
                        </h3>
                        <p className="text-muted mb-0">Added Sections</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="border-0 bg-danger bg-opacity-10">
                      <Card.Body className="text-center">
                        <h3 className="text-danger mb-1">
                          {compareData.summary?.removed ?? 0}
                        </h3>
                        <p className="text-muted mb-0">Removed Sections</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="border-0 bg-warning bg-opacity-10">
                      <Card.Body className="text-center">
                        <h3 className="text-warning mb-1">
                          {compareData.summary?.updated ?? 0}
                        </h3>
                        <p className="text-muted mb-0">Updated Sections</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <div className="bg-light p-3 rounded">
                  <pre
                    className="mb-0 small"
                    style={{ maxHeight: 400, overflow: "auto" }}
                  >
                    {JSON.stringify(compareData, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-muted text-center py-4">
                No comparison data available
              </p>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={() => setShowCompare(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
}
