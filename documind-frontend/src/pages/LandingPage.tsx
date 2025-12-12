import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/layout/Navigation";
import { 
  Shield, 
  Zap, 
  Lock, 
  FileText, 
  Search, 
  Brain, 
  CheckCircle2
} from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Hero Section */}
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

      {/* Trust Indicators */}
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

      {/* Features Section */}
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

      {/* Security Section */}
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

      {/* Pricing Section */}
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
