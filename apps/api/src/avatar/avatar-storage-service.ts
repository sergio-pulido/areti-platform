import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

type PersistAvatarInput = {
  base64Data: string;
  fileName: string;
  mimeType: string;
};

export type PersistedAvatarImage = {
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  absolutePath: string;
};

type AvatarStorageServiceOptions = {
  rootPath: string;
  maxBytes: number;
  allowedMimeTypes: string[];
};

const extensionByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function sanitizeFileName(value: string): string {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);

  return cleaned.length > 0 ? cleaned : "avatar-image";
}

function normalizeMimeType(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split(";")[0]
    ?.trim() ?? "";
}

function normalizeBase64(base64Data: string): string {
  const normalized = base64Data.replace(/\s+/g, "").trim();
  if (!normalized) {
    throw new Error("Avatar payload is empty.");
  }
  return normalized;
}

export class AvatarStorageService {
  readonly rootPath: string;

  private readonly maxBytes: number;
  private readonly allowedMimeTypes: Set<string>;

  constructor(options: AvatarStorageServiceOptions) {
    this.rootPath = options.rootPath;
    this.maxBytes = options.maxBytes;
    this.allowedMimeTypes = new Set(options.allowedMimeTypes.map((item) => normalizeMimeType(item)));

    mkdirSync(this.rootPath, { recursive: true });
  }

  async persistImage(input: PersistAvatarInput): Promise<PersistedAvatarImage> {
    const mimeType = normalizeMimeType(input.mimeType);
    if (!this.allowedMimeTypes.has(mimeType)) {
      throw new Error("Unsupported avatar image format.");
    }

    const base64 = normalizeBase64(input.base64Data);
    const buffer = Buffer.from(base64, "base64");

    if (!buffer || buffer.length === 0) {
      throw new Error("Avatar payload is invalid.");
    }

    if (buffer.length > this.maxBytes) {
      throw new Error(`Avatar image is too large. Maximum size is ${this.maxBytes} bytes.`);
    }

    const extension = extensionByMimeType[mimeType] ?? "bin";
    const dateSegment = new Date().toISOString().slice(0, 10);
    const storageKey = `${dateSegment}/${randomUUID()}.${extension}`;
    const absolutePath = this.resolveStoragePath(storageKey);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer);

    return {
      storageKey,
      fileName: sanitizeFileName(input.fileName),
      mimeType,
      sizeBytes: buffer.length,
      absolutePath,
    };
  }

  resolveStoragePath(storageKey: string): string {
    const normalizedKey = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");

    if (normalizedKey.includes("..")) {
      throw new Error("Invalid avatar storage key.");
    }

    const absolute = path.resolve(this.rootPath, normalizedKey);
    const rootWithSep = this.rootPath.endsWith(path.sep)
      ? this.rootPath
      : `${this.rootPath}${path.sep}`;

    if (!absolute.startsWith(rootWithSep) && absolute !== this.rootPath) {
      throw new Error("Invalid avatar storage key path.");
    }

    return absolute;
  }
}
