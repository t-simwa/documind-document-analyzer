import PageLayout from "@/components/layout/PageLayout";
import { ArrowRight } from "lucide-react";

// CheckIcon component matching LandingPage style
const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
    <path d="M13 4L6 11l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Custom Icon Components - Unique, bespoke designs
const MultiFormatIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="6" y="8" width="18" height="24" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
    <rect x="24" y="12" width="18" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
    <path d="M12 16h6M12 20h8M12 24h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    <path d="M30 20h6M30 24h8M30 28h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    <circle cx="36" cy="10" r="3" fill="currentColor" opacity="0.3"/>
    <path d="M34 10h4M36 8v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IntelligentSearchIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
    <path d="m28 28 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <circle cx="16" cy="16" r="2" fill="currentColor" opacity="0.3"/>
    <circle cx="22" cy="16" r="2" fill="currentColor" opacity="0.3"/>
    <circle cx="19" cy="22" r="2" fill="currentColor" opacity="0.3"/>
    <path d="M18 18l2 2M20 18l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

const LightningFastIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path d="M26 6L12 24h10l-2 16 14-18H24l2-16z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.4"/>
    <path d="M20 12h8M24 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <circle cx="28" cy="18" r="2" fill="currentColor" opacity="0.2"/>
    <circle cx="20" cy="30" r="2" fill="currentColor" opacity="0.2"/>
  </svg>
);

const DocumentOrganizationIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="8" y="6" width="14" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
    <rect x="26" y="10" width="14" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
    <path d="M12 12h6M12 16h8M12 20h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <path d="M30 18h6M30 22h8M30 26h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <rect x="10" y="28" width="6" height="6" rx="1" fill="currentColor" opacity="0.15"/>
    <rect x="18" y="28" width="6" height="6" rx="1" fill="currentColor" opacity="0.15"/>
    <rect x="32" y="32" width="6" height="6" rx="1" fill="currentColor" opacity="0.15"/>
  </svg>
);

const QualityAssuranceIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="10" y="8" width="28" height="32" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
    <path d="M16 18h16M16 24h12M16 30h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <circle cx="36" cy="14" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M34 14l1.5 1.5 2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    <rect x="12" y="36" width="8" height="2" rx="1" fill="currentColor" opacity="0.2"/>
    <rect x="22" y="36" width="8" height="2" rx="1" fill="currentColor" opacity="0.2"/>
    <rect x="32" y="36" width="4" height="2" rx="1" fill="currentColor" opacity="0.2"/>
  </svg>
);

const CustomWorkflowsIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="6" y="12" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
    <rect x="22" y="20" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
    <rect x="30" y="8" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
    <path d="M18 18l4 2M18 18l4-2M30 14l-4 6M30 14l-4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <circle cx="12" cy="18" r="1.5" fill="currentColor" opacity="0.2"/>
    <circle cx="28" cy="26" r="1.5" fill="currentColor" opacity="0.2"/>
    <circle cx="36" cy="14" r="1.5" fill="currentColor" opacity="0.2"/>
  </svg>
);

const TeamCollaborationIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="16" cy="18" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
    <circle cx="32" cy="18" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
    <path d="M10 28c0-3 2.5-5.5 6-5.5s6 2.5 6 5.5M26 28c0-3 2.5-5.5 6-5.5s6 2.5 6 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <rect x="8" y="34" width="32" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M14 38h4M18 38h4M26 38h4M30 38h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.2"/>
  </svg>
);

const DocumentInsightsIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="8" y="6" width="20" height="28" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
    <path d="M12 14h12M12 20h10M12 26h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <path d="M32 12l4 4-4 4M32 20l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
    <circle cx="38" cy="16" r="3" fill="currentColor" opacity="0.15"/>
    <path d="M30 30l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    <rect x="10" y="36" width="16" height="2" rx="1" fill="currentColor" opacity="0.2"/>
  </svg>
);

const APIAccessIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="8" y="10" width="32" height="28" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
    <path d="M14 18h20M14 24h16M14 30h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <circle cx="36" cy="20" r="2" fill="currentColor" opacity="0.2"/>
    <circle cx="36" cy="26" r="2" fill="currentColor" opacity="0.2"/>
    <circle cx="36" cy="32" r="2" fill="currentColor" opacity="0.2"/>
    <path d="M10 6l4 4-4 4M38 6l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
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

