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
const NativeAppIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="12" y="6" width="24" height="36" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <rect x="16" y="10" width="16" height="24" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
    <circle cx="24" cy="38" r="2" fill="currentColor" opacity="0.15"/>
    <path d="M18 16h12M18 20h10M18 24h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <rect x="14" y="28" width="20" height="2" rx="1" fill="currentColor" opacity="0.1"/>
    <rect x="14" y="32" width="16" height="2" rx="1" fill="currentColor" opacity="0.1"/>
  </svg>
);

const MobileWebIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="8" y="8" width="32" height="32" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M14 16h20M14 22h16M14 28h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <circle cx="24" cy="36" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
    <path d="M22 36l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.2"/>
  </svg>
);

const MobileFeaturesIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="12" y="6" width="24" height="36" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <circle cx="24" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
    <path d="M20 24h8M20 28h6M20 32h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <rect x="16" y="36" width="16" height="2" rx="1" fill="currentColor" opacity="0.1"/>
    <circle cx="24" cy="40" r="1.5" fill="currentColor" opacity="0.15"/>
  </svg>
);

const OfflineIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="12" y="6" width="24" height="36" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M18 16h12M18 22h10M18 28h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <circle cx="24" cy="36" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
    <path d="M22 36l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.2"/>
    <path d="M16 12l-4 4M32 12l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.15"/>
  </svg>
);

const MobileSecurityIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="12" y="6" width="24" height="36" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M18 16h12M18 22h10M18 28h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <circle cx="24" cy="36" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
    <path d="M22 36l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.2"/>
    <rect x="20" y="12" width="8" height="4" rx="1" fill="currentColor" opacity="0.1"/>
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

