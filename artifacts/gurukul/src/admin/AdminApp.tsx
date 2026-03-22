import { Switch, Route, Redirect } from "wouter";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { isAdminAuthenticated } from "./auth";
import AdminLogin from "./AdminLogin";
import AdminLayout from "./AdminLayout";
import Dashboard from "./pages/Dashboard";
import AdminAnnouncements from "./pages/Announcements";
import CalendarAdmin from "./pages/CalendarAdmin";
import CoursesAdmin from "./pages/CoursesAdmin";
import Teachers from "./pages/Teachers";
import Students from "./pages/Students";
import Inventory from "./pages/Inventory";
import Settings from "./pages/Settings";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!isAdminAuthenticated()) setLocation("/admin/login");
  }, []);
  if (!isAdminAuthenticated()) return null;
  return <AdminLayout>{children}</AdminLayout>;
}

export default function AdminApp() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard">
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      </Route>
      <Route path="/admin/announcements">
        <ProtectedRoute><AdminAnnouncements /></ProtectedRoute>
      </Route>
      <Route path="/admin/calendar">
        <ProtectedRoute><CalendarAdmin /></ProtectedRoute>
      </Route>
      <Route path="/admin/courses">
        <ProtectedRoute><CoursesAdmin /></ProtectedRoute>
      </Route>
      <Route path="/admin/teachers">
        <ProtectedRoute><Teachers /></ProtectedRoute>
      </Route>
      <Route path="/admin/students">
        <ProtectedRoute><Students /></ProtectedRoute>
      </Route>
      <Route path="/admin/inventory">
        <ProtectedRoute><Inventory /></ProtectedRoute>
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute><Settings /></ProtectedRoute>
      </Route>
      <Route path="/admin">
        {isAdminAuthenticated() ? <Redirect to="/admin/dashboard" /> : <Redirect to="/admin/login" />}
      </Route>
    </Switch>
  );
}
