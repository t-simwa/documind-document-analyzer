import { Link } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import { ArrowRight } from "lucide-react";

// Custom Icon Components - Sophisticated, minimal designs
const UsageAnalyticsIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="8" y="6" width="32" height="36" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M14 14h20M14 20h16M14 26h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <rect x="12" y="32" width="24" height="2" rx="1" fill="currentColor" opacity="0.15"/>
    <rect x="12" y="36" width="20" height="2" rx="1" fill="currentColor" opacity="0.15"/>
    <rect x="12" y="40" width="16" height="2" rx="1" fill="currentColor" opacity="0.15"/>
    <circle cx="38" cy="34" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
    <path d="M36 34l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
  </svg>
);

const PerformanceIcon = () => (
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

const DocumentInsightsIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="8" y="6" width="32" height="36" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M14 14h20M14 20h16M14 26h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <circle cx="24" cy="34" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
    <path d="M20 34l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
    <circle cx="20" cy="30" r="1.5" fill="currentColor" opacity="0.1"/>
    <circle cx="28" cy="30" r="1.5" fill="currentColor" opacity="0.1"/>
  </svg>
);

const RealTimeIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="24" cy="24" r="12" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M24 12v6M24 30v6M12 24h6M30 24h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <circle cx="24" cy="18" r="1.5" fill="currentColor" opacity="0.15"/>
    <circle cx="24" cy="30" r="1.5" fill="currentColor" opacity="0.15"/>
    <circle cx="18" cy="24" r="1.5" fill="currentColor" opacity="0.15"/>
    <circle cx="30" cy="24" r="1.5" fill="currentColor" opacity="0.15"/>
    <path d="M20 20l8 8M28 20l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.2"/>
  </svg>
);

const ReportsIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="6" y="8" width="14" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <rect x="24" y="12" width="14" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <rect x="28" y="34" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M10 14h6M10 18h8M10 22h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <path d="M28 18h6M28 22h8M28 26h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <path d="M32 38h6M32 42h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <circle cx="12" cy="30" r="1.5" fill="currentColor" opacity="0.15"/>
    <circle cx="30" cy="34" r="1.5" fill="currentColor" opacity="0.15"/>
    <circle cx="38" cy="40" r="1.5" fill="currentColor" opacity="0.15"/>
  </svg>
);

const BIIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="8" y="6" width="32" height="36" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M14 14h20M14 20h16M14 26h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <rect x="12" y="32" width="24" height="2" rx="1" fill="currentColor" opacity="0.15"/>
    <rect x="12" y="36" width="20" height="2" rx="1" fill="currentColor" opacity="0.15"/>
    <rect x="12" y="40" width="16" height="2" rx="1" fill="currentColor" opacity="0.15"/>
    <circle cx="38" cy="34" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
    <path d="M36 34l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
  </svg>
);

// Custom Stat Badge Component
const StatBadge = ({ stat }: { stat: string }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-white/[0.02] rounded-full">
    <div className="w-1 h-1 rounded-full bg-white/40"></div>
    <span className="text-xs font-medium text-white/50 uppercase tracking-wider">{stat}</span>
  </div>
);

// Custom List Item Component
const CapabilityItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-3 group/item">
    <div className="relative mt-2 flex-shrink-0">
      <div className="w-2 h-2 border border-white/30 rounded-sm rotate-45 group-hover/item:border-white/50 transition-colors"></div>
      <div className="absolute inset-0 w-2 h-2 border-t border-l border-white/20 rounded-sm"></div>
    </div>
    <span className="text-white/70 group-hover/item:text-white/90 transition-colors">{text}</span>
  </div>
);

