import PageLayout from "@/components/layout/PageLayout";
import { Smartphone, Globe, CheckCircle2 } from "lucide-react";

const MobilePage = () => {
  return (
    <PageLayout 
      title="Mobile Experience"
      description="Access and analyze documents from anywhere. Full-featured mobile apps for iOS and Android."
    >
      <div className="space-y-24">
        <section>
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {[
              {
                icon: Smartphone,
                title: "Native Mobile Apps",
                description: "Dedicated iOS and Android apps with full feature parity. Native performance and offline support.",
                features: [
                  "iOS app (App Store)",
                  "Android app (Play Store)",
                  "Native performance",
                  "Offline mode",
                  "Push notifications",
                  "Biometric authentication"
                ]
              },
              {
                icon: Globe,
                title: "Mobile Web",
                description: "Fully responsive web interface optimized for mobile browsers. Works seamlessly on any device.",
                features: [
                  "Responsive design",
                  "Touch-optimized UI",
                  "Mobile gestures",
                  "Fast loading",
                  "Progressive Web App (PWA)",
                  "Add to home screen"
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
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Mobile Features",
                features: [
                  "Document upload from device",
                  "Camera document capture",
                  "Quick document scan",
                  "Mobile-optimized chat",
                  "Voice queries",
                  "Touch-friendly interface"
                ]
              },
              {
                title: "Offline Capabilities",
                features: [
                  "Offline document viewing",
                  "Cached queries",
                  "Offline search",
                  "Sync when online",
                  "Background sync",
                  "Offline mode indicator"
                ]
              },
              {
                title: "Mobile Security",
                features: [
                  "Biometric authentication",
                  "Device encryption",
                  "Secure storage",
                  "Remote wipe",
                  "App-level security",
                  "Certificate pinning"
                ]
              }
            ].map((section, index) => (
              <div key={index} className="p-6 rounded-lg border border-white/10 bg-white/5">
                <h3 className="text-lg font-semibold mb-4 text-white">{section.title}</h3>
                <ul className="space-y-3">
                  {section.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-white/60 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-white/60">{feature}</span>
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

export default MobilePage;

