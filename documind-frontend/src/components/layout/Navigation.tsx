import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProductsDropdown from "@/components/navigation/ProductsDropdown";
import { Menu, X, User, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

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
            <Link to="/products/security" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Security
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link to="/resources" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Resources
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative h-8 w-8 rounded-lg hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black">
                    <Avatar className="h-8 w-8 ring-1 ring-white/15 ring-offset-0 transition-all duration-200 hover:ring-white/30">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-white/10 text-white font-semibold text-[11px] border border-white/15">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px] rounded-lg border border-white/10 bg-black/98 backdrop-blur-xl shadow-xl p-1.5 overflow-hidden">
                  {/* Profile Header */}
                  <div className="px-3 py-2.5 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8 ring-1 ring-white/15">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-white/10 text-white font-semibold text-[11px] border border-white/15">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white leading-tight truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-white/60 leading-tight truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <DropdownMenuItem asChild className="px-0 mx-0">
                      <Link 
                        to="/app" 
                        className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-white/90 hover:text-white transition-colors duration-150 hover:bg-white/10 rounded-md w-full"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5 text-white/60" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="px-0 mx-0">
                      <Link 
                        to="/app/profile" 
                        className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-white/90 hover:text-white transition-colors duration-150 hover:bg-white/10 rounded-md w-full"
                      >
                        <User className="h-3.5 w-3.5 text-white/60" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="px-0 mx-0">
                      <Link 
                        to="/app/settings" 
                        className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-white/90 hover:text-white transition-colors duration-150 hover:bg-white/10 rounded-md w-full"
                      >
                        <Settings className="h-3.5 w-3.5 text-white/60" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>

                  {/* Logout Section */}
                  <div className="border-t border-white/10 pt-1">
                    <button
                      onClick={async () => {
                        await logout();
                        navigate("/login");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-red-400 hover:text-red-300 transition-colors duration-150 hover:bg-red-500/10 rounded-md"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="text-white/60 hover:text-white hover:bg-white/5"
                  asChild
                >
                  <Link to="/login">Log in</Link>
                </Button>
                <Button 
                  className="bg-white text-black hover:bg-white/90 font-medium"
                  asChild
                >
                  <Link to="/login">Start building</Link>
                </Button>
              </>
            )}
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
            <Link to="/products/security" className="block text-sm font-medium text-white/60 hover:text-white">
              Security
            </Link>
            <Link to="/pricing" className="block text-sm font-medium text-white/60 hover:text-white">
              Pricing
            </Link>
            <Link to="/resources" className="block text-sm font-medium text-white/60 hover:text-white">
              Resources
            </Link>
            <div className="pt-4 space-y-2">
              {isAuthenticated && user ? (
                <>
                  <div className="px-4 py-3 border-t border-white/10">
                    <div className="flex items-center gap-2.5 mb-3">
                      <Avatar className="h-8 w-8 ring-1 ring-white/15">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-white/10 text-white font-semibold text-[11px] border border-white/15">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white leading-tight truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-white/60 leading-tight truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Link to="/app" className="block text-[13px] font-medium text-white/80 hover:text-white mb-1.5">
                      Dashboard
                    </Link>
                    <Link to="/app/profile" className="block text-[13px] font-medium text-white/80 hover:text-white mb-1.5">
                      Profile
                    </Link>
                    <Link to="/app/settings" className="block text-[13px] font-medium text-white/80 hover:text-white mb-1.5">
                      Settings
                    </Link>
                    <button
                      onClick={async () => {
                        await logout();
                        navigate("/login");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left text-[13px] font-medium text-red-400 hover:text-red-300 mt-2"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="w-full text-white/60 hover:text-white hover:bg-white/5" asChild>
                    <Link to="/login">Log in</Link>
                  </Button>
                  <Button className="w-full bg-white text-black hover:bg-white/90 font-medium" asChild>
                    <Link to="/login">Start building</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;

