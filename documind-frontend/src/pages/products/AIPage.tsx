import PageLayout from "@/components/layout/PageLayout";
import { Brain, Sparkles, MessageSquare, FileSearch, TrendingUp, Target, CheckCircle2 } from "lucide-react";

const AIPage = () => {
  return (
    <PageLayout 
      title="AI & Intelligence"
      description="Advanced AI capabilities that understand context, extract insights, and provide intelligent analysis"
    >
      <div className="space-y-24">
        <section>
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
    </PageLayout>
  );
};

export default AIPage;

