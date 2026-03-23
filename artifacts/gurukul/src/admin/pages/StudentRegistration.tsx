import { useState } from "react";
import { useLocation } from "wouter";
import { StudentRegistrationForm } from "@/components/StudentRegistrationForm";
import { CheckCircle2, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudentRegistration() {
  const [, setLocation] = useLocation();
  const [success, setSuccess] = useState<{ code: string; name: string } | null>(null);

  function handleSuccess(studentCode: string, studentName: string) {
    setSuccess({ code: studentCode, name: studentName });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleAnother() {
    setSuccess(null);
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-3xl border border-border p-10 text-center space-y-6 shadow-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-secondary">Registration Complete!</h2>
            <p className="text-muted-foreground mt-2">
              <span className="font-semibold text-secondary">{success.name}</span> has been successfully
              registered with student ID{" "}
              <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                {success.code}
              </span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={handleAnother}>
              Register Another Student
            </Button>
            <Button onClick={() => setLocation("/admin/students")} className="gap-2">
              <Users className="w-4 h-4" /> View Students List <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-secondary">Student Registration</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Register a new student and enroll them in one or more Gurukul courses.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
        <StudentRegistrationForm
          onSuccess={handleSuccess}
          onBack={() => setLocation("/admin/students")}
          submitLabel="Register Student"
          adminMode={true}
        />
      </div>
    </div>
  );
}
