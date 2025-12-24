import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { cloudStorageApi } from "@/services/cloudStorageApi";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function OAuthCallback() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      if (!provider) {
        setError("Invalid provider");
        setStatus("error");
        return;
      }

      // Get code and state from URL
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const errorParam = searchParams.get("error");

      // Check for OAuth errors
      if (errorParam) {
        setError(`OAuth error: ${errorParam}`);
        setStatus("error");
        setTimeout(() => navigate("/app/documents"), 3000);
        return;
      }

      if (!code || !state) {
        setError("Missing authorization code or state");
        setStatus("error");
        setTimeout(() => navigate("/app/documents"), 3000);
        return;
      }

      // Verify state matches stored state
      const storedState = sessionStorage.getItem(`oauth_state_${provider}`);
      const storedProvider = sessionStorage.getItem(`oauth_provider_${provider}`);

      if (state !== storedState || provider !== storedProvider) {
        setError("Invalid state parameter. Possible CSRF attack.");
        setStatus("error");
        setTimeout(() => navigate("/app/documents"), 3000);
        return;
      }

      try {
        // Complete OAuth flow
        // Normalize to use localhost instead of 127.0.0.1 to ensure consistency
        // The port will be automatically included from window.location.origin
        const origin = window.location.origin.replace('127.0.0.1', 'localhost');
        const redirectUri = `${origin}/auth/${provider}/callback`;
        console.log('OAuth Callback Redirect URI:', redirectUri); // Debug log
        await cloudStorageApi.oauthCallback(provider, code, state, redirectUri);

        // Clear stored state
        sessionStorage.removeItem(`oauth_state_${provider}`);
        sessionStorage.removeItem(`oauth_provider_${provider}`);

        setStatus("success");
        toast.success(`Successfully connected to ${provider.replace("_", " ")}`);

        // Redirect to documents page after 2 seconds
        setTimeout(() => {
          navigate("/app/documents");
        }, 2000);
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError(err instanceof Error ? err.message : "Failed to complete OAuth flow");
        setStatus("error");
        toast.error(`Failed to connect to ${provider.replace("_", " ")}`);

        // Redirect to documents page after 3 seconds
        setTimeout(() => {
          navigate("/app/documents");
        }, 3000);
      }
    };

    handleCallback();
  }, [provider, searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="text-center space-y-4 p-8">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-[#171717] dark:text-[#fafafa] mx-auto" />
            <p className="text-sm text-[#737373] dark:text-[#a3a3a3]">
              Completing connection to {provider?.replace("_", " ")}...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto" />
            <p className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
              Successfully connected!
            </p>
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
              Redirecting to documents...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto" />
            <p className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
              Connection failed
            </p>
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 max-w-md mx-auto">
                {error}
              </p>
            )}
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
              Redirecting to documents...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

