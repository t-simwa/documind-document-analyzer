import PageLayout from "@/components/layout/PageLayout";
import { BarChart3, TrendingUp, PieChart, Activity, FileBarChart, Target, CheckCircle2 } from "lucide-react";

const AnalyticsPage = () => {
  return (
    <PageLayout 
      title="Analytics & Insights"
      description="Track usage, measure performance, and gain insights into your document analysis workflows"
    >
      <div className="space-y-24">
        <section>
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
    </PageLayout>
  );
};

export default AnalyticsPage;

