import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRightLeft, Pencil, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { call, useAdminData } from "@/admin/api";
import { Button, Card, Chip, Empty, ErrorBox, Field, inputClass, Loading, Modal, PageHeader, when } from "@/admin/ui";

function EditStudent({ student, onClose, onSaved }) {
  const fields = ["name", "first_name", "middle_name", "last_name", "student_id", "section", "guardian_name", "guardian_phone", "guardian_email", "notes"];
  const [form, setForm] = useState(() => ({
    ...Object.fromEntries(fields.map((f) => [f, student[f] || ""])),
    special_needs: Boolean(student.special_needs),
    enrollment_status: student.enrollment_status || "active",
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await call("students.update", { id: student.id, student: form });
      toast.success("Student record corrected");
      onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={`Correct record · ${student.name}`} onClose={onClose} wide>
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        <Field label="Complete name (shown on the kiosk)" className="sm:col-span-2"><input className={inputClass} required value={form.name} onChange={set("name")} /></Field>
        <Field label="First name"><input className={inputClass} value={form.first_name} onChange={set("first_name")} /></Field>
        <Field label="Middle name"><input className={inputClass} value={form.middle_name} onChange={set("middle_name")} /></Field>
        <Field label="Last name"><input className={inputClass} value={form.last_name} onChange={set("last_name")} /></Field>
        <Field label="School student ID"><input className={inputClass} value={form.student_id} onChange={set("student_id")} /></Field>
        <Field label="Section"><input className={inputClass} required value={form.section} onChange={set("section")} /></Field>
        <Field label="Enrollment status">
          <select className={inputClass} value={form.enrollment_status} onChange={set("enrollment_status")}>
            <option value="active">Active</option><option value="inactive">Inactive</option><option value="transferred">Transferred</option>
          </select>
        </Field>
        <Field label="Guardian name"><input className={inputClass} value={form.guardian_name} onChange={set("guardian_name")} /></Field>
        <Field label="Guardian phone"><input className={inputClass} value={form.guardian_phone} onChange={set("guardian_phone")} /></Field>
        <Field label="Guardian email"><input className={inputClass} type="email" value={form.guardian_email} onChange={set("guardian_email")} /></Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-bold text-[#173a44]">
          <input type="checkbox" checked={form.special_needs} onChange={(e) => setForm((f) => ({ ...f, special_needs: e.target.checked }))} />
          SNED student (adapted learning interface)
        </label>
        <Field label="Notes" className="sm:col-span-2"><textarea className={inputClass} rows={3} value={form.notes} onChange={set("notes")} /></Field>
        <div className="sm:col-span-2"><ErrorBox message={error} /></div>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" busy={busy}>Save correction</Button>
        </div>
      </form>
    </Modal>
  );
}

function TransferStudent({ student, onClose, onSaved }) {
  const { data } = useAdminData("teachers.list");
  const [teacher, setTeacher] = useState("");
  const [section, setSection] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const options = (data?.teachers || []).filter((t) => t.status !== "deactivated" && t.email !== student.advisory_teacher_email);

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await call("students.transfer", { id: student.id, teacher_email: teacher, section });
      toast.success(`${student.name} transferred`);
      onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={`Transfer ${student.name}`} onClose={onClose}>
      <p className="mb-3 text-sm font-semibold text-[#4b6a72]">
        Current advisory teacher: <b>{student.advisory_teacher_name || student.advisory_teacher_email || "none"}</b>. The same record moves; progress and assessments stay with it.
      </p>
      <Field label="New advisory teacher">
        <select className={inputClass} value={teacher} onChange={(e) => setTeacher(e.target.value)}>
          <option value="">Choose a teacher…</option>
          {options.map((t) => <option key={t.email} value={t.email}>{t.full_name || t.email} ({(t.advisory_sections || []).join(", ") || "no section"})</option>)}
        </select>
      </Field>
      <Field label="New section (optional)" className="mt-3"><input className={inputClass} value={section} placeholder={student.section} onChange={(e) => setSection(e.target.value)} /></Field>
      <ErrorBox message={error} />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button busy={busy} disabled={!teacher} onClick={save}><ArrowRightLeft className="h-4 w-4" /> Transfer</Button>
      </div>
    </Modal>
  );
}

function StudentProfile({ id, onClose, onChanged }) {
  const { data, error, loading, reload } = useAdminData("students.get", { id });
  const [mode, setMode] = useState("");
  const [photo, setPhoto] = useState("");
  const s = data?.student;

  useEffect(() => {
    if (!s?.has_photo) return;
    call("students.photo", { id }).then((r) => setPhoto(r.url)).catch(() => {});
  }, [id, s?.has_photo]);

  const done = (data?.progress || []).filter((p) => p.status === "completed");
  return (
    <Modal title={s?.name || "Student"} onClose={onClose} wide>
      <ErrorBox message={error} onRetry={reload} />
      {loading && !data ? <Loading /> : s ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start gap-4">
            {photo ? <img src={photo} alt="" className="h-20 w-20 rounded-2xl object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#e3f5f2] font-display text-3xl font-extrabold text-[#0d6f74]">{s.name?.[0]}</div>}
            <div className="min-w-0 flex-1 space-y-1 text-sm font-semibold text-[#4b6a72]">
              <div className="flex flex-wrap gap-1.5">
                <Chip tone={(s.enrollment_status || "active") === "active" ? "green" : "gray"}>{s.enrollment_status || "active"}</Chip>
                {s.special_needs && <Chip tone="violet">SNED</Chip>}
                <Chip>{s.section}</Chip>
              </div>
              <p>Advisory teacher: <b className="text-[#173a44]">{s.advisory_teacher_name || s.advisory_teacher_email || "Not assigned"}</b></p>
              <p>Student ID: {s.student_id || "—"} · Guardian: {s.guardian_name || "—"} {s.guardian_phone ? `· ${s.guardian_phone}` : ""}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setMode("edit")}><Pencil className="h-4 w-4" /> Correct</Button>
              <Button variant="secondary" onClick={() => setMode("transfer")}><ArrowRightLeft className="h-4 w-4" /> Transfer</Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-[#f6faf9] p-3"><p className="text-xs font-extrabold uppercase text-[#6c8a90]">Lessons completed</p><p className="font-display text-2xl font-extrabold text-[#173a44]">{done.length}</p></div>
            <div className="rounded-xl bg-[#f6faf9] p-3"><p className="text-xs font-extrabold uppercase text-[#6c8a90]">Stars</p><p className="font-display text-2xl font-extrabold text-[#173a44]">{done.reduce((a, p) => a + (p.stars || 0), 0)}</p></div>
            <div className="rounded-xl bg-[#f6faf9] p-3"><p className="text-xs font-extrabold uppercase text-[#6c8a90]">Speaking tries</p><p className="font-display text-2xl font-extrabold text-[#173a44]">{data.assessments.length}</p></div>
          </div>

          <Card title="Learning progress">
            {data.progress.length === 0 ? <Empty>No lessons started yet.</Empty> : (
              <div className="flex flex-wrap gap-2">
                {data.progress.map((p) => (
                  <span key={p.id} className="rounded-xl bg-[#f6faf9] px-3 py-2 text-xs font-bold text-[#173a44]">
                    {p.module === "vowels" ? "Vowel" : "CVC"} {p.lesson_key} · {p.status === "completed" ? `★ ${p.stars || 0}` : "in progress"} · best {p.best_accuracy || 0}%
                  </span>
                ))}
              </div>
            )}
          </Card>
          <Card title="Assessment results">
            {data.assessments.length === 0 ? <Empty>No pronunciation assessments yet.</Empty> : (
              <div className="max-h-72 overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-white text-xs uppercase text-[#6c8a90]"><tr><th className="py-2">Date</th><th>Lesson</th><th>Trial</th><th>Accuracy</th><th>Result</th></tr></thead>
                  <tbody className="divide-y divide-[#eef3f3]">
                    {data.assessments.map((a) => (
                      <tr key={a.id}>
                        <td className="py-1.5 font-semibold text-[#4b6a72]">{when(a.created_date)}</td>
                        <td className="font-bold text-[#173a44]">{a.module === "vowels" ? "Vowel" : "CVC"} {a.lesson_key}</td>
                        <td>{a.trial || "—"}</td>
                        <td className="font-bold">{Math.round(a.accuracy || 0)}%</td>
                        <td><Chip tone={a.passed ? "green" : "yellow"}>{a.passed ? "Passed" : "Try again"}</Chip></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : null}
      {mode === "edit" && s && <EditStudent student={s} onClose={() => setMode("")} onSaved={() => { setMode(""); reload(); onChanged(); }} />}
      {mode === "transfer" && s && <TransferStudent student={s} onClose={() => setMode("")} onSaved={() => { setMode(""); reload(); onChanged(); }} />}
    </Modal>
  );
}

export default function Students() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("");
  const [sned, setSned] = useState(false);
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(search), 300);
    return () => window.clearTimeout(id);
  }, [search]);
  const { data, error, loading, reload } = useAdminData("students.list", { search: debounced, section, sned: sned || undefined });
  const openId = params.get("open");

  return (
    <>
      <PageHeader title="Student Management" icon={Users} subtitle="All registered students, their progress and advisory teachers." />
      <Card>
        <div className="mb-3 flex flex-wrap gap-2">
          <label className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8aa6ab]" />
            <input className={`${inputClass} pl-9`} placeholder="Search by student name or ID" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <select className={`${inputClass} w-auto`} value={section} onChange={(e) => setSection(e.target.value)} aria-label="Filter by section">
            <option value="">All sections</option>
            {(data?.sections || []).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <label className="flex items-center gap-2 rounded-xl px-3 text-sm font-bold text-[#173a44] ring-1 ring-[#cfe0dd]">
            <input type="checkbox" checked={sned} onChange={(e) => setSned(e.target.checked)} /> SNED only
          </label>
        </div>
        <ErrorBox message={error} onRetry={reload} />
        {loading && !data ? <Loading /> : (data?.students || []).length === 0 ? <Empty>No students match.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase text-[#6c8a90]"><tr><th className="py-2">Student</th><th>Section</th><th>Advisory teacher</th><th>Status</th><th>SNED</th></tr></thead>
              <tbody className="divide-y divide-[#eef3f3]">
                {data.students.map((s) => (
                  <tr key={s.id} className="cursor-pointer hover:bg-[#f6faf9]" onClick={() => setParams({ open: s.id })}>
                    <td className="py-2.5"><p className="font-extrabold text-[#173a44]">{s.name}</p><p className="text-xs font-semibold text-[#7d9ba0]">{s.student_id || ""}</p></td>
                    <td className="font-semibold text-[#4b6a72]">{s.section}</td>
                    <td className="font-semibold text-[#4b6a72]">{s.advisory_teacher_name || s.advisory_teacher_email || <Chip tone="yellow">Unassigned</Chip>}</td>
                    <td><Chip tone={(s.enrollment_status || "active") === "active" ? "green" : "gray"}>{s.enrollment_status || "active"}</Chip></td>
                    <td>{s.special_needs ? <Chip tone="violet">SNED</Chip> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {openId && <StudentProfile id={openId} onClose={() => setParams({})} onChanged={reload} />}
    </>
  );
}
