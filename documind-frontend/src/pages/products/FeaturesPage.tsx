import PageLayout from "@/components/layout/PageLayout";
import { 
  FileText, 
  Search, 
  Brain, 
  Zap, 
  Layers, 
  FileCheck,
  CheckCircle2,
  Workflow,
  Users,
  FileBarChart,
  FileCode
} from "lucide-react";

const FeaturesPage = () => {
  return (
    <PageLayout 
      title="Features"
      description="Powerful tools designed for modern document analysis workflows"
    >
      <div className="space-y-24">
        {/* Core Features */}
        <section>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Core Features
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Everything you need to analyze documents efficiently
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
    </PageLayout>
  );
};

export default FeaturesPage;

