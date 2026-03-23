import { Switch, Route, Redirect } from "wouter";
import { useLocation } from "wouter";
import { AuthProvider, useAuth } from "./AuthContext";
import { canAccess, getDefaultRoute, type Permission } from "./rbac";
import AdminLogin from "./AdminLogin";
import AdminLayout from "./AdminLayout";
import Dashboard from "./pages/Dashboard";
import AdminAnnouncements from "./pages/Announcements";
import CalendarAdmin from "./pages/CalendarAdmin";
import CoursesAdmin from "./pages/CourseManagement";
import Teachers from "./pages/Teachers";
import Students from "./pages/Students";
import Inventory from "./pages/Inventory";
import Settings from "./pages/Settings";
import CourseDocuments from "./pages/CourseDocuments";
import Attendance from "./pages/Attendance";
import ParentNotifications from "./pages/ParentNotifications";
import RoleManagement from "./pages/RoleManagement";
import AccessDenied from "./components/AccessDenied";

function ProtectedRoute({
  children,
  permission,
}: {
  children: React.ReactNode;
  permission?: Permission;
}) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  if (!user) {
    setLocation("/admin/login");
    return null;
  }

  if (permission && !canAccess(user.role, permission)) {
    return (
      <AdminLayout>
        <AccessDenied />
      </AdminLayout>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}

function AdminRoutes() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />

      <Route path="/admin/dashboard">
        <ProtectedRoute permission="dashboard"><Dashboard /></ProtectedRoute>
      </Route>
      <Route path="/admin/announcements">
        <ProtectedRoute permission="announcements"><AdminAnnouncements /></ProtectedRoute>
      </Route>
      <Route path="/admin/calendar">
        <ProtectedRoute permission="calendar"><CalendarAdmin /></ProtectedRoute>
      </Route>
      <Route path="/admin/courses">
        <ProtectedRoute permission="courses"><CoursesAdmin /></ProtectedRoute>
      </Route>
      <Route path="/admin/teachers">
        <ProtectedRoute permission="teachers"><Teachers /></ProtectedRoute>
      </Route>
      <Route path="/admin/students">
        <ProtectedRoute permission="students"><Students /></ProtectedRoute>
      </Route>
      <Route path="/admin/inventory">
        <ProtectedRoute permission="inventory"><Inventory /></ProtectedRoute>
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute permission="settings"><Settings /></ProtectedRoute>
      </Route>

      {/* New shared pages */}
      <Route path="/admin/documents">
        <ProtectedRoute permission="documents"><CourseDocuments /></ProtectedRoute>
      </Route>
      <Route path="/admin/attendance">
        <ProtectedRoute permission="attendance"><Attendance /></ProtectedRoute>
      </Route>
      <Route path="/admin/notifications">
        <ProtectedRoute permission="notifications"><ParentNotifications /></ProtectedRoute>
      </Route>

      {/* Admin-only pages */}
      <Route path="/admin/roles">
        <ProtectedRoute permission="roles"><RoleManagement /></ProtectedRoute>
      </Route>

      <Route path="/admin">
        {user ? <Redirect to={getDefaultRoute(user.role)} /> : <Redirect to="/admin/login" />}
      </Route>

      <Route path="/admin/:rest*">
        {user ? <Redirect to={getDefaultRoute(user.role)} /> : <Redirect to="/admin/login" />}
      </Route>
    </Switch>
  );
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <AdminRoutes />
    </AuthProvider>
  );
}
