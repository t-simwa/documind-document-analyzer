import { Link } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import { ArrowRight } from "lucide-react";

// CheckIcon component matching LandingPage style
const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3 h-3">
    <path d="M13 4L6 11l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Custom Icon Components - Sophisticated, minimal designs
const ComplianceIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="8" y="6" width="32" height="36" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M14 14h20M14 20h16M14 26h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <circle cx="36" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
    <path d="M34 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
    <rect x="10" y="32" width="28" height="8" rx="1" fill="currentColor" opacity="0.05"/>
    <path d="M16 36h16M18 40h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.2"/>
  </svg>
);

const AdminControlsIcon = () => (
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

const AuditLogsIcon = () => (
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

const EncryptionIcon = () => (
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

const IdentityIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="16" cy="18" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <circle cx="32" cy="18" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M10 28c0-3 2.5-5.5 6-5.5s6 2.5 6 5.5M26 28c0-3 2.5-5.5 6-5.5s6 2.5 6 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <rect x="8" y="34" width="32" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
    <path d="M14 38h4M18 38h4M26 38h4M30 38h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.15"/>
  </svg>
);

const PrivacyIcon = () => (
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

const InfrastructureIcon = () => (
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

// Badge Component for Certifications
const CertificationBadge = ({ badge }: { badge: string }) => (
  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10">
    {badge}
  </span>
);

const SecurityPage = () => {
  const coreSecurityFeatures = [
    {
      title: "Admin Controls",
      description: "Comprehensive administrative controls for managing your organization's security settings and user access. Complete visibility and control over every aspect of your security posture.",
      capabilities: [
        "Team management and user provisioning",
        "Role-based access control (RBAC)",
        "Fine-grained permissions",
        "Organization-wide security policies",
        "Custom security rules",
        "Automated user lifecycle management",
        "Bulk user operations",
        "Delegated administration"
      ],
      stat: "Full control",
      icon: AdminControlsIcon
    },
    {
      title: "Audit Logs",
      description: "Complete visibility into all actions and events across your organization with comprehensive audit trails. Every action is logged, tracked, and available for review.",
      capabilities: [
        "Comprehensive activity logging",
        "User action tracking",
        "Document access logs",
        "API call auditing",
        "Security event monitoring",
        "Compliance reporting",
        "Real-time alerting",
        "Exportable audit reports"
      ],
      stat: "Complete visibility",
      icon: AuditLogsIcon
    },
    {
      title: "Data Encryption",
      description: "End-to-end encryption ensures your documents are protected at every stage of processing and storage. Multiple layers of protection, zero compromises.",
      capabilities: [
        "Encryption at rest (AES-256)",
        "Encryption in transit (TLS 1.3)",
        "Field-level encryption",
        "Key management (KMS)",
        "Encrypted backups",
        "Zero-knowledge architecture",
        "Customer-managed keys",
        "Encryption key rotation"
      ],
      stat: "Bank-level",
      icon: EncryptionIcon
    }
  ];

  const complianceCertifications = [
    {
      title: "SOC 2 Type II",
      description: "Certified for security, availability, and confidentiality. Regular audits ensure ongoing compliance with the highest industry standards.",
      badge: "Certified",
      icon: ComplianceIcon
    },
    {
      title: "GDPR Compliant",
      description: "Full compliance with European data protection regulations. Data residency options available to meet regional requirements.",
      badge: "Compliant",
      icon: ComplianceIcon
    },
    {
      title: "HIPAA Ready",
      description: "Healthcare data protection standards built-in. Business Associate Agreement available for covered entities.",
      badge: "Ready",
      icon: ComplianceIcon
    },
    {
      title: "ISO 27001",
      description: "Information security management system certification. Currently in progress with regular updates on certification status.",
      badge: "In Progress",
      icon: ComplianceIcon
    }
  ];

  const identityFeatures = [
    {
      title: "Single Sign-On (SSO)",
      description: "Seamless authentication with SAML 2.0, OAuth 2.0, and OpenID Connect support. One login, access everywhere.",
      capabilities: [
        "SAML 2.0 support",
        "OAuth 2.0 / OpenID Connect",
        "Just-in-time provisioning",
        "Automatic user sync"
      ],
      icon: IdentityIcon
    },
    {
      title: "Passkeys",
      description: "Passwordless authentication using WebAuthn standards for enhanced security and convenience. The future of authentication.",
      capabilities: [
        "WebAuthn support",
        "Biometric authentication",
        "Hardware security keys",
        "Cross-platform support"
      ],
      icon: IdentityIcon
    },
    {
      title: "Multi-Factor Authentication",
      description: "Enforce MFA for all users with support for TOTP, SMS, and hardware tokens. Multiple layers, maximum security.",
      capabilities: [
        "TOTP authenticator apps",
        "SMS verification",
        "Hardware security keys",
        "Backup codes"
      ],
      icon: IdentityIcon
    }
  ];

  const privacyFeatures = [
    {
      title: "Private Teams",
      description: "Create private teams and workspaces with complete isolation. Control visibility and access at the team level. Your data, your rules.",
      capabilities: [
        "Team-level privacy controls",
        "Isolated workspaces",
        "Private document collections",
        "Team member restrictions",
        "Invitation-only access",
        "Visibility controls"
      ],
      icon: PrivacyIcon
    },
    {
      title: "Multi-Region Hosting",
      description: "Choose where your data is stored with multi-region hosting options. Ensure compliance with data residency requirements.",
      capabilities: [
        "Regional data centers",
        "Data residency options",
        "EU data hosting",
        "US data hosting",
        "Asia-Pacific hosting",
        "Compliance mapping"
      ],
      icon: PrivacyIcon
    },
    {
      title: "Data Export & Portability",
      description: "Export your data at any time in standard formats. Full data portability ensures you maintain complete control.",
      capabilities: [
        "Full data export",
        "Multiple export formats",
        "Automated exports",
        "API access for data",
        "Bulk export capabilities",
        "Data portability compliance"
      ],
      icon: PrivacyIcon
    }
  ];

  const infrastructureFeatures = [
    {
      title: "99.9% Uptime SLA",
      description: "Guaranteed availability with redundant infrastructure and automatic failover."
    },
    {
      title: "DDoS Protection",
      description: "Multi-layer DDoS protection to ensure service availability during attacks."
    },
    {
      title: "Web Application Firewall",
      description: "WAF protection against common web vulnerabilities and attacks."
    },
    {
      title: "Intrusion Detection",
      description: "Real-time monitoring and detection of suspicious activities and threats."
    },
    {
      title: "Security Monitoring",
      description: "24/7 security monitoring with automated threat detection and response."
    },
    {
      title: "Incident Response",
      description: "Rapid incident response team with defined procedures and escalation paths."
    },
    {
      title: "Disaster Recovery",
      description: "Automated backups and disaster recovery procedures with RPO/RTO guarantees."
    },
    {
      title: "High Availability",
      description: "Multi-zone deployment with automatic failover and load balancing."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight mb-4 text-white leading-tight">
            Security
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-white/60 mb-8 max-w-2xl mx-auto leading-relaxed">
            Enterprise-grade security and compliance built into every layer. Your documents are protected with industry-leading standards.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="space-y-20">
          {/* Introduction Section */}
          <section>
            <div className="max-w-4xl">
              <div className="inline-block mb-4">
                <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Security Foundation</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight">
                Security that doesn't compromise
              </h2>
              <p className="text-sm text-white/50 leading-relaxed mb-8">
                Every layer of our platform is designed with security in mind. From encryption to access controls, 
                we've built a foundation you can trust—without sacrificing usability or performance.
              </p>
              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
                  <div className="group">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white mb-1.5 relative inline-block tracking-tight">
                      <span className="relative z-10">SOC 2</span>
                      <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="text-[10px] text-white/45 font-medium tracking-[0.1em] uppercase">
                      Type II Certified
                    </div>
                    <div className="w-6 h-px bg-white/10 mt-2 group-hover:w-10 group-hover:bg-white/20 transition-all duration-300"></div>
                  </div>
                  <div className="group">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white mb-1.5 relative inline-block tracking-tight">
                      <span className="relative z-10">AES-256</span>
                      <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="text-[10px] text-white/45 font-medium tracking-[0.1em] uppercase">
                      Encryption Standard
                    </div>
                    <div className="w-6 h-px bg-white/10 mt-2 group-hover:w-10 group-hover:bg-white/20 transition-all duration-300"></div>
                  </div>
                  <div className="group">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white mb-1.5 relative inline-block tracking-tight">
                      <span className="relative z-10">99.9%</span>
                      <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="text-[10px] text-white/45 font-medium tracking-[0.1em] uppercase">
                      Uptime SLA
                    </div>
                    <div className="w-6 h-px bg-white/10 mt-2 group-hover:w-10 group-hover:bg-white/20 transition-all duration-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Compliance Certifications */}
          <section>
            <div className="mb-12">
              <div className="inline-block mb-3">
                <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Compliance & Certifications</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight max-w-3xl">
                Certified and audited to the highest standards
              </h2>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">
                Regular audits and certifications ensure we meet and exceed industry security standards.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {complianceCertifications.map((cert, index) => {
                const Icon = cert.icon;
                return (
                  <div 
                    key={index} 
                    className="group relative"
                  >
                    <div className="h-full relative">
                      <div className="absolute inset-0 border border-white/10 rounded-lg bg-white/[0.01] group-hover:bg-white/[0.02] group-hover:border-white/15 transition-all duration-500"></div>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.02)_0%,transparent_50%)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="relative">
                            <div className="absolute -inset-0.5 border border-white/5 rounded-lg"></div>
                            <div className="relative w-10 h-10 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-center group-hover:bg-white/[0.04] group-hover:border-white/15 transition-all duration-300">
                              <div className="w-6 h-6 text-white/30 group-hover:text-white/40 transition-colors">
                                <Icon />
                              </div>
                            </div>
                          </div>
                          <CertificationBadge badge={cert.badge} />
                        </div>
                        <h3 className="text-base font-medium mb-2 text-white">
                          {cert.title}
                        </h3>
                        <p className="text-white/60 leading-relaxed text-xs">
                          {cert.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Core Security Features - Editorial Style */}
          <section>
            <div className="mb-12">
              <div className="inline-block mb-3">
                <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Core Security</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight max-w-3xl">
                Enterprise-grade controls and monitoring
              </h2>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">
                Comprehensive security features designed for organizations that demand complete control and visibility.
              </p>
            </div>

            <div className="space-y-16">
              {coreSecurityFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={index} 
                    className={`flex flex-col lg:flex-row gap-10 items-start ${
                      index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                    }`}
                  >
                    <div className="flex-1 lg:max-w-xl">
                      <div className="mb-4">
                        <StatBadge stat={feature.stat} />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-white/60 mb-6 leading-relaxed">
                        {feature.description}
                      </p>
                      <div className="space-y-3">
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

          {/* Identity Management */}
          <section>
            <div className="mb-12">
              <div className="inline-block mb-3">
                <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Identity & Access</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight max-w-3xl">
                Flexible authentication for modern teams
              </h2>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">
                Multiple authentication options that adapt to your organization's needs and security requirements.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {identityFeatures.map((feature, index) => {
                const Icon = feature.icon;
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
                          <h3 className="text-base font-medium mb-2 text-white">
                            {feature.title}
                          </h3>
                          <p className="text-white/60 mb-6 leading-relaxed text-xs">
                            {feature.description}
                          </p>
                        </div>
                        <div className="space-y-3 mb-6">
                          {feature.capabilities.map((item, i) => (
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

          {/* Privacy & Data Protection */}
          <section>
            <div className="mb-12">
              <div className="inline-block mb-3">
                <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Privacy & Data</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight max-w-3xl">
                Your data, your control
              </h2>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">
                Comprehensive privacy controls and data protection features that put you in complete control.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {privacyFeatures.map((feature, index) => {
                const Icon = feature.icon;
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
                          <h3 className="text-base font-medium mb-2 text-white">
                            {feature.title}
                          </h3>
                          <p className="text-white/60 mb-6 leading-relaxed text-xs">
                            {feature.description}
                          </p>
                        </div>
                        <div className="space-y-3 mb-6">
                          {feature.capabilities.map((item, i) => (
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

          {/* Infrastructure Security */}
          <section>
            <div className="mb-12">
              <div className="inline-block mb-3">
                <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Infrastructure</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight max-w-3xl">
                Enterprise-grade infrastructure
              </h2>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">
                Comprehensive security measures at every layer of our infrastructure.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {infrastructureFeatures.map((feature, index) => (
                <div 
                  key={index} 
                  className="group relative"
                >
                  <div className="h-full relative">
                    <div className="absolute inset-0 border border-white/10 rounded-lg bg-white/[0.01] group-hover:bg-white/[0.02] group-hover:border-white/15 transition-all duration-500"></div>
                    <div className="relative p-4">
                      <h3 className="text-sm font-medium mb-2 text-white">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-white/60 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Security Summary */}
          <section className="pt-12">
            <div className="border-t border-white/10 pt-12">
              <div className="max-w-4xl mx-auto">
                <div className="mb-10 text-center">
                  <div className="inline-block mb-3">
                    <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Security Overview</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight">
                    Built for organizations that demand security
                  </h2>
                  <p className="text-sm text-white/50 max-w-2xl mx-auto leading-relaxed">
                    Every feature, every control, every layer designed with security as the foundation.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-base font-medium mb-4 text-white">Security Features</h3>
                    <div className="space-y-3">
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
                        <CapabilityItem key={i} text={feature} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-medium mb-4 text-white">Compliance & Certifications</h3>
                    <div className="space-y-3">
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
                        <CapabilityItem key={i} text={feature} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="pt-12">
            <div className="border-t border-white/10 pt-12">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight">
                  Ready to secure your documents?
                </h2>
                <p className="text-sm text-white/50 mb-8 leading-relaxed">
                  See how our security features can protect your organization's most sensitive documents.
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
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="relative w-4 h-4">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path 
                      d="M12 2L2 19.5h20L12 2z" 
                      fill="currentColor"
                      className="text-white"
                    />
                  </svg>
                </div>
                <span className="font-medium text-white text-xs">DocuMind AI</span>
              </div>
              <p className="text-xs text-white/60">
                Intelligent document analysis with enterprise-grade security.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-white text-xs">Product</h3>
              <ul className="space-y-2 text-xs">
                <li><Link to="/products" className="text-white/60 hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="text-white/60 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/products/security" className="text-white/60 hover:text-white transition-colors">Security</Link></li>
                <li><Link to="/app" className="text-white/60 hover:text-white transition-colors">Sign in</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-white text-xs">Resources</h3>
              <ul className="space-y-2 text-xs">
                <li><Link to="/resources" className="text-white/60 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="/resources" className="text-white/60 hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/resources" className="text-white/60 hover:text-white transition-colors">Case studies</Link></li>
                <li><Link to="/resources" className="text-white/60 hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-white text-xs">Company</h3>
              <ul className="space-y-2 text-xs">
                <li><Link to="#about" className="text-white/60 hover:text-white transition-colors">About</Link></li>
                <li><Link to="#contact" className="text-white/60 hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="#careers" className="text-white/60 hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="#privacy" className="text-white/60 hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-white/60">
              © 2024 DocuMind AI. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-white/60">
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