const AnalyticsPage = () => {
  const coreAnalyticsFeatures = [
    {
      title: "Usage Analytics",
      description: "Comprehensive analytics dashboard showing document processing, query volume, and system usage. Understand exactly how your team uses the platform.",
      capabilities: [
        "Document processing metrics",
        "Query volume tracking",
        "User activity reports",
        "Storage usage",
        "API usage statistics",
        "Custom date ranges"
      ],
      stat: "Complete visibility",
      icon: UsageAnalyticsIcon
    },
    {
      title: "Performance Metrics",
      description: "Monitor system performance, response times, and processing speeds. Identify bottlenecks and optimize workflows before they become problems.",
      capabilities: [
        "Response time tracking",
        "Processing speed metrics",
        "System performance",
        "Error rate monitoring",
        "Success rate tracking",
        "Performance trends"
      ],
      stat: "Real-time monitoring",
      icon: PerformanceIcon
    },
    {
      title: "Document Insights",
      description: "Analyze document types, sizes, and processing patterns. Understand your document landscape and optimize your workflows accordingly.",
      capabilities: [
        "Document type distribution",
        "Size analysis",
        "Processing patterns",
        "Content analysis",
        "Usage patterns",
        "Trend analysis"
      ],
      stat: "Deep insights",
      icon: DocumentInsightsIcon
    }
  ];

  const advancedAnalyticsFeatures = [
    {
      title: "Real-Time Monitoring",
      description: "Live dashboards and alerts for system health, usage spikes, and important events. Stay ahead of issues before they impact your team.",
      capabilities: [
        "Real-time dashboards",
        "Custom alerts",
        "System health monitoring",
        "Usage notifications",
        "Event tracking",
        "Alert management"
      ],
      stat: "Always on",
      icon: RealTimeIcon
    },
    {
      title: "Custom Reports",
      description: "Generate custom reports for stakeholders. Export data for further analysis. Share insights the way your organization needs them.",
      capabilities: [
        "Custom report builder",
        "Scheduled reports",
        "PDF/CSV export",
        "Email delivery",
        "Report templates",
        "Data visualization"
      ],
      stat: "Fully customizable",
      icon: ReportsIcon
    },
    {
      title: "Business Intelligence",
      description: "Advanced BI features for deeper insights. Connect to your existing BI tools and data warehouses. Enterprise-grade analytics.",
      capabilities: [
        "BI tool integration",
        "Data warehouse export",
        "Advanced analytics",
        "Predictive insights",
        "Custom metrics",
        "Data modeling"
      ],
      stat: "Enterprise-ready",
      icon: BIIcon
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white leading-tight">
            Analytics & Insights
          </h1>
          <p className="text-xl sm:text-2xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            Track usage, measure performance, and gain insights into your document analysis workflows
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
                <span className="text-sm font-medium text-white/40 uppercase tracking-wider">Data-Driven Decisions</span>
              </div>
              <h2 className="text-5xl sm:text-6xl font-bold mb-8 text-white leading-tight">
                Insights that matter, presented clearly
              </h2>
              <p className="text-xl text-white/50 leading-relaxed mb-12">
                Analytics shouldn't be complicated. We've built dashboards and reports that give you 
                the insights you need without the complexity you don't. Every metric, every chart, 
                every report designed to help you make better decisions.
              </p>
              <div className="mt-16 pt-12 border-t border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
                  <div className="group">
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 relative inline-block tracking-tight">
                      <span className="relative z-10">Real-time</span>
                      <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="text-sm text-white/45 font-medium tracking-[0.1em] uppercase">
                      Data Updates
                    </div>
                    <div className="w-8 h-px bg-white/10 mt-3 group-hover:w-12 group-hover:bg-white/20 transition-all duration-300"></div>
                  </div>
                  <div className="group">
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 relative inline-block tracking-tight">
                      <span className="relative z-10">100+</span>
                      <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="text-sm text-white/45 font-medium tracking-[0.1em] uppercase">
                      Metrics Tracked
                    </div>
                    <div className="w-8 h-px bg-white/10 mt-3 group-hover:w-12 group-hover:bg-white/20 transition-all duration-300"></div>
                  </div>
                  <div className="group">
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 relative inline-block tracking-tight">
                      <span className="relative z-10">Unlimited</span>
                      <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="text-sm text-white/45 font-medium tracking-[0.1em] uppercase">
                      Custom Reports
                    </div>
                    <div className="w-8 h-px bg-white/10 mt-3 group-hover:w-12 group-hover:bg-white/20 transition-all duration-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Core Analytics Features - Editorial Style */}
          <section>
            <div className="mb-20">
              <div className="inline-block mb-4">
                <span className="text-sm font-medium text-white/40 uppercase tracking-wider">Core Analytics</span>
              </div>
              <h2 className="text-5xl sm:text-6xl font-bold mb-6 text-white leading-tight max-w-3xl">
                Everything you need to understand your usage
              </h2>
              <p className="text-xl text-white/50 max-w-2xl leading-relaxed">
                Comprehensive analytics that give you complete visibility into how your organization uses the platform.
              </p>
            </div>

            <div className="space-y-32">
              {coreAnalyticsFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={index} 
                    className={`flex flex-col lg:flex-row gap-16 items-start ${
                      index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                    }`}
                  >
                    <div className="flex-1 lg:max-w-xl">
                      <div className="mb-6">
                        <StatBadge stat={feature.stat} />
                      </div>
                      <h3 className="text-4xl sm:text-5xl font-bold mb-6 text-white leading-tight">
                        {feature.title}
                      </h3>
                      <p className="text-lg text-white/60 mb-8 leading-relaxed">
                        {feature.description}
                      </p>
                      <div className="space-y-4">
                        {feature.capabilities.map((capability, i) => (
                          <CapabilityItem key={i} text={capability} />
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 lg:max-w-xl">
                      <div className="aspect-[4/3] relative group">
                        <div className="absolute inset-0 border border-white/10 rounded-lg overflow-hidden">
                          <div className="absolute inset-0 bg-white/[0.01]"></div>
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02)_0%,transparent_70%)]"></div>
                          <div className="absolute inset-0 flex items-center justify-center p-12">
                            <div className="relative w-full h-full flex items-center justify-center">
                              <div className="absolute inset-0 border border-white/5 rounded-lg"></div>
                              <div className="relative z-10 w-32 h-32 text-white/20 group-hover:text-white/30 transition-colors">
                                <Icon />
                              </div>
                              <div className="absolute bottom-8 left-8 right-8 space-y-2">
                                <div className="h-1 bg-white/5 rounded-full w-full"></div>
                                <div className="h-1 bg-white/5 rounded-full w-3/4"></div>
                                <div className="h-1 bg-white/5 rounded-full w-5/6"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Divider */}
          <div className="relative">
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </div>

          {/* Advanced Analytics Features */}
          <section>
            <div className="mb-20">
              <div className="inline-block mb-4">
                <span className="text-sm font-medium text-white/40 uppercase tracking-wider">Advanced Features</span>
              </div>
              <h2 className="text-5xl sm:text-6xl font-bold mb-6 text-white leading-tight max-w-3xl">
                Analytics that scale with your needs
              </h2>
              <p className="text-xl text-white/50 max-w-2xl leading-relaxed">
                Advanced capabilities for organizations that need deeper insights and enterprise-grade reporting.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {advancedAnalyticsFeatures.map((feature, index) => {
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
                    Analytics that work from day one
                  </h2>
                  <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
                    Start tracking metrics immediately. No setup, no configuration—just insights.
                  </p>
                </div>

                <div className="space-y-12">
                  {[
                    {
                      step: "01",
                      title: "Automatic Tracking",
                      description: "Every action is tracked automatically. Document uploads, queries, analyses—everything is captured from the moment you start using the platform."
                    },
                    {
                      step: "02",
                      title: "Instant Dashboards",
                      description: "Pre-built dashboards show your key metrics immediately. No configuration needed. See your usage patterns, performance, and insights right away."
                    },
                    {
                      step: "03",
                      title: "Customize & Export",
                      description: "Customize reports, set up alerts, and export data when you're ready. Start simple, add complexity as your needs grow."
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
                  Ready to gain insights?
                </h2>
                <p className="text-xl text-white/50 mb-10 leading-relaxed">
                  See how analytics can help you optimize your document workflows.
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

export default AnalyticsPage;
