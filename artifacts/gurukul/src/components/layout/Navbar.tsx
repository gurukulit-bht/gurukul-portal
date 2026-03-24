import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/courses", label: "Courses" },
  { href: "/parents", label: "Parents Portal" },
  { href: "/weekly-updates", label: "Weekly Updates" },
  { href: "/students-corner", label: "🎉 Student's Corner" },
  { href: "/announcements", label: "Announcements" },
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
          "fixed top-1 left-0 right-0 z-40 transition-all duration-300 border-b border-border/40",
          isScrolled
            ? "bg-background/95 backdrop-blur-md shadow-md py-3"
            : "bg-background/80 backdrop-blur-sm shadow-sm py-4"
        )}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform ring-2 ring-primary/10">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-xl leading-none text-secondary tracking-tight">
                  Bhartiya Hindu Temple
                </span>
                <span className="text-xs sm:text-sm font-semibold text-primary tracking-[0.24em] uppercase">
                  Gurukul
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0.5 whitespace-nowrap">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-2.5 py-2 rounded-full text-[12px] xl:text-[13px] 2xl:text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary",
                    location === link.href
                      ? "text-primary bg-primary/10"
                      : "text-foreground/75"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={REGISTER_HREF}
                className={cn(
                  "ml-1 px-3 py-2 rounded-full text-[12px] xl:text-[13px] 2xl:text-sm font-semibold transition-all duration-200 shadow-sm whitespace-nowrap",
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
            className="fixed inset-0 z-30 pt-24 bg-background/98 backdrop-blur-xl lg:hidden"
          >
            <nav className="flex flex-col items-center gap-5 p-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-xl font-display font-bold transition-colors px-4 py-2 rounded-full",
                    location === link.href ? "text-primary bg-primary/10" : "text-secondary"
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
            <div className="absolute bottom-10 left-0 right-0 flex justify-center opacity-15 pointer-events-none">
               <img src={`${import.meta.env.BASE_URL}images/lotus-motif.png`} alt="" className="w-48 h-48 opacity-20" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
