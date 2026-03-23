import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubmitContact, useListCourses } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

const formSchema = z.object({
  motherName:     z.string().optional(),
  motherPhone:    z.string().optional(),
  motherEmail:    z.string().email("Invalid email").optional().or(z.literal("")),
  fatherName:     z.string().optional(),
  fatherPhone:    z.string().optional(),
  fatherEmail:    z.string().email("Invalid email").optional().or(z.literal("")),
  childName:      z.string().min(2, "Child name is required"),
  childAge:       z.coerce.number().min(3, "Child must be at least 3").max(18, "Age limit is 18").optional(),
  courseInterest: z.string().min(1, "Please select a course"),
  message:        z.string().optional(),
}).refine(d => d.motherName?.trim() || d.fatherName?.trim(), {
  message: "Please provide at least one parent's name",
  path: ["motherName"],
});

type FormValues = z.infer<typeof formSchema>;

export default function ParentsPortal() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const preselectedCourse = searchParams.get("course") || "";

  const { data: courses = [] } = useListCourses();
  const submitMutation = useSubmitContact();
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseInterest: preselectedCourse,
    }
  });

  // Keep select value in sync with react-hook-form
  const selectedCourse = watch("courseInterest");

  const onSubmit = (data: FormValues) => {
    submitMutation.mutate({ data }, {
      onSuccess: () => {
        setIsSuccess(true);
        toast({
          title: "Registration Submitted",
          description: "We will contact you shortly regarding enrollment.",
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: "Please try again later.",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader 
        title="Parents Portal" 
        description="Enroll your child for upcoming sessions or contact administration."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-3xl shadow-xl border border-border/50 overflow-hidden">
          <div className="bg-primary/5 p-8 border-b border-border/50">
            <h2 className="text-2xl font-display font-bold text-secondary">Student Enrollment Application</h2>
            <p className="text-muted-foreground mt-2">Fill out the form below to register your child. Our team will review and get back to you with schedule details.</p>
          </div>

          <div className="p-8">
            {isSuccess ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-3xl font-display font-bold text-secondary mb-4">Application Received!</h3>
                <p className="text-lg text-muted-foreground mb-8">Thank you for registering. Om Shanti.</p>
                <Button onClick={() => setIsSuccess(false)} variant="outline">Submit Another Application</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Mother */}
                <div>
                  <p className="text-sm font-semibold text-pink-600 mb-3">Mother's Information</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="motherName">Mother's Name *</Label>
                      <Input id="motherName" {...register("motherName")} className={errors.motherName ? "border-destructive" : ""} />
                      {errors.motherName && <p className="text-sm text-destructive">{errors.motherName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motherPhone">Mother's Phone</Label>
                      <Input id="motherPhone" type="tel" {...register("motherPhone")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motherEmail">Mother's Email</Label>
                      <Input id="motherEmail" type="email" {...register("motherEmail")} className={errors.motherEmail ? "border-destructive" : ""} />
                      {errors.motherEmail && <p className="text-sm text-destructive">{errors.motherEmail.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Father */}
                <div>
                  <p className="text-sm font-semibold text-blue-600 mb-3">Father's Information</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fatherName">Father's Name</Label>
                      <Input id="fatherName" {...register("fatherName")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fatherPhone">Father's Phone</Label>
                      <Input id="fatherPhone" type="tel" {...register("fatherPhone")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fatherEmail">Father's Email</Label>
                      <Input id="fatherEmail" type="email" {...register("fatherEmail")} className={errors.fatherEmail ? "border-destructive" : ""} />
                      {errors.fatherEmail && <p className="text-sm text-destructive">{errors.fatherEmail.message}</p>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="childName">Child's Name *</Label>
                    <Input id="childName" {...register("childName")} className={errors.childName ? "border-destructive" : ""} />
                    {errors.childName && <p className="text-sm text-destructive">{errors.childName.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="childAge">Child's Age</Label>
                    <Input id="childAge" type="number" {...register("childAge")} className={errors.childAge ? "border-destructive" : ""} />
                    {errors.childAge && <p className="text-sm text-destructive">{errors.childAge.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="courseInterest">Select Course *</Label>
                    <Select value={selectedCourse} onValueChange={(val) => setValue("courseInterest", val)}>
                      <SelectTrigger className={errors.courseInterest ? "border-destructive" : ""}>
                        <SelectValue placeholder="Choose a course..." />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map(c => (
                          <SelectItem key={c.id} value={c.name}>{c.name} ({c.ageGroup})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.courseInterest && <p className="text-sm text-destructive">{errors.courseInterest.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Additional Notes or Questions</Label>
                  <Textarea id="message" {...register("message")} rows={4} placeholder="Any prior experience, special needs, or questions..." />
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting Application...</>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