const FeaturesPage = () => {
  const coreFeatures = [
    {
      title: "Multi-Format Support",
      description: "Upload and analyze PDFs, Word documents, images, spreadsheets, and more. Automatic text extraction and OCR for scanned documents.",
      capabilities: ["PDF, DOCX, TXT, MD", "Image OCR", "Spreadsheet parsing", "Markdown support"],
      stat: "50+ formats",
      icon: MultiFormatIcon
    },
    {
      title: "Intelligent Search",
      description: "Semantic search across all your documents. Find information instantly, even in complex technical content.",
      capabilities: ["Semantic search", "Keyword search", "Hybrid search", "Advanced filters"],
      stat: "<100ms response",
      icon: IntelligentSearchIcon
    },
    {
      title: "Lightning Fast",
      description: "Process and analyze documents in seconds. Get instant answers to complex questions across large document sets.",
      capabilities: ["Fast processing", "Real-time analysis", "Instant responses", "Scalable infrastructure"],
      stat: "10x faster",
      icon: LightningFastIcon
    },
    {
      title: "Document Organization",
      description: "Organize documents into collections, folders, and projects. Tag and categorize for easy management.",
      capabilities: ["Collections & folders", "Tagging system", "Project organization", "Smart categorization"],
      stat: "Unlimited",
      icon: DocumentOrganizationIcon
    },
    {
      title: "Quality Assurance",
      description: "Built-in validation and quality checks ensure accurate document processing and analysis.",
      capabilities: ["Format validation", "Content verification", "Error detection", "Quality scoring"],
      stat: "99.9% accuracy",
      icon: QualityAssuranceIcon
    }
  ];

  const advancedFeatures = [
    {
      title: "Custom Workflows",
      description: "Create automated workflows for document processing, analysis, and distribution. Integrate with your existing tools and processes.",
      details: [
        "Automated processing pipelines",
        "Custom analysis rules",
        "Integration triggers",
        "Conditional logic"
      ],
      icon: CustomWorkflowsIcon
    },
    {
      title: "Team Collaboration",
      description: "Share documents, insights, and analysis with your team. Real-time collaboration and commenting features.",
      details: [
        "Shared workspaces",
        "Real-time collaboration",
        "Comments & annotations",
        "Permission management"
      ],
      icon: TeamCollaborationIcon
    },
    {
      title: "Document Insights",
      description: "Automatically extract key insights, entities, and summaries from your documents. Get structured data from unstructured content.",
      details: [
        "Entity extraction",
        "Key insights",
        "Automatic summaries",
        "Structured data export"
      ],
      icon: DocumentInsightsIcon
    },
    {
      title: "API Access",
      description: "Full REST API access to all features. Build custom integrations and automate your document analysis workflows.",
      details: [
        "REST API",
        "Webhooks",
        "SDK libraries",
        "Custom integrations"
      ],
      icon: APIAccessIcon
    }
  ];

  return (
    <PageLayout 
      title="Features"
      description="Everything you need to transform how you work with documents"
    >
      <div className="space-y-32">
        {/* Core Features - Editorial Style */}
        <section>
          <div className="mb-20">
            <div className="inline-block mb-4">
              <span className="text-sm font-medium text-white/40 uppercase tracking-wider">Core Capabilities</span>
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold mb-6 text-white leading-tight max-w-3xl">
              Built for professionals who demand precision
            </h2>
            <p className="text-xl text-white/50 max-w-2xl leading-relaxed">
              Every feature is designed with your workflow in mind. No compromises, no shortcuts.
            </p>
          </div>

          <div className="space-y-32">
            {coreFeatures.map((feature, index) => {
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
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_0%,transparent_70%)]"></div>
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

        {/* Advanced Features - Grid Layout */}
        <section>
          <div className="mb-20">
            <div className="inline-block mb-4">
              <span className="text-sm font-medium text-white/40 uppercase tracking-wider">Enterprise Features</span>
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold mb-6 text-white leading-tight max-w-3xl">
              Scale with confidence
            </h2>
            <p className="text-xl text-white/50 max-w-2xl leading-relaxed">
              Advanced capabilities for teams and organizations that need more.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {advancedFeatures.map((feature, index) => {
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
                        <h3 className="text-2xl font-bold mb-4 text-white">
                          {feature.title}
                        </h3>
                        <p className="text-white/60 mb-8 leading-relaxed text-lg">
                          {feature.description}
                        </p>
                      </div>
                      <div className="space-y-4 mb-8">
                        {feature.details.map((detail, i) => (
                          <CapabilityItem key={i} text={detail} />
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

        {/* CTA Section */}
        <section className="pt-16">
          <div className="border-t border-white/10 pt-20">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white leading-tight">
                Ready to get started?
              </h2>
              <p className="text-xl text-white/50 mb-10 leading-relaxed">
                See how these features can transform your document workflow.
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
    </PageLayout>
  );
};

export default FeaturesPage;

