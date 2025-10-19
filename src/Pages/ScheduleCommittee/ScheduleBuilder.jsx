import React, { useEffect, useMemo, useState } from "react";
import api from "../../Services/apiClient";
import SectionFormModal from "./SectionFormModal";
import AIGeneratedModal from "./AIGeneratedModal";
import Navbar from "./ScheduleCommitteeNavbar";
import { useToast } from "../../Hooks/ToastContext"; // ✅ التوست

// 🧭 مهم: الأيام كلها حروف صغيرة لتطابق قاعدة البيانات
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday"];

const TIME_SLOTS = [
  ["08:00", "09:00"],
  ["09:00", "10:00"],
  ["10:00", "11:00"],
  ["11:00", "12:00"],
  ["12:00", "13:00"], // Lunch
  ["13:00", "14:00"], // Midterm continuation
  ["14:00", "15:00"],
  ["15:00", "16:00"],
];

const isLunch = (start, end) => start === "12:00" && end === "13:00";
const isMidtermWindow = (day, start, end) =>
  (day === "monday" || day === "wednesday") &&
  ((start === "12:00" && end === "13:00") ||
    (start === "13:00" && end === "14:00"));

// ✅ حساب عدد الخلايا حسب نوع السكشن
const getDurationSlots = (start, end, type) => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const duration = (eh * 60 + em - (sh * 60 + sm)) / 60;

  // 🧠 لو النوع لاب نحجز ساعتين فقط مهما كانت المدة
  if (type?.toLowerCase() === "lab") return 2;

  return Math.max(1, Math.floor(duration));
};

