import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/layout/Navigation";
import { ArrowRight } from "lucide-react";
import ContactDemoDialog from "@/components/contact/ContactDemoDialog";

// Custom Icon Components - Unique, abstract designs
const DocumentIntelligenceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M8 8h8M8 12h6M8 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="16" cy="10" r="2" fill="currentColor" opacity="0.3"/>
    <path d="M14 14l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SemanticSearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="9" cy="9" r="1.5" fill="currentColor" opacity="0.4"/>
    <circle cx="13" cy="9" r="1.5" fill="currentColor" opacity="0.4"/>
    <circle cx="11" cy="13" r="1.5" fill="currentColor" opacity="0.4"/>
  </svg>
);

const EnterpriseSecurityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="10" y="8" width="4" height="4" rx="1" fill="currentColor" opacity="0.2"/>
  </svg>
);

const LightningFastIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M10 6h4M12 4v4" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
  </svg>
);

const AccessControlsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M12 9v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="7" y="4" width="10" height="2" rx="1" fill="currentColor" opacity="0.3"/>
  </svg>
);

const AnalyticsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <path d="M3 20h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6 16l4-4 4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="6" cy="16" r="1.5" fill="currentColor" opacity="0.4"/>
    <circle cx="10" cy="12" r="1.5" fill="currentColor" opacity="0.4"/>
    <circle cx="14" cy="12" r="1.5" fill="currentColor" opacity="0.4"/>
    <circle cx="20" cy="10" r="1.5" fill="currentColor" opacity="0.4"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
    <path d="M13 4L6 11l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SecurityBadgeIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
    <path d="M10 2L3 5v5c0 5 3.5 9.5 7 11 3.5-1.5 7-6 7-11V5l-7-3z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LandingPage = () => {
  const [isDemoDialogOpen, setIsDemoDialogOpen] = useState(false);

  const features = [
    {
      icon: DocumentIntelligenceIcon,
      title: "Document Intelligence",
      description: "Extract insights from any document format with precision and accuracy."
    },
    {
      icon: SemanticSearchIcon,
      title: "Semantic Search",
      description: "Find exactly what you need across thousands of documents instantly."
    },
    {
      icon: EnterpriseSecurityIcon,
      title: "Enterprise Security",
      description: "Bank-level encryption and compliance with SOC 2, GDPR, and HIPAA."
    },
    {
      icon: LightningFastIcon,
      title: "Lightning Fast",
      description: "Process and analyze documents in seconds, not hours."
    },
    {
      icon: AccessControlsIcon,
      title: "Access Controls",
      description: "Granular permissions and audit trails for complete control."
    },
    {
      icon: AnalyticsIcon,
      title: "Analytics & Insights",
      description: "Track usage patterns and gain actionable insights from your documents."
    }
  ];

  const stats = [
    { value: "10M+", label: "Documents Processed" },
    { value: "50K+", label: "Active Users" },
    { value: "99.9%", label: "Uptime SLA" },
    { value: "150+", label: "Countries Served" }
  ];

  const testimonials = [
    {
      quote: "DocuMind transformed how our legal team handles document review. What used to take days now takes minutes.",
      author: "Sarah Chen",
      role: "General Counsel",
      company: "Fortune 500 Corporation"
    },
    {
      quote: "The security and compliance features give us confidence to handle sensitive research documents at scale.",
      author: "Dr. Michael Rodriguez",
      role: "Research Director",
      company: "Leading Research Institution"
    },
    {
      quote: "Integration was seamless. We were up and running in hours, not weeks.",
      author: "James Park",
      role: "CTO",
      company: "Healthcare Technology Company"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Sophisticated background effects */}
        <div className="absolute inset-0 opacity-[0.015]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] via-transparent to-white/[0.01] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-4xl">
            {/* Unique Badge Design - Left Aligned */}
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 mb-8 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-white/[0.08] rounded-[12px] blur-sm group-hover:blur-md transition-all"></div>
              <div className="absolute inset-[1px] bg-black rounded-[11px]"></div>
              <div className="relative flex items-center gap-3 text-sm text-white/70 font-medium">
                <div className="relative">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                  <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-white/50 animate-ping"></div>
                </div>
                <span className="tracking-wide">Trusted by leading organizations worldwide</span>
              </div>
            </div>
            
            {/* Main Headline - Left Aligned */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6 text-white leading-[0.95] max-w-5xl">
              Document intelligence
              <br />
              <span className="text-white/50">for modern teams</span>
            </h1>
            
            {/* Subheadline - Left Aligned */}
            <p className="text-base sm:text-lg lg:text-xl text-white/50 mb-10 max-w-2xl leading-relaxed font-light">
              Analyze, search, and extract insights from your documents with enterprise-grade security and precision.
            </p>
            
            {/* CTA Buttons - Left Aligned */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-white/90 font-medium text-base px-8 h-12 rounded-md relative group overflow-hidden shadow-lg shadow-white/5"
                asChild
              >
                <Link to="/app">
                  <span className="relative z-10 flex items-center">
                    Get started
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  {/* Subtle shine effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/5 hover:border-white/30 font-medium text-base px-8 h-12 rounded-md backdrop-blur-sm transition-all"
                onClick={() => setIsDemoDialogOpen(true)}
              >
                Request demo
              </Button>
            </div>
          </div>

          {/* Stats Grid - Enhanced Design with Left Alignment */}
          <div className="mt-16 pt-12 border-t border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="group">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 relative inline-block tracking-tight">
                    <span className="relative z-10">{stat.value}</span>
                    <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div className="text-sm text-white/45 font-medium tracking-[0.1em] uppercase">
                    {stat.label}
                  </div>
                  {/* Decorative line */}
                  <div className="w-8 h-px bg-white/10 mt-3 group-hover:w-12 group-hover:bg-white/20 transition-all duration-300"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-white/10 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-white">
              Everything you need
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Powerful features designed for teams that demand precision and security.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative p-8 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent hover:from-white/[0.06] hover:to-white/[0.02] transition-all duration-300 overflow-hidden"
                >
                  {/* Subtle glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  
                  {/* Icon container with unique styling */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-white/5 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative w-14 h-14 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-all">
                      <Icon />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3 text-white relative z-10">{feature.title}</h3>
                  <p className="text-white/60 leading-relaxed relative z-10">{feature.description}</p>
                  
                  {/* Decorative corner element */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-white/10 relative">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-white/[0.02]"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-white">
              Trusted by industry leaders
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Organizations worldwide rely on DocuMind for their most critical document workflows.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="relative p-8 rounded-xl border border-white/10 bg-gradient-to-br from-black/80 to-black/40 backdrop-blur-sm hover:border-white/20 transition-all group"
              >
                {/* Quote mark decoration */}
                <div className="absolute top-6 left-6 text-6xl font-serif text-white/5 leading-none">"</div>
                
                <p className="text-white/80 mb-6 leading-relaxed text-lg relative z-10">
                  {testimonial.quote}
                </p>
                <div className="relative z-10">
                  <div className="font-semibold text-white mb-1">{testimonial.author}</div>
                  <div className="text-sm text-white/50">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
                
                {/* Subtle accent line */}
                <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              </div>
            ))}
          </div>

          {/* Company Logos - More abstract representation */}
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-30">
            {[
              { name: "Fortune 500", pattern: "■■■" },
              { name: "Legal Firms", pattern: "◼◼◼" },
              { name: "Research Labs", pattern: "●●●" },
              { name: "Healthcare", pattern: "▲▲▲" },
              { name: "Finance", pattern: "◆◆◆" },
              { name: "Government", pattern: "■●■" }
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center gap-2 text-white/40">
                <div className="text-xs font-mono tracking-wider">{item.pattern}</div>
                <span className="text-xs font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              {/* Unique Badge Design */}
              <div className="inline-flex items-center gap-2.5 px-5 py-2 mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-white/[0.08] rounded-[12px] blur-sm"></div>
                <div className="absolute inset-[1px] bg-black rounded-[11px]"></div>
                <div className="relative flex items-center gap-2.5 text-sm text-white/70 font-medium">
                  <SecurityBadgeIcon />
                  <span>Security First</span>
                </div>
              </div>
              
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 text-white">
                Enterprise-grade security
                <br />
                <span className="text-white/60">built in</span>
              </h2>
              <p className="text-xl text-white/60 mb-8 leading-relaxed">
                Your documents are protected with industry-leading security standards and compliance certifications.
              </p>
              <div className="space-y-4">
                {[
                  "End-to-end encryption at rest and in transit",
                  "SOC 2 Type II certified",
                  "GDPR and HIPAA compliant",
                  "Regular security audits and penetration testing",
                  "Role-based access controls",
                  "Comprehensive audit trails"
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 group">
                    <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                      <CheckIcon />
                    </div>
                    <span className="text-white/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:pl-8">
              <div className="relative p-8 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-sm">
                {/* Decorative grid background */}
                <div className="absolute inset-0 opacity-[0.03] rounded-xl" style={{
                  backgroundImage: `linear-gradient(to right, white 1px, transparent 1px),
                                  linear-gradient(to bottom, white 1px, transparent 1px)`,
                  backgroundSize: '24px 24px'
                }}></div>
                
                <div className="space-y-6 relative z-10">
                  <div>
                    <div className="text-sm text-white/50 mb-3 font-medium">Compliance Certifications</div>
                    <div className="flex flex-wrap gap-2">
                      {["SOC 2", "GDPR", "HIPAA", "ISO 27001"].map((cert, index) => (
                        <div
                          key={index}
                          className="relative px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/80 font-medium backdrop-blur-sm hover:bg-white/10 transition-colors"
                        >
                          {cert}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-white/50 mb-3 font-medium">Security Features</div>
                    <div className="space-y-3">
                      {[
                        "256-bit AES encryption",
                        "TLS 1.3 for data in transit",
                        "Multi-factor authentication",
                        "Single sign-on (SSO) support"
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 text-sm text-white/70">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/40 relative">
                            <div className="absolute inset-0 bg-white/40 rounded-full animate-ping opacity-75"></div>
                          </div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-white">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto">
            Start free, scale as you grow. Enterprise plans available for large organizations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-white/90 font-medium text-base px-8 h-12 rounded-md"
              asChild
            >
              <Link to="/pricing">View pricing</Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/5 font-medium text-base px-8 h-12 rounded-md"
              asChild
            >
              <Link to="/app">Start free trial</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-white/10 relative overflow-hidden">
        {/* Subtle background effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent"></div>
        
        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 text-white">
            Ready to get started?
          </h2>
          <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            Join thousands of teams using DocuMind to unlock insights from their documents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-white/90 font-medium text-base px-8 h-12 rounded-md relative group overflow-hidden"
              asChild
            >
              <Link to="/app">
                <span className="relative z-10 flex items-center">
                  Get started free
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/5 font-medium text-base px-8 h-12 rounded-md"
              onClick={() => setIsDemoDialogOpen(true)}
            >
              Schedule a demo
            </Button>
          </div>
        </div>
      </section>

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

export default LandingPage;
