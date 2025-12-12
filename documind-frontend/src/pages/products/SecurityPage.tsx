import PageLayout from "@/components/layout/PageLayout";
import { ShieldCheck, LockKeyhole, Fingerprint, Lock, Key, Eye, CheckCircle2 } from "lucide-react";

const SecurityPage = () => {
  return (
    <PageLayout 
      title="Security"
      description="Built with security and compliance at the core. Your documents are protected at every layer."
    >
      <div className="space-y-24">
        <section>
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
    </PageLayout>
  );
};

export default SecurityPage;

