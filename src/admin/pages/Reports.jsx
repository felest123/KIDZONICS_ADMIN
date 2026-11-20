import { BarChart3, Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAdminData } from "@/admin/api";
import { Button, Card, Empty, ErrorBox, Loading, PageHeader, Stat, when } from "@/admin/ui";

function toCsv(rows, columns) {
  const escape = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    // Neutralise spreadsheet formulas and quote every cell.
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return [columns.map(([, label]) => escape(label)).join(","), ...rows.map((r) => columns.map(([key]) => escape(r[key])).join(","))].join("\r\n");
}
function download(name, csv) {
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const SECTION_COLUMNS = [["section", "Section"], ["students", "Students"], ["sned", "SNED"], ["lessons_completed", "Lessons completed"], ["vowels_completed", "Vowel lessons"], ["cvc_completed", "CVC lessons"], ["assessments", "Speaking tries"], ["average_accuracy", "Average accuracy %"], ["pass_rate", "Pass rate %"]];
const LESSON_COLUMNS = [["module", "Module"], ["lesson_key", "Lesson"], ["tries", "Tries"], ["average_accuracy", "Average accuracy %"], ["pass_rate", "Pass rate %"]];
const TEACHER_COLUMNS = [["full_name", "Teacher"], ["email", "Email"], ["status", "Status"], ["students", "Students"], ["sned", "SNED"]];

export default function Reports() {
  const { data, error, loading, reload } = useAdminData("reports.summary");
  const stamp = data ? data.generated_at.slice(0, 10) : "";

  return (
    <>
      <PageHeader title="System Reports" icon={BarChart3} subtitle={data ? `School-wide results, generated ${when(data.generated_at)}` : "School-wide results"} />
      <ErrorBox message={error} onRetry={reload} />
      {loading && !data ? <Loading /> : data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Active students" value={data.totals.students} />
            <Stat label="SNED students" value={data.totals.sned} tone="violet" />
            <Stat label="Active teachers" value={data.totals.teachers} tone="blue" />
            <Stat label="Speaking assessments" value={data.totals.assessments} tone="amber" />
          </div>

          <Card title="Progress by section" actions={<Button variant="secondary" onClick={() => download(`kidzonics-sections-${stamp}.csv`, toCsv(data.sections, SECTION_COLUMNS))}><Download className="h-4 w-4" /> CSV</Button>}>
            {data.sections.length === 0 ? <Empty>No students yet.</Empty> : (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.sections} margin={{ left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e3eeec" />
                      <XAxis dataKey="section" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="vowels_completed" name="Vowel lessons" stackId="a" fill="#0d9488" />
                      <Bar dataKey="cvc_completed" name="CVC lessons" stackId="a" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="text-xs uppercase text-[#6c8a90]"><tr>{SECTION_COLUMNS.map(([k, l]) => <th key={k} className="py-2">{l}</th>)}</tr></thead>
                    <tbody className="divide-y divide-[#eef3f3]">
                      {data.sections.map((s) => <tr key={s.section}>{SECTION_COLUMNS.map(([k]) => <td key={k} className="py-2 font-semibold text-[#173a44]">{s[k] ?? "—"}</td>)}</tr>)}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Results by lesson" actions={<Button variant="secondary" onClick={() => download(`kidzonics-lessons-${stamp}.csv`, toCsv(data.lessons, LESSON_COLUMNS))}><Download className="h-4 w-4" /> CSV</Button>}>
              {data.lessons.length === 0 ? <Empty>No assessments yet.</Empty> : (
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-[#6c8a90]"><tr><th className="py-2">Lesson</th><th>Tries</th><th>Avg</th><th>Pass</th></tr></thead>
                  <tbody className="divide-y divide-[#eef3f3]">
                    {data.lessons.map((l) => <tr key={`${l.module}${l.lesson_key}`}><td className="py-2 font-bold text-[#173a44]">{l.module === "vowels" ? "Vowel" : "CVC"} {l.lesson_key}</td><td>{l.tries}</td><td>{l.average_accuracy}%</td><td>{l.pass_rate}%</td></tr>)}
                  </tbody>
                </table>
              )}
            </Card>
            <Card title="Teachers and class sizes" actions={<Button variant="secondary" onClick={() => download(`kidzonics-teachers-${stamp}.csv`, toCsv(data.teachers, TEACHER_COLUMNS))}><Download className="h-4 w-4" /> CSV</Button>}>
              {data.teachers.length === 0 ? <Empty>No teachers yet.</Empty> : (
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-[#6c8a90]"><tr><th className="py-2">Teacher</th><th>Status</th><th>Students</th><th>SNED</th></tr></thead>
                  <tbody className="divide-y divide-[#eef3f3]">
                    {data.teachers.map((t) => <tr key={t.email}><td className="py-2 font-bold text-[#173a44]">{t.full_name || t.email}</td><td>{t.status}</td><td>{t.students}</td><td>{t.sned}</td></tr>)}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}
