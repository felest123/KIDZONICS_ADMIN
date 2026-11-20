import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Inbox as InboxIcon, Search, Send, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { call, useAdminData } from "@/admin/api";
import { Button, Card, Chip, Empty, ErrorBox, Field, inputClass, Loading, Modal, PageHeader, when } from "@/admin/ui";
import { cn } from "@/lib/utils";

export const CATEGORIES = {
  rfid_card: "RFID Card Problem", account: "Account Assistance", student_record: "Student Record Concern", ai_agent: "AI Agent Problem",
  lesson_request: "Lesson Management Request", technical: "Technical Support", other: "Other Concerns",
};
const STATUS = { pending: ["Pending", "yellow"], in_progress: ["In Progress", "blue"], resolved: ["Resolved", "green"] };

function Conversation({ id, onClose, onChanged }) {
  const { data, error, loading, reload } = useAdminData("inbox.get", { id });
  const [reply, setReply] = useState("");
  const [nextStatus, setNextStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const r = data?.request;

  const send = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await call("inbox.reply", { id, body: reply, status: nextStatus || undefined });
      setReply("");
      setNextStatus("");
      toast.success("Reply sent to the teacher");
      await reload();
      onChanged();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  const setStatus = async (status) => {
    try {
      await call("inbox.setStatus", { id, status });
      toast.success(`Marked ${STATUS[status][0]}`);
      await reload();
      onChanged();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <Modal title={r?.subject || "Request"} onClose={onClose} wide>
      <ErrorBox message={error} onRetry={reload} />
      {loading && !data ? <Loading /> : r ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#4b6a72]">
            <Chip tone={STATUS[r.status][1]}>{STATUS[r.status][0]}</Chip>
            <Chip>{CATEGORIES[r.category] || r.category}</Chip>
            <span>{r.teacher_name || "Teacher"} · {r.teacher_email}</span>
            <span>· submitted {when(r.created_date)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {r.status !== "in_progress" && <Button variant="secondary" onClick={() => setStatus("in_progress")}>Mark In Progress</Button>}
            {r.status !== "resolved" && <Button variant="secondary" onClick={() => setStatus("resolved")}>Mark Resolved</Button>}
            {r.status === "resolved" && <Button variant="secondary" onClick={() => setStatus("pending")}>Re-open</Button>}
          </div>
          <div className="max-h-[45vh] space-y-2 overflow-y-auto rounded-xl bg-[#f6faf9] p-3">
            <div className="rounded-xl bg-white p-3 ring-1 ring-[#e3eeec]">
              <p className="flex items-center gap-1 text-xs font-extrabold uppercase text-[#6c8a90]"><UserRound className="h-3.5 w-3.5" /> {r.teacher_name || "Teacher"} · {when(r.created_date)}</p>
              <p className="mt-1 whitespace-pre-line text-sm font-semibold text-[#173a44]">{r.description}</p>
            </div>
            {(r.messages || []).map((m, i) => (
              <div key={i} className={cn("rounded-xl p-3", m.from === "admin" ? "ml-8 bg-[#e3f5f2]" : "mr-8 bg-white ring-1 ring-[#e3eeec]")}>
                <p className="flex items-center gap-1 text-xs font-extrabold uppercase text-[#6c8a90]">
                  {m.from === "admin" ? <ShieldCheck className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}
                  {m.from === "admin" ? m.author_name || "Administrator" : r.teacher_name || "Teacher"} · {when(m.sent_at)}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm font-semibold text-[#173a44]">{m.body}</p>
              </div>
            ))}
          </div>
          <form onSubmit={send} className="space-y-2">
            <Field label="Reply to the teacher">
              <textarea className={inputClass} rows={4} maxLength={4000} required value={reply} onChange={(e) => setReply(e.target.value)} />
            </Field>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <select className={`${inputClass} w-auto`} value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} aria-label="Status after reply">
                <option value="">Status after reply: {r.status === "pending" ? "In Progress" : STATUS[r.status][0]}</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <Button type="submit" busy={busy} disabled={!reply.trim()}><Send className="h-4 w-4" /> Send reply</Button>
            </div>
          </form>
        </div>
      ) : null}
    </Modal>
  );
}

export default function Inbox() {
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(search), 300);
    return () => window.clearTimeout(id);
  }, [search]);
  const { data, error, loading, reload } = useAdminData("inbox.list", { status: status || undefined, category: category || undefined, search: debounced }, { refreshMs: 30000 });
  const openId = params.get("open");

  return (
    <>
      <PageHeader title="Admin Inbox" icon={InboxIcon} subtitle="Requests sent by teachers from Contact Administrator." />
      <Card>
        <div className="mb-3 flex flex-wrap gap-2">
          <label className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8aa6ab]" />
            <input className={`${inputClass} pl-9`} placeholder="Search messages" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <select className={`${inputClass} w-auto`} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
            <option value="">All categories</option>
            {Object.entries(CATEGORIES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
          <select className={`${inputClass} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option><option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option>
          </select>
        </div>
        <ErrorBox message={error} onRetry={reload} />
        {loading && !data ? <Loading /> : (data?.requests || []).length === 0 ? <Empty>No teacher requests match.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-[#6c8a90]"><tr><th className="py-2">Teacher</th><th>Subject</th><th>Category</th><th>Message</th><th>Submitted</th><th>Status</th></tr></thead>
              <tbody className="divide-y divide-[#eef3f3]">
                {data.requests.map((r) => (
                  <tr key={r.id} className="cursor-pointer hover:bg-[#f6faf9]" onClick={() => setParams({ open: r.id })}>
                    <td className="py-2.5 font-bold text-[#173a44]">{r.teacher_name || r.teacher_email}</td>
                    <td className="max-w-[200px] truncate font-extrabold text-[#173a44]">
                      {r.last_message_from === "teacher" && r.status !== "resolved" && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#f59e0b]" title="Waiting for an administrator" />}
                      {r.subject}
                    </td>
                    <td className="text-xs font-semibold text-[#4b6a72]">{CATEGORIES[r.category] || r.category}</td>
                    <td className="max-w-[240px] truncate text-xs font-semibold text-[#4b6a72]">{r.description}</td>
                    <td className="text-xs font-semibold text-[#4b6a72]">{when(r.created_date)}</td>
                    <td><Chip tone={STATUS[r.status]?.[1]}>{STATUS[r.status]?.[0] || r.status}</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {openId && <Conversation id={openId} onClose={() => setParams({})} onChanged={reload} />}
    </>
  );
}