export default function ScheduleBuilder() {
  const toast = useToast();

  const [levelId, setLevelId] = useState(3);
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [slotCtx, setSlotCtx] = useState(null);
  const [editSection, setEditSection] = useState(null);
  const [aiModal, setAIModal] = useState(false);
  const [aiSchedule, setAISchedule] = useState(null);

  const [levels, setLevels] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [rooms, setRooms] = useState([]);

  // 🟢 تحميل القوائم
  useEffect(() => {
    (async () => {
      try {
        const [lv, cs, fc, rm] = await Promise.all([
          api.get("/dropdowns/levels"),
          api.get("/dropdowns/courses"),
          api.get("/dropdowns/faculty"),
          api.get("/dropdowns/rooms"),
        ]);
        setLevels(lv.data || []);
        setCourses(cs.data || []);
        setFaculty(fc.data || []);
        setRooms(rm.data || []);
      } catch {
        toast.error("Failed to load dropdown data");
      }
    })();
  }, []);

  // 🟢 تحميل المجموعات لكل مستوى
  useEffect(() => {
    if (!levelId) return;
    (async () => {
      try {
        const { data } = await api.get(`/dropdowns/groups?level_id=${levelId}`);
        setGroups(data || []);
      } catch {
        toast.warning("Could not load groups for this level");
      }
    })();
  }, [levelId]);

  // 🟢 تحميل السكاشن
  const loadSections = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get(`/sections`, {
        params: { level_id: levelId, group_id: groupId || undefined },
      });
      setSections(Array.isArray(data) ? data : []);
    } catch {
      setErr("Unable to load schedule data");
      toast.error("Unable to load schedule data");
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSections();
  }, [levelId, groupId]);

  // ✅ تجهيز الجدول حسب الأيام
  const gridMap = useMemo(() => {
    const m = {};
    for (const s of sections) {
      const dayKey = s.day?.trim().toLowerCase() || "";
      const startHHMM = (
        s.start_time_hhmm ||
        s.start_time?.slice(0, 5) ||
        ""
      ).trim();
      if (!m[dayKey]) m[dayKey] = {};
      m[dayKey][startHHMM] = s;
    }
    return m;
  }, [sections]);

  // ✅ إضافة سكشن
  const openAdd = (day, start, end) => {
    setEditSection(null);
    setSlotCtx({ day, start, end, levelId });
    setShowModal(true);
  };

  // ✅ تعديل سكشن
  const openEdit = (sec) => {
    setEditSection(sec);
    setSlotCtx({
      day: sec.day,
      start: sec.start_time,
      end: sec.end_time,
      levelId: sec.level_id,
    });
    setShowModal(true);
  };

  // ✅ حذف سكشن
  const remove = async (sec) => {
    if (!window.confirm("Delete this section?")) return;
    try {
      await api.delete(`/sections/${sec.id}`);
      await loadSections();
      toast.success(`Section ${sec.section_number} deleted successfully`);
    } catch {
      toast.error("Failed to delete section");
    }
  };

  // ✅ نشر الجدول
  const onPublish = async () => {
    if (!window.confirm("Publish schedule?")) return;
    try {
      await api.post(`/committee/schedule/publish/${levelId}`);
      toast.success("Schedule published successfully");
      await loadSections();
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to publish schedule");
    }
  };

  // ✅ التوليد التلقائي (AI)
  const onAutoGenerate = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/committee/schedule/suggest`, {
        params: { level_id: levelId, ai: true },
      });
      setAISchedule(data);
      setAIModal(true);
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to get AI suggestions");
    } finally {
      setLoading(false);
    }
  };

  const onExport = () => {
    toast.info("Export feature not implemented yet");
  };

  return (
    <>
      <Navbar />

      <div className="container py-3">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h4 className="mb-0" style={{ color: "#0f766e", fontWeight: 800 }}>
              Schedule Builder
            </h4>
            <small className="text-muted">
              Build weekly schedule for each level
            </small>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* Level Filter */}
            <select
              className="form-select form-select-sm"
              style={{ width: 160 }}
              value={levelId}
              onChange={(e) => {
                setLevelId(Number(e.target.value));
                setGroupId("");
              }}
            >
              {levels.map((lv) => (
                <option key={lv.id} value={lv.id}>
                  {lv.name || `Level ${lv.id}`}
                </option>
              ))}
            </select>

            {/* Group Filter */}
            <select
              className="form-select form-select-sm"
              style={{ width: 160 }}
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            >
              <option value="">All Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <button className="btn btn-primary btn-sm" onClick={onAutoGenerate}>
              Auto-Generate
            </button>
            <button className="btn btn-success btn-sm" onClick={onExport}>
              Export
            </button>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={onPublish}
            >
              Publish
            </button>
          </div>
        </div>

        {err && <div className="alert alert-danger">{err}</div>}
        {loading && <div className="alert alert-info">Loading schedule…</div>}

        {/* جدول الجدول الزمني */}
        <div className="table-responsive">
          <table
            className="table table-bordered align-middle shadow-sm"
            style={{ tableLayout: "fixed", width: "100%" }}
          >
            <thead className="table-light">
              <tr>
                <th style={{ width: 120 }}>Time</th>
                {DAYS.map((d) => (
                  <th key={d} className="text-center text-capitalize">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map(([start, end]) => (
                <tr key={start}>
                  <td className="fw-semibold">
                    {start}-{end}
                  </td>
                  {DAYS.map((day) => {
                    const dayKey = day.toLowerCase();
                    const sec = gridMap[dayKey]?.[start];

                    // 🧠 FIXED: Check if this slot is part of an extended section that started earlier
                    const inPreviousSlot = Object.values(
                      gridMap[dayKey] || {}
                    ).some((s) => {
                      const sStart =
                        s.start_time_hhmm || s.start_time?.slice(0, 5);
                      const sEnd = s.end_time_hhmm || s.end_time?.slice(0, 5);
                      if (!sStart || !sEnd) return false;

                      // Check if this section spans multiple slots and started before current slot
                      const durationSlots = getDurationSlots(
                        sStart,
                        sEnd,
                        s.type
                      );
                      if (durationSlots > 1 && sStart < start && sEnd > start) {
                        return true;
                      }
                      return false;
                    });

                    // ⛔ If this cell is part of an extended section, skip rendering it entirely
                    if (inPreviousSlot) {
                      return null;
                    }

                    const lunch = isLunch(start, end);
                    const midterm = isMidtermWindow(day, start, end);
                    const isBlocked = lunch || midterm;

                    const cellBg = lunch
                      ? "rgba(253, 230, 138, 0.5)"
                      : midterm
                      ? "rgba(252, 165, 165, 0.4)"
                      : "transparent";

                    const rowSpan = sec
                      ? getDurationSlots(
                          sec.start_time_hhmm || sec.start_time?.slice(0, 5),
                          sec.end_time_hhmm || sec.end_time?.slice(0, 5),
                          sec.type
                        )
                      : 1;

                    return (
                      <td
                        key={day + start}
                        rowSpan={rowSpan}
                        style={{
                          background: cellBg,
                          height: 72 * rowSpan,
                          cursor: isBlocked ? "not-allowed" : "pointer",
                          opacity: isBlocked ? 0.7 : 1,
                          verticalAlign: "middle",
                        }}
                        onClick={() =>
                          !isBlocked &&
                          (!sec ? openAdd(day, start, end) : openEdit(sec))
                        }
                        className="text-center align-middle"
                      >
                        {isBlocked ? (
                          <small className="text-muted fw-semibold">
                            {lunch ? "Lunch Break" : "Exam Slot"}
                          </small>
                        ) : !sec ? (
                          <span
                            style={{
                              fontSize: 26,
                              color: "#0f766e",
                              fontWeight: 600,
                            }}
                          >
                            +
                          </span>
                        ) : (
                          <div
                            className="d-flex flex-column align-items-center position-relative"
                            style={{ minHeight: 70 }}
                          >
                            <button
                              className="btn btn-link p-0 position-absolute top-0 end-0 me-1 mt-1"
                              style={{
                                fontSize: "16px",
                                color: "#dc3545",
                                lineHeight: 1,
                                transition: "color 0.2s ease",
                              }}
                              title="Delete section"
                              onMouseEnter={(e) =>
                                (e.target.style.color = "#ff4d4d")
                              }
                              onMouseLeave={(e) =>
                                (e.target.style.color = "#dc3545")
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                remove(sec);
                              }}
                            >
                              🗑️
                            </button>

                            <div className="badge text-bg-secondary">
                              {sec.course_code || sec.course_name}
                            </div>
                            <small className="text-muted">
                              Sec {sec.section_number || "?"} • {sec.type}
                            </small>
                            <small className="text-muted">
                              {sec.faculty_name}
                            </small>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ✅ النصائح أسفل الجدول */}
        <div
          className="alert mt-4"
          style={{ background: "#FEF3C7", borderColor: "#FDE68A" }}
        >
          <h6 className="mb-2">
            <strong>Schedule Building Tips</strong>
          </h6>
          <ul className="mb-0">
            <li>Click on empty slots to add courses</li>
            <li>Click on filled slots to view/edit or delete section</li>
            <li>Lunch break (12–1 PM) is blocked on all days</li>
            <li>
              Monday and Wednesday (12–2 PM) are reserved for midterm exams
            </li>
            <li>Use Auto-Generate to view AI suggested schedule (not saved)</li>
          </ul>
        </div>

        {/* النوافذ */}
        <SectionFormModal
          show={showModal}
          onClose={() => setShowModal(false)}
          onSaved={loadSections}
          slotContext={slotCtx}
          editSection={editSection}
          courses={courses}
          faculty={faculty}
          rooms={rooms}
          levelId={levelId}
        />

        {aiModal && (
          <AIGeneratedModal
            show={aiModal}
            onClose={() => setAIModal(false)}
            data={aiSchedule}
          />
        )}
      </div>
    </>
  );
}
