import { Link } from "react-router-dom";
import { Bot, BookOpen, CreditCard, GraduationCap, HeartHandshake, Inbox, LayoutDashboard, Users } from "lucide-react";
import { useAdminData } from "@/admin/api";
import { ago, Card, Chip, Empty, ErrorBox, Loading, PageHeader, Stat, StatusPill, when } from "@/admin/ui";

const ACTION_LABELS = {
  "teacher.created": "Added teacher",
  "teacher.updated": "Edited teacher",
  "teacher.deactivated": "Deactivated teacher",
  "teacher.reactivated": "Reactivated teacher",
  "teacher.password_reset_sent": "Sent password reset",
  "rfid.registered": "Registered RFID card",
  "rfid.replaced": "Replaced RFID card",
  "rfid.deactivated": "Deactivated RFID card",
  "student.updated": "Edited student",
  "student.transferred": "Transferred student",
  "lesson.created": "Created lesson",
  "lesson.updated": "Edited lesson",
  "lesson.published": "Published lesson",
  "lesson.unpublished": "Unpublished lesson",
  "lesson.archived": "Archived lesson",
  "lesson.sent_to_agent": "Sent lesson to AI agent",
  "ai.settings_changed": "Changed AI agent settings",
  "request.replied": "Replied to teacher",
  "request.resolved": "Resolved teacher request",
  "request.status_changed": "Changed request status",
  "settings.changed": "Changed school settings",
};
export const actionLabel = (action) => ACTION_LABELS[action] || action;

export default function Dashboard() {
  const { data, error, loading, reload } = useAdminData("overview", {}, { refreshMs: 60000 });

  return (
    <>
      <PageHeader title="Dashboard" icon={LayoutDashboard} subtitle="School-wide overview, from live KidZonics records." />
      <ErrorBox message={error} onRetry={reload} />
      {loading && !data ? (
        <Loading />
      ) : data ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            <Stat label="Registered students" value={data.totals.students} hint={`${data.totals.students_all} including inactive`} icon={Users} />
            <Stat label="Registered teachers" value={data.totals.teachers} hint="Active accounts" icon={GraduationCap} tone="blue" />
            <Stat label="SNED students" value={data.totals.sned} icon={HeartHandshake} tone="violet" />
            <Stat label="Active lessons" value={data.totals.active_lessons} hint="Published in the library" icon={BookOpen} tone="amber" />
            <Stat label="Pending requests" value={data.totals.pending_requests} hint="Not yet resolved" icon={Inbox} tone="rose" />
            <div className="rounded-2xl border border-[#dce9e7] bg-white p-4">
              <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-[#6c8a90]"><Bot className="h-4 w-4" /> AI Agent</p>
              <div className="mt-2"><StatusPill status={data.ai_status} /></div>
              <Link to="/ai-agent" className="mt-2 block text-xs font-bold text-[#0d6f74] hover:underline">Details</Link>
            </div>
            <div className="rounded-2xl border border-[#dce9e7] bg-white p-4">
              <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-[#6c8a90]"><CreditCard className="h-4 w-4" /> RFID reader</p>
              <div className="mt-2"><StatusPill status={data.rfid.connected ? "connected" : data.rfid.devices.length ? "disconnected" : "configuration_required"} /></div>
              <p className="mt-2 text-xs font-semibold text-[#7d9ba0]">
                {data.rfid.devices.length ? `Last heartbeat ${ago(data.rfid.devices[0].last_seen)}` : "No reader has reported yet"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Pending support requests" actions={<Link to="/inbox" className="text-sm font-bold text-[#0d6f74] hover:underline">Open inbox</Link>}>
              {data.pending_requests.length === 0 ? (
                <Empty>No open requests from teachers.</Empty>
              ) : (
                <ul className="divide-y divide-[#eef3f3]">
                  {data.pending_requests.map((r) => (
                    <li key={r.id} className="flex items-center gap-2 py-2.5">
                      <div className="min-w-0 flex-1">
                        <Link to={`/inbox?open=${r.id}`} className="block truncate text-sm font-extrabold text-[#173a44] hover:underline">{r.subject}</Link>
                        <p className="text-xs font-semibold text-[#7d9ba0]">{r.teacher_name || "Teacher"} · {when(r.created_date)}</p>
                      </div>
                      <Chip tone={r.status === "pending" ? "yellow" : "blue"}>{r.status === "pending" ? "Pending" : "In Progress"}</Chip>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Recent administrative activity" actions={<Link to="/activity" className="text-sm font-bold text-[#0d6f74] hover:underline">All logs</Link>}>
              {data.recent_activity.length === 0 ? (
                <Empty>No administrative actions recorded yet.</Empty>
              ) : (
                <ul className="divide-y divide-[#eef3f3]">
                  {data.recent_activity.map((log) => (
                    <li key={log.id} className="py-2.5">
                      <p className="text-sm font-extrabold text-[#173a44]">{actionLabel(log.action)} <span className="font-semibold text-[#4b6a72]">· {log.target_label}</span></p>
                      <p className="text-xs font-semibold text-[#7d9ba0]">{log.admin_name || log.admin_email} · {when(log.created_date)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Recently added teachers">
              {data.recent_teachers.length === 0 ? (
                <Empty>No teachers yet.</Empty>
              ) : (
                <ul className="divide-y divide-[#eef3f3]">
                  {data.recent_teachers.map((t) => (
                    <li key={t.email} className="flex items-center gap-2 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-[#173a44]">{t.full_name || t.email}</p>
                        <p className="truncate text-xs font-semibold text-[#7d9ba0]">{t.email}</p>
                      </div>
                      <Chip tone={t.status === "active" ? "green" : t.status === "invited" ? "yellow" : "gray"}>{t.status}</Chip>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Recently registered students">
              {data.recent_students.length === 0 ? (
                <Empty>No students yet.</Empty>
              ) : (
                <ul className="divide-y divide-[#eef3f3]">
                  {data.recent_students.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 py-2.5">
                      <Link to={`/students?open=${s.id}`} className="truncate text-sm font-extrabold text-[#173a44] hover:underline">{s.name}</Link>
                      <span className="text-xs font-semibold text-[#7d9ba0]">{s.section} · {when(s.created_date, false)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card title="System integration status">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-[#f6faf9] p-3">
                <p className="text-xs font-extrabold uppercase text-[#6c8a90]">Main system link</p>
                <div className="mt-1.5"><StatusPill status="connected" /></div>
                <p className="mt-1 text-xs font-semibold text-[#7d9ba0]">This page was loaded through it.</p>
              </div>
              <div className="rounded-xl bg-[#f6faf9] p-3">
                <p className="text-xs font-extrabold uppercase text-[#6c8a90]">AI pronunciation check</p>
                <div className="mt-1.5"><StatusPill status={data.ai_status} /></div>
              </div>
              <div className="rounded-xl bg-[#f6faf9] p-3">
                <p className="text-xs font-extrabold uppercase text-[#6c8a90]">RFID reader</p>
                <div className="mt-1.5"><StatusPill status={data.rfid.connected ? "connected" : data.rfid.devices.length ? "disconnected" : "configuration_required"} /></div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
