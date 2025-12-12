import PageLayout from "@/components/layout/PageLayout";
import { Cloud, Server, MessageSquare, Users, GitBranch, Workflow, FileText, Plug, Webhook, Terminal, Code, CheckCircle2 } from "lucide-react";

const IntegrationsPage = () => {
  return (
    <PageLayout 
      title="Integrations & APIs"
      description="Connect DocuMind AI with your existing tools and workflows. Over 100+ integrations available."
    >
      <div className="space-y-24">
        <section>
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
    </PageLayout>
  );
};

export default IntegrationsPage;

