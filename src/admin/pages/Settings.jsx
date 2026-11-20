import { useEffect, useState } from "react";
import { KeyRound, Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { call, useAdminData } from "@/admin/api";
import { Button, Card, ErrorBox, Field, inputClass, Loading, PageHeader } from "@/admin/ui";

export default function Settings() {
  const { admin } = useOutletContext();
  const { data, error, loading, reload } = useAdminData("settings.get");
  const [form, setForm] = useState({ school_name: "", support_contact: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data?.school) setForm({ school_name: data.school.school_name || "", support_contact: data.school.support_contact || "" });
  }, [data]);

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await call("settings.update", form);
      toast.success("Settings saved");
      reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" icon={SettingsIcon} subtitle="School details and your administrator account." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="School">
          <ErrorBox message={error} onRetry={reload} />
          {loading && !data ? <Loading /> : (
            <form onSubmit={save} className="space-y-3">
              <Field label="School name"><input className={inputClass} maxLength={120} value={form.school_name} onChange={(e) => setForm((f) => ({ ...f, school_name: e.target.value }))} /></Field>
              <Field label="Support contact shown to teachers" hint="e.g. office phone or email"><input className={inputClass} maxLength={200} value={form.support_contact} onChange={(e) => setForm((f) => ({ ...f, support_contact: e.target.value }))} /></Field>
              <div className="flex justify-end"><Button type="submit" busy={busy}>Save</Button></div>
            </form>
          )}
        </Card>
        <Card title="Your account">
          <p className="text-sm font-bold text-[#173a44]">{admin.full_name || "Administrator"}</p>
          <p className="text-sm font-semibold text-[#4b6a72]">{admin.email}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/mfa" className="inline-flex items-center gap-1.5 rounded-xl bg-[#0d9488] px-3.5 py-2 text-sm font-extrabold text-white"><ShieldCheck className="h-4 w-4" /> Two-step verification</a>
            <a href="/forgot-password" className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-sm font-extrabold text-[#173a44] ring-1 ring-[#cfe0dd]"><KeyRound className="h-4 w-4" /> Change password</a>
          </div>
          <p className="mt-3 text-xs font-semibold text-[#7d9ba0]">New administrators are invited from the Base44 dashboard of this Admin app. There is no public sign-up.</p>
        </Card>
      </div>
    </>
  );
}