const MobilePage = () => {
  const coreMobileOptions = [
    {
                title: "Native Mobile Apps",
      description: "Dedicated iOS and Android apps with full feature parity. Native performance, offline support, and seamless integration with your device.",
      capabilities: [
                  "iOS app (App Store)",
                  "Android app (Play Store)",
                  "Native performance",
                  "Offline mode",
                  "Push notifications",
                  "Biometric authentication"
      ],
      stat: "Full-featured",
      icon: NativeAppIcon
              },
              {
                title: "Mobile Web",
      description: "Fully responsive web interface optimized for mobile browsers. Works seamlessly on any device, anywhere, without installation.",
      capabilities: [
                  "Responsive design",
                  "Touch-optimized UI",
                  "Mobile gestures",
                  "Fast loading",
                  "Progressive Web App (PWA)",
                  "Add to home screen"
      ],
      stat: "Universal access",
      icon: MobileWebIcon
    }
  ];

  const mobileFeatureCategories = [
              {
                title: "Mobile Features",
      description: "Everything you need to work with documents on mobile devices. Optimized for touch, speed, and convenience.",
      capabilities: [
                  "Document upload from device",
                  "Camera document capture",
                  "Quick document scan",
                  "Mobile-optimized chat",
                  "Voice queries",
                  "Touch-friendly interface"
      ],
      icon: MobileFeaturesIcon
              },
              {
                title: "Offline Capabilities",
      description: "Work without an internet connection. Your documents and queries sync automatically when you're back online.",
      capabilities: [
                  "Offline document viewing",
                  "Cached queries",
                  "Offline search",
                  "Sync when online",
                  "Background sync",
                  "Offline mode indicator"
      ],
      icon: OfflineIcon
              },
              {
                title: "Mobile Security",
      description: "Enterprise-grade security on your mobile device. Your documents are protected with the same standards as desktop.",
      capabilities: [
                  "Biometric authentication",
                  "Device encryption",
                  "Secure storage",
                  "Remote wipe",
                  "App-level security",
                  "Certificate pinning"
      ],
      icon: MobileSecurityIcon
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight mb-4 text-white leading-tight">
            Mobile Experience
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-white/60 mb-8 max-w-2xl mx-auto leading-relaxed">
            Access and analyze documents from anywhere. Full-featured mobile apps for iOS and Android.
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
                <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Mobile First</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight">
                Your documents, wherever you are
              </h2>
              <p className="text-sm text-white/50 leading-relaxed mb-8">
                Whether you're in the office or on the go, access your documents with the same power and 
                security you expect from desktop. Native apps and mobile web—both designed to work the way you do.
              </p>
              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
                  <div className="group">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white mb-1.5 relative inline-block tracking-tight">
                      <span className="relative z-10">iOS & Android</span>
                      <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="text-[10px] text-white/45 font-medium tracking-[0.1em] uppercase">
                      Native Apps
                    </div>
                    <div className="w-6 h-px bg-white/10 mt-2 group-hover:w-10 group-hover:bg-white/20 transition-all duration-300"></div>
                  </div>
                  <div className="group">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white mb-1.5 relative inline-block tracking-tight">
                      <span className="relative z-10">100%</span>
                      <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="text-[10px] text-white/45 font-medium tracking-[0.1em] uppercase">
                      Feature Parity
                    </div>
                    <div className="w-6 h-px bg-white/10 mt-2 group-hover:w-10 group-hover:bg-white/20 transition-all duration-300"></div>
                  </div>
                  <div className="group">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white mb-1.5 relative inline-block tracking-tight">
                      <span className="relative z-10">Offline</span>
                      <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="text-[10px] text-white/45 font-medium tracking-[0.1em] uppercase">
                      Full Support
                    </div>
                    <div className="w-6 h-px bg-white/10 mt-2 group-hover:w-10 group-hover:bg-white/20 transition-all duration-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Core Mobile Options - Editorial Style */}
          <section>
            <div className="mb-12">
              <div className="inline-block mb-3">
                <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Mobile Options</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight max-w-3xl">
                Choose how you want to access your documents
              </h2>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">
                Native apps for the best experience, or mobile web for universal access. Both offer the same powerful features.
              </p>
            </div>

            <div className="space-y-16">
              {coreMobileOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <div 
                    key={index} 
                    className={`flex flex-col lg:flex-row gap-10 items-start ${
                      index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                    }`}
                  >
                    <div className="flex-1 lg:max-w-xl">
                      <div className="mb-4">
                        <StatBadge stat={option.stat} />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight">
                        {option.title}
                      </h3>
                      <p className="text-sm text-white/60 mb-6 leading-relaxed">
                        {option.description}
                      </p>
                      <div className="space-y-3">
                        {option.capabilities.map((capability, i) => (
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

          {/* Mobile Feature Categories */}
          <section>
            <div className="mb-12">
              <div className="inline-block mb-3">
                <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Mobile Features</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight max-w-3xl">
                Built for mobile workflows
              </h2>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">
                Features designed specifically for mobile devices. Touch-optimized, fast, and secure.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {mobileFeatureCategories.map((category, index) => {
                const Icon = category.icon;
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
                            {category.title}
                          </h3>
                          <p className="text-white/60 mb-6 leading-relaxed text-xs">
                            {category.description}
                          </p>
                        </div>
                        <div className="space-y-3 mb-6">
                          {category.capabilities.map((item, i) => (
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

          {/* How It Works Section */}
          <section className="pt-12">
            <div className="border-t border-white/10 pt-12">
              <div className="max-w-4xl mx-auto">
                <div className="mb-10 text-center">
                  <div className="inline-block mb-3">
                    <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Getting Started</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight">
                    Start using mobile in minutes
                  </h2>
                  <p className="text-sm text-white/50 max-w-2xl mx-auto leading-relaxed">
                    Download the app or open the mobile web interface. Your documents are already there.
                  </p>
                </div>

                <div className="space-y-8">
                  {[
                    {
                      step: "01",
                      title: "Download or Open",
                      description: "Download the native app from the App Store or Google Play, or simply open the mobile web interface in your browser. Both options work immediately."
                    },
                    {
                      step: "02",
                      title: "Sign In & Sync",
                      description: "Sign in with your existing account. All your documents, collections, and settings sync automatically. Everything you have on desktop is available on mobile."
                    },
                    {
                      step: "03",
                      title: "Start Working",
                      description: "Upload documents, ask questions, analyze content—everything works the same way. Optimized for touch, but with the same powerful features."
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex gap-4 group">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-center group-hover:bg-white/[0.04] group-hover:border-white/15 transition-all">
                          <span className="text-sm font-medium text-white/40 group-hover:text-white/60 transition-colors">{item.step}</span>
                        </div>
                      </div>
                      <div className="flex-1 pt-1">
                        <h3 className="text-base font-medium mb-2 text-white">{item.title}</h3>
                        <p className="text-xs text-white/60 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="pt-12">
            <div className="border-t border-white/10 pt-12">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl sm:text-3xl font-medium mb-4 text-white leading-tight">
                  Ready to go mobile?
                </h2>
                <p className="text-sm text-white/50 mb-8 leading-relaxed">
                  Download the app or try the mobile web interface. Your documents are waiting.
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

export default MobilePage;
