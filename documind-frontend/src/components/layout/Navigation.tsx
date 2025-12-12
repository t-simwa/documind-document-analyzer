import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProductsDropdown from "@/components/navigation/ProductsDropdown";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Smooth scroll for anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="#"]');
      if (link) {
        const href = link.getAttribute('href');
        if (href && href !== '#') {
          e.preventDefault();
          const element = document.querySelector(href);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setMobileMenuOpen(false);
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return (
    <nav className="fixed top-0 w-full bg-black/80 backdrop-blur-xl border-b border-white/10 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="relative w-6 h-6">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path 
                  d="M12 2L2 19.5h20L12 2z" 
                  fill="currentColor"
                  className="text-white"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">
              DocuMind AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <ProductsDropdown />
            <Link to="/#features" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Features
            </Link>
            <Link to="/#security" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Security
            </Link>
            <Link to="/#pricing" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link to="/#resources" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Resources
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button 
              variant="ghost" 
              className="text-white/60 hover:text-white hover:bg-white/5"
              asChild
            >
              <Link to="/app">Log in</Link>
            </Button>
            <Button 
              className="bg-white text-black hover:bg-white/90 font-medium"
              asChild
            >
              <Link to="/app">Start building</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white/60 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-black">
          <div className="px-4 py-4 space-y-3">
            <Link to="/products" className="block text-sm font-medium text-white hover:text-white">
              Products
            </Link>
            <Link to="/#features" className="block text-sm font-medium text-white/60 hover:text-white">
              Features
            </Link>
            <Link to="/#security" className="block text-sm font-medium text-white/60 hover:text-white">
              Security
            </Link>
            <Link to="/#pricing" className="block text-sm font-medium text-white/60 hover:text-white">
              Pricing
            </Link>
            <Link to="/#resources" className="block text-sm font-medium text-white/60 hover:text-white">
              Resources
            </Link>
            <div className="pt-4 space-y-2">
              <Button variant="ghost" className="w-full text-white/60 hover:text-white hover:bg-white/5" asChild>
                <Link to="/app">Log in</Link>
              </Button>
              <Button className="w-full bg-white text-black hover:bg-white/90 font-medium" asChild>
                <Link to="/app">Start building</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;

