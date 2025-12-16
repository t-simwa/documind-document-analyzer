// Login Page - World-Class SaaS Design
import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/brand/Logo";
import { Separator } from "@/components/ui/separator";

const Login = () => {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.015]" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-16">
          {/* Logo */}
          <div className="flex items-center">
            <Logo className="h-7 w-auto" showText={false} />
          </div>
          
          {/* Main Content */}
          <div className="space-y-8 max-w-lg">
            <div className="space-y-4">
              <h2 className="text-4xl font-semibold tracking-tight leading-tight">
                Secure document analysis for modern teams
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                Transform how your organization processes, analyzes, and extracts insights from documents at scale.
              </p>
            </div>
            
            <div className="space-y-5 pt-2">
              <div className="flex items-start gap-4 group">
                <div className="mt-0.5 h-6 w-6 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-muted/80 transition-colors">
                  <svg className="h-3.5 w-3.5 text-foreground" fill="none" viewBox="0 0 14 14">
                    <path d="M11.5 3.5L5.25 9.75 2.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm font-medium text-foreground mb-1">Enterprise-grade security</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">SOC 2, GDPR, and HIPAA compliant infrastructure</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 group">
                <div className="mt-0.5 h-6 w-6 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-muted/80 transition-colors">
                  <svg className="h-3.5 w-3.5 text-foreground" fill="none" viewBox="0 0 14 14">
                    <path d="M11.5 3.5L5.25 9.75 2.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm font-medium text-foreground mb-1">AI-powered insights</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Extract key information and patterns instantly</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 group">
                <div className="mt-0.5 h-6 w-6 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-muted/80 transition-colors">
                  <svg className="h-3.5 w-3.5 text-foreground" fill="none" viewBox="0 0 14 14">
                    <path d="M11.5 3.5L5.25 9.75 2.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm font-medium text-foreground mb-1">Scalable infrastructure</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Built for teams of all sizes, from startups to enterprises</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span className="font-medium">Trusted by leading organizations</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Enterprise ready</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center space-y-4 pb-4">
            <Logo className="h-7 w-auto" showText={false} />
          </div>

          <div className="space-y-6">
            <div className="space-y-2 text-center lg:text-left">
              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome back
              </h1>
              <p className="text-muted-foreground text-sm">
                Sign in to your account to continue
              </p>
            </div>

            <LoginForm />
          </div>

          <div className="pt-6">
            <Separator className="mb-6" />
            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to our{" "}
              <a href="#" className="underline hover:text-foreground transition-colors">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="underline hover:text-foreground transition-colors">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
