import { Activity, Camera, CreditCard, Link2, Mic, Sparkles } from "lucide-react";
import { useAdminData } from "@/admin/api";
import { ago, Card, Empty, ErrorBox, Loading, PageHeader, StatusPill, when } from "@/admin/ui";

const deviceStatus = (s) => (s === "ok" ? "connected" : s === "blocked" || s === "unavailable" ? "disconnected" : "configuration_required");

export default function Monitoring() {
  const { data, error, loading, reload } = useAdminData("monitoring.status", {}, { refreshMs: 15000 });

  return (
    <>
      <PageHeader title="System Monitoring" icon={Activity} subtitle="Live checks, refreshed every 15 seconds. Nothing here is assumed: each status comes from a real signal." />
      {error && (
        <div className="mb-4 space-y-2">
          <ErrorBox message={error} onRetry={reload} />
          <Card><div className="flex items-center gap-2 text-sm font-bold text-[#173a44]"><Link2 className="h-4 w-4" /> Main system link <StatusPill status="disconnected" /></div></Card>
        </div>
      )}
      {loading && !data ? <Loading /> : data ? (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-[#7d9ba0]">Last checked {when(data.checked_at)}</p>
          <div className="grid gap-4 md:grid-cols-3">
            <Card title="Main system link">
              <div className="flex items-center gap-2"><Link2 className="h-5 w-5 text-[#0d9488]" /><StatusPill status={error ? "disconnected" : data.admin_api} /></div>
              <p className="mt-2 text-xs font-semibold text-[#4b6a72]">Signed requests between this Admin app and the KidZonics main system.</p>
            </Card>
            <Card title="AI pronunciation check">
              <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#0d9488]" /><StatusPill status={data.ai.status} /></div>
              <p className="mt-2 text-xs font-semibold text-[#4b6a72]">Last success {ago(data.ai.last_ok_at)} · last error {ago(data.ai.last_error_at)}</p>
              {data.ai.last_error && <p className="mt-1 text-xs font-bold text-[#a34c3f]">{data.ai.last_error}</p>}
              <p className="mt-1 text-xs font-semibold text-[#7d9ba0]">Last assessment saved {ago(data.last_assessment_at)}</p>
            </Card>
            <Card title="RFID readers">
              <div className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-[#0d9488]" /><StatusPill status={data.rfid.connected ? "connected" : data.rfid.devices.length ? "disconnected" : "configuration_required"} /></div>
              <ul className="mt-2 space-y-1">
                {data.rfid.devices.map((d) => <li key={d.device} className="text-xs font-semibold text-[#4b6a72]">{d.device}: {d.connected ? "online" : "offline"} · {ago(d.last_seen)}</li>)}
              </ul>
            </Card>
          </div>
          <Card title="Kiosk camera and microphone">
            {data.kiosks.length === 0 ? <Empty>No kiosk has reported yet. Reports arrive when a child uses the camera check or the microphone in a lesson.</Empty> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="text-xs uppercase text-[#6c8a90]"><tr><th className="py-2">Kiosk</th><th><Camera className="inline h-4 w-4" /> Camera</th><th><Mic className="inline h-4 w-4" /> Microphone</th></tr></thead>
                  <tbody className="divide-y divide-[#eef3f3]">
                    {data.kiosks.map((k) => (
                      <tr key={k.device_name}>
                        <td className="py-2.5 font-bold text-[#173a44]">{k.device_name}</td>
                        <td><StatusPill status={deviceStatus(k.camera)} /> <span className="text-xs text-[#7d9ba0]">{ago(k.camera_checked_at)}</span></td>
                        <td><StatusPill status={deviceStatus(k.microphone)} /> <span className="text-xs text-[#7d9ba0]">{ago(k.microphone_checked_at)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </>
  );
}
