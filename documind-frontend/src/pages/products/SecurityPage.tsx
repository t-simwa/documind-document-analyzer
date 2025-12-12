import { Link } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import { 
  ShieldCheck, 
  LockKeyhole, 
  Fingerprint, 
  Lock, 
  Key, 
  Eye, 
  CheckCircle2,
  Users,
  Settings,
  FileCheck,
  Globe,
  Building2,
  Server,
  Shield,
  Database,
  Network,
  AlertTriangle,
  Clock,
  Download,
  UserCheck,
  UserX,
  Mail,
  HardDrive,
  Cloud,
  Zap,
  BarChart3
} from "lucide-react";

const SecurityPage = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white leading-tight">
            Security
          </h1>
          <p className="text-xl sm:text-2xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            Enterprise-grade security and compliance built into every layer. Your documents are protected with industry-leading standards.
          </p>
        </div>
      </section>

      {/* Compliance Certifications Section */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Compliance & Certifications
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Certified and audited to meet the highest security standards
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "SOC 2 Type II",
                description: "Certified for security, availability, and confidentiality. Regular audits ensure ongoing compliance.",
                badge: "Certified"
              },
              {
                icon: LockKeyhole,
                title: "GDPR Compliant",
                description: "Full compliance with European data protection regulations. Data residency options available.",
                badge: "Compliant"
              },
              {
                icon: Fingerprint,
                title: "HIPAA Ready",
                description: "Healthcare data protection standards built-in. BAA available for covered entities.",
                badge: "Ready"
              },
              {
                icon: Shield,
                title: "ISO 27001",
                description: "Information security management system certification. Currently in progress.",
                badge: "In Progress"
              },
              {
                icon: FileCheck,
                title: "Regular Audits",
                description: "Annual third-party security audits and penetration testing to ensure continuous compliance.",
                badge: "Annual"
              },
              {
                icon: AlertTriangle,
                title: "Vulnerability Management",
                description: "Continuous vulnerability assessments and rapid response to security threats.",
                badge: "Active"
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="p-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-white/80">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">{item.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enterprise-Grade Security Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Enterprise-Grade Security
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Advanced security controls and monitoring for enterprise organizations
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Settings,
                title: "Admin Controls",
                description: "Comprehensive administrative controls for managing your organization's security settings and user access.",
                features: [
                  "Team management and user provisioning",
                  "Role-based access control (RBAC)",
                  "Fine-grained permissions",
                  "Organization-wide security policies",
                  "Custom security rules",
                  "Automated user lifecycle management",
                  "Bulk user operations",
                  "Delegated administration"
                ]
              },
              {
                icon: Eye,
                title: "Audit Logs",
                description: "Complete visibility into all actions and events across your organization with comprehensive audit trails.",
                features: [
                  "Comprehensive activity logging",
                  "User action tracking",
                  "Document access logs",
                  "API call auditing",
                  "Security event monitoring",
                  "Compliance reporting",
                  "Real-time alerting",
                  "Exportable audit reports"
                ]
              },
              {
                icon: FileCheck,
                title: "App Approvals",
                description: "Control which applications and integrations can access your data with granular approval workflows.",
                features: [
                  "OAuth app approval workflows",
                  "API access controls",
                  "Third-party integration management",
                  "Permission scoping",
                  "App usage monitoring",
                  "Revocation capabilities",
                  "Security review process",
                  "Custom approval policies"
                ]
              },
              {
                icon: Database,
                title: "Data Encryption",
                description: "End-to-end encryption ensures your documents are protected at every stage of processing and storage.",
                features: [
                  "Encryption at rest (AES-256)",
                  "Encryption in transit (TLS 1.3)",
                  "Field-level encryption",
                  "Key management (KMS)",
                  "Encrypted backups",
                  "Zero-knowledge architecture",
                  "Customer-managed keys",
                  "Encryption key rotation"
                ]
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="p-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-white">{item.title}</h3>
                  <p className="text-white/60 mb-6 leading-relaxed">
                    {item.description}
                  </p>
                  <ul className="space-y-3">
                    {item.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-white/60">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Identity Management Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Identity Management
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Flexible authentication and access control options for your organization
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Key,
                title: "Single Sign-On (SSO)",
                description: "Seamless authentication with SAML 2.0, OAuth 2.0, and OpenID Connect support.",
                details: [
                  "SAML 2.0 support",
                  "OAuth 2.0 / OpenID Connect",
                  "Just-in-time provisioning",
                  "Automatic user sync"
                ]
              },
              {
                icon: Fingerprint,
                title: "Passkeys",
                description: "Passwordless authentication using WebAuthn standards for enhanced security and convenience.",
                details: [
                  "WebAuthn support",
                  "Biometric authentication",
                  "Hardware security keys",
                  "Cross-platform support"
                ]
              },
              {
                icon: Users,
                title: "SCIM Provisioning",
                description: "Automated user provisioning and deprovisioning through SCIM 2.0 protocol.",
                details: [
                  "SCIM 2.0 protocol",
                  "Automatic provisioning",
                  "Group synchronization",
                  "User attribute mapping"
                ]
              },
              {
                icon: Building2,
                title: "Domain Claiming",
                description: "Claim your organization's domain to automatically manage user access and authentication.",
                details: [
                  "Domain verification",
                  "Automatic user matching",
                  "Email domain restrictions",
                  "Domain-based policies"
                ]
              },
              {
                icon: UserCheck,
                title: "Login Restrictions",
                description: "Control who can access your organization with configurable login policies and restrictions.",
                details: [
                  "Email domain restrictions",
                  "Allowed email patterns",
                  "Blocked user lists",
                  "Time-based access"
                ]
              },
              {
                icon: Network,
                title: "IP Restrictions",
                description: "Restrict access to specific IP addresses or ranges for enhanced network security.",
                details: [
                  "IP allowlisting",
                  "IP range restrictions",
                  "VPN integration",
                  "Geographic restrictions"
                ]
              },
              {
                icon: Shield,
                title: "Multi-Factor Authentication",
                description: "Enforce MFA for all users with support for TOTP, SMS, and hardware tokens.",
                details: [
                  "TOTP authenticator apps",
                  "SMS verification",
                  "Hardware security keys",
                  "Backup codes"
                ]
              },
              {
                icon: Clock,
                title: "Session Management",
                description: "Advanced session controls including timeout policies and concurrent session limits.",
                details: [
                  "Configurable timeouts",
                  "Session activity monitoring",
                  "Concurrent session limits",
                  "Remote session termination"
                ]
              },
              {
                icon: Lock,
                title: "Password Policies",
                description: "Enforce strong password requirements and password expiration policies.",
                details: [
                  "Complexity requirements",
                  "Password expiration",
                  "Password history",
                  "Account lockout policies"
                ]
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="p-6 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{item.title}</h3>
                  <p className="text-sm text-white/60 mb-4 leading-relaxed">
                    {item.description}
                  </p>
                  <ul className="space-y-2">
                    {item.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white/40 mt-0.5 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Privacy & Data Protection
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Your data privacy is our priority with comprehensive controls and protections
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Users,
                title: "Private Teams",
                description: "Create private teams and workspaces with complete isolation. Control visibility and access at the team level.",
                features: [
                  "Team-level privacy controls",
                  "Isolated workspaces",
                  "Private document collections",
                  "Team member restrictions",
                  "Invitation-only access",
                  "Visibility controls"
                ]
              },
              {
                icon: UserX,
                title: "Guest Accounts",
                description: "Invite external collaborators with limited access. Guest accounts have restricted permissions and visibility.",
                features: [
                  "Limited access permissions",
                  "Time-limited access",
                  "Document-level restrictions",
                  "Read-only options",
                  "Automatic expiration",
                  "Activity monitoring"
                ]
              },
              {
                icon: Globe,
                title: "Multi-Region Hosting",
                description: "Choose where your data is stored with multi-region hosting options. Ensure compliance with data residency requirements.",
                features: [
                  "Regional data centers",
                  "Data residency options",
                  "EU data hosting",
                  "US data hosting",
                  "Asia-Pacific hosting",
                  "Compliance mapping"
                ]
              },
              {
                icon: Download,
                title: "Data Export & Portability",
                description: "Export your data at any time in standard formats. Full data portability ensures you maintain control.",
                features: [
                  "Full data export",
                  "Multiple export formats",
                  "Automated exports",
                  "API access for data",
                  "Bulk export capabilities",
                  "Data portability compliance"
                ]
              },
              {
                icon: HardDrive,
                title: "Data Retention & Deletion",
                description: "Configure data retention policies and securely delete data when required. Support for right to be forgotten.",
                features: [
                  "Configurable retention policies",
                  "Automatic data deletion",
                  "Secure deletion (DoD 5220.22-M)",
                  "Right to be forgotten",
                  "Deletion audit trails",
                  "Backup data removal"
                ]
              },
              {
                icon: Mail,
                title: "Privacy Controls",
                description: "Granular privacy controls for documents, collections, and user data. Control what's visible and accessible.",
                features: [
                  "Document-level privacy",
                  "Collection privacy settings",
                  "User data controls",
                  "Search visibility controls",
                  "Sharing restrictions",
                  "Privacy by default"
                ]
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="p-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-white">{item.title}</h3>
                  <p className="text-white/60 mb-6 leading-relaxed">
                    {item.description}
                  </p>
                  <ul className="space-y-3">
                    {item.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-white/60">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Infrastructure Security Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Infrastructure Security
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Enterprise-grade infrastructure with comprehensive security measures
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Server,
                title: "99.9% Uptime SLA",
                description: "Guaranteed availability with redundant infrastructure and automatic failover."
              },
              {
                icon: Shield,
                title: "DDoS Protection",
                description: "Multi-layer DDoS protection to ensure service availability during attacks."
              },
              {
                icon: Network,
                title: "Web Application Firewall",
                description: "WAF protection against common web vulnerabilities and attacks."
              },
              {
                icon: AlertTriangle,
                title: "Intrusion Detection",
                description: "Real-time monitoring and detection of suspicious activities and threats."
              },
              {
                icon: BarChart3,
                title: "Security Monitoring",
                description: "24/7 security monitoring with automated threat detection and response."
              },
              {
                icon: Zap,
                title: "Incident Response",
                description: "Rapid incident response team with defined procedures and escalation paths."
              },
              {
                icon: Cloud,
                title: "Disaster Recovery",
                description: "Automated backups and disaster recovery procedures with RPO/RTO guarantees."
              },
              {
                icon: Database,
                title: "High Availability",
                description: "Multi-zone deployment with automatic failover and load balancing."
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="p-6 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{item.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security Features Summary */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold mb-6 text-white">Security Features</h3>
              <ul className="space-y-3">
                {[
                  "Single Sign-On (SSO) support",
                  "Multi-factor authentication (MFA)",
                  "Role-based access control (RBAC)",
                  "IP allowlisting",
                  "Session management",
                  "Password policies",
                  "Data encryption at rest",
                  "TLS/SSL encryption in transit"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                    <span className="text-white/60">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-6 text-white">Compliance & Certifications</h3>
              <ul className="space-y-3">
                {[
                  "SOC 2 Type II certified",
                  "GDPR compliant",
                  "HIPAA ready",
                  "ISO 27001 (in progress)",
                  "Regular security audits",
                  "Penetration testing",
                  "Vulnerability assessments",
                  "Compliance reporting"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                    <span className="text-white/60">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

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

export default SecurityPage;
