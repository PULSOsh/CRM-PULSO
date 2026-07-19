import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

export type StoredFile = {
  storageKey: string;
  sha256: string;
  sizeBytes: number;
  mimeType: string;
  originalName: string;
};

export interface StorageAdapter {
  put(input: { bytes: Uint8Array; originalName: string; mimeType: string }): Promise<StoredFile>;
  read(storageKey: string): Promise<Uint8Array>;
  moveToTrash(storageKey: string): Promise<void>;
}

const allowedMimeTypes = new Set([
  "application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain", "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export class LocalPrivateStorage implements StorageAdapter {
  private basePath: string;
  private trashPath: string;

  constructor(basePath = process.env.PRIVATE_STORAGE_PATH ?? "./storage/private") {
    this.basePath = resolve(basePath);
    this.trashPath = join(this.basePath, ".trash");
  }

  async put(input: { bytes: Uint8Array; originalName: string; mimeType: string }): Promise<StoredFile> {
    if (!allowedMimeTypes.has(input.mimeType)) throw new Error("Tipo de arquivo não permitido.");
    if (input.bytes.byteLength > 25 * 1024 * 1024) throw new Error("Arquivo maior que 25 MB.");

    await mkdir(this.basePath, { recursive: true });
    const extension = extname(input.originalName).toLowerCase().replace(/[^.a-z0-9]/g, "");
    const storageKey = `${randomUUID()}${extension}`;
    const destination = join(this.basePath, storageKey);
    const sha256 = createHash("sha256").update(input.bytes).digest("hex");

    await writeFile(destination, input.bytes, { flag: "wx", mode: 0o600 });
    const fileStat = await stat(destination);

    return { storageKey, sha256, sizeBytes: fileStat.size, mimeType: input.mimeType, originalName: input.originalName };
  }

  async read(storageKey: string) {
    return new Uint8Array(await readFile(this.safePath(storageKey)));
  }

  async moveToTrash(storageKey: string) {
    await mkdir(this.trashPath, { recursive: true });
    await rename(this.safePath(storageKey), join(this.trashPath, `${Date.now()}-${storageKey}`));
  }

  private safePath(storageKey: string) {
    if (!/^[a-f0-9-]{36}(\.[a-z0-9]+)?$/i.test(storageKey)) throw new Error("Chave de armazenamento inválida.");
    return join(this.basePath, storageKey);
  }
}
