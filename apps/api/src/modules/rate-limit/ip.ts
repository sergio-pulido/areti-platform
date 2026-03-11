import type { Request } from "express";

function normalizeIp(rawValue: string | null | undefined): string {
  if (!rawValue) {
    return "unknown";
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return "unknown";
  }

  const withoutIpv4Mapped = trimmed.startsWith("::ffff:") ? trimmed.slice("::ffff:".length) : trimmed;
  const zoneIndex = withoutIpv4Mapped.indexOf("%");
  return zoneIndex >= 0 ? withoutIpv4Mapped.slice(0, zoneIndex) : withoutIpv4Mapped;
}

export function getClientIp(request: Request): string {
  const rawIp = request.ip || request.socket.remoteAddress || null;
  return normalizeIp(rawIp);
}

export function maskIp(ip: string): string {
  if (ip === "unknown") {
    return ip;
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }

  if (ip.includes(":")) {
    const parts = ip.split(":").filter(Boolean);
    if (parts.length <= 2) {
      return `${ip}::`;
    }
    return `${parts.slice(0, 2).join(":")}::`;
  }

  return ip;
}
