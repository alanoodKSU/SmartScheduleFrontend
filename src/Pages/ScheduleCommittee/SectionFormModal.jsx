import React, { useEffect, useState } from "react";
import Select from "react-select";
import api from "../../Services/apiClient";

export default function SectionFormModal({
  show,
  onClose,
  onSaved,
  slotContext,
  editSection,
  courses = [],
  faculty = [],
  rooms = [],
  groups = [],
  students = [],
}) {
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [forceLevelId, setForceLevelId] = useState("");

  const getInitialFormState = () => ({
    course_id: "",
    section_number: 1,
    type: "tutorial",
    faculty_id: "",
    room_id: "",
    day: "",
    start_time: "",
    end_time: "",
    level_id: "",
    groups: [],
    students: [],
  });

  const [form, setForm] = useState(getInitialFormState());

  /* --------------------------------------------------------
     ✅ FIXED normalizeSection()
     Backend returns: groups=[1,2] students=[5,10]
     Now handled correctly.
  -------------------------------------------------------- */
  const normalizeSection = (section, slotCtx) => {
    const levelId =
      section.level_id || section.levelId || slotCtx?.levelId || "";

    const startTime =
      section.start_time_hhmm ||
      section.start_time?.slice(0, 5) ||
      slotCtx?.start?.slice(0, 5) ||
      "";

    const endTime =
      section.end_time_hhmm ||
      section.end_time?.slice(0, 5) ||
      slotCtx?.end?.slice(0, 5) ||
      "";

    const dayRaw = slotCtx?.day || section.day || "";

    const courseId = section.course_id ? Number(section.course_id) : "";
    const facultyId = section.faculty_id ? Number(section.faculty_id) : "";
    const roomId = section.room_id ? Number(section.room_id) : "";

    // 🔥 FIXED HERE
    const groupIds = Array.isArray(section.groups)
      ? section.groups.map((g) => Number(g)).filter(Boolean)
      : [];

    const studentIds = Array.isArray(section.students)
      ? section.students.map((s) => Number(s)).filter(Boolean)
      : [];

    return {
      course_id: courseId,
      section_number: section.section_number || 1,
      type: section.type?.toLowerCase() || "tutorial",
      faculty_id: facultyId,
      room_id: roomId,
      day: dayRaw.toLowerCase(),
      start_time: startTime,
      end_time: endTime,
      level_id: levelId,
      groups: groupIds,
      students: studentIds,
    };
  };

  /* --------------------------------------------------------
     Reset form on open (Edit / Add Mode)
  -------------------------------------------------------- */
  useEffect(() => {
    if (!show) {
      setForm(getInitialFormState());
      setForceLevelId("");
      return;
    }

    if (editSection) {
      const normalized = normalizeSection(editSection, slotContext);
      setForm(normalized);
      setForceLevelId(normalized.level_id);
    } else {
      const newForm = getInitialFormState();
      if (slotContext) {
        newForm.day = slotContext.day?.toLowerCase() || "";
        newForm.start_time = slotContext.start || "";
        newForm.end_time = slotContext.end || "";
        newForm.level_id = slotContext.levelId || "";
      }
      setForm(newForm);
      setForceLevelId(slotContext?.levelId || "");
    }
  }, [show, editSection, slotContext]);

  /* --------------------------------------------------------
     Load available rooms
  -------------------------------------------------------- */
  useEffect(() => {
    if (!show) return;

    const fetchAvailableRooms = async () => {
      try {
        if (!form.day || !form.start_time || !form.end_time) {
          const { data } = await api.get("/dropdowns/rooms");
          setAvailableRooms(data || []);
          return;
        }

        const { data } = await api.get("/sections/available-rooms", {
          params: {
            day: form.day.toUpperCase(),
            start_time: form.start_time,
            end_time: form.end_time,
          },
        });

        setAvailableRooms(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("❌ Error loading rooms:", error);
        setAvailableRooms([]);
      }
    };

    fetchAvailableRooms();
  }, [show, form.day, form.start_time, form.end_time]);

  /* --------------------------------------------------------
     Helpers
  -------------------------------------------------------- */
  const customFilterOption = (option, inputValue) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase());

  const groupOptions = groups.map((g) => ({
    value: g.id,
    label: g.name,
  }));

  const studentOptions = students.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const getSelectedGroups = () =>
    groupOptions.filter((o) => form.groups.includes(Number(o.value)));

  const getSelectedStudents = () =>
    studentOptions.filter((o) => form.students.includes(Number(o.value)));

  /* --------------------------------------------------------
     Submit
  -------------------------------------------------------- */
  const isInvalidTime = () => {
    const { start_time, end_time, day } = form;
    const upperDay = day?.toUpperCase();
    if (start_time === "12:00" && end_time === "13:00")
      return "Lunch break slot!";
    if (
      (upperDay === "MONDAY" || upperDay === "WEDNESDAY") &&
      ((start_time === "12:00" && end_time === "13:00") ||
        (start_time === "13:00" && end_time === "14:00"))
    )
      return "Exam slot (Monday/Wednesday 12–2)";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!form.level_id) {
      setErr("❌ Level ID is required.");
      return;
    }

    const invalidMsg = isInvalidTime();
    if (invalidMsg) {
      setErr(invalidMsg);
      return;
    }

    setLoading(true);

    try {
      const normalizedDay =
        form.day.charAt(0).toUpperCase() + form.day.slice(1).toLowerCase();

      const payload = {
        ...form,
        day: normalizedDay,
        section_number: Number(form.section_number),
        course_id: form.course_id ? Number(form.course_id) : null,
        faculty_id: form.faculty_id ? Number(form.faculty_id) : null,
        room_id: form.room_id ? Number(form.room_id) : null,
        groups: form.groups.map((id) => Number(id)),
        students: form.students.map((id) => Number(id)),
      };

      if (editSection) {
        await api.put(`/sections/${editSection.id}`, payload);
      } else {
        await api.post(`/sections`, payload);
      }

      onSaved?.();
      onClose();
    } catch (error) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to save section";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  if (!show) return null;

  const courseOptions = courses.map((c) => ({
    value: c.id,
    label: `${c.code || ""} ${c.name || ""}`.trim(),
  }));

  const facultyOptions = faculty.map((f) => ({
    value: f.id,
    label: f.name,
  }));

  const roomOptions = availableRooms.map((r) => ({
    value: r.id,
    label: `${r.name}`,
  }));

  /* --------------------------------------------------------
     Render
  -------------------------------------------------------- */
  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,.35)" }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {editSection ? "Edit Section" : "Add Course to Schedule"}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <form onSubmit={onSubmit}>
            <div className="modal-body">
              {err && <div className="alert alert-danger">{err}</div>}

              <div className="row g-3">
                {/* Course */}
                <div className="col-md-6">
                  <label className="form-label">Course</label>
                  <Select
                    options={courseOptions}
                    value={courseOptions.find(
                      (o) => o.value === Number(form.course_id)
                    )}
                    onChange={(opt) =>
                      setForm((p) => ({ ...p, course_id: opt?.value || "" }))
                    }
                    placeholder="Select course…"
                    isSearchable
                    filterOption={customFilterOption}
                    required
                  />
                </div>

                {/* Section # */}
                <div className="col-md-3">
                  <label className="form-label">Section #</label>
                  <input
                    type="number"
                    className="form-control"
                    name="section_number"
                    value={form.section_number}
                    onChange={onChange}
                    min="1"
                    required
                  />
                </div>

                {/* Type */}
                <div className="col-md-3">
                  <label className="form-label">Type</label>
                  <select
                    className="form-select"
                    name="type"
                    value={form.type}
                    onChange={onChange}
                    required
                  >
                    <option value="tutorial">Tutorial</option>
                    <option value="lab">Lab</option>
                    <option value="lecture">Lecture</option>
                  </select>
                </div>

                {/* Instructor */}
                <div className="col-md-4">
                  <label className="form-label">Instructor</label>
                  <Select
                    options={facultyOptions}
                    value={facultyOptions.find(
                      (o) => o.value === Number(form.faculty_id)
                    )}
                    onChange={(opt) =>
                      setForm((p) => ({ ...p, faculty_id: opt?.value || "" }))
                    }
                    placeholder="Select instructor…"
                    isSearchable
                    filterOption={customFilterOption}
                  />
                </div>

                {/* Room */}
                <div className="col-md-4">
                  <label className="form-label">Room</label>
                  <Select
                    options={roomOptions}
                    value={roomOptions.find(
                      (o) => o.value === Number(form.room_id)
                    )}
                    onChange={(opt) =>
                      setForm((p) => ({ ...p, room_id: opt?.value || "" }))
                    }
                    placeholder={
                      availableRooms.length > 0
                        ? "Select room…"
                        : "No rooms available"
                    }
                    isSearchable
                    filterOption={customFilterOption}
                  />
                </div>

                {/* Day */}
                <div className="col-md-2">
                  <label className="form-label">Day</label>
                  <input className="form-control" value={form.day} disabled />
                </div>

                {/* Level */}
                <div className="col-md-2">
                  <label className="form-label">Level</label>
                  <input
                    className="form-control"
                    value={
                      form.level_id ? `Level ${form.level_id}` : "Level missing"
                    }
                    disabled
                  />
                </div>

                {/* Groups */}
                <div className="col-md-6">
                  <label className="form-label">Assign to Groups</label>
                  <Select
                    isMulti
                    options={groupOptions}
                    value={getSelectedGroups()}
                    onChange={(selected) =>
                      setForm((p) => ({
                        ...p,
                        groups: selected.map((s) => s.value),
                      }))
                    }
                    placeholder="Select groups…"
                    isSearchable
                    filterOption={customFilterOption}
                  />
                </div>

                {/* Students */}
                <div className="col-md-6">
                  <label className="form-label">Add Students (optional)</label>
                  <Select
                    isMulti
                    options={studentOptions}
                    value={getSelectedStudents()}
                    onChange={(selected) =>
                      setForm((p) => ({
                        ...p,
                        students: selected.map((s) => s.value),
                      }))
                    }
                    placeholder="Select students…"
                    isSearchable
                    filterOption={customFilterOption}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !form.level_id}
              >
                {loading
                  ? "Saving…"
                  : editSection
                  ? "Save Changes"
                  : "Add to Schedule"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
