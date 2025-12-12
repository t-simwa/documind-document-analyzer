import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Search, 
  Lock, 
  FileText, 
  Zap, 
  Shield, 
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Sparkles,
  BarChart3,
  Smartphone,
  Users,
  Code,
  Database,
  Globe,
  Key,
  Eye,
  Server,
  Cloud,
  GitBranch,
  MessageSquare,
  TrendingUp,
  Layers,
  Workflow,
  Settings,
  Bell,
  Download,
  Upload,
  FileCheck,
  FileSearch,
  FileBarChart,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileType,
  Network,
  Plug,
  Webhook,
  Terminal,
  ShieldCheck,
  LockKeyhole,
  Fingerprint,
  Scan,
  AlertTriangle,
  Clock,
  Activity,
  PieChart,
  LineChart,
  Target,
  Filter,
  SortAsc,
  BookOpen,
  HelpCircle,
  Video,
  FileQuestion
} from "lucide-react";

const ProductsPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("features");

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

  const tabs = [
    { id: "features", label: "Features", icon: Sparkles },
    { id: "ai", label: "AI & Intelligence", icon: Brain },
    { id: "security", label: "Security", icon: Shield },
    { id: "integrations", label: "Integrations", icon: Plug },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "mobile", label: "Mobile", icon: Smartphone },
  ];

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
              <Link to="/products" className="text-sm font-medium text-white hover:text-white transition-colors">
                Products
              </Link>
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

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white leading-tight">
            Everything you need to analyze documents
          </h1>
          <p className="text-xl sm:text-2xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            A complete platform for intelligent document understanding, analysis, and insights.
          </p>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="sticky top-16 bg-black/95 backdrop-blur-xl border-b border-white/10 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto scrollbar-hide gap-1 justify-center md:justify-center">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-white text-white"
                      : "border-transparent text-white/60 hover:text-white hover:border-white/30"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Features Tab */}
        {activeTab === "features" && (
          <div className="space-y-24">
            {/* Core Features */}
            <section>
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                  Core Features
                </h2>
                <p className="text-lg text-white/60 max-w-2xl mx-auto">
                  Powerful tools designed for modern document analysis workflows
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  {
                    icon: FileText,
                    title: "Multi-Format Support",
                    description: "Upload and analyze PDFs, Word documents, images, spreadsheets, and more. Automatic text extraction and OCR for scanned documents.",
                    features: ["PDF, DOCX, TXT, MD", "Image OCR", "Spreadsheet parsing", "Markdown support"]
                  },
                  {
                    icon: Search,
                    title: "Intelligent Search",
                    description: "Semantic search across all your documents. Find information instantly, even in complex technical content.",
                    features: ["Semantic search", "Keyword search", "Hybrid search", "Advanced filters"]
                  },
                  {
                    icon: Brain,
                    title: "AI-Powered Analysis",
                    description: "Advanced RAG technology understands context and provides accurate, cited responses to your questions.",
                    features: ["Context understanding", "Accurate citations", "Multi-document analysis", "Smart summaries"]
                  },
                  {
                    icon: Zap,
                    title: "Lightning Fast",
                    description: "Process and analyze documents in seconds. Get instant answers to complex questions across large document sets.",
                    features: ["Fast processing", "Real-time analysis", "Instant responses", "Scalable infrastructure"]
                  },
                  {
                    icon: Layers,
                    title: "Document Organization",
                    description: "Organize documents into collections, folders, and projects. Tag and categorize for easy management.",
                    features: ["Collections & folders", "Tagging system", "Project organization", "Smart categorization"]
                  },
                  {
                    icon: FileCheck,
                    title: "Quality Assurance",
                    description: "Built-in validation and quality checks ensure accurate document processing and analysis.",
                    features: ["Format validation", "Content verification", "Error detection", "Quality scoring"]
                  }
                ].map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="group">
                      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                      <p className="text-white/60 mb-4 leading-relaxed">
                        {feature.description}
                      </p>
                      <ul className="space-y-2">
                        {feature.features.map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                            <CheckCircle2 className="w-4 h-4 text-white/40 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Advanced Features */}
            <section>
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                  Advanced Capabilities
                </h2>
                <p className="text-lg text-white/60 max-w-2xl mx-auto">
                  Enterprise-grade features for professional document analysis
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-12">
                {[
                  {
                    icon: Workflow,
                    title: "Custom Workflows",
                    description: "Create automated workflows for document processing, analysis, and distribution. Integrate with your existing tools and processes.",
                    details: [
                      "Automated processing pipelines",
                      "Custom analysis rules",
                      "Integration triggers",
                      "Conditional logic"
                    ]
                  },
                  {
                    icon: Users,
                    title: "Team Collaboration",
                    description: "Share documents, insights, and analysis with your team. Real-time collaboration and commenting features.",
                    details: [
                      "Shared workspaces",
                      "Real-time collaboration",
                      "Comments & annotations",
                      "Permission management"
                    ]
                  },
                  {
                    icon: FileBarChart,
                    title: "Document Insights",
                    description: "Automatically extract key insights, entities, and summaries from your documents. Get structured data from unstructured content.",
                    details: [
                      "Entity extraction",
                      "Key insights",
                      "Automatic summaries",
                      "Structured data export"
                    ]
                  },
                  {
                    icon: FileCode,
                    title: "API Access",
                    description: "Full REST API access to all features. Build custom integrations and automate your document analysis workflows.",
                    details: [
                      "REST API",
                      "Webhooks",
                      "SDK libraries",
                      "Custom integrations"
                    ]
                  }
                ].map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="p-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-semibold mb-3 text-white">{feature.title}</h3>
                      <p className="text-white/60 mb-6 leading-relaxed">
                        {feature.description}
                      </p>
                      <ul className="space-y-3">
                        {feature.details.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                            <span className="text-white/60">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* AI & Intelligence Tab */}
        {activeTab === "ai" && (
          <div className="space-y-24">
            <section>
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                  AI-Powered Intelligence
                </h2>
                <p className="text-lg text-white/60 max-w-2xl mx-auto">
                  Advanced AI capabilities that understand context, extract insights, and provide intelligent analysis
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-12">
                {[
                  {
                    icon: Brain,
                    title: "RAG Technology",
                    description: "Retrieval-Augmented Generation ensures accurate, context-aware responses with proper citations and source attribution.",
                    features: [
                      "Context-aware responses",
                      "Source citations",
                      "Hybrid search (semantic + keyword)",
                      "Re-ranking for accuracy"
                    ]
                  },
                  {
                    icon: Sparkles,
                    title: "AI Agents",
                    description: "Intelligent agents that automate document analysis tasks, extract information, and generate insights automatically.",
                    features: [
                      "Automated analysis",
                      "Task automation",
                      "Smart extraction",
                      "Intelligent routing"
                    ]
                  },
                  {
                    icon: MessageSquare,
                    title: "Conversational AI",
                    description: "Natural language interface for querying documents. Ask questions in plain English and get accurate, cited answers.",
                    features: [
                      "Natural language queries",
                      "Multi-turn conversations",
                      "Context retention",
                      "Query suggestions"
                    ]
                  },
                  {
                    icon: FileSearch,
                    title: "Semantic Search",
                    description: "Find information by meaning, not just keywords. Understand intent and context across all your documents.",
                    features: [
                      "Meaning-based search",
                      "Intent understanding",
                      "Cross-document search",
                      "Related content discovery"
                    ]
                  },
                  {
                    icon: TrendingUp,
                    title: "Smart Summarization",
                    description: "Automatically generate summaries, extract key points, and identify important information in documents.",
                    features: [
                      "Automatic summaries",
                      "Key point extraction",
                      "Executive briefs",
                      "Custom summary formats"
                    ]
                  },
                  {
                    icon: Target,
                    title: "Intelligent Classification",
                    description: "Automatically categorize and tag documents based on content, type, and context. Smart organization without manual work.",
                    features: [
                      "Auto-categorization",
                      "Content-based tagging",
                      "Type detection",
                      "Smart organization"
                    ]
                  }
                ].map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="p-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-semibold mb-3 text-white">{feature.title}</h3>
                      <p className="text-white/60 mb-6 leading-relaxed">
                        {feature.description}
                      </p>
                      <ul className="space-y-3">
                        {feature.features.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                            <span className="text-white/60">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="space-y-24">
            <section>
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                  Enterprise-Grade Security
                </h2>
                <p className="text-lg text-white/60 max-w-2xl mx-auto">
                  Built with security and compliance at the core. Your documents are protected at every layer.
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {[
                  {
                    icon: ShieldCheck,
                    title: "SOC 2 Type II",
                    description: "Certified for security, availability, and confidentiality. Regular audits ensure ongoing compliance."
                  },
                  {
                    icon: LockKeyhole,
                    title: "GDPR Compliant",
                    description: "Full compliance with European data protection regulations. Data residency options available."
                  },
                  {
                    icon: Fingerprint,
                    title: "HIPAA Ready",
                    description: "Healthcare data protection standards built-in. BAA available for covered entities."
                  },
                  {
                    icon: Lock,
                    title: "End-to-End Encryption",
                    description: "All data encrypted in transit and at rest. Your documents are protected at every stage."
                  },
                  {
                    icon: Key,
                    title: "Access Controls",
                    description: "Role-based access control (RBAC) and fine-grained permissions. Control who sees what."
                  },
                  {
                    icon: Eye,
                    title: "Audit Logs",
                    description: "Comprehensive audit trails for all actions. Track every access, change, and query."
                  }
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="p-6 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-white">{item.title}</h3>
                      <p className="text-sm text-white/60">{item.description}</p>
                    </div>
                  );
                })}
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {[
                  {
                    title: "Security Features",
                    features: [
                      "Single Sign-On (SSO) support",
                      "Multi-factor authentication (MFA)",
                      "Role-based access control (RBAC)",
                      "IP allowlisting",
                      "Session management",
                      "Password policies",
                      "Data encryption at rest",
                      "TLS/SSL encryption in transit"
                    ]
                  },
                  {
                    title: "Compliance & Certifications",
                    features: [
                      "SOC 2 Type II certified",
                      "GDPR compliant",
                      "HIPAA ready",
                      "ISO 27001 (in progress)",
                      "Regular security audits",
                      "Penetration testing",
                      "Vulnerability assessments",
                      "Compliance reporting"
                    ]
                  },
                  {
                    title: "Data Protection",
                    features: [
                      "Data residency options",
                      "Automatic backups",
                      "Point-in-time recovery",
                      "Data retention policies",
                      "Secure data deletion",
                      "Data export capabilities",
                      "Privacy controls",
                      "Right to be forgotten"
                    ]
                  },
                  {
                    title: "Infrastructure Security",
                    features: [
                      "99.9% uptime SLA",
                      "DDoS protection",
                      "WAF (Web Application Firewall)",
                      "Intrusion detection",
                      "Security monitoring",
                      "Incident response",
                      "Disaster recovery",
                      "High availability"
                    ]
                  }
                ].map((section, index) => (
                  <div key={index} className="p-8 rounded-lg border border-white/10 bg-white/5">
                    <h3 className="text-xl font-semibold mb-6 text-white">{section.title}</h3>
                    <ul className="space-y-3">
                      {section.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                          <span className="text-white/60">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === "integrations" && (
          <div className="space-y-24">
            <section>
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                  Integrations & APIs
                </h2>
                <p className="text-lg text-white/60 max-w-2xl mx-auto">
                  Connect DocuMind AI with your existing tools and workflows. Over 100+ integrations available.
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {[
                  { name: "Google Drive", icon: Cloud },
                  { name: "Microsoft OneDrive", icon: Cloud },
                  { name: "Dropbox", icon: Cloud },
                  { name: "Box", icon: Cloud },
                  { name: "SharePoint", icon: Server },
                  { name: "Slack", icon: MessageSquare },
                  { name: "Microsoft Teams", icon: Users },
                  { name: "GitHub", icon: GitBranch },
                  { name: "GitLab", icon: GitBranch },
                  { name: "Jira", icon: Workflow },
                  { name: "Notion", icon: FileText },
                  { name: "Confluence", icon: FileText },
                  { name: "Zapier", icon: Plug },
                  { name: "Make (Integromat)", icon: Plug },
                  { name: "Webhooks", icon: Webhook },
                  { name: "REST API", icon: Terminal },
                  { name: "Python SDK", icon: Code },
                  { name: "JavaScript SDK", icon: Code }
                ].map((integration, index) => {
                  const Icon = integration.icon;
                  return (
                    <div key={index} className="p-6 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-center">
                      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 mx-auto">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-sm font-medium text-white">{integration.name}</h3>
                    </div>
                  );
                })}
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {[
                  {
                    icon: Terminal,
                    title: "REST API",
                    description: "Full-featured REST API for programmatic access to all DocuMind AI capabilities.",
                    features: [
                      "Complete API coverage",
                      "RESTful design",
                      "OpenAPI documentation",
                      "Rate limiting",
                      "Authentication via API keys",
                      "Webhook support"
                    ]
                  },
                  {
                    icon: Code,
                    title: "SDKs & Libraries",
                    description: "Official SDKs for popular programming languages. Quick integration with your applications.",
                    features: [
                      "Python SDK",
                      "JavaScript/TypeScript SDK",
                      "Node.js support",
                      "React components",
                      "Comprehensive documentation",
                      "Code examples"
                    ]
                  },
                  {
                    icon: Webhook,
                    title: "Webhooks",
                    description: "Real-time notifications for document processing, analysis completion, and system events.",
                    features: [
                      "Event-driven architecture",
                      "Custom webhook endpoints",
                      "Retry mechanisms",
                      "Event filtering",
                      "Secure webhook delivery",
                      "Payload customization"
                    ]
                  },
                  {
                    icon: Plug,
                    title: "No-Code Integrations",
                    description: "Connect with Zapier, Make, and other no-code platforms. Automate workflows without coding.",
                    features: [
                      "Zapier integration",
                      "Make (Integromat) support",
                      "Pre-built templates",
                      "Custom workflows",
                      "Trigger automation",
                      "Action automation"
                    ]
                  }
                ].map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="p-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-semibold mb-3 text-white">{feature.title}</h3>
                      <p className="text-white/60 mb-6 leading-relaxed">
                        {feature.description}
                      </p>
                      <ul className="space-y-3">
                        {feature.features.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                            <span className="text-white/60">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-24">
            <section>
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                  Analytics & Insights
                </h2>
                <p className="text-lg text-white/60 max-w-2xl mx-auto">
                  Track usage, measure performance, and gain insights into your document analysis workflows
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-12">
                {[
                  {
                    icon: BarChart3,
                    title: "Usage Analytics",
                    description: "Comprehensive analytics dashboard showing document processing, query volume, and system usage.",
                    features: [
                      "Document processing metrics",
                      "Query volume tracking",
                      "User activity reports",
                      "Storage usage",
                      "API usage statistics",
                      "Custom date ranges"
                    ]
                  },
                  {
                    icon: TrendingUp,
                    title: "Performance Metrics",
                    description: "Monitor system performance, response times, and processing speeds. Identify bottlenecks and optimize.",
                    features: [
                      "Response time tracking",
                      "Processing speed metrics",
                      "System performance",
                      "Error rate monitoring",
                      "Success rate tracking",
                      "Performance trends"
                    ]
                  },
                  {
                    icon: PieChart,
                    title: "Document Insights",
                    description: "Analyze document types, sizes, and processing patterns. Understand your document landscape.",
                    features: [
                      "Document type distribution",
                      "Size analysis",
                      "Processing patterns",
                      "Content analysis",
                      "Usage patterns",
                      "Trend analysis"
                    ]
                  },
                  {
                    icon: Activity,
                    title: "Real-Time Monitoring",
                    description: "Live dashboards and alerts for system health, usage spikes, and important events.",
                    features: [
                      "Real-time dashboards",
                      "Custom alerts",
                      "System health monitoring",
                      "Usage notifications",
                      "Event tracking",
                      "Alert management"
                    ]
                  },
                  {
                    icon: FileBarChart,
                    title: "Custom Reports",
                    description: "Generate custom reports for stakeholders. Export data for further analysis.",
                    features: [
                      "Custom report builder",
                      "Scheduled reports",
                      "PDF/CSV export",
                      "Email delivery",
                      "Report templates",
                      "Data visualization"
                    ]
                  },
                  {
                    icon: Target,
                    title: "Business Intelligence",
                    description: "Advanced BI features for deeper insights. Connect to your existing BI tools.",
                    features: [
                      "BI tool integration",
                      "Data warehouse export",
                      "Advanced analytics",
                      "Predictive insights",
                      "Custom metrics",
                      "Data modeling"
                    ]
                  }
                ].map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="p-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-semibold mb-3 text-white">{feature.title}</h3>
                      <p className="text-white/60 mb-6 leading-relaxed">
                        {feature.description}
                      </p>
                      <ul className="space-y-3">
                        {feature.features.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                            <span className="text-white/60">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Mobile Tab */}
        {activeTab === "mobile" && (
          <div className="space-y-24">
            <section>
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                  Mobile Experience
                </h2>
                <p className="text-lg text-white/60 max-w-2xl mx-auto">
                  Access and analyze documents from anywhere. Full-featured mobile apps for iOS and Android.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-12 mb-16">
                {[
                  {
                    icon: Smartphone,
                    title: "Native Mobile Apps",
                    description: "Dedicated iOS and Android apps with full feature parity. Native performance and offline support.",
                    features: [
                      "iOS app (App Store)",
                      "Android app (Play Store)",
                      "Native performance",
                      "Offline mode",
                      "Push notifications",
                      "Biometric authentication"
                    ]
                  },
                  {
                    icon: Globe,
                    title: "Mobile Web",
                    description: "Fully responsive web interface optimized for mobile browsers. Works seamlessly on any device.",
                    features: [
                      "Responsive design",
                      "Touch-optimized UI",
                      "Mobile gestures",
                      "Fast loading",
                      "Progressive Web App (PWA)",
                      "Add to home screen"
                    ]
                  }
                ].map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="p-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-semibold mb-3 text-white">{feature.title}</h3>
                      <p className="text-white/60 mb-6 leading-relaxed">
                        {feature.description}
                      </p>
                      <ul className="space-y-3">
                        {feature.features.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                            <span className="text-white/60">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    title: "Mobile Features",
                    features: [
                      "Document upload from device",
                      "Camera document capture",
                      "Quick document scan",
                      "Mobile-optimized chat",
                      "Voice queries",
                      "Touch-friendly interface"
                    ]
                  },
                  {
                    title: "Offline Capabilities",
                    features: [
                      "Offline document viewing",
                      "Cached queries",
                      "Offline search",
                      "Sync when online",
                      "Background sync",
                      "Offline mode indicator"
                    ]
                  },
                  {
                    title: "Mobile Security",
                    features: [
                      "Biometric authentication",
                      "Device encryption",
                      "Secure storage",
                      "Remote wipe",
                      "App-level security",
                      "Certificate pinning"
                    ]
                  }
                ].map((section, index) => (
                  <div key={index} className="p-6 rounded-lg border border-white/10 bg-white/5">
                    <h3 className="text-lg font-semibold mb-4 text-white">{section.title}</h3>
                    <ul className="space-y-3">
                      {section.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 text-white/60 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-white/60">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
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
                <li><Link to="/products#security" className="text-white/60 hover:text-white transition-colors">Security</Link></li>
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
              <Link to="/products#security" className="hover:text-white transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProductsPage;


