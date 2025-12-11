import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Zap, 
  Lock, 
  FileText, 
  Search, 
  Brain, 
  CheckCircle2, 
  ArrowRight,
  Star,
  Sparkles,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

const LandingPage = () => {
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
    <div className="min-h-screen bg-black text-white">
      {/* Navigation - Linear.app style */}
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
              <Link to="#features" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                Features
              </Link>
              <Link to="#security" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                Security
              </Link>
              <Link to="#pricing" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link to="#resources" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
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
              <Link to="#features" className="block text-sm font-medium text-white/60 hover:text-white">
                Features
              </Link>
              <Link to="#security" className="block text-sm font-medium text-white/60 hover:text-white">
                Security
              </Link>
              <Link to="#pricing" className="block text-sm font-medium text-white/60 hover:text-white">
                Pricing
              </Link>
              <Link to="#resources" className="block text-sm font-medium text-white/60 hover:text-white">
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

      {/* Hero Section - Linear.app style */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white leading-tight">
            DocuMind AI is a purpose-built tool for
            <span className="block mt-2">document analysis</span>
          </h1>
          <p className="text-xl sm:text-2xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            Meet the system for intelligent document understanding. Streamline analysis, extract insights, and unlock the full potential of your documents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
              asChild
            >
              <Link to="#demo">
                Request demo
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Indicators - Linear.app style */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-sm text-white/40 mb-8">
            Powering the world's best teams. From next-gen startups to established enterprises.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-40">
            {["Fortune 500", "Legal Firms", "Research Labs", "Healthcare", "Finance", "Government"].map((company) => (
              <div key={company} className="text-sm font-medium text-white/60">
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Linear.app style */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
              Made for modern document teams
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              DocuMind AI is shaped by the practices and principles that distinguish world-class document analysis teams.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI-Powered Analysis",
                description: "Advanced RAG technology understands context and provides accurate, cited responses to your questions."
              },
              {
                icon: Search,
                title: "Intelligent Search",
                description: "Find information instantly with semantic search across all your documents, even in complex technical content."
              },
              {
                icon: Lock,
                title: "Enterprise Security",
                description: "End-to-end encryption, SOC 2 Type II, GDPR, and HIPAA compliant. Your documents are always secure."
              },
              {
                icon: FileText,
                title: "Multi-Format Support",
                description: "Upload PDFs, Word docs, images, and more. Automatic text extraction and OCR for scanned documents."
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Process and analyze documents in seconds. Get instant answers to complex questions across large document sets."
              },
              {
                icon: Shield,
                title: "Compliance Ready",
                description: "Built for regulated industries with audit trails, access controls, and comprehensive compliance features."
              }
            ].map((feature, index) => (
              <div key={index} className="group">
                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section - Linear.app style */}
      <section id="security" className="py-24 px-4 sm:px-6 lg:px-8 border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
              Built on strong foundations
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              DocuMind AI is so simple to use, it's easy to overlook the wealth of complex technologies packed under the hood that keep your documents robust, safe, and blazing fast.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                title: "SOC 2",
                description: "Certified for security, availability, and confidentiality"
              },
              {
                title: "GDPR",
                description: "Full compliance with European data protection regulations"
              },
              {
                title: "HIPAA",
                description: "Healthcare data protection standards built-in"
              },
              {
                title: "Enterprise-ready security",
                description: "Best-in-class security practices keep your work safe and secure at every layer."
              }
            ].map((item, index) => (
              <div key={index} className="p-6 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                <h3 className="text-lg font-semibold mb-2 text-white">{item.title}</h3>
                <p className="text-sm text-white/60">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              "Role-based access control (RBAC)",
              "Single Sign-On (SSO) support",
              "Comprehensive audit logs",
              "Data residency options",
              "Regular security audits",
              "99.9% uptime SLA"
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                <span className="text-white/60">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Linear.app style */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
              Loved by teams worldwide
            </h2>
            <p className="text-xl text-white/60">
              See what our customers are saying
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "Legal Director",
                company: "TechCorp Legal",
                content: "DocuMind AI has transformed how we analyze legal documents. The AI understands complex legal language and provides accurate citations. It's like having a legal research assistant available 24/7.",
                rating: 5
              },
              {
                name: "Michael Rodriguez",
                role: "Research Lead",
                company: "Innovation Labs",
                content: "The semantic search capabilities are incredible. We can now find relevant information across thousands of research papers in seconds. This has accelerated our research process significantly.",
                rating: 5
              },
              {
                name: "Emily Watson",
                role: "Compliance Officer",
                company: "HealthFirst",
                content: "The security and compliance features give us confidence to use AI for sensitive healthcare documents. The HIPAA compliance and audit trails are exactly what we needed.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="p-6 rounded-lg border border-white/10 bg-white/5">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-white/20 text-white/20" />
                  ))}
                </div>
                <p className="text-white/80 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-white/60">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Linear.app style */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-white/60">
              Choose the plan that fits your needs
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Starter",
                price: "$29",
                period: "per month",
                description: "Perfect for individuals and small teams",
                features: [
                  "Up to 100 documents",
                  "10,000 queries/month",
                  "Basic AI analysis",
                  "Email support",
                  "Standard security"
                ],
                cta: "Start free trial",
                popular: false
              },
              {
                name: "Professional",
                price: "$99",
                period: "per month",
                description: "For growing teams and businesses",
                features: [
                  "Unlimited documents",
                  "100,000 queries/month",
                  "Advanced AI analysis",
                  "Priority support",
                  "Enhanced security",
                  "Team collaboration",
                  "Custom integrations"
                ],
                cta: "Start free trial",
                popular: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                description: "For large organizations with advanced needs",
                features: [
                  "Unlimited everything",
                  "Dedicated infrastructure",
                  "Custom AI models",
                  "24/7 dedicated support",
                  "SOC 2, GDPR, HIPAA",
                  "SSO & RBAC",
                  "Custom SLA",
                  "On-premise option"
                ],
                cta: "Contact sales",
                popular: false
              }
            ].map((plan, index) => (
              <div 
                key={index} 
                className={`p-8 rounded-lg border ${
                  plan.popular 
                    ? "border-white/20 bg-white/5" 
                    : "border-white/10 bg-white/5"
                } hover:bg-white/10 transition-colors`}
              >
                {plan.popular && (
                  <div className="mb-4">
                    <span className="text-xs font-medium text-white/60 bg-white/10 px-2 py-1 rounded">
                      Most popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-semibold mb-2 text-white">{plan.name}</h3>
                <p className="text-white/60 mb-6">
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="text-white/60 ml-2">{plan.period}</span>}
                </div>
                <Button 
                  className={`w-full mb-8 font-medium ${
                    plan.popular 
                      ? "bg-white text-black hover:bg-white/90" 
                      : "border-white/20 text-white hover:bg-white/5"
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link to="/app">{plan.cta}</Link>
                </Button>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-white/60">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section - Linear.app style */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
            Plan the present. Build the future.
          </h2>
          <p className="text-xl text-white/60 mb-10">
            Join thousands of teams using DocuMind AI to unlock insights from their documents
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
              asChild
            >
              <Link to="#demo">Contact sales</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer - Linear.app style */}
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
                <li><Link to="#features" className="text-white/60 hover:text-white transition-colors">Features</Link></li>
                <li><Link to="#pricing" className="text-white/60 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="#security" className="text-white/60 hover:text-white transition-colors">Security</Link></li>
                <li><Link to="/app" className="text-white/60 hover:text-white transition-colors">Sign in</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Resources</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="#resources" className="text-white/60 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="#resources" className="text-white/60 hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="#resources" className="text-white/60 hover:text-white transition-colors">Case studies</Link></li>
                <li><Link to="#resources" className="text-white/60 hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Company</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="#about" className="text-white/60 hover:text-white transition-colors">About</Link></li>
                <li><Link to="#contact" className="text-white/60 hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="#careers" className="text-white/60 hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="#privacy" className="text-white/60 hover:text-white transition-colors">Privacy</Link></li>
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
              <Link to="#security" className="hover:text-white transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
