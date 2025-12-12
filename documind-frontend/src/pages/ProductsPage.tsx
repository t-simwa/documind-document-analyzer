import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/layout/Navigation";
import { ArrowRight } from "lucide-react";
import ContactDemoDialog from "@/components/contact/ContactDemoDialog";

// Custom Icon Components - Sophisticated, minimal designs
const FeaturesIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="8" y="6" width="32" height="36" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M14 14h20M14 20h16M14 26h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <circle cx="36" cy="12" r="2" fill="currentColor" opacity="0.15"/>
    <path d="M34 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.2"/>
    <rect x="12" y="32" width="24" height="2" rx="1" fill="currentColor" opacity="0.1"/>
    <rect x="12" y="36" width="20" height="2" rx="1" fill="currentColor" opacity="0.1"/>
  </svg>
);

const AIIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="8" y="6" width="32" height="36" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M14 14h20M14 20h16M14 26h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <circle cx="24" cy="34" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
    <path d="M20 34l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.2"/>
  </svg>
);

const SecurityIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="8" y="6" width="32" height="36" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M14 14h20M14 20h16M14 26h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <circle cx="36" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
    <path d="M34 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.2"/>
    <rect x="12" y="32" width="24" height="2" rx="1" fill="currentColor" opacity="0.1"/>
  </svg>
);

const IntegrationsIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="8" y="10" width="32" height="28" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M14 18h20M14 24h16M14 30h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <circle cx="36" cy="20" r="2" fill="currentColor" opacity="0.15"/>
    <circle cx="36" cy="26" r="2" fill="currentColor" opacity="0.15"/>
    <circle cx="36" cy="32" r="2" fill="currentColor" opacity="0.15"/>
    <path d="M10 6l4 4-4 4M38 6l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.2"/>
  </svg>
);

const AnalyticsIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path d="M8 38L16 28l8 8 8-12 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.4"/>
    <path d="M8 38h32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <path d="M8 38v-32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <circle cx="16" cy="28" r="2" fill="currentColor" opacity="0.15"/>
    <circle cx="24" cy="36" r="2" fill="currentColor" opacity="0.15"/>
    <circle cx="32" cy="24" r="2" fill="currentColor" opacity="0.15"/>
    <circle cx="40" cy="30" r="2" fill="currentColor" opacity="0.15"/>
  </svg>
);

const MobileIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="12" y="6" width="24" height="36" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <rect x="16" y="10" width="16" height="24" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
    <circle cx="24" cy="38" r="2" fill="currentColor" opacity="0.15"/>
    <path d="M18 16h12M18 20h10M18 24h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
  </svg>
);

