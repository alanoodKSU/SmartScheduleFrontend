// App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./Components/Layout";
import { ToastProvider } from "./Hooks/ToastContext";

// Pages (Auth)
import SignUp from "./Pages/auth/SignUp";
import Login from "./Pages/auth/Login";
import ForgotPassword from "./Pages/auth/ForgotPassword";
import ResetPassword from "./Pages/auth/ResetPassword";

// Pages (Schedule Committee)
import ScheduleCommitteeDashboard from "./Pages/ScheduleCommittee/ScheduleCommitteeDashboard";
import CommitteeSurveys from "./Pages/ScheduleCommittee/CommitteeSurveys";
import ScheduleBuilder from "./Pages/ScheduleCommittee/ScheduleBuilder";
import ExternalSlots from "./Pages/ScheduleCommittee/ExternalSlots";
import ExamSchedule from "./Pages/ScheduleCommittee/ExamSchedule";
import SurveyTable from "./Pages/ScheduleCommittee/SurveyTable";
import IrregularStudents from "./Pages/ScheduleCommittee/IrregularStudents";
import Rules from "./Pages/ScheduleCommittee/RulesPage";
import FeedbackPage from "./Pages/ScheduleCommittee/FeedbackPage";
import HistoryPage from "./Pages/ScheduleCommittee/ScheduleHistoryPage";

// Pages(Registrar)
import RegistrarIrregularStudents from "./Pages/Registrar/IrregularStudentsPage";
import RegistrarCourseEnrollmentPage from "./Pages/Registrar/RegistrarCourseEnrollmentPage";
import RegistrarSectionCapacityPage from "./Pages/Registrar/RegistrarSectionCapacityPage";

//pages (Student)
import StudentSchedulePage from "./Pages/Student/StudentSchedulePage";
import StudentElectivePreferencesPage from "./Pages/Student/StudentElectivePreferencesPage";
import StudentFeedbackPage from "./Pages/Student/StudentFeedbackPage";
import AllLevelsSchedulePage from "./Pages/Student/AllLevelsSchedulePage";

//pages (Faculty)
import FacultyFeedbackPage from "./Pages/Faculty/FacultyFeedback";
import FacultySchedulePage from "./Pages/Faculty/FacultySchedule";

//pages (Load Committee)
import LoadCommitteeFeedback from "./Pages/LoadCommittee/LoadCommitteeFeedback";
import LoadCommitteeDashboard from "./Pages/LoadCommittee/LoadCommitteeDashboard";

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* 🔐 Auth Routes */}
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* 🌐 Layout Wrapper */}
          <Route element={<Layout />}>
            <Route
              path="/schedule-committee"
              element={<ScheduleCommitteeDashboard />}
            />
            <Route
              path="/schedule-committee/surveys"
              element={<CommitteeSurveys />}
            />
            <Route
              path="/schedule-committee/schedule-builder"
              element={<ScheduleBuilder />}
            />
            <Route
              path="/schedule-committee/external-slots"
              element={<ExternalSlots />}
            />
            <Route
              path="/schedule-committee/exam-schedule"
              element={<ExamSchedule />}
            />
            <Route
              path="/schedule-committee/survey-analytics"
              element={<SurveyTable />}
            />
            <Route
              path="/schedule-committee/irregular-students"
              element={<IrregularStudents />}
            />
            <Route path="/schedule-committee/rules" element={<Rules />} />
            <Route
              path="/schedule-committee/feedback"
              element={<FeedbackPage />}
            />
            <Route
              path="/schedule-committee/history"
              element={<HistoryPage />}
            />

            {/* Registrar Routes */}
            <Route
              path="/registrar/irregular-students"
              element={<RegistrarIrregularStudents />}
            />
            <Route
              path="/registrar/course-enrollment"
              element={<RegistrarCourseEnrollmentPage />}
            />
            <Route
              path="/registrar/sections"
              element={<RegistrarSectionCapacityPage />}
            />

            {/* Student Routes */}
            <Route path="/student/schedule" element={<StudentSchedulePage />} />
            <Route
              path="/student/elective-preferences"
              element={<StudentElectivePreferencesPage />}
            />
            <Route path="/student/feedback" element={<StudentFeedbackPage />} />
            <Route
              path="/student/all-levels"
              element={<AllLevelsSchedulePage />}
            />
            {/* Faculty Routes */}
            <Route path="/faculty/feedback" element={<FacultyFeedbackPage />} />
            <Route path="/faculty/schedule" element={<FacultySchedulePage />} />

            {/* Load Committee Routes */}
            <Route
              path="/load-committee/feedback"
              element={<LoadCommitteeFeedback />}
            />
            <Route
              path="/load-committee/dashboard"
              element={<LoadCommitteeDashboard />}
            />
            {/* 🌐 Layout Wrapper */}
          </Route>

          {/* 🏠 Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
