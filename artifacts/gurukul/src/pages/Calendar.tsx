import { PageHeader } from "@/components/layout/PageHeader";
import { useListEvents } from "@workspace/api-client-react";
import { format, isFuture, parseISO } from "date-fns";
import { MapPin, Clock, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

export default function Calendar() {
  const { data: events = [], isLoading } = useListEvents();

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => 
    parseISO(a.date).getTime() - parseISO(b.date).getTime()
  );

  const upcomingEvents = sortedEvents.filter(e => isFuture(parseISO(e.date)));
  const pastEvents = sortedEvents.filter(e => !isFuture(parseISO(e.date))).reverse();

  const EventCard = ({ event }: { event: any }) => (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-border hover:shadow-lg transition-all flex flex-col sm:flex-row gap-6">
      <div className="sm:w-48 shrink-0 text-center sm:text-left sm:border-r border-border pr-6">
        <div className="text-sm font-bold text-primary uppercase tracking-wider mb-1">
          {format(parseISO(event.date), "MMM")}
        </div>
        <div className="text-5xl font-display font-bold text-secondary mb-2">
          {format(parseISO(event.date), "dd")}
        </div>
        <div className="text-sm text-muted-foreground font-medium">
          {format(parseISO(event.date), "EEEE")}
        </div>
      </div>
      
      <div className="flex-1">
        <div className="inline-block px-3 py-1 bg-accent/20 text-accent-foreground text-xs font-bold rounded-full mb-3">
          {event.category}
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-3">{event.title}</h3>
        <p className="text-muted-foreground mb-4">{event.description}</p>
        
        <div className="flex flex-wrap gap-4 text-sm font-medium text-foreground/80 bg-background/50 p-3 rounded-xl inline-flex">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            {event.time}
          </div>
          <div className="w-px h-4 bg-border hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            {event.location}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader 
        title="Academic Calendar" 
        description="Important dates, festivals, and events at the Gurukul."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Upcoming Events */}
            <section>
              <h2 className="text-2xl font-display font-bold text-secondary mb-6 flex items-center gap-3">
                <CalendarDays className="w-6 h-6 text-primary" /> Upcoming Events
              </h2>
              <div className="space-y-6">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <EventCard event={event} />
                    </motion.div>
                  ))
                ) : (
                  <p className="text-muted-foreground p-8 bg-white rounded-xl text-center border border-dashed">No upcoming events scheduled at this moment.</p>
                )}
              </div>
            </section>

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <section className="opacity-70 grayscale-[30%]">
                <h2 className="text-2xl font-display font-bold text-secondary mb-6 flex items-center gap-3">
                  Past Events
                </h2>
                <div className="space-y-6">
                  {pastEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
