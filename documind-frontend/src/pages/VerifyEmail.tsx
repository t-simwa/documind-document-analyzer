// Email Verification Page
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, Mail, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/contexts/AuthContext";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">("loading");
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("idle");
        return;
      }

      try {
        await authApi.verifyEmail({ token });
        setStatus("success");
        // Refresh user data to get updated email_verified status
        setTimeout(() => {
          navigate("/app");
        }, 3000);
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to verify email");
      }
    };

    verifyEmail();
  }, [token, navigate]);

  const handleResend = async () => {
    if (!user?.email) {
      setError("Please log in to resend verification email");
      return;
    }

    setResending(true);
    setResendSuccess(false);
    setError(null);

    try {
      await authApi.resendVerification({ email: user.email });
      setResendSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend verification email");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-muted/30">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo className="h-7 w-auto" showText={false} />
        </div>

        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Email Verification</CardTitle>
            <CardDescription>
              {status === "loading" && "Verifying your email address..."}
              {status === "success" && "Email verified successfully!"}
              {status === "error" && "Verification failed"}
              {status === "idle" && "No verification token provided"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Loading State */}
            {status === "loading" && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Please wait while we verify your email...</p>
              </div>
            )}

            {/* Success State */}
            {status === "success" && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Email Verified!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your email address has been successfully verified. Redirecting you to the app...
                  </p>
                </div>
                <Button onClick={() => navigate("/app")} className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            )}

            {/* Error State */}
            {status === "error" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-4 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">Verification Failed</h3>
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <p className="text-sm text-muted-foreground">
                      The verification link may have expired or is invalid. You can request a new verification email.
                    </p>
                  </div>
                </div>

                {user?.email && (
                  <div className="space-y-2">
                    <Button
                      onClick={handleResend}
                      disabled={resending}
                      className="w-full"
                      variant="outline"
                    >
                      {resending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Resend Verification Email
                        </>
                      )}
                    </Button>
                    {resendSuccess && (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>
                          Verification email sent! Please check your inbox.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                <Button onClick={() => navigate("/login")} variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </div>
            )}

            {/* Idle State (No Token) */}
            {status === "idle" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Mail className="h-12 w-12 text-muted-foreground" />
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">No Verification Token</h3>
                    <p className="text-sm text-muted-foreground">
                      Please check your email for the verification link, or request a new one.
                    </p>
                  </div>
                </div>

                {user?.email && (
                  <Button
                    onClick={handleResend}
                    disabled={resending}
                    className="w-full"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                )}

                <Button onClick={() => navigate("/login")} variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;



