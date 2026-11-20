import { useState } from "react";
import { ScrollText, Search } from "lucide-react";
import { useAdminData } from "@/admin/api";
import { Card, Empty, ErrorBox, inputClass, Loading, PageHeader, when } from "@/admin/ui";
import { actionLabel } from "@/admin/pages/Dashboard";

function Details({ raw }) {
  if (!raw || raw === "{}") return null;
  let text = raw;
  try {
    text = JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    // keep raw text
  }
  return (
    <details className="mt-1">
      <summary className="cursor-pointer text-xs font-bold text-[#0d6f74]">Details</summary>
      <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-[#f6faf9] p-2 text-[11px] text-[#173a44]">{text}</pre>
    </details>
  );
}

export default function ActivityLogs() {
  const [action, setAction] = useState("");
  const [query, setQuery] = useState("");
  const { data, error, loading, reload } = useAdminData("logs.list", { action: action || undefined, limit: 500 });
  const logs = (data?.logs || []).filter((l) => `${l.admin_email} ${l.admin_name} ${l.target_label} ${l.action}`.toLowerCase().includes(query.trim().toLowerCase()));
  const actions = [...new Set((data?.logs || []).map((l) => l.action))].sort();

  return (
    <>
      <PageHeader title="Activity Logs" icon={ScrollText} subtitle="Every administrative change, who made it and when. Entries cannot be edited or deleted." />
      <Card>
        <div className="mb-3 flex flex-wrap gap-2">
          <label className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8aa6ab]" />
            <input className={`${inputClass} pl-9`} placeholder="Search administrator or record" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <select className={`${inputClass} w-auto`} value={action} onChange={(e) => setAction(e.target.value)} aria-label="Filter by action">
            <option value="">All actions</option>
            {actions.map((a) => <option key={a} value={a}>{actionLabel(a)}</option>)}
          </select>
        </div>
        <ErrorBox message={error} onRetry={reload} />
        {loading && !data ? <Loading /> : logs.length === 0 ? <Empty>No activity recorded.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-[#6c8a90]"><tr><th className="py-2">Date and time</th><th>Administrator</th><th>Action</th><th>Affected record</th></tr></thead>
              <tbody className="divide-y divide-[#eef3f3] align-top">
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap py-2.5 text-xs font-semibold text-[#4b6a72]">{when(l.created_date)}</td>
                    <td><p className="font-bold text-[#173a44]">{l.admin_name || "—"}</p><p className="text-xs font-semibold text-[#7d9ba0]">{l.admin_email}</p></td>
                    <td className="font-bold text-[#173a44]">{actionLabel(l.action)}</td>
                    <td><p className="font-semibold text-[#173a44]">{l.target_label || l.target_id}</p><p className="text-xs text-[#7d9ba0]">{l.target_type}</p><Details raw={l.details} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
