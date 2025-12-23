import PageLayout from "@/components/layout/PageLayout";
import { ArrowRight } from "lucide-react";

// CheckIcon component matching LandingPage style
const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3 h-3">
    <path d="M13 4L6 11l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Custom Icon Components - Sophisticated, minimal designs
const RAGIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="8" y="6" width="32" height="36" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M14 14h20M14 20h16M14 26h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <circle cx="36" cy="12" r="2" fill="currentColor" opacity="0.2"/>
    <path d="M34 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
    <rect x="10" y="32" width="28" height="8" rx="1" fill="currentColor" opacity="0.05"/>
    <path d="M16 36h16M18 40h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.2"/>
  </svg>
);

const AgentsIcon = () => (
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

const ConversationalIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="8" y="8" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <rect x="20" y="24" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <circle cx="14" cy="14" r="1.5" fill="currentColor" opacity="0.2"/>
    <circle cx="20" cy="14" r="1.5" fill="currentColor" opacity="0.2"/>
    <circle cx="26" cy="14" r="1.5" fill="currentColor" opacity="0.2"/>
    <circle cx="26" cy="30" r="1.5" fill="currentColor" opacity="0.2"/>
    <circle cx="32" cy="30" r="1.5" fill="currentColor" opacity="0.2"/>
    <circle cx="38" cy="30" r="1.5" fill="currentColor" opacity="0.2"/>
    <path d="M12 18h8M16 22h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <path d="M24 34h12M28 38h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
  </svg>
);

const SemanticSearchIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="20" cy="20" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="m28 28 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <circle cx="16" cy="16" r="1.5" fill="currentColor" opacity="0.15"/>
    <circle cx="22" cy="16" r="1.5" fill="currentColor" opacity="0.15"/>
    <circle cx="19" cy="22" r="1.5" fill="currentColor" opacity="0.15"/>
    <path d="M18 18l2 2M20 18l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.2"/>
    <rect x="8" y="36" width="32" height="6" rx="1" fill="currentColor" opacity="0.05"/>
    <path d="M12 39h24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.2"/>
  </svg>
);

