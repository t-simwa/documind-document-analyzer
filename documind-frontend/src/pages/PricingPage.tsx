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
import { Check, X, HelpCircle } from "lucide-react";

const PricingPage = () => {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

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
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white leading-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-xl sm:text-2xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            Choose the plan that fits your needs. All plans include a 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm ${billingPeriod === "monthly" ? "text-white" : "text-white/60"}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")}
              className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                billingPeriod === "annual" ? "bg-white" : "bg-white/20"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-black rounded-full transition-transform duration-200 ${
                  billingPeriod === "annual" ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-sm ${billingPeriod === "annual" ? "text-white" : "text-white/60"}`}>
              Annual
            </span>
            {billingPeriod === "annual" && (
              <span className="text-xs font-medium text-white/60 bg-white/10 px-2 py-1 rounded">
                Save up to 17%
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="relative p-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
              >
                <h3 className="text-2xl font-semibold mb-2 text-white">{plan.name}</h3>
                <p className="text-white/60 mb-6 text-sm">{plan.description}</p>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">{getPrice(plan)}</span>
                    {plan.monthlyPrice !== null && (
                      <>
                        <span className="text-white/60">
                          /{billingPeriod === "annual" ? "month" : "mo"}
                        </span>
                        {billingPeriod === "annual" && getSavings(plan) && (
                          <span className="text-sm text-white/60 line-through">
                            ${plan.monthlyPrice}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {billingPeriod === "annual" && plan.monthlyPrice !== null && (
                    <p className="text-sm text-white/60 mt-2">
                      Billed annually (${plan.annualPrice! * 12}/year)
                    </p>
                  )}
                </div>
                <Button
                  className="w-full mb-8 font-medium border-white/20 text-white hover:bg-white/5"
                  variant="outline"
                  asChild
                >
                  <Link to={plan.id === "enterprise" ? "#contact" : "/app"}>
                    {plan.cta}
                  </Link>
                </Button>
                <ul className="space-y-3">
                  {Object.entries(plan.features)
                    .slice(0, 6)
                    .map(([key, value]) => (
                      <li key={key} className="flex items-start gap-3">
                        {typeof value === "boolean" ? (
                          value ? (
                            <Check className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                          ) : (
                            <X className="w-5 h-5 text-white/20 mt-0.5 flex-shrink-0" />
                          )
                        ) : (
                          <Check className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-sm text-white/60">
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
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center text-white">
            Compare plans
          </h2>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[800px] px-4 sm:px-0">
              <div className="overflow-y-visible">
                <table className="w-full">
                  <thead className="sticky top-16 bg-black z-10">
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 px-4 font-semibold text-white bg-black">Feature</th>
                      {plans.map((plan) => (
                      <th
                        key={plan.id}
                        className="text-center py-4 px-4 font-semibold bg-black text-white/60"
                      >
                        {plan.name}
                      </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {featureRows.map((row, index) => (
                      <tr
                        key={row.key}
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors group ${
                          index % 2 === 0 ? "bg-white/2" : ""
                        }`}
                      >
                        <td className="py-4 px-4 text-white/80 font-medium group-hover:text-white transition-colors">
                          {row.label}
                        </td>
                        {plans.map((plan) => {
                          const value = plan.features[row.key as keyof typeof plan.features];
                          return (
                            <td
                              key={plan.id}
                              className="py-4 px-4 text-center"
                            >
                              {typeof value === "boolean" ? (
                                value ? (
                                  <Check className="w-5 h-5 text-white/60 mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-white/20 mx-auto" />
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
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-white">
            Need something more?
          </h2>
          <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            Enterprise plans include everything in Professional, plus dedicated infrastructure,
            custom AI models, on-premise deployment, and more.
          </p>
          <Button
            size="lg"
            className="bg-white text-black hover:bg-white/90 font-medium text-base px-8 h-12"
            asChild
          >
            <Link to="#contact">Contact sales</Link>
          </Button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-y border-white/10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center text-white">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-white/10">
                <AccordionTrigger className="text-left text-white hover:text-white/80 py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-white/60 pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-white">
            Ready to get started?
          </h2>
          <p className="text-xl text-white/60 mb-10">
            Join thousands of teams using DocuMind AI to unlock insights from their documents
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
              asChild
            >
              <Link to="#contact">Contact sales</Link>
            </Button>
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

