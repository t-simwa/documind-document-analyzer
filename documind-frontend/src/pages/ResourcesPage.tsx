import { Link } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import { 
  BookMarked, 
  FileSearch, 
  LockKeyhole, 
  Cpu, 
  GitBranch, 
  TrendingUp,
  Clock,
  ChevronRight,
  ScrollText,
  Network,
  CircleHelp
} from "lucide-react";

interface Article {
  title: string;
  description: string;
  author: string;
  date?: string;
  href?: string;
  readTime?: string;
}

interface ResourceCategory {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  learnMoreHref?: string;
  articles: Article[];
}

const ResourcesPage = () => {
  const resourceCategories: ResourceCategory[] = [
    {
      title: "Document Intelligence",
      subtitle: "The future of document understanding and analysis.",
      icon: FileSearch,
      learnMoreHref: "/products/features",
      articles: [
        {
          title: "Getting Started with Document Analysis",
          description: "Learn how to upload, process, and analyze your first documents using DocuMind AI's powerful RAG technology.",
          author: "Sarah Chen",
          date: "Dec 15, 2024",
          readTime: "5 min read"
        },
        {
          title: "Advanced Query Techniques",
          description: "Master complex queries and get precise answers from your document collection with advanced search strategies.",
          author: "Michael Rodriguez",
          date: "Dec 10, 2024",
          readTime: "8 min read"
        },
        {
          title: "Understanding RAG Technology",
          description: "Deep dive into how Retrieval-Augmented Generation powers accurate, cited responses in document analysis.",
          author: "Emily Watson",
          date: "Dec 5, 2024",
          readTime: "12 min read"
        },
        {
          title: "Best Practices for Document Organization",
          description: "Organize your documents effectively to maximize search accuracy and analysis quality.",
          author: "David Kim",
          date: "Nov 28, 2024",
          readTime: "6 min read"
        }
      ]
    },
    {
      title: "AI & Machine Learning",
      subtitle: "Harness the power of AI for intelligent document insights.",
      icon: Cpu,
      learnMoreHref: "/products/ai",
      articles: [
        {
          title: "How AI Transforms Document Workflows",
          description: "Discover how artificial intelligence is revolutionizing the way teams interact with documents.",
          author: "Alex Thompson",
          date: "Dec 12, 2024",
          readTime: "7 min read"
        },
        {
          title: "Custom AI Models for Your Use Case",
          description: "Learn how to fine-tune AI models to match your specific document analysis requirements.",
          author: "Lisa Park",
          date: "Dec 8, 2024",
          readTime: "10 min read"
        },
        {
          title: "Semantic Search Explained",
          description: "Understand how semantic search goes beyond keywords to find meaning in your documents.",
          author: "James Wilson",
          date: "Dec 3, 2024",
          readTime: "9 min read"
        },
        {
          title: "AI Accuracy and Confidence Scores",
          description: "Learn how to interpret AI confidence scores and improve response quality.",
          author: "Maria Garcia",
          date: "Nov 25, 2024",
          readTime: "6 min read"
        }
      ]
    },
    {
      title: "Security & Compliance",
      subtitle: "Enterprise-grade security for sensitive documents.",
      icon: LockKeyhole,
      learnMoreHref: "/products/security",
      articles: [
        {
          title: "End-to-End Encryption Guide",
          description: "Understand how DocuMind AI protects your documents with industry-leading encryption standards.",
          author: "Robert Chen",
          date: "Dec 14, 2024",
          readTime: "8 min read"
        },
        {
          title: "SOC 2 Compliance: What It Means",
          description: "Learn about our SOC 2 Type II certification and what it means for your organization's security.",
          author: "Jennifer Lee",
          date: "Dec 9, 2024",
          readTime: "5 min read"
        },
        {
          title: "GDPR Compliance Best Practices",
          description: "Ensure your document analysis workflows comply with GDPR and other data protection regulations.",
          author: "Thomas Anderson",
          date: "Dec 6, 2024",
          readTime: "11 min read"
        },
        {
          title: "Role-Based Access Control Setup",
          description: "Configure RBAC to manage team permissions and secure access to sensitive documents.",
          author: "Amanda White",
          date: "Nov 30, 2024",
          readTime: "7 min read"
        }
      ]
    },
    {
      title: "Integrations & Workflows",
      subtitle: "Connect DocuMind AI with your existing tools.",
      icon: GitBranch,
      learnMoreHref: "/products/integrations",
      articles: [
        {
          title: "Integrating with Google Drive",
          description: "Step-by-step guide to connecting your Google Drive account and syncing documents automatically.",
          author: "Chris Martinez",
          date: "Dec 11, 2024",
          readTime: "6 min read"
        },
        {
          title: "Microsoft 365 Integration Guide",
          description: "Connect SharePoint and OneDrive to streamline your document analysis workflow.",
          author: "Rachel Brown",
          date: "Dec 7, 2024",
          readTime: "8 min read"
        },
        {
          title: "API Integration Tutorial",
          description: "Learn how to integrate DocuMind AI into your applications using our REST API.",
          author: "Kevin Zhang",
          date: "Dec 4, 2024",
          readTime: "15 min read"
        },
        {
          title: "Automating Document Analysis",
          description: "Set up automated workflows to process documents as they arrive in your storage systems.",
          author: "Nicole Taylor",
          date: "Nov 27, 2024",
          readTime: "9 min read"
        }
      ]
    },
    {
      title: "Case Studies",
      subtitle: "Real-world success stories from our customers.",
      icon: TrendingUp,
      articles: [
        {
          title: "How TechCorp Legal Reduced Research Time by 70%",
          description: "Discover how a leading legal firm uses DocuMind AI to analyze case documents and legal precedents faster.",
          author: "Case Study Team",
          date: "Dec 13, 2024",
          readTime: "10 min read"
        },
        {
          title: "Healthcare Provider Improves Patient Documentation",
          description: "Learn how a healthcare organization streamlined patient record analysis and improved care quality.",
          author: "Case Study Team",
          date: "Dec 2, 2024",
          readTime: "8 min read"
        },
        {
          title: "Research Lab Accelerates Literature Review",
          description: "See how a research institution uses AI-powered document analysis to review scientific papers 10x faster.",
          author: "Case Study Team",
          date: "Nov 26, 2024",
          readTime: "12 min read"
        }
      ]
    },
    {
      title: "Documentation & Guides",
      subtitle: "Comprehensive guides and technical documentation.",
      icon: ScrollText,
      articles: [
        {
          title: "API Reference Documentation",
          description: "Complete API reference with endpoints, parameters, and example requests for developers.",
          author: "Technical Team",
          date: "Dec 1, 2024",
          readTime: "Reference"
        },
        {
          title: "User Guide: Getting Started",
          description: "A comprehensive guide for new users covering all essential features and workflows.",
          author: "Product Team",
          date: "Nov 29, 2024",
          readTime: "20 min read"
        },
        {
          title: "Troubleshooting Common Issues",
          description: "Solutions to common problems and frequently asked questions about using DocuMind AI.",
          author: "Support Team",
          date: "Nov 24, 2024",
          readTime: "15 min read"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight mb-4 text-white leading-tight">
              Resources
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Everything you need to understand, analyze, and extract value from your documents.
            </p>
          </div>
        </div>
      </section>

      {/* Resources Categories */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10 lg:gap-x-6 lg:gap-y-12">
            {resourceCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <div 
                  key={index}
                  className="group"
                >
                  {/* Category Header */}
                  <div className="mb-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] group-hover:border-white/10 group-hover:bg-white/[0.04] transition-all duration-300 flex-shrink-0">
                        <Icon className="w-4 h-4 text-white/75 group-hover:text-white/90 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-base font-medium text-white mb-1.5 tracking-[-0.01em] leading-tight">
                          {category.title}
                        </h2>
                        <p className="text-xs text-white/60 leading-relaxed font-normal">
                          {category.subtitle}
                        </p>
                      </div>
                    </div>

                    {category.learnMoreHref && (
                      <Link 
                        to={category.learnMoreHref}
                        className="inline-flex items-center gap-1.5 text-xs text-white/65 hover:text-white transition-colors font-medium group/link"
                      >
                        Learn more
                        <ChevronRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform duration-200" />
                      </Link>
                    )}
                  </div>

                  {/* Articles List */}
                  <div className="space-y-1.5">
                    {category.articles.map((article, articleIndex) => (
                      <Link
                        key={articleIndex}
                        to={article.href || "#"}
                        className="block group/article p-4 rounded-lg border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-xs font-medium text-white group-hover/article:text-white/95 transition-colors leading-snug flex-1 tracking-[-0.01em]">
                            {article.title}
                          </h3>
                          <ChevronRight className="w-3 h-3 text-white/25 group-hover/article:text-white/50 group-hover/article:translate-x-1 transition-all duration-200 flex-shrink-0 mt-0.5" />
                        </div>
                        <p className="text-[10px] text-white/55 mb-3 leading-relaxed line-clamp-2">
                          {article.description}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-white/45">
                          <span className="font-medium">{article.author}</span>
                          {article.date && (
                            <>
                              <span className="text-white/15">·</span>
                              <span>{article.date}</span>
                            </>
                          )}
                          {article.readTime && (
                            <>
                              <span className="text-white/15">·</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {article.readTime}
                              </span>
                            </>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-medium text-white mb-3 tracking-[-0.02em]">
              Quick Access
            </h2>
            <p className="text-sm text-white/60 font-normal">
              Jump to the resources you need most
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: BookMarked, title: "Documentation", description: "Complete guides and references", href: "/products/features" },
              { icon: LockKeyhole, title: "Security", description: "Security and compliance info", href: "/products/security" },
              { icon: Network, title: "API Reference", description: "Developer documentation", href: "/products/integrations" },
              { icon: CircleHelp, title: "Support", description: "Get help and support", href: "/app" }
            ].map((link, index) => {
              const Icon = link.icon;
              return (
                <Link 
                  key={index}
                  to={link.href}
                  className="group flex flex-col gap-3 p-5 rounded-lg border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300"
                >
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] w-fit group-hover:bg-white/[0.04] group-hover:border-white/10 transition-all duration-300">
                    <Icon className="w-4 h-4 text-white/70 group-hover:text-white/90 transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white mb-1.5 group-hover:text-white/95 transition-colors tracking-[-0.01em]">
                      {link.title}
                    </h3>
                    <p className="text-xs text-white/55 leading-relaxed">
                      {link.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-10 px-4 sm:px-6 lg:px-8 mt-12">
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
              <p className="text-xs text-white/60 leading-relaxed">
                Intelligent document analysis with enterprise-grade security.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-white text-xs tracking-[-0.01em]">Product</h3>
              <ul className="space-y-2 text-xs">
                <li><Link to="/products" className="text-white/60 hover:text-white transition-colors duration-200">Features</Link></li>
                <li><Link to="/pricing" className="text-white/60 hover:text-white transition-colors duration-200">Pricing</Link></li>
                <li><Link to="/products/security" className="text-white/60 hover:text-white transition-colors duration-200">Security</Link></li>
                <li><Link to="/app" className="text-white/60 hover:text-white transition-colors duration-200">Sign in</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-white text-xs tracking-[-0.01em]">Resources</h3>
              <ul className="space-y-2 text-xs">
                <li><Link to="/resources" className="text-white/60 hover:text-white transition-colors duration-200">Documentation</Link></li>
                <li><Link to="/resources" className="text-white/60 hover:text-white transition-colors duration-200">Blog</Link></li>
                <li><Link to="/resources" className="text-white/60 hover:text-white transition-colors duration-200">Case studies</Link></li>
                <li><Link to="/resources" className="text-white/60 hover:text-white transition-colors duration-200">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-white text-xs tracking-[-0.01em]">Company</h3>
              <ul className="space-y-2 text-xs">
                <li><Link to="#about" className="text-white/60 hover:text-white transition-colors duration-200">About</Link></li>
                <li><Link to="#contact" className="text-white/60 hover:text-white transition-colors duration-200">Contact</Link></li>
                <li><Link to="#careers" className="text-white/60 hover:text-white transition-colors duration-200">Careers</Link></li>
                <li><Link to="#privacy" className="text-white/60 hover:text-white transition-colors duration-200">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.08] pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-white/60">
              © 2024 DocuMind AI. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-white/60">
              <Link to="#terms" className="hover:text-white transition-colors duration-200">Terms</Link>
              <Link to="#privacy" className="hover:text-white transition-colors duration-200">Privacy</Link>
              <Link to="/products/security" className="hover:text-white transition-colors duration-200">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ResourcesPage;
