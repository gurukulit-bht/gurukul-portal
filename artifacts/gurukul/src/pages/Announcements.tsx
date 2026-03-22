import { PageHeader } from "@/components/layout/PageHeader";
import { useListAnnouncements } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Bell, AlertTriangle, Calendar as CalIcon, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Announcements() {
  const { data: announcements = [], isLoading } = useListAnnouncements();

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader 
        title="Announcements" 
        description="Stay updated with the latest news, notices, and updates from the Gurukul administration."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse shadow-sm" />)}
          </div>
        ) : (
          <div className="space-y-6">
            {announcements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "bg-white rounded-2xl p-6 sm:p-8 shadow-md border-l-4 transition-all hover:shadow-lg",
                  announcement.isUrgent 
                    ? "border-l-destructive ring-1 ring-destructive/10" 
                    : "border-l-primary"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    {announcement.isUrgent ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-destructive/10 text-destructive rounded-full text-sm font-bold animate-pulse">
                        <AlertTriangle className="w-4 h-4" /> Urgent
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Bell className="w-5 h-5" />
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-foreground">{announcement.title}</h3>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5 bg-secondary/5 px-3 py-1 rounded-full text-secondary font-medium">
                      <Tag className="w-3.5 h-3.5" />
                      {announcement.category}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalIcon className="w-4 h-4" />
                      {format(new Date(announcement.date), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>

                <p className="text-muted-foreground text-base leading-relaxed sm:ml-13">
                  {announcement.content}
                </p>
              </motion.div>
            ))}

            {announcements.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-border">
                <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground font-medium">No announcements at this time.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
