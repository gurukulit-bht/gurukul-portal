import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="relative pt-32 pb-20 overflow-hidden bg-secondary">
      {/* Abstract pattern background */}
      <div className="absolute inset-0 opacity-10">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-mandala.png`} 
          alt="" 
          className="w-full h-full object-cover mix-blend-overlay"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-secondary to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <img 
            src={`${import.meta.env.BASE_URL}images/lotus-motif.png`} 
            alt="Lotus" 
            className="w-12 h-12 mx-auto mb-6 opacity-80 filter brightness-0 invert"
          />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl mx-auto text-lg text-white/80">
              {description}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
