import { useRef, useState } from "react";
import { Archive, BookOpen, Bot, Eye, EyeOff, Pencil, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { call, useAdminData } from "@/admin/api";
import { Button, Card, Chip, ConfirmButton, Empty, ErrorBox, Field, inputClass, Loading, Modal, PageHeader, when } from "@/admin/ui";

const STATUS_TONE = { draft: "gray", published: "green", archived: "yellow" };
const AI_TONE = { connected: "green", prepared: "yellow", not_prepared: "gray" };
const AI_LABEL = { connected: "Agent ready", prepared: "Prepared (target not scorable)", not_prepared: "Not sent to agent" };

function MediaField({ label, value, accept, onChange }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Please use a file under 50 MB.");
      return;
    }
    setBusy(true);
    try {
      // Lesson media is learning material, not personal data, so a public link is used
      // that both this app and the KidZonics main system can play.
      const result = await base44.integrations.Core.UploadFile({ file });
      if (result?.file_url) onChange(result.file_url);
    } catch {
      toast.error("Upload failed.");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input className={inputClass} value={value || ""} placeholder="https://…" onChange={(e) => onChange(e.target.value)} />
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={upload} />
        <Button type="button" variant="secondary" busy={busy} onClick={() => ref.current?.click()}><Upload className="h-4 w-4" /></Button>
      </div>
    </Field>
  );
}

function LessonForm({ lesson, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: "", description: "", category: "vowels", target: "", instructions: "", pronunciation_target: "",
    assessment_instructions: "", demo_video_uri: "", demo_audio_uri: "", illustration_uri: "", ...(lesson || {}),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await call("lessons.save", { id: lesson?.id, lesson: form });
      toast.success(lesson ? "Lesson saved" : "Lesson created as a draft");
      onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };
  return (
    <Modal title={lesson ? "Edit lesson" : "Add lesson"} onClose={onClose} wide>
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2"><input className={inputClass} required maxLength={120} value={form.title} onChange={set("title")} /></Field>
        <Field label="Module">
          <select className={inputClass} value={form.category} onChange={set("category")}><option value="vowels">Vowel recognition</option><option value="cvc">CVC word reading</option></select>
        </Field>
        <Field label="Target letter or word"><input className={inputClass} required maxLength={20} value={form.target} onChange={set("target")} placeholder="A or CAT" /></Field>
        <Field label="Description" className="sm:col-span-2"><textarea className={inputClass} rows={2} value={form.description} onChange={set("description")} /></Field>
        <Field label="Learning instructions" className="sm:col-span-2"><textarea className={inputClass} rows={3} value={form.instructions} onChange={set("instructions")} /></Field>
        <Field label="Pronunciation target" hint="What the child should say, e.g. 'cat'"><input className={inputClass} maxLength={40} value={form.pronunciation_target} onChange={set("pronunciation_target")} /></Field>
        <Field label="Assessment instructions"><input className={inputClass} value={form.assessment_instructions} onChange={set("assessment_instructions")} /></Field>
        <MediaField label="Demonstration video" accept="video/*" value={form.demo_video_uri} onChange={(v) => setForm((f) => ({ ...f, demo_video_uri: v }))} />
        <MediaField label="Audio instructions" accept="audio/*" value={form.demo_audio_uri} onChange={(v) => setForm((f) => ({ ...f, demo_audio_uri: v }))} />
        <MediaField label="Learning illustration" accept="image/*" value={form.illustration_uri} onChange={(v) => setForm((f) => ({ ...f, illustration_uri: v }))} />
        <div className="sm:col-span-2"><ErrorBox message={error} /></div>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" busy={busy}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Lessons() {
  const [status, setStatus] = useState("");
  const { data, error, loading, reload } = useAdminData("lessons.list", status ? { status } : {});
  const [editing, setEditing] = useState(null);

  const run = async (action, params, message) => {
    try {
      const result = await call(action, params);
      toast.success(typeof message === "function" ? message(result) : message);
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Lesson Management"
        icon={BookOpen}
        subtitle="The central lesson library. Teachers can only assign published lessons."
        actions={<Button onClick={() => setEditing({})}><Plus className="h-4 w-4" /> Add lesson</Button>}
      />
      <Card>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {[["", "All"], ["draft", "Draft"], ["published", "Published"], ["archived", "Archived"]].map(([value, label]) => (
            <button key={value} onClick={() => setStatus(value)} className={`rounded-full px-3 py-1.5 text-sm font-bold ${status === value ? "bg-[#0d9488] text-white" : "bg-[#eef3f3] text-[#4b6a72]"}`}>{label}</button>
          ))}
        </div>
        <ErrorBox message={error} onRetry={reload} />
        {loading && !data ? <Loading /> : (data?.lessons || []).length === 0 ? <Empty>No lessons here yet.</Empty> : (
          <ul className="space-y-2">
            {data.lessons.map((l) => (
              <li key={l.id} className="rounded-xl border border-[#e3eeec] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`flex h-10 min-w-12 items-center justify-center rounded-lg px-2 font-display font-extrabold ${l.category === "vowels" ? "bg-[#e3f7ea] text-[#166534]" : "bg-[#e8f1ff] text-[#1e4b8a]"}`}>{l.target}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold text-[#173a44]">{l.title}</p>
                    <p className="text-xs font-semibold text-[#7d9ba0]">{l.category === "vowels" ? "Vowels" : "CVC words"} · updated {when(l.updated_date)} · assigned {l.assignment_count}×</p>
                  </div>
                  <Chip tone={STATUS_TONE[l.status || "draft"]}>{l.status || "draft"}</Chip>
                  <Chip tone={AI_TONE[l.ai_status || "not_prepared"]}>{AI_LABEL[l.ai_status || "not_prepared"]}</Chip>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Button variant="ghost" onClick={() => setEditing(l)}><Pencil className="h-4 w-4" /> Edit</Button>
                  {l.status !== "published" && l.status !== "archived" && <Button variant="ghost" onClick={() => run("lessons.setStatus", { id: l.id, status: "published" }, "Lesson published")}><Eye className="h-4 w-4" /> Publish</Button>}
                  {l.status === "published" && <Button variant="ghost" onClick={() => run("lessons.setStatus", { id: l.id, status: "draft" }, "Lesson unpublished")}><EyeOff className="h-4 w-4" /> Unpublish</Button>}
                  {l.status === "archived" && <Button variant="ghost" onClick={() => run("lessons.setStatus", { id: l.id, status: "draft" }, "Lesson restored as a draft")}><Eye className="h-4 w-4" /> Restore</Button>}
                  <Button variant="ghost" onClick={() => run("lessons.sendToAgent", { id: l.id }, (r) => (r.assessable ? "Sent: the voice check can score this lesson" : "Sent, but the voice check cannot score this target yet"))}><Bot className="h-4 w-4" /> Send to AI agent</Button>
                  {l.status !== "archived" && (
                    <ConfirmButton
                      label="Archive" icon={Archive} buttonVariant="ghost" title="Archive this lesson?"
                      message="Teachers will no longer see or assign it. Student progress and assessment results are kept." confirmLabel="Archive"
                      onConfirm={() => run("lessons.setStatus", { id: l.id, status: "archived" }, "Lesson archived")}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {editing && <LessonForm lesson={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}
