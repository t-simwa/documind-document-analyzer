// Forgot Password Page - World-Class SaaS Design
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authApi.forgotPassword({ email });
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send password reset email");
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="space-y-6 max-w-lg">
            <div className="space-y-2">
              <h2 className="text-2xl font-medium tracking-tight leading-tight text-[#171717] dark:text-[#fafafa]">
                Reset your password securely
              </h2>
              <p className="text-sm text-[#737373] dark:text-[#a3a3a3] leading-relaxed">
                Enter your email address and we'll send you a secure link to reset your password.
              </p>
            </div>
            
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 group">
                <div className="mt-0.5 h-5 w-5 rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] flex items-center justify-center flex-shrink-0 group-hover:bg-[#e5e5e5] dark:group-hover:bg-[#262626] transition-colors">
                  <svg className="h-3 w-3 text-[#171717] dark:text-[#fafafa]" fill="none" viewBox="0 0 14 14">
                    <path d="M11.5 3.5L5.25 9.75 2.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa] mb-0.5">Secure token-based reset</p>
                  <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] leading-relaxed">Cryptographically secure reset links that expire after 1 hour</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 group">
                <div className="mt-0.5 h-5 w-5 rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] flex items-center justify-center flex-shrink-0 group-hover:bg-[#e5e5e5] dark:group-hover:bg-[#262626] transition-colors">
                  <svg className="h-3 w-3 text-[#171717] dark:text-[#fafafa]" fill="none" viewBox="0 0 14 14">
                    <path d="M11.5 3.5L5.25 9.75 2.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa] mb-0.5">Email verification</p>
                  <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] leading-relaxed">Reset links are sent only to verified email addresses</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 group">
                <div className="mt-0.5 h-5 w-5 rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] flex items-center justify-center flex-shrink-0 group-hover:bg-[#e5e5e5] dark:group-hover:bg-[#262626] transition-colors">
                  <svg className="h-3 w-3 text-[#171717] dark:text-[#fafafa]" fill="none" viewBox="0 0 14 14">
                    <path d="M11.5 3.5L5.25 9.75 2.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa] mb-0.5">Privacy protected</p>
                  <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] leading-relaxed">We don't reveal whether an email exists in our system</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center gap-4 text-[10px] text-[#737373] dark:text-[#a3a3a3]">
            <span className="font-medium">Secure password recovery</span>
            <Separator orientation="vertical" className="h-3" />
            <span>Enterprise ready</span>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center space-y-4 pb-4">
            <Logo className="h-7 w-auto" showText={false} />
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5 text-center lg:text-left">
              <h1 className="text-xl font-medium tracking-tight text-[#171717] dark:text-[#fafafa]">
                {isSuccess ? "Check your email" : "Reset password"}
              </h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                {isSuccess
                  ? "We've sent you a password reset link"
                  : "Enter your email to receive a reset link"}
              </p>
            </div>

            {isSuccess ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center space-y-1.5">
                    <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                      Email sent successfully
                    </p>
                    <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] leading-relaxed max-w-sm">
                      If an account with that email exists, we've sent you a password reset link. Please check your inbox.
                    </p>
                    <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] pt-1">
                      The link will expire in 1 hour.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => navigate("/login")}
                  className="w-full h-8 text-xs font-medium bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]"
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="py-2 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
                    <AlertDescription className="text-xs text-red-900 dark:text-red-100">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                    Email address
                  </Label>
                  <div className="space-y-1">
                    <div className="relative">
                      <Mail className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@company.com"
                        disabled={isLoading}
                        className="h-8 pl-7 text-xs border-[#e5e5e5] dark:border-[#262626]"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-8 text-xs font-medium bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-8 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa]"
                  onClick={() => navigate("/login")}
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-1.5 h-3 w-3" />
                  Back to login
                </Button>
              </form>
            )}
          </div>

          <div className="pt-4">
            <Separator className="mb-4 border-[#e5e5e5] dark:border-[#262626]" />
            <p className="text-[10px] text-center text-[#737373] dark:text-[#a3a3a3]">
              Remember your password?{" "}
              <button
                onClick={() => navigate("/login")}
                className="underline hover:text-[#171717] dark:hover:text-[#fafafa] transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
