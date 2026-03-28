import { PageHeader } from "@/components/layout/PageHeader";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";

export default function About() {
  const { get } = useSiteContent();

  const coreValues = get("about_core_values")
    .split("\n")
    .map(v => v.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="About Our Gurukul" 
        description={get("about_header_desc")}
      />

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-display font-bold text-secondary mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {get("about_mission_p1")}
              </p>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {get("about_mission_p2")}
              </p>

              <h3 className="text-2xl font-bold text-foreground mb-4">Core Values</h3>
              <ul className="space-y-4">
                {coreValues.map((value, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-foreground font-medium">
                    <CheckCircle2 className="text-primary w-6 h-6 shrink-0" />
                    {value}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square bg-gradient-to-tr from-secondary/10 to-accent/10 rounded-full absolute -inset-6 blur-3xl z-0" />
              <img 
                src={`${import.meta.env.BASE_URL}images/about-temple.png`}
                alt="Temple View" 
                className="relative z-10 rounded-2xl shadow-2xl w-full object-cover aspect-[4/5]"
              />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
