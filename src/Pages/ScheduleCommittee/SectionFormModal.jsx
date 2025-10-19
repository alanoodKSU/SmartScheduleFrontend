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
}) {
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [forceLevelId, setForceLevelId] = useState("");

  const [form, setForm] = useState({
    course_id: "",
    section_number: 1,
    type: "tutorial",
    faculty_id: "",
    room_id: "",
    day: slotContext?.day || "",
    start_time: slotContext?.start || "",
    end_time: slotContext?.end || "",
    level_id: slotContext?.levelId || "",
    groups: [],
    students: [],
  });

  // ✅ تعبئة البيانات عند الفتح أو التعديل
  useEffect(() => {
    if (!show) return;

    if (editSection) {
      const levelId =
        editSection.level_id ||
        editSection.levelId ||
        slotContext?.levelId ||
        null;

      setForm({
        course_id: editSection.course_id || "",
        section_number: editSection.section_number || 1,
        type: editSection.type || "tutorial",
        faculty_id: editSection.faculty_id || "",
        room_id: editSection.room_id || "",
        day: editSection.day || "",
        start_time:
          editSection.start_time_hhmm ||
          editSection.start_time?.slice(0, 5) ||
          "",
        end_time:
          editSection.end_time_hhmm || editSection.end_time?.slice(0, 5) || "",
        level_id: levelId || "",
        groups:
          editSection.groups?.map((g) => g.id || g.group_id || g.value) || [],
        students:
          editSection.students?.map((s) => s.id || s.student_id || s.value) ||
          [],
      });

      setForceLevelId(levelId);
    } else if (slotContext) {
      setForm((prev) => ({
        ...prev,
        day: slotContext.day,
        start_time: slotContext.start,
        end_time: slotContext.end,
        level_id: slotContext.levelId,
        section_number: 1,
      }));
      setForceLevelId(slotContext.levelId);
    }
  }, [show, editSection, slotContext]);

  // ✅ تحميل القروبات والطلاب للمستوى
  useEffect(() => {
    if (!show) return;
    const fetchLists = async () => {
      try {
        const levelId = form.level_id || forceLevelId;
        if (!levelId) {
          setGroups([]);
          setStudents([]);
          return;
        }

        const [gr, st] = await Promise.all([
          api.get(`/dropdowns/groups?level_id=${levelId}`),
          api.get(`/dropdowns/students?level_id=${levelId}`),
        ]);

        setGroups(gr.data || []);
        setStudents(st.data || []);
      } catch {
        setGroups([]);
        setStudents([]);
      }
    };
    fetchLists();
  }, [show, form.level_id, forceLevelId]);

  // ✅ تحميل الغرف المتاحة حسب اليوم والوقت
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
            day: form.day.toUpperCase(), // ✅ تحويل اليوم لأحرف كبيرة
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

  // ✅ عند الحفظ
  // ✅ عند الحفظ
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
      // ✅ تحويل اليوم للصيغة الصحيحة: الحرف الأول كبير والباقي صغير
      const normalizedDay = form.day
        ? form.day.charAt(0).toUpperCase() + form.day.slice(1).toLowerCase()
        : "";

      const payload = {
        ...form,
        day: normalizedDay, // 🔥 الآن سترسل "Monday" بدل "MONDAY"
        section_number: form.section_number ? Number(form.section_number) : 1,
      };

      console.log("Sending payload:", payload); // للت debugging

      if (editSection) {
        await api.put(`/sections/${editSection.id}`, payload);
      } else {
        await api.post(`/sections`, payload); // ✅ تأكد أنه POST للإضافة
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
      console.error("API Error:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // ✅ فحص الوقت المحظور
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

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  if (!show) return null;

  // ✅ إعداد الخيارات
  const customFilterOption = (option, inputValue) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase());

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
  const groupOptions = groups.map((g) => ({
    value: g.id,
    label: g.name,
  }));
  const studentOptions = students.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const getValueWithFallback = (options, id, name) =>
    options.find((o) => o.value === id) ||
    (id && name ? { value: id, label: name } : null);

  const getSelectedGroups = () =>
    groupOptions.filter((option) => form.groups.includes(option.value));

  // ✅ واجهة المستخدم
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
                    value={getValueWithFallback(
                      courseOptions,
                      form.course_id,
                      editSection?.course_name
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

                {/* Section Number */}
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
                    value={getValueWithFallback(
                      facultyOptions,
                      form.faculty_id,
                      editSection?.faculty_name
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
                    value={getValueWithFallback(
                      roomOptions,
                      form.room_id,
                      editSection?.room_name
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
                  {availableRooms.length === 0 && (
                    <small className="text-danger">
                      No available rooms for this time.
                    </small>
                  )}
                </div>

                {/* Day & Level */}
                <div className="col-md-2">
                  <label className="form-label">Day</label>
                  <input className="form-control" value={form.day} disabled />
                </div>
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
                    value={studentOptions.filter((o) =>
                      form.students.includes(o.value)
                    )}
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
