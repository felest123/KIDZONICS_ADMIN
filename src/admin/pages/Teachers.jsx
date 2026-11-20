import { useState } from "react";
import { GraduationCap, KeyRound, Pencil, Plus, Power, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { call, useAdminData } from "@/admin/api";
import { Button, Card, Chip, ConfirmButton, Empty, ErrorBox, Field, inputClass, Loading, Modal, PageHeader, when } from "@/admin/ui";

const STATUS_TONE = { active: "green", invited: "yellow", deactivated: "gray" };

function sectionsText(list) {
  return (list || []).join(", ");
}
function parseSections(text) {
  return text.split(",").map((s) => s.trim()).filter(Boolean);
}

function TeacherForm({ teacher, onClose, onSaved }) {
  const [form, setForm] = useState({
    email: teacher?.email || "",
    full_name: teacher?.full_name || "",
    phone: teacher?.phone || "",
    employee_id: teacher?.employee_id || "",
    sections: sectionsText(teacher?.advisory_sections),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const params = { email: form.email, full_name: form.full_name, phone: form.phone, employee_id: form.employee_id, advisory_sections: parseSections(form.sections) };
      const result = await call(teacher ? "teachers.update" : "teachers.invite", params);
      if (!teacher) {
        toast.success(result.has_account ? "Teacher added. They can sign in now." : "Teacher added. Ask them to sign up with this email to activate the account.");
      } else {
        toast.success("Teacher saved");
      }
      onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={teacher ? "Edit teacher" : "Add teacher account"} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <Field label="Email (sign-in)" hint={teacher ? "The sign-in email cannot be changed here." : "The teacher signs up with this exact email to activate the account."}>
          <input className={inputClass} type="email" required disabled={Boolean(teacher)} value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Full name">
          <input className={inputClass} required maxLength={120} value={form.full_name} onChange={set("full_name")} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Phone">
            <input className={inputClass} maxLength={40} value={form.phone} onChange={set("phone")} />
          </Field>
          <Field label="Employee ID">
            <input className={inputClass} maxLength={40} value={form.employee_id} onChange={set("employee_id")} />
          </Field>
        </div>
        <Field label="Advisory sections" hint="Separate with commas, e.g. Sampaguita, Rosal">
          <input className={inputClass} value={form.sections} onChange={set("sections")} />
        </Field>
        <ErrorBox message={error} />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" busy={busy}>{teacher ? "Save changes" : "Add teacher"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function TeacherDetail({ email, onClose, onChanged }) {
  const { data, error, loading, reload } = useAdminData("teachers.get", { email });
  const [editing, setEditing] = useState(false);
  const t = data?.teacher;

  const act = async (action, params, message) => {
    await call(action, params);
    toast.success(message);
    await reload();
    onChanged();
  };

  return (
    <Modal title={t?.full_name || email} onClose={onClose} wide>
      <ErrorBox message={error} onRetry={reload} />
      {loading && !data ? (
        <Loading />
      ) : t ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={STATUS_TONE[t.status]}>{t.status}</Chip>
            <span className="text-sm font-semibold text-[#4b6a72]">{t.email}</span>
            {t.phone && <span className="text-sm font-semibold text-[#4b6a72]">· {t.phone}</span>}
            {t.employee_id && <span className="text-sm font-semibold text-[#4b6a72]">· ID {t.employee_id}</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> Edit / assign sections</Button>
            <ConfirmButton
              label="Reset password"
              icon={KeyRound}
              title="Send password reset?"
              message={`Base44 will email ${t.email} a secure link to choose a new password. Nobody else sees the password.`}
              confirmLabel="Send reset email"
              variant="primary"
              onConfirm={() => act("teachers.resetPassword", { email: t.email }, "Password reset email sent")}
            />
            {t.status === "deactivated" ? (
              <ConfirmButton
                label="Reactivate"
                icon={RotateCcw}
                title="Reactivate this teacher?"
                message="They can sign in to the Teacher Portal again. Their RFID card stays off: register it again in RFID Management."
                confirmLabel="Reactivate"
                variant="primary"
                onConfirm={() => act("teachers.setStatus", { email: t.email, status: "active" }, "Teacher reactivated")}
              />
            ) : (
              <ConfirmButton
                label="Deactivate"
                icon={Power}
                title="Deactivate this teacher?"
                message="They will no longer be able to use the Teacher Portal and their RFID card will be switched off. Their students, progress and assessment records are kept."
                confirmLabel="Deactivate"
                withReason
                onConfirm={(reason) => act("teachers.setStatus", { email: t.email, status: "deactivated", reason }, "Teacher deactivated")}
              />
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-[#f6faf9] p-3">
              <p className="text-xs font-extrabold uppercase text-[#6c8a90]">Advisory sections</p>
              <p className="mt-1 text-sm font-bold text-[#173a44]">{sectionsText(t.advisory_sections) || "None assigned"}</p>
            </div>
            <div className="rounded-xl bg-[#f6faf9] p-3">
              <p className="text-xs font-extrabold uppercase text-[#6c8a90]">Students</p>
              <p className="mt-1 text-sm font-bold text-[#173a44]">{t.student_count} ({t.sned_count} SNED)</p>
            </div>
            <div className="rounded-xl bg-[#f6faf9] p-3">
              <p className="text-xs font-extrabold uppercase text-[#6c8a90]">RFID card</p>
              <p className="mt-1 text-sm font-bold text-[#173a44]">{t.rfid ? `${t.rfid.fingerprint} · ${t.rfid.label}` : "No active card"}</p>
            </div>
          </div>

          <Card title="Assigned classes">
            {data.students.length === 0 ? (
              <Empty>No students are assigned to this teacher.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-[#6c8a90]"><tr><th className="py-2">Student</th><th>Section</th><th>Status</th><th>SNED</th></tr></thead>
                  <tbody className="divide-y divide-[#eef3f3]">
                    {data.students.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2 font-bold text-[#173a44]">{s.name}</td>
                        <td className="font-semibold text-[#4b6a72]">{s.section}</td>
                        <td><Chip tone={(s.enrollment_status || "active") === "active" ? "green" : "gray"}>{s.enrollment_status || "active"}</Chip></td>
                        <td>{s.special_needs ? <Chip tone="violet">SNED</Chip> : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {data.cards.length > 0 && (
            <Card title="RFID card history">
              <ul className="divide-y divide-[#eef3f3] text-sm">
                {data.cards.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-2 py-2">
                    <span className="font-mono font-bold text-[#173a44]">{c.fingerprint}</span>
                    <Chip tone={c.active ? "green" : "gray"}>{c.active ? "Active" : "Inactive"}</Chip>
                    <span className="text-xs font-semibold text-[#7d9ba0]">Added {when(c.created_date)}{c.deactivated_at ? ` · off ${when(c.deactivated_at)} (${c.deactivated_reason})` : ""}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      ) : null}
      {editing && t && (
        <TeacherForm
          teacher={t}
          onClose={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            await reload();
            onChanged();
          }}
        />
      )}
    </Modal>
  );
}

export default function Teachers() {
  const { data, error, loading, reload } = useAdminData("teachers.list");
  const [adding, setAdding] = useState(false);
  const [openEmail, setOpenEmail] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  const teachers = (data?.teachers || []).filter(
    (t) => (!status || t.status === status) && `${t.full_name} ${t.email}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Teacher Management"
        icon={GraduationCap}
        subtitle="Teacher accounts, advisory sections and access."
        actions={<Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add teacher</Button>}
      />
      <Card>
        <div className="mb-3 flex flex-wrap gap-2">
          <label className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8aa6ab]" />
            <input className={`${inputClass} pl-9`} placeholder="Search name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <select className={`${inputClass} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>
        <ErrorBox message={error} onRetry={reload} />
        {loading && !data ? (
          <Loading />
        ) : teachers.length === 0 ? (
          <Empty>No teachers match.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase text-[#6c8a90]">
                <tr><th className="py-2">Teacher</th><th>Sections</th><th>Students</th><th>RFID</th><th>Status</th></tr>
              </thead>
              <tbody className="divide-y divide-[#eef3f3]">
                {teachers.map((t) => (
                  <tr key={t.email} className="cursor-pointer hover:bg-[#f6faf9]" onClick={() => setOpenEmail(t.email)}>
                    <td className="py-2.5">
                      <p className="font-extrabold text-[#173a44]">{t.full_name || "—"}</p>
                      <p className="text-xs font-semibold text-[#7d9ba0]">{t.email}</p>
                    </td>
                    <td className="font-semibold text-[#4b6a72]">{sectionsText(t.advisory_sections) || "—"}</td>
                    <td className="font-semibold text-[#4b6a72]">{t.student_count}</td>
                    <td className="font-mono text-xs font-bold text-[#4b6a72]">{t.rfid ? t.rfid.fingerprint : "—"}</td>
                    <td><Chip tone={STATUS_TONE[t.status]}>{t.status}</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {adding && <TeacherForm onClose={() => setAdding(false)} onSaved={() => { setAdding(false); reload(); }} />}
      {openEmail && <TeacherDetail email={openEmail} onClose={() => setOpenEmail(null)} onChanged={reload} />}
    </>
  );
}
