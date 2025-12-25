// Reset Password Page - World-Class SaaS Design
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle2, XCircle, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  
  // Password requirements validation
  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  };
  
  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [token]);

  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordRequirements.minLength) {
      errors.password = "Password must be at least 8 characters long";
    } else if (!passwordRequirements.hasUpperCase) {
      errors.password = "Password must contain at least one uppercase letter";
    } else if (!passwordRequirements.hasLowerCase) {
      errors.password = "Password must contain at least one lowercase letter";
    } else if (!passwordRequirements.hasNumber) {
      errors.password = "Password must contain at least one number";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPasswordErrors({});

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    if (!validatePassword()) {
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword({
        token,
        new_password: password,
      });
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Branding & Visual */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.015]" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <div className="relative z-10 flex flex-col justify-between p-16">
            <div className="flex items-center">
              <Logo className="h-7 w-auto" showText={false} />
            </div>
            
            <div className="space-y-6 max-w-lg">
              <div className="space-y-2">
                <h2 className="text-2xl font-medium tracking-tight leading-tight text-[#171717] dark:text-[#fafafa]">
                  Invalid reset link
                </h2>
                <p className="text-sm text-[#737373] dark:text-[#a3a3a3] leading-relaxed">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-[10px] text-[#737373] dark:text-[#a3a3a3]">
              <span className="font-medium">Secure password recovery</span>
            </div>
          </div>
        </div>

        {/* Right Side - Error State */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md space-y-8">
            <div className="lg:hidden flex flex-col items-center space-y-4 pb-4">
              <Logo className="h-7 w-auto" showText={false} />
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5 text-center lg:text-left">
                <h1 className="text-xl font-medium tracking-tight text-[#171717] dark:text-[#fafafa]">
                  Invalid reset link
                </h1>
                <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                  This link is invalid or has expired
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-center space-y-1.5">
                    <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                      Link expired or invalid
                    </p>
                    <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] leading-relaxed max-w-sm">
                      Please request a new password reset link from the login page.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => navigate("/auth/forgot-password")}
                  className="w-full h-8 text-xs font-medium bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]"
                >
                  Request new reset link
                </Button>

                <Button
                  variant="ghost"
                  className="w-full h-8 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa]"
                  onClick={() => navigate("/login")}
                >
                  <ArrowLeft className="mr-1.5 h-3 w-3" />
                  Back to login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                Set a new secure password
              </h2>
              <p className="text-sm text-[#737373] dark:text-[#a3a3a3] leading-relaxed">
                Choose a strong password to protect your account. Make sure it's at least 8 characters long.
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
                  <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa] mb-0.5">Strong password requirements</p>
                  <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] leading-relaxed">Minimum 8 characters with secure hashing</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 group">
                <div className="mt-0.5 h-5 w-5 rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] flex items-center justify-center flex-shrink-0 group-hover:bg-[#e5e5e5] dark:group-hover:bg-[#262626] transition-colors">
                  <svg className="h-3 w-3 text-[#171717] dark:text-[#fafafa]" fill="none" viewBox="0 0 14 14">
                    <path d="M11.5 3.5L5.25 9.75 2.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa] mb-0.5">Secure encryption</p>
                  <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] leading-relaxed">Your password is encrypted using industry-standard bcrypt</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 group">
                <div className="mt-0.5 h-5 w-5 rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] flex items-center justify-center flex-shrink-0 group-hover:bg-[#e5e5e5] dark:group-hover:bg-[#262626] transition-colors">
                  <svg className="h-3 w-3 text-[#171717] dark:text-[#fafafa]" fill="none" viewBox="0 0 14 14">
                    <path d="M11.5 3.5L5.25 9.75 2.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa] mb-0.5">Single-use token</p>
                  <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] leading-relaxed">Reset links can only be used once for maximum security</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center gap-4 text-[10px] text-[#737373] dark:text-[#a3a3a3]">
            <span className="font-medium">Secure password reset</span>
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
                {isSuccess ? "Password reset successful" : "Set new password"}
              </h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                {isSuccess
                  ? "Your password has been reset. Redirecting you to login..."
                  : "Enter your new password below"}
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
                      Password reset complete
                    </p>
                    <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] leading-relaxed max-w-sm">
                      Your password has been successfully reset. You can now sign in with your new password.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => navigate("/login")}
                  className="w-full h-8 text-xs font-medium bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]"
                >
                  Go to login
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
                  <Label htmlFor="password" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                    New password
                  </Label>
                  <div className="space-y-1">
                    <div className="relative">
                      <Lock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (passwordErrors.password) {
                            setPasswordErrors((prev) => ({ ...prev, password: "" }));
                          }
                        }}
                        required
                        minLength={8}
                        placeholder="••••••••"
                        disabled={isLoading}
                        className={`h-8 pl-7 pr-7 text-xs border-[#e5e5e5] dark:border-[#262626] ${passwordErrors.password ? "border-red-500 dark:border-red-500" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] transition-colors"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.password && (
                      <p className="text-[10px] text-red-500 dark:text-red-400">{passwordErrors.password}</p>
                    )}
                    {password && (
                      <div className="pt-2 border-t border-[#e5e5e5] dark:border-[#262626]">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-3.5 w-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                              passwordRequirements.minLength
                                ? "bg-[#fafafa] dark:bg-[#0a0a0a] border-[#171717] dark:border-[#fafafa]"
                                : "bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]"
                            )}>
                              {passwordRequirements.minLength && (
                                <svg className="h-2 w-2 text-[#171717] dark:text-[#fafafa]" fill="none" viewBox="0 0 10 10">
                                  <path d="M8.5 2.5L4 7 1.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <p className={cn(
                              "text-[10px] leading-tight",
                              passwordRequirements.minLength
                                ? "text-[#171717] dark:text-[#fafafa] font-medium"
                                : "text-[#737373] dark:text-[#a3a3a3]"
                            )}>
                              8+ characters
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-3.5 w-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                              passwordRequirements.hasUpperCase
                                ? "bg-[#fafafa] dark:bg-[#0a0a0a] border-[#171717] dark:border-[#fafafa]"
                                : "bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]"
                            )}>
                              {passwordRequirements.hasUpperCase && (
                                <svg className="h-2 w-2 text-[#171717] dark:text-[#fafafa]" fill="none" viewBox="0 0 10 10">
                                  <path d="M8.5 2.5L4 7 1.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <p className={cn(
                              "text-[10px] leading-tight",
                              passwordRequirements.hasUpperCase
                                ? "text-[#171717] dark:text-[#fafafa] font-medium"
                                : "text-[#737373] dark:text-[#a3a3a3]"
                            )}>
                              Uppercase
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-3.5 w-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                              passwordRequirements.hasLowerCase
                                ? "bg-[#fafafa] dark:bg-[#0a0a0a] border-[#171717] dark:border-[#fafafa]"
                                : "bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]"
                            )}>
                              {passwordRequirements.hasLowerCase && (
                                <svg className="h-2 w-2 text-[#171717] dark:text-[#fafafa]" fill="none" viewBox="0 0 10 10">
                                  <path d="M8.5 2.5L4 7 1.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <p className={cn(
                              "text-[10px] leading-tight",
                              passwordRequirements.hasLowerCase
                                ? "text-[#171717] dark:text-[#fafafa] font-medium"
                                : "text-[#737373] dark:text-[#a3a3a3]"
                            )}>
                              Lowercase
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-3.5 w-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                              passwordRequirements.hasNumber
                                ? "bg-[#fafafa] dark:bg-[#0a0a0a] border-[#171717] dark:border-[#fafafa]"
                                : "bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]"
                            )}>
                              {passwordRequirements.hasNumber && (
                                <svg className="h-2 w-2 text-[#171717] dark:text-[#fafafa]" fill="none" viewBox="0 0 10 10">
                                  <path d="M8.5 2.5L4 7 1.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <p className={cn(
                              "text-[10px] leading-tight",
                              passwordRequirements.hasNumber
                                ? "text-[#171717] dark:text-[#fafafa] font-medium"
                                : "text-[#737373] dark:text-[#a3a3a3]"
                            )}>
                              Number
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {!password && (
                      <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] pt-0.5">
                        Must be at least 8 characters with uppercase, lowercase, and number
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                    Confirm password
                  </Label>
                  <div className="space-y-1">
                    <div className="relative">
                      <Lock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (passwordErrors.confirmPassword) {
                            setPasswordErrors((prev) => ({ ...prev, confirmPassword: "" }));
                          }
                        }}
                        required
                        minLength={8}
                        placeholder="••••••••"
                        disabled={isLoading}
                        className={`h-8 pl-7 pr-7 text-xs border-[#e5e5e5] dark:border-[#262626] ${passwordErrors.confirmPassword ? "border-red-500 dark:border-red-500" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] transition-colors"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-[10px] text-red-500 dark:text-red-400">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-8 text-xs font-medium bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]"
                  disabled={isLoading || !isPasswordValid}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      Resetting password...
                    </>
                  ) : (
                    "Reset password"
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

export default ResetPassword;
