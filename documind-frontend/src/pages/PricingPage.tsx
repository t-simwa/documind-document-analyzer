import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/layout/Navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, X } from "lucide-react";
import ContactDemoDialog from "@/components/contact/ContactDemoDialog";

const PricingPage = () => {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [isDemoDialogOpen, setIsDemoDialogOpen] = useState(false);

  const plans = [
    {
      id: "starter",
      name: "Starter",
      monthlyPrice: 29,
      annualPrice: 24,
      description: "Perfect for individuals and small teams getting started",
      popular: false,
      cta: "Start free trial",
      features: {
        documents: "Up to 100 documents",
        queries: "10,000 queries/month",
        storage: "10 GB storage",
        aiAnalysis: "Basic AI analysis",
        support: "Email support",
        security: "Standard security",
        apiAccess: false,
        teamCollaboration: false,
        customIntegrations: false,
        advancedAnalytics: false,
        prioritySupport: false,
        sso: false,
        auditLogs: false,
        customSla: false,
        dedicatedInfrastructure: false,
        customAiModels: false,
        onPremise: false,
      },
    },
    {
      id: "professional",
      name: "Professional",
      monthlyPrice: 99,
      annualPrice: 83,
      description: "For growing teams and businesses",
      popular: true,
      cta: "Start free trial",
      features: {
        documents: "Unlimited documents",
        queries: "100,000 queries/month",
        storage: "100 GB storage",
        aiAnalysis: "Advanced AI analysis",
        support: "Priority support",
        security: "Enhanced security",
        apiAccess: true,
        teamCollaboration: true,
        customIntegrations: true,
        advancedAnalytics: true,
        prioritySupport: true,
        sso: false,
        auditLogs: false,
        customSla: false,
        dedicatedInfrastructure: false,
        customAiModels: false,
        onPremise: false,
      },
    },
    {
      id: "enterprise",
      name: "Enterprise",
      monthlyPrice: null,
      annualPrice: null,
      description: "For large organizations with advanced needs",
      popular: false,
      cta: "Contact sales",
      features: {
        documents: "Unlimited everything",
        queries: "Unlimited queries",
        storage: "Unlimited storage",
        aiAnalysis: "Custom AI models",
        support: "24/7 dedicated support",
        security: "SOC 2, GDPR, HIPAA",
        apiAccess: true,
        teamCollaboration: true,
        customIntegrations: true,
        advancedAnalytics: true,
        prioritySupport: true,
        sso: true,
        auditLogs: true,
        customSla: true,
        dedicatedInfrastructure: true,
        customAiModels: true,
        onPremise: true,
      },
    },
  ];

  const featureRows = [
    { key: "documents", label: "Documents" },
    { key: "queries", label: "Queries per month" },
    { key: "storage", label: "Storage" },
    { key: "aiAnalysis", label: "AI Analysis" },
    { key: "support", label: "Support" },
    { key: "security", label: "Security & Compliance" },
    { key: "apiAccess", label: "API Access" },
    { key: "teamCollaboration", label: "Team Collaboration" },
    { key: "customIntegrations", label: "Custom Integrations" },
    { key: "advancedAnalytics", label: "Advanced Analytics" },
    { key: "prioritySupport", label: "Priority Support" },
    { key: "sso", label: "Single Sign-On (SSO)" },
    { key: "auditLogs", label: "Audit Logs" },
    { key: "customSla", label: "Custom SLA" },
    { key: "dedicatedInfrastructure", label: "Dedicated Infrastructure" },
    { key: "customAiModels", label: "Custom AI Models" },
    { key: "onPremise", label: "On-Premise Option" },
  ];

  const faqs = [
    {
      question: "Can I change plans later?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated and reflected in your next billing cycle.",
    },
    {
      question: "What happens if I exceed my plan limits?",
      answer: "We'll notify you when you're approaching your limits. You can upgrade your plan or purchase additional capacity. For Enterprise plans, we work with you to ensure you have the resources you need.",
    },
    {
      question: "Do you offer discounts for annual billing?",
      answer: "Yes! Annual billing saves you up to 17% compared to monthly billing. The discount is automatically applied when you select annual billing.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, and ACH transfers. Enterprise customers can also pay via invoice.",
    },
    {
      question: "Is there a free trial?",
      answer: "Yes, all plans come with a 14-day free trial. No credit card required to start. You can cancel anytime during the trial period.",
    },
    {
      question: "What security certifications do you have?",
      answer: "We're SOC 2 Type II certified, GDPR compliant, and HIPAA compliant. Enterprise plans include additional security features and compliance options.",
    },
    {
      question: "Can I get a custom plan?",
      answer: "Yes! Enterprise plans are fully customizable. Contact our sales team to discuss your specific requirements and get a custom quote.",
    },
    {
      question: "How does API access work?",
      answer: "API access is available on Professional and Enterprise plans. You'll receive API keys and comprehensive documentation to integrate DocuMind AI into your applications.",
    },
  ];

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === null) return "Custom";
    const price = billingPeriod === "annual" ? plan.annualPrice : plan.monthlyPrice;
    return `$${price}`;
  };

  const getSavings = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === null || plan.annualPrice === null) return null;
    const savings = ((plan.monthlyPrice - plan.annualPrice) / plan.monthlyPrice) * 100;
    return Math.round(savings);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-white leading-[1.1]">
            Pricing that scales with you
          </h1>
          <p className="text-lg sm:text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Start free, upgrade as you grow. All plans include full access to our platform.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-5 mb-16">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`text-sm font-medium transition-all duration-200 ${
                billingPeriod === "monthly" 
                  ? "text-white" 
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")}
              className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
                billingPeriod === "annual" ? "bg-white" : "bg-white/10"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-black rounded-full transition-transform duration-300 shadow-sm ${
                  billingPeriod === "annual" ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBillingPeriod("annual")}
                className={`text-sm font-medium transition-all duration-200 ${
                  billingPeriod === "annual" 
                    ? "text-white" 
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                Annual
              </button>
              {billingPeriod === "annual" && (
                <span className="text-xs font-semibold text-black bg-white px-2.5 py-1 rounded-full">
                  Save 17%
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className={`relative group ${
                  plan.popular 
                    ? "md:-mt-4 md:mb-4" 
                    : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold text-black bg-white">
                      Most Popular
                    </span>
                  </div>
                )}
                <div
                  className={`relative h-full p-8 lg:p-10 rounded-2xl border transition-all duration-300 ${
                    plan.popular
                      ? "border-white/20 bg-white/5 shadow-[0_8px_30px_rgba(255,255,255,0.08)]"
                      : "border-white/10 bg-white/[0.02] hover:border-white/15 hover:bg-white/5"
                  }`}
                >
                  <div className="mb-8">
                    <h3 className="text-2xl font-semibold mb-3 text-white">{plan.name}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{plan.description}</p>
                  </div>
                  
                  <div className="mb-8 pb-8 border-b border-white/10">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-6xl font-bold text-white tracking-tight">
                        {getPrice(plan)}
                      </span>
                      {plan.monthlyPrice !== null && (
                        <span className="text-lg text-white/40 font-light">
                          /{billingPeriod === "annual" ? "mo" : "mo"}
                        </span>
                      )}
                    </div>
                    {plan.monthlyPrice !== null && (
                      <div className="flex items-center gap-2 mt-3">
                        {billingPeriod === "annual" && (
                          <>
                            <span className="text-sm text-white/30 line-through">
                              ${plan.monthlyPrice}/mo
                            </span>
                            <span className="text-xs font-medium text-white/50">
                              billed annually
                            </span>
                          </>
                        )}
                        {billingPeriod === "monthly" && (
                          <span className="text-xs text-white/40">
                            billed monthly
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {plan.id === "enterprise" ? (
                    <Button
                      className={`w-full mb-10 font-medium transition-all duration-200 ${
                        plan.popular
                          ? "bg-white text-black hover:bg-white/90 h-12 text-base"
                          : "border-white/20 text-white hover:bg-white/5 hover:border-white/30 h-12 text-base"
                      }`}
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => setIsDemoDialogOpen(true)}
                    >
                      {plan.cta}
                    </Button>
                  ) : (
                    <Button
                      className={`w-full mb-10 font-medium transition-all duration-200 ${
                        plan.popular
                          ? "bg-white text-black hover:bg-white/90 h-12 text-base"
                          : "border-white/20 text-white hover:bg-white/5 hover:border-white/30 h-12 text-base"
                      }`}
                      variant={plan.popular ? "default" : "outline"}
                      asChild
                    >
                      <Link to="/app">{plan.cta}</Link>
                    </Button>
                  )}

                  <ul className="space-y-4">
                    {Object.entries(plan.features)
                      .slice(0, 6)
                      .map(([key, value]) => (
                        <li key={key} className="flex items-start gap-3">
                          {typeof value === "boolean" ? (
                            value ? (
                              <Check className="w-5 h-5 text-white/70 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                            ) : (
                              <X className="w-5 h-5 text-white/15 mt-0.5 flex-shrink-0" strokeWidth={2} />
                            )
                          ) : (
                            <Check className="w-5 h-5 text-white/70 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                          )}
                          <span className="text-sm text-white/60 leading-relaxed">
                            {typeof value === "boolean" ? (
                              value ? "Included" : "Not included"
                            ) : (
                              value
                            )}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-y border-white/10 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white tracking-tight">
              Compare plans
            </h2>
            <p className="text-lg text-white/40 max-w-2xl mx-auto">
              See exactly what's included in each plan
            </p>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[900px] px-4 sm:px-0">
              <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-5 px-6 font-semibold text-white bg-white/[0.02]">
                        <span className="text-sm uppercase tracking-wider text-white/50">Feature</span>
                      </th>
                      {plans.map((plan) => (
                        <th
                          key={plan.id}
                          className={`text-center py-5 px-6 font-semibold bg-white/[0.02] ${
                            plan.popular 
                              ? "text-white border-l border-r border-white/10" 
                              : "text-white/70"
                          }`}
                        >
                          <span className="text-base">{plan.name}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {featureRows.map((row, index) => (
                      <tr
                        key={row.key}
                        className={`border-b border-white/5 transition-colors group hover:bg-white/5 ${
                          index % 2 === 0 ? "bg-white/[0.01]" : ""
                        }`}
                      >
                        <td className="py-5 px-6 text-white/70 font-medium group-hover:text-white/90 transition-colors">
                          {row.label}
                        </td>
                        {plans.map((plan) => {
                          const value = plan.features[row.key as keyof typeof plan.features];
                          return (
                            <td
                              key={plan.id}
                              className={`py-5 px-6 text-center ${
                                plan.popular ? "border-l border-r border-white/5" : ""
                              }`}
                            >
                              {typeof value === "boolean" ? (
                                value ? (
                                  <Check className="w-5 h-5 text-white/70 mx-auto" strokeWidth={2.5} />
                                ) : (
                                  <X className="w-5 h-5 text-white/15 mx-auto" strokeWidth={2} />
                                )
                              ) : (
                                <span className="text-white/60 text-sm">{value}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 lg:p-16 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white tracking-tight">
              Enterprise solutions
            </h2>
            <p className="text-lg text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed">
              Custom plans tailored to your organization's needs. Includes dedicated infrastructure,
              custom AI models, on-premise deployment, and priority support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-white/90 font-medium text-base px-8 h-12"
                onClick={() => setIsDemoDialogOpen(true)}
              >
                Contact sales
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/5 font-medium text-base px-8 h-12"
                asChild
              >
                <Link to="/products/security">Learn more</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 border-y border-white/10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white tracking-tight">
              Frequently asked questions
            </h2>
            <p className="text-lg text-white/40">
              Everything you need to know about our pricing
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-1">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`} 
                className="border border-white/10 rounded-lg px-6 bg-white/[0.01] hover:bg-white/5 transition-colors"
              >
                <AccordionTrigger className="text-left text-white hover:text-white/90 py-6 font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-white/60 pb-6 leading-relaxed text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white tracking-tight">
            Ready to get started?
          </h2>
          <p className="text-lg text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of teams using DocuMind AI to unlock insights from their documents.
            Start your free trial today—no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-white/90 font-medium text-base px-8 h-12"
              asChild
            >
              <Link to="/app">Start free trial</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5 font-medium text-base px-8 h-12"
              onClick={() => setIsDemoDialogOpen(true)}
            >
              Contact sales
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Demo Dialog */}
      <ContactDemoDialog 
        open={isDemoDialogOpen} 
        onOpenChange={setIsDemoDialogOpen} 
      />

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
                <li>
                  <Link to="/products" className="text-white/60 hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-white/60 hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    to="/products/security"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Security
                  </Link>
                </li>
                <li>
                  <Link to="/app" className="text-white/60 hover:text-white transition-colors">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Resources</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/resources" className="text-white/60 hover:text-white transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link to="/resources" className="text-white/60 hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/resources" className="text-white/60 hover:text-white transition-colors">
                    Case studies
                  </Link>
                </li>
                <li>
                  <Link to="/resources" className="text-white/60 hover:text-white transition-colors">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Company</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="#about" className="text-white/60 hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="#contact" className="text-white/60 hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="#careers" className="text-white/60 hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link to="#privacy" className="text-white/60 hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/60">© 2024 DocuMind AI. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-white/60">
              <Link to="#terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link to="#privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link to="/products/security" className="hover:text-white transition-colors">
                Security
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;