const ProductsPage = () => {
  const [isDemoDialogOpen, setIsDemoDialogOpen] = useState(false);

  const productCategories = [
    { 
      id: "features", 
      label: "Features", 
      icon: FeaturesIcon, 
      href: "/products/features", 
      description: "Powerful tools for document analysis",
      stat: "Core capabilities"
    },
    { 
      id: "ai", 
      label: "AI & Intelligence", 
      icon: AIIcon, 
      href: "/products/ai", 
      description: "Advanced AI capabilities and RAG technology",
      stat: "Intelligent"
    },
    { 
      id: "security", 
      label: "Security", 
      icon: SecurityIcon, 
      href: "/products/security", 
      description: "Enterprise-grade security and compliance",
      stat: "Enterprise-ready"
    },
    { 
      id: "integrations", 
      label: "Integrations", 
      icon: IntegrationsIcon, 
      href: "/products/integrations", 
      description: "Connect with your existing tools",
      stat: "100+ integrations"
    },
    { 
      id: "analytics", 
      label: "Analytics", 
      icon: AnalyticsIcon, 
      href: "/products/analytics", 
      description: "Track usage and gain insights",
      stat: "Data-driven"
    },
    { 
      id: "mobile", 
      label: "Mobile", 
      icon: MobileIcon, 
      href: "/products/mobile", 
      description: "Access from anywhere",
      stat: "Always available"
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white leading-tight">
            Everything you need to analyze documents
          </h1>
          <p className="text-xl sm:text-2xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            A complete platform for intelligent document understanding, analysis, and insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-white/90 font-medium text-base px-8 h-12"
              asChild
            >
              <Link to="/products/features">
                Explore Features
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/5 font-medium text-base px-8 h-12"
              asChild
            >
              <Link to="/app">Start building</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="space-y-32">
          {/* Introduction Section */}
          <section>
            <div className="max-w-4xl">
              <div className="inline-block mb-6">
                <span className="text-sm font-medium text-white/40 uppercase tracking-wider">Complete Platform</span>
              </div>
              <h2 className="text-5xl sm:text-6xl font-bold mb-8 text-white leading-tight">
                Built for professionals who demand more
              </h2>
              <p className="text-xl text-white/50 leading-relaxed mb-12">
                Every feature, every capability, every integration designed to help you work with documents 
                more effectively. No compromises, no shortcuts—just powerful tools that work.
              </p>
              <div className="mt-16 pt-12 border-t border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
                  <div className="group">
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 relative inline-block tracking-tight">
                      <span className="relative z-10">6</span>
                      <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="text-sm text-white/45 font-medium tracking-[0.1em] uppercase">
                      Product Areas
                    </div>
                    <div className="w-8 h-px bg-white/10 mt-3 group-hover:w-12 group-hover:bg-white/20 transition-all duration-300"></div>
                  </div>
                  <div className="group">
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 relative inline-block tracking-tight">
                      <span className="relative z-10">100+</span>
                      <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="text-sm text-white/45 font-medium tracking-[0.1em] uppercase">
                      Integrations
                    </div>
                    <div className="w-8 h-px bg-white/10 mt-3 group-hover:w-12 group-hover:bg-white/20 transition-all duration-300"></div>
                  </div>
                  <div className="group">
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 relative inline-block tracking-tight">
                      <span className="relative z-10">Enterprise</span>
                      <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="text-sm text-white/45 font-medium tracking-[0.1em] uppercase">
                      Grade Security
                    </div>
                    <div className="w-8 h-px bg-white/10 mt-3 group-hover:w-12 group-hover:bg-white/20 transition-all duration-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Product Categories */}
          <section>
            <div className="mb-20">
              <div className="inline-block mb-4">
                <span className="text-sm font-medium text-white/40 uppercase tracking-wider">Product Areas</span>
              </div>
              <h2 className="text-5xl sm:text-6xl font-bold mb-6 text-white leading-tight max-w-3xl">
                Everything you need, organized clearly
              </h2>
              <p className="text-xl text-white/50 max-w-2xl leading-relaxed">
                Explore each area to discover capabilities designed for your workflow.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {productCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Link
                    key={category.id}
                    to={category.href}
                    className="group relative"
                  >
                    <div className="h-full relative">
                      <div className="absolute inset-0 border border-white/10 rounded-lg bg-white/[0.01] group-hover:bg-white/[0.02] group-hover:border-white/15 transition-all duration-500"></div>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.02)_0%,transparent_50%)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative p-10">
                        <div className="mb-6">
                          <div className="relative mb-6">
                            <div className="absolute -inset-1 border border-white/5 rounded-lg"></div>
                            <div className="relative w-16 h-16 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-center group-hover:bg-white/[0.04] group-hover:border-white/15 transition-all duration-300">
                              <div className="w-10 h-10 text-white/30 group-hover:text-white/40 transition-colors">
                                <Icon />
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-white/80 border border-white/10">
                              {category.stat}
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-white/90 transition-colors">
                            {category.label}
                          </h3>
                          <p className="text-white/60 mb-6 leading-relaxed">
                            {category.description}
                          </p>
                        </div>
                        <div className="pt-6 border-t border-white/10">
                          <div className="flex items-center gap-2 text-sm text-white/40 group-hover:text-white/60 transition-colors">
                            <span>Explore</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* How It Works Section */}
          <section className="pt-16">
            <div className="border-t border-white/10 pt-20">
              <div className="max-w-4xl mx-auto">
                <div className="mb-16 text-center">
                  <div className="inline-block mb-4">
                    <span className="text-sm font-medium text-white/40 uppercase tracking-wider">Getting Started</span>
                  </div>
                  <h2 className="text-5xl sm:text-6xl font-bold mb-6 text-white leading-tight">
                    Start using the platform in minutes
                  </h2>
                  <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
                    Everything you need is ready to go. No complex setup, no lengthy onboarding.
                  </p>
                </div>

                <div className="space-y-12">
                  {[
                    {
                      step: "01",
                      title: "Explore Features",
                      description: "Browse our product areas to understand what's available. Each area is designed to solve specific document analysis challenges."
                    },
                    {
                      step: "02",
                      title: "Choose Your Path",
                      description: "Start with features that matter most to you. Whether it's AI capabilities, security, integrations, or analytics—dive deep into what you need."
                    },
                    {
                      step: "03",
                      title: "Start Building",
                      description: "Sign up and start using the platform. Upload documents, ask questions, analyze content. Everything works immediately."
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex gap-8 group">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-center group-hover:bg-white/[0.04] group-hover:border-white/15 transition-all">
                          <span className="text-2xl font-bold text-white/40 group-hover:text-white/60 transition-colors">{item.step}</span>
                        </div>
                      </div>
                      <div className="flex-1 pt-2">
                        <h3 className="text-2xl font-bold mb-3 text-white">{item.title}</h3>
                        <p className="text-white/60 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="pt-16">
            <div className="border-t border-white/10 pt-20">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white leading-tight">
                  Ready to get started?
                </h2>
                <p className="text-xl text-white/50 mb-10 leading-relaxed">
                  Join thousands of teams using DocuMind AI to unlock insights from their documents.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-white text-black hover:bg-white/90 font-medium text-base px-8 h-12"
                    asChild
                  >
                    <Link to="/app">
                      Start building
                    </Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white/20 text-white hover:bg-white/5 font-medium text-base px-8 h-12"
                    onClick={() => setIsDemoDialogOpen(true)}
                  >
                    Request demo
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Contact Demo Dialog */}
      <ContactDemoDialog 
        open={isDemoDialogOpen} 
        onOpenChange={setIsDemoDialogOpen} 
      />

      {/* Footer */}
      <footer className="border-t border-white/10 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="relative w-5 h-5">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path 
                      d="M12 2L2 19.5h20L12 2z" 
                      fill="currentColor"
                      className="text-white"
                    />
                  </svg>
                </div>
                <span className="font-semibold text-white">DocuMind AI</span>
              </div>
              <p className="text-sm text-white/60">
                Intelligent document analysis with enterprise-grade security.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Product</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/products" className="text-white/60 hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/#pricing" className="text-white/60 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/products/security" className="text-white/60 hover:text-white transition-colors">Security</Link></li>
                <li><Link to="/app" className="text-white/60 hover:text-white transition-colors">Sign in</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Resources</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/resources" className="text-white/60 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="/resources" className="text-white/60 hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/resources" className="text-white/60 hover:text-white transition-colors">Case studies</Link></li>
                <li><Link to="/resources" className="text-white/60 hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Company</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/#about" className="text-white/60 hover:text-white transition-colors">About</Link></li>
                <li><Link to="/#contact" className="text-white/60 hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/#careers" className="text-white/60 hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/#privacy" className="text-white/60 hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/60">
              © 2024 DocuMind AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-white/60">
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

export default ProductsPage;
