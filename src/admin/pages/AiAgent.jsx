import { useEffect, useState } from "react";
import { Bot, Camera, Mic, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { call, useAdminData } from "@/admin/api";
import { ago, Button, Card, Empty, ErrorBox, Field, inputClass, Loading, PageHeader, StatusPill, when } from "@/admin/ui";

const STATUS_HELP = {
  connected: "A real pronunciation assessment succeeded in the last 7 days.",
  disconnected: "The most recent real assessment failed. See the error below.",
  configuration_required: "No real assessment has been recorded yet, so the connection is unverified.",
  temporarily_disabled: "Assessment is switched off. Students see a 'voice check is turned off' message and no score is created.",
};

const deviceStatus = (s) => (s === "ok" ? "connected" : s === "blocked" || s === "unavailable" ? "disconnected" : "configuration_required");

export default function AiAgent() {
  const { data, error, loading, reload } = useAdminData("ai.get");
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    if (data?.config) setForm({ ...data.config });
  }, [data]);

  // Voice names come from the browser's speech engine; the kiosk must have the same voice installed.
  useEffect(() => {
    if (!("speechSynthesis" in window)) return undefined;
    const load = () => setVoices(window.speechSynthesis.getVoices().filter((v) => /^(en|fil)/i.test(v.lang)));
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", load);
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const save = async (patch) => {
    setBusy(true);
    try {
      await call("ai.update", { config: patch });
      toast.success("AI agent settings saved");
      await reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const preview = () => {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(form.audio_instructions || `Hi! I am ${form.agent_name || "your reading buddy"}. Let's learn together!`);
    u.rate = Number(form.speaking_rate) || 0.82;
    u.lang = form.language || "en-US";
    const voice = window.speechSynthesis.getVoices().find((v) => v.name === form.voice_name);
    if (voice) u.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  return (
    <>
      <PageHeader title="AI Agent Management" icon={Bot} subtitle="The reading buddy and the AI pronunciation check used on the kiosk." />
      <ErrorBox message={error} onRetry={reload} />
      {loading && !data ? <Loading /> : data && form ? (
        <div className="space-y-4">
          <Card title="Connection status">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-[#f6faf9] p-3">
                <p className="text-xs font-extrabold uppercase text-[#6c8a90]">AI pronunciation API</p>
                <div className="mt-1.5"><StatusPill status={data.status} /></div>
                <p className="mt-2 text-xs font-semibold text-[#4b6a72]">{STATUS_HELP[data.status]}</p>
                <p className="mt-1 text-xs font-semibold text-[#7d9ba0]">Last success: {when(data.config.last_ok_at)} · Last error: {when(data.config.last_error_at)}</p>
                {data.config.last_error && <p className="mt-1 text-xs font-bold text-[#a34c3f]">Error: {data.config.last_error}</p>}
              </div>
              <div className="rounded-xl bg-[#f6faf9] p-3">
                <p className="text-xs font-extrabold uppercase text-[#6c8a90]">AI assessment availability</p>
                <label className="mt-2 flex items-center gap-3 text-sm font-bold text-[#173a44]">
                  <input type="checkbox" className="h-5 w-5" checked={form.assessment_enabled !== false} disabled={busy} onChange={(e) => save({ assessment_enabled: e.target.checked })} />
                  {form.assessment_enabled !== false ? "Enabled for all kiosks" : "Disabled: students see an 'unavailable' message"}
                </label>
                <p className="mt-2 text-xs font-semibold text-[#7d9ba0]">Targets the checker can score: {data.assessable_targets.join(", ")}</p>
              </div>
            </div>
          </Card>

          <Card title="Kiosk devices (reported during real lessons)">
            {data.devices.length === 0 ? <Empty>No kiosk has reported its camera or microphone yet. Statuses appear after a child starts a lesson on a kiosk.</Empty> : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.devices.map((d) => (
                  <div key={d.id} className="rounded-xl bg-[#f6faf9] p-3">
                    <p className="text-sm font-extrabold text-[#173a44]">{d.device_name}</p>
                    <p className="mt-2 flex items-center gap-2 text-xs font-bold text-[#4b6a72]"><Camera className="h-4 w-4" /> Camera <StatusPill status={deviceStatus(d.camera_status)} /></p>
                    <p className="text-[11px] font-semibold text-[#7d9ba0]">{ago(d.camera_checked_at)}</p>
                    <p className="mt-2 flex items-center gap-2 text-xs font-bold text-[#4b6a72]"><Mic className="h-4 w-4" /> Microphone <StatusPill status={deviceStatus(d.microphone_status)} /></p>
                    <p className="text-[11px] font-semibold text-[#7d9ba0]">{ago(d.microphone_checked_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Agent and voice settings">
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                const { agent_name, agent_avatar, voice_name, speaking_rate, language, pass_threshold, audio_instructions } = form;
                save({ agent_name, agent_avatar, voice_name, speaking_rate: Number(speaking_rate), language, pass_threshold: Number(pass_threshold), audio_instructions });
              }}
            >
              <Field label="Agent name"><input className={inputClass} maxLength={60} value={form.agent_name || ""} onChange={set("agent_name")} placeholder="e.g. Ziggy" /></Field>
              <Field label="Avatar (emoji or https image link)"><input className={inputClass} maxLength={500} value={form.agent_avatar || ""} onChange={set("agent_avatar")} placeholder="🦉" /></Field>
              <Field label="Voice" hint="Voices depend on the device; install the same voice on the kiosk.">
                <select className={inputClass} value={form.voice_name || ""} onChange={set("voice_name")}>
                  <option value="">Default voice of the device</option>
                  {form.voice_name && !voices.some((v) => v.name === form.voice_name) && <option value={form.voice_name}>{form.voice_name}</option>}
                  {voices.map((v) => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
                </select>
              </Field>
              <Field label="Language">
                <select className={inputClass} value={form.language || "en-US"} onChange={set("language")}>
                  <option value="en-US">English (US)</option><option value="en-GB">English (UK)</option><option value="en-PH">English (Philippines)</option><option value="fil-PH">Filipino</option>
                </select>
              </Field>
              <Field label={`Speaking speed: ${Number(form.speaking_rate || 0.82).toFixed(2)}×`}>
                <input type="range" min="0.5" max="1.3" step="0.02" className="w-full" value={form.speaking_rate || 0.82} onChange={set("speaking_rate")} />
              </Field>
              <Field label={`Pass mark: ${form.pass_threshold ?? 65}% accuracy`} hint="Pronunciation assessment configuration. Default 65%.">
                <input type="range" min="40" max="95" step="1" className="w-full" value={form.pass_threshold ?? 65} onChange={set("pass_threshold")} />
              </Field>
              <Field label="Audio instructions (spoken before a lesson)" className="sm:col-span-2">
                <textarea className={inputClass} rows={3} maxLength={600} value={form.audio_instructions || ""} onChange={set("audio_instructions")} />
              </Field>
              <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="secondary" onClick={preview}><Volume2 className="h-4 w-4" /> Preview voice</Button>
                <Button type="submit" busy={busy}>Save settings</Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </>
  );
}
