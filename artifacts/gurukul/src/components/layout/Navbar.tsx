import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/courses", label: "Courses" },
  { href: "/announcements", label: "Announcements" },
  { href: "/calendar", label: "Calendar" },
  { href: "/parents", label: "Parents Portal" },
  { href: "/contact", label: "Contact Us" },
];

const REGISTER_HREF = "/register";

export function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <>
      <div className="h-1 bg-gradient-to-r from-secondary via-primary to-accent w-full fixed top-0 z-50" />
      <header
        className={cn(
          "fixed top-1 left-0 right-0 z-40 transition-all duration-300 border-b",
          isScrolled
            ? "bg-white/90 backdrop-blur-md shadow-sm border-border/50 py-3"
            : "bg-transparent border-transparent py-5"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-xl leading-none text-secondary">
                  Bhartiya Hindu Temple
                </span>
                <span className="text-sm font-medium text-primary tracking-widest uppercase">
                  Gurukul
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary",
                    location === link.href
                      ? "text-primary bg-primary/5"
                      : "text-foreground/80"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={REGISTER_HREF}
                className={cn(
                  "ml-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 shadow-sm",
                  location === REGISTER_HREF
                    ? "bg-primary text-white"
                    : "bg-primary text-white hover:bg-primary/90 hover:shadow-md"
                )}
              >
                Register Now
              </Link>
            </nav>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-foreground/80 hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-30 pt-24 bg-white/95 backdrop-blur-xl lg:hidden"
          >
            <nav className="flex flex-col items-center gap-6 p-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-xl font-display font-bold transition-colors",
                    location === link.href ? "text-primary" : "text-secondary"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={REGISTER_HREF}
                className="mt-2 px-8 py-3 bg-primary text-white rounded-full text-xl font-display font-bold shadow-md hover:bg-primary/90 transition-colors"
              >
                Register Now
              </Link>
            </nav>
            <div className="absolute bottom-10 left-0 right-0 flex justify-center opacity-20 pointer-events-none">
               <img src={`${import.meta.env.BASE_URL}images/lotus-motif.png`} alt="" className="w-48 h-48 opacity-20" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
