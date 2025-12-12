import { Link } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import { ArrowRight } from "lucide-react";

// CheckIcon component matching LandingPage style
const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
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
  <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-white/[0.02] rounded-full">
    <div className="w-1 h-1 rounded-full bg-white/40"></div>
    <span className="text-xs font-medium text-white/50 uppercase tracking-wider">{stat}</span>
  </div>
);

// Custom List Item Component - matching LandingPage style
const CapabilityItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-3 group">
    <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
      <CheckIcon />
    </div>
    <span className="text-white/80">{text}</span>
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
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white leading-tight">
            Mobile Experience
          </h1>
          <p className="text-xl sm:text-2xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            Access and analyze documents from anywhere. Full-featured mobile apps for iOS and Android.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="space-y-32">
          {/* Introduction Section */}
          <section>
            <div className="max-w-4xl">
              <div className="inline-block mb-6">
                <span className="text-sm font-medium text-white/40 uppercase tracking-wider">Mobile First</span>
              </div>
              <h2 className="text-5xl sm:text-6xl font-bold mb-8 text-white leading-tight">
                Your documents, wherever you are
              </h2>
              <p className="text-xl text-white/50 leading-relaxed mb-12">
                Whether you're in the office or on the go, access your documents with the same power and 
                security you expect from desktop. Native apps and mobile web—both designed to work the way you do.
              </p>
              <div className="mt-16 pt-12 border-t border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
                  <div className="group">
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 relative inline-block tracking-tight">
                      <span className="relative z-10">iOS & Android</span>
                      <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="text-sm text-white/45 font-medium tracking-[0.1em] uppercase">
                      Native Apps
                    </div>
                    <div className="w-8 h-px bg-white/10 mt-3 group-hover:w-12 group-hover:bg-white/20 transition-all duration-300"></div>
                  </div>
                  <div className="group">
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 relative inline-block tracking-tight">
                      <span className="relative z-10">100%</span>
                      <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="text-sm text-white/45 font-medium tracking-[0.1em] uppercase">
                      Feature Parity
                    </div>
                    <div className="w-8 h-px bg-white/10 mt-3 group-hover:w-12 group-hover:bg-white/20 transition-all duration-300"></div>
                  </div>
                  <div className="group">
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 relative inline-block tracking-tight">
                      <span className="relative z-10">Offline</span>
                      <div className="absolute inset-0 bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="text-sm text-white/45 font-medium tracking-[0.1em] uppercase">
                      Full Support
                    </div>
                    <div className="w-8 h-px bg-white/10 mt-3 group-hover:w-12 group-hover:bg-white/20 transition-all duration-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Core Mobile Options - Editorial Style */}
          <section>
            <div className="mb-20">
              <div className="inline-block mb-4">
                <span className="text-sm font-medium text-white/40 uppercase tracking-wider">Mobile Options</span>
              </div>
              <h2 className="text-5xl sm:text-6xl font-bold mb-6 text-white leading-tight max-w-3xl">
                Choose how you want to access your documents
              </h2>
              <p className="text-xl text-white/50 max-w-2xl leading-relaxed">
                Native apps for the best experience, or mobile web for universal access. Both offer the same powerful features.
              </p>
            </div>

            <div className="space-y-32">
              {coreMobileOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <div 
                    key={index} 
                    className={`flex flex-col lg:flex-row gap-16 items-start ${
                      index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                    }`}
                  >
                    <div className="flex-1 lg:max-w-xl">
                      <div className="mb-6">
                        <StatBadge stat={option.stat} />
                      </div>
                      <h3 className="text-4xl sm:text-5xl font-bold mb-6 text-white leading-tight">
                        {option.title}
                      </h3>
                      <p className="text-lg text-white/60 mb-8 leading-relaxed">
                        {option.description}
                      </p>
                      <div className="space-y-4">
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
                          <div className="absolute inset-0 flex items-center justify-center p-12">
                            <div className="relative w-full h-full flex items-center justify-center">
                              <div className="absolute inset-0 border border-white/5 rounded-lg"></div>
                              <div className="relative z-10 w-32 h-32 text-white/20 group-hover:text-white/30 transition-colors">
                                <Icon />
                              </div>
                              <div className="absolute bottom-8 left-8 right-8 space-y-2">
                                <div className="h-1 bg-white/5 rounded-full w-full"></div>
                                <div className="h-1 bg-white/5 rounded-full w-3/4"></div>
                                <div className="h-1 bg-white/5 rounded-full w-5/6"></div>
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
            <div className="mb-20">
              <div className="inline-block mb-4">
                <span className="text-sm font-medium text-white/40 uppercase tracking-wider">Mobile Features</span>
              </div>
              <h2 className="text-5xl sm:text-6xl font-bold mb-6 text-white leading-tight max-w-3xl">
                Built for mobile workflows
              </h2>
              <p className="text-xl text-white/50 max-w-2xl leading-relaxed">
                Features designed specifically for mobile devices. Touch-optimized, fast, and secure.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
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
                      <div className="relative p-10">
                        <div className="mb-8">
                          <div className="relative mb-8">
                            <div className="absolute -inset-1 border border-white/5 rounded-lg"></div>
                            <div className="relative w-20 h-20 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-center group-hover:bg-white/[0.04] group-hover:border-white/15 transition-all duration-300">
                              <div className="w-12 h-12 text-white/30 group-hover:text-white/40 transition-colors">
                                <Icon />
                              </div>
                            </div>
                          </div>
                          <h3 className="text-2xl font-bold mb-4 text-white">
                            {category.title}
                          </h3>
                          <p className="text-white/60 mb-8 leading-relaxed text-lg">
                            {category.description}
                          </p>
                        </div>
                        <div className="space-y-4 mb-8">
                          {category.capabilities.map((item, i) => (
                            <CapabilityItem key={i} text={item} />
                          ))}
                        </div>
                        <div className="pt-8 border-t border-white/10">
                          <div className="flex items-center gap-2 text-sm text-white/40 group-hover:text-white/60 transition-colors">
                            <span>Learn more</span>
                            <ArrowRight className="w-4 h-4" />
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
          <section className="pt-16">
            <div className="border-t border-white/10 pt-20">
              <div className="max-w-4xl mx-auto">
                <div className="mb-16 text-center">
                  <div className="inline-block mb-4">
                    <span className="text-sm font-medium text-white/40 uppercase tracking-wider">Getting Started</span>
                  </div>
                  <h2 className="text-5xl sm:text-6xl font-bold mb-6 text-white leading-tight">
                    Start using mobile in minutes
                  </h2>
                  <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
                    Download the app or open the mobile web interface. Your documents are already there.
                  </p>
                </div>

                <div className="space-y-12">
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
                    <div key={index} className="flex gap-8 group">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-center group-hover:bg-white/[0.04] group-hover:border-white/15 transition-all">
                          <span className="text-2xl font-bold text-white/40 group-hover:text-white/60 transition-colors">{item.step}</span>
                        </div>
                      </div>
                      <div className="flex-1 pt-2">
                        <h3 className="text-2xl font-bold mb-3 text-white">{item.title}</h3>
                        <p className="text-white/60 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="pt-16">
            <div className="border-t border-white/10 pt-20">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white leading-tight">
                  Ready to go mobile?
                </h2>
                <p className="text-xl text-white/50 mb-10 leading-relaxed">
                  Download the app or try the mobile web interface. Your documents are waiting.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="/app" 
                    className="inline-flex items-center justify-center px-8 py-4 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors"
                  >
                    Start building
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </a>
                  <a 
                    href="/pricing" 
                    className="inline-flex items-center justify-center px-8 py-4 border border-white/20 text-white font-medium rounded-lg hover:bg-white/5 transition-colors"
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

export default MobilePage;
