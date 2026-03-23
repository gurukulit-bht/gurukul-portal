import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NaradJi } from "@/components/NaradJi";

import Home from "@/pages/Home";
import About from "@/pages/About";
import Courses from "@/pages/Courses";
import Announcements from "@/pages/Announcements";
import Calendar from "@/pages/Calendar";
import ParentsPortal from "@/pages/ParentsPortal";
import Contact from "@/pages/Contact";
import Register from "@/pages/Register";
import NotFound from "@/pages/not-found";
import AdminApp from "@/admin/AdminApp";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-[72px]">
        {children}
      </main>
      <Footer />
      <NaradJi />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/admin/:rest*" component={AdminApp} />
      <Route path="/admin" component={AdminApp} />
      <Route>
        <PublicLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/about" component={About} />
            <Route path="/courses" component={Courses} />
            <Route path="/announcements" component={Announcements} />
            <Route path="/calendar" component={Calendar} />
            <Route path="/parents" component={ParentsPortal} />
            <Route path="/register" component={Register} />
            <Route path="/contact" component={Contact} />
            <Route component={NotFound} />
          </Switch>
        </PublicLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
