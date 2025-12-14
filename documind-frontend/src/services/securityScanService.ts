// Security Scanning Service
// Simulates malware and virus scanning for uploaded documents

import type { SecurityScanResult, SecurityThreat } from "@/types/api";

// Helper to simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock threat database (in production, this would be a real scanning engine)
const mockThreatDatabase = [
  { name: "Trojan.Generic.123456", type: "malware" as const, severity: "high" as const },
  { name: "Virus.Win32.Example", type: "virus" as const, severity: "critical" as const },
  { name: "Suspicious.Macro.Content", type: "suspicious_content" as const, severity: "medium" as const },
];

// Simulate scanning a file for malware
async function scanForMalware(file: File): Promise<{
  status: "clean" | "threat_detected" | "error";
  threats?: SecurityThreat[];
  error?: string;
}> {
  await delay(800); // Simulate scanning time

  // Simulate random threat detection (5% chance for demo purposes)
  // In production, this would use a real malware scanning engine
  const hasThreat = Math.random() < 0.05;

  if (hasThreat) {
    const threat = mockThreatDatabase[0];
    return {
      status: "threat_detected",
      threats: [
        {
          type: threat.type,
          name: threat.name,
          severity: threat.severity,
          description: `Detected ${threat.name} in uploaded file. This file may contain malicious code.`,
          detectedAt: new Date(),
        },
      ],
    };
  }

  return {
    status: "clean",
  };
}

// Simulate scanning a file for viruses
async function scanForViruses(file: File): Promise<{
  status: "clean" | "threat_detected" | "error";
  threats?: SecurityThreat[];
  error?: string;
}> {
  await delay(1000); // Virus scanning typically takes longer

  // Simulate random threat detection (3% chance for demo purposes)
  const hasThreat = Math.random() < 0.03;

  if (hasThreat) {
    const threat = mockThreatDatabase[1];
    return {
      status: "threat_detected",
      threats: [
        {
          type: threat.type,
          name: threat.name,
          severity: threat.severity,
          description: `Virus detected: ${threat.name}. This file has been flagged as potentially harmful.`,
          detectedAt: new Date(),
        },
      ],
    };
  }

  return {
    status: "clean",
  };
}

// Main security scanning function
export async function performSecurityScan(
  file: File
): Promise<SecurityScanResult> {
  try {
    // Start with scanning status
    const initialResult: SecurityScanResult = {
      status: "scanning",
    };

    // Perform malware scan
    const malwareResult = await scanForMalware(file);
    const malwareScan = {
      status: malwareResult.status === "threat_detected" ? "threat_detected" : "clean",
      scannedAt: new Date(),
      threats: malwareResult.threats,
    };

    // If malware detected, stop scanning and return threat
    if (malwareResult.status === "threat_detected") {
      return {
        status: "threat_detected",
        scannedAt: new Date(),
        malwareScan,
        virusScan: {
          status: "pending",
        },
      };
    }

    // Perform virus scan
    const virusResult = await scanForViruses(file);
    const virusScan = {
      status: virusResult.status === "threat_detected" ? "threat_detected" : "clean",
      scannedAt: new Date(),
      threats: virusResult.threats,
    };

    // Determine overall status
    let overallStatus: SecurityScanResult["status"] = "clean";
    if (virusResult.status === "threat_detected") {
      overallStatus = "threat_detected";
    }

    return {
      status: overallStatus,
      scannedAt: new Date(),
      malwareScan,
      virusScan,
    };
  } catch (error) {
    return {
      status: "error",
      scannedAt: new Date(),
      malwareScan: {
        status: "error",
      },
      virusScan: {
        status: "error",
      },
      error: error instanceof Error ? error.message : "Unknown error during security scan",
    };
  }
}

// Get security scan status for a document
export async function getSecurityScanStatus(documentId: string): Promise<SecurityScanResult | null> {
  await delay(200);
  // In production, this would fetch from the backend
  // For now, return null (will be stored in document metadata)
  return null;
}