const SummarizationIcon = () => (
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

const ClassificationIcon = () => (
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

// Custom Stat Badge Component
const StatBadge = ({ stat }: { stat: string }) => (
  <div className="inline-flex items-center gap-1.5 px-2 py-1 border border-white/10 bg-white/[0.02] rounded-full">
    <div className="w-0.5 h-0.5 rounded-full bg-white/40"></div>
    <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">{stat}</span>
  </div>
);

// Custom List Item Component - matching LandingPage style
const CapabilityItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-2 group">
    <div className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-md bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
      <CheckIcon />
    </div>
    <span className="text-xs text-white/80">{text}</span>
  </div>
);

const AIPage = () => {
  const coreCapabilities = [
    {
                title: "RAG Technology",
      description: "Retrieval-Augmented Generation ensures accurate, context-aware responses with proper citations and source attribution. Every answer is grounded in your actual documents, not generic knowledge.",
      capabilities: [
                  "Context-aware responses",
                  "Source citations",
                  "Hybrid search (semantic + keyword)",
                  "Re-ranking for accuracy"
      ],
      stat: "99.2% accuracy",
      icon: RAGIcon
              },
              {
                title: "AI Agents",
      description: "Intelligent agents that automate document analysis tasks, extract information, and generate insights automatically. Set them to work and let them handle the heavy lifting.",
      capabilities: [
                  "Automated analysis",
                  "Task automation",
                  "Smart extraction",
                  "Intelligent routing"
      ],
      stat: "10x faster",
      icon: AgentsIcon
              },
              {
                title: "Conversational AI",
      description: "Natural language interface for querying documents. Ask questions in plain English and get accurate, cited answers. The conversation flows naturally, understanding context and intent.",
      capabilities: [
                  "Natural language queries",
                  "Multi-turn conversations",
                  "Context retention",
                  "Query suggestions"
      ],
      stat: "Human-like",
      icon: ConversationalIcon
    }
  ];

  const advancedCapabilities = [
    {
                title: "Semantic Search",
      description: "Find information by meaning, not just keywords. Understand intent and context across all your documents. Discover connections you didn't know existed.",
      capabilities: [
                  "Meaning-based search",
                  "Intent understanding",
                  "Cross-document search",
                  "Related content discovery"
      ],
      stat: "Deep understanding",
      icon: SemanticSearchIcon
              },
              {
                title: "Smart Summarization",
      description: "Automatically generate summaries, extract key points, and identify important information in documents. Get the essence without reading every word.",
      capabilities: [
                  "Automatic summaries",
                  "Key point extraction",
                  "Executive briefs",
                  "Custom summary formats"
      ],
      stat: "Instant insights",
      icon: SummarizationIcon
              },
              {
                title: "Intelligent Classification",
      description: "Automatically categorize and tag documents based on content, type, and context. Smart organization without manual work. Your documents organize themselves.",
      capabilities: [
                  "Auto-categorization",
                  "Content-based tagging",
                  "Type detection",
                  "Smart organization"
      ],
      stat: "Zero effort",
      icon: ClassificationIcon
    }
  ];

  return (
    <PageLayout 
      title="AI & Intelligence"
      description="Advanced capabilities that understand context, extract insights, and provide intelligent analysis—without the typical AI hype."
    >
      <div className="space-y-20">
        {/* Introduction Section */}
        <section>
          <div className="max-w-4xl">
            <div className="inline-block mb-4">
              <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Intelligence Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight">
              Understanding that goes beyond keywords
            </h2>
            <p className="text-sm text-white/50 leading-relaxed mb-8">
              Our intelligence system doesn't just process text—it understands meaning, context, and relationships. 
              Every capability is designed to help you work with documents the way you think, not the way machines compute.
            </p>
            <div className="mt-12 pt-8 border-t border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
                <div className="group">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white mb-1.5 relative inline-block tracking-tight">
                    <span className="relative z-10">99.2%</span>
                    <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div className="text-[10px] text-white/45 font-medium tracking-[0.1em] uppercase">
                    Accuracy rate
                  </div>
                  {/* Decorative line */}
                  <div className="w-6 h-px bg-white/10 mt-2 group-hover:w-10 group-hover:bg-white/20 transition-all duration-300"></div>
                </div>
                <div className="group">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white mb-1.5 relative inline-block tracking-tight">
                    <span className="relative z-10">&lt;100ms</span>
                    <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div className="text-[10px] text-white/45 font-medium tracking-[0.1em] uppercase">
                    Average response time
                  </div>
                  {/* Decorative line */}
                  <div className="w-6 h-px bg-white/10 mt-2 group-hover:w-10 group-hover:bg-white/20 transition-all duration-300"></div>
                </div>
                <div className="group">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white mb-1.5 relative inline-block tracking-tight">
                    <span className="relative z-10">10M+</span>
                    <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div className="text-[10px] text-white/45 font-medium tracking-[0.1em] uppercase">
                    Documents analyzed
                  </div>
                  {/* Decorative line */}
                  <div className="w-6 h-px bg-white/10 mt-2 group-hover:w-10 group-hover:bg-white/20 transition-all duration-300"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Capabilities - Editorial Style */}
        <section>
          <div className="mb-12">
            <div className="inline-block mb-3">
              <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Core Capabilities</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight max-w-3xl">
              Built for precision and reliability
            </h2>
            <p className="text-sm text-white/50 max-w-2xl leading-relaxed">
              Every capability is engineered to deliver accurate, trustworthy results. No hallucinations, no guesswork.
            </p>
          </div>

          <div className="space-y-16">
            {coreCapabilities.map((capability, index) => {
              const Icon = capability.icon;
              return (
                <div 
                  key={index} 
                  className={`flex flex-col lg:flex-row gap-10 items-start ${
                    index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  <div className="flex-1 lg:max-w-xl">
                    <div className="mb-4">
                      <StatBadge stat={capability.stat} />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight">
                      {capability.title}
                    </h3>
                    <p className="text-sm text-white/60 mb-6 leading-relaxed">
                      {capability.description}
                    </p>
                    <div className="space-y-3">
                      {capability.capabilities.map((item, i) => (
                        <CapabilityItem key={i} text={item} />
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 lg:max-w-xl">
                    <div className="aspect-[4/3] relative group">
                      <div className="absolute inset-0 border border-white/10 rounded-lg overflow-hidden">
                        <div className="absolute inset-0 bg-white/[0.01]"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02)_0%,transparent_70%)]"></div>
                        <div className="absolute inset-0 flex items-center justify-center p-8">
                          <div className="relative w-full h-full flex items-center justify-center">
                            <div className="absolute inset-0 border border-white/5 rounded-lg"></div>
                            <div className="relative z-10 w-24 h-24 text-white/20 group-hover:text-white/30 transition-colors">
                              <Icon />
                            </div>
                            <div className="absolute bottom-6 left-6 right-6 space-y-1.5">
                              <div className="h-0.5 bg-white/5 rounded-full w-full"></div>
                              <div className="h-0.5 bg-white/5 rounded-full w-3/4"></div>
                              <div className="h-0.5 bg-white/5 rounded-full w-5/6"></div>
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

        {/* Advanced Capabilities - Grid Layout */}
        <section>
          <div className="mb-12">
            <div className="inline-block mb-3">
              <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Advanced Features</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight max-w-3xl">
              Intelligence that adapts to your needs
            </h2>
            <p className="text-sm text-white/50 max-w-2xl leading-relaxed">
              Beyond the basics, these capabilities transform how you interact with information.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {advancedCapabilities.map((capability, index) => {
              const Icon = capability.icon;
              return (
                <div 
                  key={index} 
                  className="group relative"
                >
                  <div className="h-full relative">
                    <div className="absolute inset-0 border border-white/10 rounded-lg bg-white/[0.01] group-hover:bg-white/[0.02] group-hover:border-white/15 transition-all duration-500"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.02)_0%,transparent_50%)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative p-5">
                      <div className="mb-6">
                        <div className="relative mb-6">
                          <div className="absolute -inset-0.5 border border-white/5 rounded-lg"></div>
                          <div className="relative w-12 h-12 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-center group-hover:bg-white/[0.04] group-hover:border-white/15 transition-all duration-300">
                            <div className="w-7 h-7 text-white/30 group-hover:text-white/40 transition-colors">
                              <Icon />
                            </div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <StatBadge stat={capability.stat} />
                        </div>
                        <h3 className="text-base font-medium mb-2 text-white">
                          {capability.title}
                        </h3>
                        <p className="text-white/60 mb-6 leading-relaxed text-xs">
                          {capability.description}
                        </p>
                      </div>
                      <div className="space-y-3 mb-6">
                        {capability.capabilities.map((item, i) => (
                          <CapabilityItem key={i} text={item} />
                        ))}
                      </div>
                      <div className="pt-6 border-t border-white/10">
                        <div className="flex items-center gap-1.5 text-xs text-white/40 group-hover:text-white/60 transition-colors">
                          <span>Learn more</span>
                          <ArrowRight className="w-3 h-3" />
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
        <section className="pt-12">
          <div className="border-t border-white/10 pt-12">
            <div className="max-w-4xl mx-auto">
              <div className="mb-10 text-center">
                <div className="inline-block mb-3">
                  <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">How It Works</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight">
                  Simple on the surface, sophisticated underneath
                </h2>
                <p className="text-sm text-white/50 max-w-2xl mx-auto leading-relaxed">
                  The complexity is hidden. What you see is intelligence that just works.
                </p>
              </div>

              <div className="space-y-8">
                {[
                  {
                    step: "01",
                    title: "Document Ingestion",
                    description: "Your documents are processed, indexed, and made searchable. Every format, every structure, handled automatically."
                  },
                  {
                    step: "02",
                    title: "Semantic Understanding",
                    description: "Our models analyze meaning, context, and relationships. Not just words—actual understanding of concepts and ideas."
                  },
                  {
                    step: "03",
                    title: "Intelligent Retrieval",
                    description: "When you ask a question, the system finds the most relevant information across all your documents, ranked by relevance and accuracy."
                  },
                  {
                    step: "04",
                    title: "Contextual Response",
                    description: "Answers are generated with full context, proper citations, and source attribution. You always know where information comes from."
                  }
                ].map((item, index) => (
                  <div key={index} className="flex gap-4 group">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-center group-hover:bg-white/[0.04] group-hover:border-white/15 transition-all">
                        <span className="text-sm font-medium text-white/40 group-hover:text-white/60 transition-colors">{item.step}</span>
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="text-base font-medium mb-2 text-white">{item.title}</h3>
                      <p className="text-xs text-white/60 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="pt-12">
          <div className="border-t border-white/10 pt-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight">
                Experience intelligence that works
              </h2>
              <p className="text-sm text-white/50 mb-8 leading-relaxed">
                See how our AI capabilities can transform your document workflow.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a 
                  href="/app" 
                  className="inline-flex items-center justify-center px-6 py-2 bg-white text-black font-medium text-xs rounded-md hover:bg-white/90 transition-colors h-8"
                >
                  Start building
                  <ArrowRight className="w-3 h-3 ml-1.5" />
                </a>
                <a 
                  href="/pricing" 
                  className="inline-flex items-center justify-center px-6 py-2 border border-white/20 text-white font-medium text-xs rounded-md hover:bg-white/5 transition-colors h-8"
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

export default AIPage;
