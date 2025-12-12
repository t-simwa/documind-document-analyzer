import { Link } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import { ArrowRight } from "lucide-react";

// CheckIcon component matching LandingPage style
const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
    <path d="M13 4L6 11l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Custom Icon Components - Sophisticated, minimal designs
const CloudStorageIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="8" y="12" width="32" height="24" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M14 20h20M14 26h16M14 32h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <circle cx="36" cy="16" r="2" fill="currentColor" opacity="0.15"/>
    <path d="M34 16l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.2"/>
    <rect x="10" y="38" width="28" height="4" rx="1" fill="currentColor" opacity="0.05"/>
  </svg>
);

const CollaborationIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="16" cy="18" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <circle cx="32" cy="18" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M10 28c0-3 2.5-5.5 6-5.5s6 2.5 6 5.5M26 28c0-3 2.5-5.5 6-5.5s6 2.5 6 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <rect x="8" y="34" width="32" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
    <path d="M14 38h4M18 38h4M26 38h4M30 38h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.15"/>
  </svg>
);

const DevelopmentIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="6" y="10" width="16" height="20" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <rect x="26" y="14" width="16" height="20" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M10 18h8M10 22h10M10 26h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <path d="M30 22h8M30 26h10M30 30h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <circle cx="12" cy="34" r="1.5" fill="currentColor" opacity="0.15"/>
    <circle cx="36" cy="38" r="1.5" fill="currentColor" opacity="0.15"/>
    <path d="M22 20l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.2"/>
  </svg>
);

const APIIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="8" y="10" width="32" height="28" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M14 18h20M14 24h16M14 30h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <circle cx="36" cy="20" r="2" fill="currentColor" opacity="0.15"/>
    <circle cx="36" cy="26" r="2" fill="currentColor" opacity="0.15"/>
    <circle cx="36" cy="32" r="2" fill="currentColor" opacity="0.15"/>
    <path d="M10 6l4 4-4 4M38 6l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.2"/>
  </svg>
);

const WebhookIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="24" cy="24" r="12" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M24 12v6M24 30v6M12 24h6M30 24h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <circle cx="24" cy="18" r="2" fill="currentColor" opacity="0.15"/>
    <circle cx="24" cy="30" r="2" fill="currentColor" opacity="0.15"/>
    <circle cx="18" cy="24" r="2" fill="currentColor" opacity="0.15"/>
    <circle cx="30" cy="24" r="2" fill="currentColor" opacity="0.15"/>
    <path d="M20 20l8 8M28 20l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.2"/>
  </svg>
);

const NoCodeIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="8" y="8" width="32" height="32" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <rect x="12" y="14" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
    <rect x="24" y="20" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
    <rect x="12" y="26" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
    <path d="M18 18l6 6M24 18l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.2"/>
  </svg>
);

// Custom Stat Badge Component
const StatBadge = ({ stat }: { stat: string }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-white/[0.02] rounded-full">
    <div className="w-1 h-1 rounded-full bg-white/40"></div>
    <span className="text-xs font-medium text-white/50 uppercase tracking-wider">{stat}</span>
  </div>
);

// Custom List Item Component - matching LandingPage style
const CapabilityItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-3 group">
    <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
      <CheckIcon />
    </div>
    <span className="text-white/80">{text}</span>
  </div>
);

