import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import AdminLogin from "@/pages/AdminLogin";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Mfa from "@/pages/Mfa";
import AdminShell from "@/admin/AdminShell";
import Dashboard from "@/admin/pages/Dashboard";
import Teachers from "@/admin/pages/Teachers";
import Students from "@/admin/pages/Students";
import Rfid from "@/admin/pages/Rfid";
import AiAgent from "@/admin/pages/AiAgent";
import Lessons from "@/admin/pages/Lessons";
import Inbox from "@/admin/pages/Inbox";
import Reports from "@/admin/pages/Reports";
import Monitoring from "@/admin/pages/Monitoring";
import Settings from "@/admin/pages/Settings";
import ActivityLogs from "@/admin/pages/ActivityLogs";

// KIDZONICS ADMIN – SYSTEM MANAGEMENT. A separate application from the
// KidZonics Student/Teacher system; there is no sign-up page on purpose.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/mfa" element={<Mfa />} />
        <Route element={<AdminShell />}>
          <Route index element={<Dashboard />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="students" element={<Students />} />
          <Route path="rfid" element={<Rfid />} />
          <Route path="ai-agent" element={<AiAgent />} />
          <Route path="lessons" element={<Lessons />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="reports" element={<Reports />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="settings" element={<Settings />} />
          <Route path="activity" element={<ActivityLogs />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" richColors closeButton />
    </BrowserRouter>
  );
}
