import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/layout/Navigation";
import { 
  Brain, 
  Shield, 
  ArrowRight,
  Sparkles,
  BarChart3,
  Smartphone,
  Plug
} from "lucide-react";

const ProductsPage = () => {

  const productCategories = [
    { id: "features", label: "Features", icon: Sparkles, href: "/products/features", description: "Powerful tools for document analysis" },
    { id: "ai", label: "AI & Intelligence", icon: Brain, href: "/products/ai", description: "Advanced AI capabilities and RAG technology" },
    { id: "security", label: "Security", icon: Shield, href: "/products/security", description: "Enterprise-grade security and compliance" },
    { id: "integrations", label: "Integrations", icon: Plug, href: "/products/integrations", description: "Connect with your existing tools" },
    { id: "analytics", label: "Analytics", icon: BarChart3, href: "/products/analytics", description: "Track usage and gain insights" },
    { id: "mobile", label: "Mobile", icon: Smartphone, href: "/products/mobile", description: "Access from anywhere" },
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

      {/* Product Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {productCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                to={category.href}
                className="group p-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{category.label}</h3>
                <p className="text-white/60 mb-4">
                  {category.description}
                </p>
                <div className="flex items-center gap-2 text-sm text-white/60 group-hover:text-white transition-colors">
                  Learn more <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-white">
            Ready to get started?
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
              <Link to="/#demo">Request demo</Link>
            </Button>
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
                <li><Link to="/products" className="text-white/60 hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/#pricing" className="text-white/60 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/products/security" className="text-white/60 hover:text-white transition-colors">Security</Link></li>
                <li><Link to="/app" className="text-white/60 hover:text-white transition-colors">Sign in</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Resources</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/#resources" className="text-white/60 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="/#resources" className="text-white/60 hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/#resources" className="text-white/60 hover:text-white transition-colors">Case studies</Link></li>
                <li><Link to="/#resources" className="text-white/60 hover:text-white transition-colors">Support</Link></li>
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