const IntegrationsPage = () => {
  const cloudStorageIntegrations = [
    "Google Drive",
    "Microsoft OneDrive",
    "Dropbox",
    "Box",
    "SharePoint"
  ];

  const collaborationIntegrations = [
    "Slack",
    "Microsoft Teams",
    "Notion",
    "Confluence"
  ];

  const developmentIntegrations = [
    "GitHub",
    "GitLab",
    "Jira"
  ];

  const coreIntegrationFeatures = [
    {
                title: "REST API",
      description: "Full-featured REST API for programmatic access to all DocuMind AI capabilities. Complete control, maximum flexibility.",
      capabilities: [
                  "Complete API coverage",
                  "RESTful design",
                  "OpenAPI documentation",
                  "Rate limiting",
                  "Authentication via API keys",
                  "Webhook support"
      ],
      stat: "Full control",
      icon: APIIcon
              },
              {
                title: "SDKs & Libraries",
      description: "Official SDKs for popular programming languages. Quick integration with your applications. Less code, more results.",
      capabilities: [
                  "Python SDK",
                  "JavaScript/TypeScript SDK",
                  "Node.js support",
                  "React components",
                  "Comprehensive documentation",
                  "Code examples"
      ],
      stat: "Developer-first",
      icon: DevelopmentIcon
              },
              {
                title: "Webhooks",
      description: "Real-time notifications for document processing, analysis completion, and system events. Stay in sync, automatically.",
      capabilities: [
                  "Event-driven architecture",
                  "Custom webhook endpoints",
                  "Retry mechanisms",
                  "Event filtering",
                  "Secure webhook delivery",
                  "Payload customization"
      ],
      stat: "Real-time",
      icon: WebhookIcon
              },
              {
                title: "No-Code Integrations",
      description: "Connect with Zapier, Make, and other no-code platforms. Automate workflows without coding. Power without complexity.",
      capabilities: [
                  "Zapier integration",
                  "Make (Integromat) support",
                  "Pre-built templates",
                  "Custom workflows",
                  "Trigger automation",
                  "Action automation"
      ],
      stat: "Zero code",
      icon: NoCodeIcon
              }
  ];

              return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white leading-tight">
            Integrations & APIs
          </h1>
          <p className="text-xl sm:text-2xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect DocuMind AI with your existing tools and workflows. Over 100+ integrations available.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="space-y-32">
          {/* Introduction Section */}
          <section>
            <div className="max-w-4xl">
              <div className="inline-block mb-6">
                <span className="text-sm font-medium text-white/40 uppercase tracking-wider">Connect Everything</span>
              </div>
              <h2 className="text-5xl sm:text-6xl font-bold mb-8 text-white leading-tight">
                Integrations that work the way you do
              </h2>
              <p className="text-xl text-white/50 leading-relaxed mb-12">
                Whether you're a developer building custom solutions or a team automating workflows, 
                we've built integrations that adapt to your needs—not the other way around.
              </p>
              <div className="mt-16 pt-12 border-t border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
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
                      <span className="relative z-10">&lt;5min</span>
                      <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="text-sm text-white/45 font-medium tracking-[0.1em] uppercase">
                      Setup Time
                    </div>
                    <div className="w-8 h-px bg-white/10 mt-3 group-hover:w-12 group-hover:bg-white/20 transition-all duration-300"></div>
                  </div>
                  <div className="group">
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 relative inline-block tracking-tight">
                      <span className="relative z-10">24/7</span>
                      <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="text-sm text-white/45 font-medium tracking-[0.1em] uppercase">
                      Support Available
                    </div>
                    <div className="w-8 h-px bg-white/10 mt-3 group-hover:w-12 group-hover:bg-white/20 transition-all duration-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Popular Integrations */}
          <section>
            <div className="mb-20">
              <div className="inline-block mb-4">
                <span className="text-sm font-medium text-white/40 uppercase tracking-wider">Popular Integrations</span>
              </div>
              <h2 className="text-5xl sm:text-6xl font-bold mb-6 text-white leading-tight max-w-3xl">
                Connect with the tools you already use
              </h2>
              <p className="text-xl text-white/50 max-w-2xl leading-relaxed">
                Seamless connections to cloud storage, collaboration tools, and development platforms.
              </p>
            </div>

            <div className="space-y-16">
              {/* Cloud Storage */}
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-center">
                    <div className="w-8 h-8 text-white/30">
                      <CloudStorageIcon />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Cloud Storage</h3>
                </div>
                <div className="grid md:grid-cols-5 gap-4">
                  {cloudStorageIntegrations.map((name, index) => (
                    <div 
                      key={index} 
                      className="group relative"
                    >
                      <div className="h-full relative">
                        <div className="absolute inset-0 border border-white/10 rounded-lg bg-white/[0.01] group-hover:bg-white/[0.02] group-hover:border-white/15 transition-all duration-500"></div>
                        <div className="relative p-6 text-center">
                          <h4 className="text-sm font-medium text-white/70 group-hover:text-white/90 transition-colors">
                            {name}
                          </h4>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collaboration */}
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-center">
                    <div className="w-8 h-8 text-white/30">
                      <CollaborationIcon />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Collaboration</h3>
                </div>
                <div className="grid md:grid-cols-4 gap-4">
                  {collaborationIntegrations.map((name, index) => (
                    <div 
                      key={index} 
                      className="group relative"
                    >
                      <div className="h-full relative">
                        <div className="absolute inset-0 border border-white/10 rounded-lg bg-white/[0.01] group-hover:bg-white/[0.02] group-hover:border-white/15 transition-all duration-500"></div>
                        <div className="relative p-6 text-center">
                          <h4 className="text-sm font-medium text-white/70 group-hover:text-white/90 transition-colors">
                            {name}
                          </h4>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Development */}
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-center">
                    <div className="w-8 h-8 text-white/30">
                      <DevelopmentIcon />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Development</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {developmentIntegrations.map((name, index) => (
                    <div 
                      key={index} 
                      className="group relative"
                    >
                      <div className="h-full relative">
                        <div className="absolute inset-0 border border-white/10 rounded-lg bg-white/[0.01] group-hover:bg-white/[0.02] group-hover:border-white/15 transition-all duration-500"></div>
                        <div className="relative p-6 text-center">
                          <h4 className="text-sm font-medium text-white/70 group-hover:text-white/90 transition-colors">
                            {name}
                          </h4>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="relative">
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </div>

          {/* Core Integration Features - Editorial Style */}
          <section>
            <div className="mb-20">
              <div className="inline-block mb-4">
                <span className="text-sm font-medium text-white/40 uppercase tracking-wider">API & Development</span>
              </div>
              <h2 className="text-5xl sm:text-6xl font-bold mb-6 text-white leading-tight max-w-3xl">
                Build with the tools you know
              </h2>
              <p className="text-xl text-white/50 max-w-2xl leading-relaxed">
                Comprehensive APIs and SDKs designed for developers who demand flexibility and control.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {coreIntegrationFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={index} 
                    className="group relative"
                  >
                    <div className="h-full relative">
                      <div className="absolute inset-0 border border-white/10 rounded-lg bg-white/[0.01] group-hover:bg-white/[0.02] group-hover:border-white/15 transition-all duration-500"></div>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.02)_0%,transparent_50%)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative p-10">
                        <div className="mb-8">
                          <div className="relative mb-8">
                            <div className="absolute -inset-1 border border-white/5 rounded-lg"></div>
                            <div className="relative w-20 h-20 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-center group-hover:bg-white/[0.04] group-hover:border-white/15 transition-all duration-300">
                              <div className="w-12 h-12 text-white/30 group-hover:text-white/40 transition-colors">
                                <Icon />
                              </div>
                            </div>
                          </div>
                          <div className="mb-4">
                            <StatBadge stat={feature.stat} />
                          </div>
                          <h3 className="text-2xl font-bold mb-4 text-white">
                            {feature.title}
                          </h3>
                          <p className="text-white/60 mb-8 leading-relaxed text-lg">
                            {feature.description}
                          </p>
                        </div>
                        <div className="space-y-4 mb-8">
                          {feature.capabilities.map((item, i) => (
                            <CapabilityItem key={i} text={item} />
                          ))}
                        </div>
                        <div className="pt-8 border-t border-white/10">
                          <div className="flex items-center gap-2 text-sm text-white/40 group-hover:text-white/60 transition-colors">
                            <span>Learn more</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
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
                    Integration in three simple steps
                  </h2>
                  <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
                    Connect your tools and start automating workflows in minutes, not hours.
                  </p>
                </div>

                <div className="space-y-12">
                  {[
                    {
                      step: "01",
                      title: "Choose Your Integration",
                      description: "Select from 100+ pre-built integrations or use our APIs to build custom connections. Everything you need is ready to go."
                    },
                    {
                      step: "02",
                      title: "Authenticate & Connect",
                      description: "Secure OAuth authentication connects your accounts in seconds. Your credentials stay safe—we never store passwords."
                    },
                    {
                      step: "03",
                      title: "Start Automating",
                      description: "Configure triggers and actions, then watch your workflows run automatically. Set it once, let it work forever."
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
                  Ready to connect your tools?
                </h2>
                <p className="text-xl text-white/50 mb-10 leading-relaxed">
                  See how our integrations can streamline your document workflows.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="/app" 
                    className="inline-flex items-center justify-center px-8 py-4 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors"
                  >
                    Start building
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </a>
                  <a 
                    href="/pricing" 
                    className="inline-flex items-center justify-center px-8 py-4 border border-white/20 text-white font-medium rounded-lg hover:bg-white/5 transition-colors"
                  >
                    View pricing
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

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
                <li><Link to="/pricing" className="text-white/60 hover:text-white transition-colors">Pricing</Link></li>
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
              <Link to="/products/security" className="hover:text-white transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IntegrationsPage;
