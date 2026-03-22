import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="text-9xl font-display font-bold text-secondary mb-4">404</h1>
        <h2 className="text-3xl font-bold text-foreground mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The path you are looking for might have been moved or doesn't exist. Let's guide you back to the right path.
        </p>
        <Button size="lg" asChild>
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}
