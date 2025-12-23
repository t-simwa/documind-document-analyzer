import { Link } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

const PageLayout = ({ children, title, description }: PageLayoutProps) => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight mb-4 text-white leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm sm:text-base lg:text-lg text-white/60 mb-8 max-w-2xl mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {children}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="relative w-4 h-4">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path 
                      d="M12 2L2 19.5h20L12 2z" 
                      fill="currentColor"
                      className="text-white"
                    />
                  </svg>
                </div>
                <span className="font-medium text-white text-xs">DocuMind AI</span>
              </div>
              <p className="text-xs text-white/60">
                Intelligent document analysis with enterprise-grade security.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-white text-xs">Product</h3>
              <ul className="space-y-2 text-xs">
                <li><Link to="/products" className="text-white/60 hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/#pricing" className="text-white/60 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/products/security" className="text-white/60 hover:text-white transition-colors">Security</Link></li>
                <li><Link to="/app" className="text-white/60 hover:text-white transition-colors">Sign in</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-white text-xs">Resources</h3>
              <ul className="space-y-2 text-xs">
                <li><Link to="/resources" className="text-white/60 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="/resources" className="text-white/60 hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/resources" className="text-white/60 hover:text-white transition-colors">Case studies</Link></li>
                <li><Link to="/resources" className="text-white/60 hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-white text-xs">Company</h3>
              <ul className="space-y-2 text-xs">
                <li><Link to="/#about" className="text-white/60 hover:text-white transition-colors">About</Link></li>
                <li><Link to="/#contact" className="text-white/60 hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/#careers" className="text-white/60 hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/#privacy" className="text-white/60 hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-white/60">
              © 2024 DocuMind AI. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-white/60">
              <Link to="#terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="#privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/products/security" className="hover:text-white transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PageLayout;

