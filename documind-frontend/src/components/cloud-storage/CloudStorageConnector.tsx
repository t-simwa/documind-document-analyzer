import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, LogOut } from "lucide-react";
import { cloudStorageApi, type CloudStorageConnection } from "@/services/cloudStorageApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CloudStorageConnectorProps {
  onConnected?: (connection: CloudStorageConnection) => void;
  onDisconnected?: (connectionId: string) => void;
}

const PROVIDERS = [
  { 
    id: "google_drive", 
    name: "Google Drive", 
    color: "#4285F4",
    logoUrl: "/cloud-storage/google-drive.png"
  },
  { 
    id: "onedrive", 
    name: "OneDrive", 
    color: "#0078D4",
    logoUrl: "/cloud-storage/one-drive.jpg"
  },
  { 
    id: "box", 
    name: "Box", 
    color: "#0061D5",
    logoUrl: "/cloud-storage/box.svg"
  },
  { 
    id: "sharepoint", 
    name: "SharePoint", 
    color: "#0078D4",
    logoUrl: "/cloud-storage/sharepoint.png"
  },
];

export const CloudStorageConnector = ({ onConnected, onDisconnected }: CloudStorageConnectorProps) => {
  const [connections, setConnections] = useState<CloudStorageConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const conns = await cloudStorageApi.listConnections();
      setConnections(conns);
    } catch (error) {
      console.error("Failed to load connections:", error);
      toast.error("Failed to load cloud storage connections");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: string) => {
    try {
      setConnecting(provider);
      // Use the exact redirect URI - must match what's configured in OAuth provider console
      // Normalize to use localhost instead of 127.0.0.1 to ensure consistency
      // The port will be automatically included from window.location.origin
      const origin = window.location.origin.replace('127.0.0.1', 'localhost');
      const redirectUri = `${origin}/auth/${provider}/callback`;
      console.log('OAuth Redirect URI:', redirectUri); // Debug log
      const { authorization_url, state } = await cloudStorageApi.initiateOAuth(provider, redirectUri);
      
      sessionStorage.setItem(`oauth_state_${provider}`, state);
      sessionStorage.setItem(`oauth_provider_${provider}`, provider);
      
      window.location.href = authorization_url;
    } catch (error) {
      console.error("Failed to initiate OAuth:", error);
      toast.error(`Failed to connect to ${provider}`);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      await cloudStorageApi.disconnectConnection(connectionId);
      setConnections(connections.filter((c) => c.id !== connectionId));
      onDisconnected?.(connectionId);
      toast.success("Disconnected successfully");
    } catch (error) {
      console.error("Failed to disconnect:", error);
      toast.error("Failed to disconnect");
    }
  };

  const getConnection = (provider: string) => {
    return connections.find((c) => c.provider === provider && c.is_active);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-3">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#737373] dark:text-[#a3a3a3]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {PROVIDERS.map((provider) => {
        const connection = getConnection(provider.id);
        const isConnecting = connecting === provider.id;

        return (
          <div
            key={provider.id}
            className={cn(
              "group flex items-center gap-2 p-2 rounded-md border transition-colors",
              connection
                ? "border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]"
                : "border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] hover:border-[#d4d4d4] dark:hover:border-[#404040]"
            )}
          >
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center overflow-hidden rounded-sm">
              <img 
                src={provider.logoUrl} 
                alt={provider.name}
                className="w-5 h-5 object-contain mix-blend-mode-normal"
                style={{ 
                  imageRendering: 'crisp-edges',
                  backgroundColor: 'transparent'
                }}
                loading="lazy"
                onError={(e) => {
                  // Fallback to colored square if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.fallback-icon')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'fallback-icon w-5 h-5 rounded-sm flex items-center justify-center text-[8px] font-medium text-white';
                    fallback.style.backgroundColor = provider.color;
                    fallback.textContent = provider.name.split(' ').map(n => n[0]).join('');
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-[#171717] dark:text-[#fafafa] truncate">
                {provider.name}
              </p>
              {connection && (
                <p className="text-[9px] text-[#737373] dark:text-[#a3a3a3] truncate">
                  {connection.account_email?.split("@")[0] || "Connected"}
                </p>
              )}
            </div>

            {connection ? (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDisconnect(connection.id)}
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/20 transition-opacity"
                  title="Disconnect"
                >
                  <LogOut className="h-2.5 w-2.5 text-[#737373] dark:text-[#a3a3a3] hover:text-red-600 dark:hover:text-red-400" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => handleConnect(provider.id)}
                disabled={isConnecting}
                className="h-5 px-1.5 text-[9px] bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5] flex-shrink-0"
              >
                {isConnecting ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : (
                  "Connect"
                )}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};
