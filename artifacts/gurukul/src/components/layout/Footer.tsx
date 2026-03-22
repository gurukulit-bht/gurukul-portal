import { Link } from "wouter";
import { BookOpen, MapPin, Phone, Mail, Facebook, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground pt-16 pb-8 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 opacity-5 pointer-events-none transform translate-x-1/3 -translate-y-1/3">
        <img src={`${import.meta.env.BASE_URL}images/hero-mandala.png`} alt="" className="w-96 h-96 object-cover rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-secondary">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-xl text-white">
                BHT Gurukul
              </span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Nurturing the next generation with the profound wisdom, culture, and values of Sanatana Dharma in a welcoming community environment.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent hover:text-secondary transition-colors text-white">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent hover:text-secondary transition-colors text-white">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-display font-bold text-lg text-accent mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-white/80 hover:text-accent transition-colors">About Gurukul</Link></li>
              <li><Link href="/courses" className="text-white/80 hover:text-accent transition-colors">Courses Offered</Link></li>
              <li><Link href="/calendar" className="text-white/80 hover:text-accent transition-colors">Academic Calendar</Link></li>
              <li><Link href="/parents" className="text-white/80 hover:text-accent transition-colors">Parents Portal</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-lg text-accent mb-6">Contact Info</h3>
            <ul className="space-y-4">
              <li className="flex gap-3 text-white/80">
                <MapPin className="w-5 h-5 text-accent shrink-0" />
                <span>3671 Hyatts Rd<br/>Powell, OH 43065</span>
              </li>
              <li className="flex gap-3 text-white/80">
                <Phone className="w-5 h-5 text-accent shrink-0" />
                <span>(740) 369-0717</span>
              </li>
              <li className="flex gap-3 text-white/80">
                <Mail className="w-5 h-5 text-accent shrink-0" />
                <span>gurukul@bhtohio.org</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-lg text-accent mb-6">Support Us</h3>
            <p className="text-white/70 text-sm mb-4">
              Your contributions help us maintain and grow our educational programs for the community.
            </p>
            <button className="px-6 py-3 bg-accent text-secondary font-bold rounded-xl hover:bg-white transition-colors w-full text-center">
              Donate Now
            </button>
          </div>

        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} Bhartiya Hindu Temple Gurukul. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-white/50">
            <a href="#" className="hover:text-accent transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-accent transition-colors">Terms of Service</a>
            <Link href="/admin/login" className="hover:text-accent transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
