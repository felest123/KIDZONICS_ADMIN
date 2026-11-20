import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, Loader2, Power, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { call, useAdminData } from "@/admin/api";
import { ago, Button, Card, Chip, ConfirmButton, Empty, ErrorBox, Field, inputClass, Loading, Modal, PageHeader, StatusPill, when } from "@/admin/ui";

// Replacement workflow: 1 select teacher → 2 view current card → 3 tap new card
// → 4 verify it → 5 old card is switched off → 6 save the new association.
function RegisterCard({ teachers, initialEmail, onClose, onDone }) {
  const [email, setEmail] = useState(initialEmail || "");
  const [label, setLabel] = useState("Teacher card");
  const [waiting, setWaiting] = useState(false);
  const [tap, setTap] = useState(null);
  const [reader, setReader] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const teacher = teachers.find((t) => t.email === email);

  useEffect(() => {
    if (!waiting) return undefined;
    let active = true;
    const poll = async () => {
      try {
        const result = await call("rfid.pendingTap");
        if (!active) return;
        setReader(result.reader);
        if (result.tap) {
          setTap(result.tap);
          setWaiting(false);
        }
      } catch (e) {
        if (active) setError(e.message);
      }
    };
    poll();
    const id = window.setInterval(poll, 2000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [waiting]);

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await call("rfid.register", { teacher_email: email, tap_id: tap.tap_id, label });
      toast.success(result.unchanged ? "That card is already this teacher's active card" : result.replaced ? "Card replaced; the old card is now off" : "Card registered");
      onDone();
    } catch (e) {
      setError(e.message);
      setTap(null);
      setBusy(false);
    }
  };

  const conflict = tap?.linked_to && tap.linked_to !== email;
  return (
    <Modal title="Register or replace an RFID card" onClose={onClose}>
      <ol className="space-y-4">
        <li>
          <Field label="1. Teacher">
            <select className={inputClass} value={email} onChange={(e) => { setEmail(e.target.value); setTap(null); }}>
              <option value="">Choose a teacher…</option>
              {teachers.filter((t) => t.status !== "deactivated").map((t) => <option key={t.email} value={t.email}>{t.full_name || t.email}</option>)}
            </select>
          </Field>
        </li>
        {teacher && (
          <li className="rounded-xl bg-[#f6faf9] p-3 text-sm font-semibold text-[#4b6a72]">
            <p className="text-xs font-extrabold uppercase text-[#6c8a90]">2. Current card</p>
            {teacher.rfid ? <p className="mt-1"><span className="font-mono font-bold text-[#173a44]">{teacher.rfid.fingerprint}</span> · {teacher.rfid.label} · updated {when(teacher.rfid.updated)}. It will be switched off when the new card is saved.</p> : <p className="mt-1">No active card.</p>}
          </li>
        )}
        {teacher && (
          <li>
            <p className="text-xs font-extrabold uppercase text-[#6c8a90]">3. Tap the new card on the kiosk reader</p>
            {!tap && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button variant={waiting ? "secondary" : "primary"} onClick={() => { setError(""); setWaiting((w) => !w); }}>
                  {waiting ? <><Loader2 className="h-4 w-4 animate-spin" /> Waiting for a tap… (cancel)</> : <><CreditCard className="h-4 w-4" /> Start listening</>}
                </Button>
                {waiting && reader && <StatusPill status={reader.connected ? "connected" : "disconnected"} />}
              </div>
            )}
            {waiting && reader && !reader.connected && <p className="mt-2 text-xs font-bold text-[#a34c3f]">The reader is not connected. Check the bridge on the kiosk.</p>}
          </li>
        )}
        {tap && (
          <li className={`rounded-xl p-3 text-sm font-semibold ${conflict ? "bg-[#fff3f0] text-[#a34c3f]" : "bg-[#e3f7ea] text-[#166534]"}`}>
            <p className="text-xs font-extrabold uppercase">4. Verify</p>
            <p className="mt-1 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Card <span className="font-mono font-bold">{tap.fingerprint}</span> read at {tap.device || "kiosk"} {ago(tap.at)}.</p>
            {conflict && <p className="mt-1">This card is already active for {tap.linked_to}. Deactivate it there first.</p>}
            <Field label="Card label" className="mt-2"><input className={inputClass} value={label} maxLength={60} onChange={(e) => setLabel(e.target.value)} /></Field>
          </li>
        )}
      </ol>
      <ErrorBox message={error} />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button busy={busy} disabled={!tap || conflict} onClick={save}>5–6. Save association</Button>
      </div>
    </Modal>
  );
}

