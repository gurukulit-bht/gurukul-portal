import { ShieldOff } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "../AuthContext";
import { getRoleLabel } from "../rbac";

export default function AccessDenied() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
        <ShieldOff className="w-10 h-10 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-secondary mb-2">Access Denied</h2>
      <p className="text-muted-foreground max-w-md mb-2">
        You don't have permission to view this page.
      </p>
      {user && (
        <p className="text-sm text-muted-foreground mb-6">
          Your current role is <span className="font-semibold">{getRoleLabel(user.role)}</span>.
        </p>
      )}
      <Link href="/admin/courses" className="text-sm text-primary underline underline-offset-4 hover:text-primary/80">
        ← Go to Courses
      </Link>
    </div>
  );
}
