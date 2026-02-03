import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-muted text-muted-foreground py-6 px-4 md:px-6 mt-auto">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
        <p className="text-sm">&copy; 2024 Yokester. All rights reserved.</p>
        <nav className="flex items-center gap-4 md:gap-6 mt-4 md:mt-0">
          <Link to="/terms" className="text-sm hover:underline">
            Terms of Service
          </Link>
          <Link to="/privacy" className="text-sm hover:underline">
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