export default function Rfid() {
  const { data, error, loading, reload } = useAdminData("rfid.list", {}, { refreshMs: 30000 });
  const [registering, setRegistering] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const cards = (data?.cards || []).filter((c) => showInactive || c.active);

  return (
    <>
      <PageHeader
        title="RFID Management"
        icon={CreditCard}
        subtitle="Teacher sign-in cards. RFID is for teachers only; students keep using their name and section."
        actions={<Button onClick={() => setRegistering({})}><CreditCard className="h-4 w-4" /> Register / replace card</Button>}
      />
      <ErrorBox message={error} onRetry={reload} />
      {loading && !data ? <Loading /> : data ? (
        <div className="space-y-4">
          <Card title="Readers">
            {data.reader.devices.length === 0 ? <Empty>No reader has reported yet. Set up the kiosk bridge to connect one.</Empty> : (
              <ul className="flex flex-wrap gap-3">
                {data.reader.devices.map((d) => (
                  <li key={d.device} className="rounded-xl bg-[#f6faf9] px-3 py-2">
                    <p className="text-sm font-extrabold text-[#173a44]">{d.device}</p>
                    <div className="mt-1 flex items-center gap-2"><StatusPill status={d.connected ? "connected" : "disconnected"} /><span className="text-xs font-semibold text-[#7d9ba0]">{ago(d.last_seen)}</span></div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card
            title="Card associations"
            actions={<label className="flex items-center gap-2 text-sm font-bold text-[#4b6a72]"><input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Show inactive</label>}
          >
            {cards.length === 0 ? <Empty>No cards registered.</Empty> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="text-xs uppercase text-[#6c8a90]"><tr><th className="py-2">Card</th><th>Teacher</th><th>Status</th><th>Last update</th><th>Registered by</th><th /></tr></thead>
                  <tbody className="divide-y divide-[#eef3f3]">
                    {cards.map((c) => (
                      <tr key={c.id}>
                        <td className="py-2.5"><p className="font-mono font-bold text-[#173a44]">{c.fingerprint}</p><p className="text-xs font-semibold text-[#7d9ba0]">{c.label}</p></td>
                        <td><p className="font-bold text-[#173a44]">{c.teacher_name || "—"}</p><p className="text-xs font-semibold text-[#7d9ba0]">{c.teacher_email}</p></td>
                        <td>{c.active ? <Chip tone="green">Active</Chip> : <span title={c.deactivated_reason}><Chip>Inactive</Chip></span>}</td>
                        <td className="text-xs font-semibold text-[#4b6a72]">{when(c.deactivated_at || c.updated_date)}</td>
                        <td className="text-xs font-semibold text-[#4b6a72]">{c.registered_by || "—"}</td>
                        <td className="text-right">
                          {c.active && (
                            <div className="flex justify-end gap-1.5">
                              <Button variant="ghost" onClick={() => setRegistering({ email: c.teacher_email })}><RefreshCcw className="h-4 w-4" /> Replace</Button>
                              <ConfirmButton
                                label="Deactivate"
                                icon={Power}
                                title="Deactivate this card?"
                                message="Use this for a lost or broken card. It will stop opening the teacher sign-in screen immediately."
                                confirmLabel="Deactivate card"
                                withReason
                                onConfirm={async (reason) => { await call("rfid.deactivate", { card_id: c.id, reason: reason || "Lost or malfunctioning" }); toast.success("Card deactivated"); reload(); }}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : null}
      {registering && (
        <RegisterCard teachers={data?.teachers || []} initialEmail={registering.email} onClose={() => setRegistering(null)} onDone={() => { setRegistering(null); reload(); }} />
      )}
    </>
  );
}
