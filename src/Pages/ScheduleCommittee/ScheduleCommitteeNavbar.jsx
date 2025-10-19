import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import {
  FaClipboardList,
  FaChartBar,
  FaPlusCircle,
  FaCalendarAlt,
  FaUserGraduate,
  FaCogs,
  FaComments,
  FaHistory,
} from "react-icons/fa";
import { Link } from "react-router-dom";

export default function ScheduleCommitteeNavbar() {
  return (
    <Navbar
      bg="light"
      expand="lg"
      className="shadow-sm border-bottom"
      style={{ fontWeight: "500" }}
    >
      <Container fluid>
        <Navbar.Toggle aria-controls="committee-navbar" />
        <Navbar.Collapse id="committee-navbar">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/schedule-committee">
              <FaClipboardList className="me-2 text-secondary" />
              Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/schedule-committee/surveys">
              <FaClipboardList className="me-2 text-secondary" />
              Surveys
            </Nav.Link>
            <Nav.Link as={Link} to="/schedule-committee/survey-analytics">
              <FaChartBar className="me-2 text-success" />
              Survey Analytics
            </Nav.Link>
            <Nav.Link as={Link} to="/schedule-committee/external-slots">
              <FaPlusCircle className="me-2 text-purple" />
              External Slots
            </Nav.Link>
            <Nav.Link as={Link} to="/schedule-committee/schedule-builder">
              <FaCalendarAlt className="me-2 text-warning" />
              Schedule Builder
            </Nav.Link>
            <Nav.Link as={Link} to="/schedule-committee/exam-schedule">
              <FaCalendarAlt className="me-2 text-danger" />
              Exam Dates
            </Nav.Link>
            <Nav.Link as={Link} to="/schedule-committee/irregular-students">
              <FaUserGraduate className="me-2 text-dark" />
              Irregular Students
            </Nav.Link>
            <Nav.Link as={Link} to="/schedule-committee/rules">
              <FaCogs className="me-2 text-secondary" />
              Rules
            </Nav.Link>
            <Nav.Link as={Link} to="/schedule-committee/feedback">
              <FaComments className="me-2 text-pink" />
              Feedback
            </Nav.Link>
            <Nav.Link as={Link} to="/schedule-committee/history">
              <FaHistory className="me-2 text-muted" />
              History
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
