import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubmitContact } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Phone, Mail } from "lucide-react";

// Reuse the schema but make course stuff optional for general contact
const formSchema = z.object({
  parentName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  childName: z.string().optional().default("N/A"), // backend expects it, dummy value for general contact
  courseInterest: z.string().optional().default("General Inquiry"),
  message: z.string().min(10, "Please provide a detailed message"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Contact() {
  const submitMutation = useSubmitContact();
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormValues) => {
    submitMutation.mutate({ data }, {
      onSuccess: () => {
        setIsSuccess(true);
        reset();
        toast({
          title: "Message Sent",
          description: "Thank you for reaching out. We will reply soon.",
        });
        setTimeout(() => setIsSuccess(false), 5000);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Failed to send",
          description: "Please try again later.",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader 
        title="Contact Us" 
        description="We are here to answer your questions and welcome you to our community."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid lg:grid-cols-5 gap-12">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-secondary text-white rounded-3xl p-8 shadow-xl relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                <img src={`${import.meta.env.BASE_URL}images/hero-mandala.png`} alt="" className="w-64 h-64 object-cover rounded-full" />
              </div>

              <h2 className="text-3xl font-display font-bold mb-8 relative z-10 text-accent">Get in Touch</h2>
              
              <div className="space-y-8 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Temple Location</h4>
                    <p className="text-white/80 leading-relaxed">
                      3671 Hyatts Rd<br />
                      Powell, OH 43065
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Phone</h4>
                    <p className="text-white/80 leading-relaxed">
                      (740) 369-0717
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Email</h4>
                    <p className="text-white/80 leading-relaxed">
                      gurukul@templewebsite.org<br />
                      info@templewebsite.org
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white rounded-3xl p-8 shadow-xl border border-border/50">
            <h2 className="text-2xl font-bold text-secondary mb-6">Send a Message</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="parentName">Your Name *</Label>
                  <Input id="parentName" {...register("parentName")} className={errors.parentName ? "border-destructive" : ""} />
                  {errors.parentName && <p className="text-sm text-destructive">{errors.parentName.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" type="email" {...register("email")} className={errors.email ? "border-destructive" : ""} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input id="phone" type="tel" {...register("phone")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea id="message" {...register("message")} rows={6} className={errors.message ? "border-destructive" : ""} />
                {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
              </div>

              <Button type="submit" size="lg" className="w-full md:w-auto px-12" disabled={submitMutation.isPending || isSuccess}>
                {submitMutation.isPending ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...</>
                ) : isSuccess ? (
                  "Message Sent!"
                ) : (
                  "Send Message"
                )}
              </Button>
            </form>
          </div>

        </div>

        {/* Map Placeholder */}
        <div className="mt-16 bg-muted rounded-3xl h-[400px] w-full relative overflow-hidden flex items-center justify-center border border-border">
          <div className="text-center">
             <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
             <p className="text-muted-foreground font-medium text-lg">Interactive Map Embed Placeholder</p>
          </div>
        </div>

      </div>
    </div>
  );
}
