import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import type { Fragment } from "../memory/schema.ts";
import type { StorageAdapter } from "./adapter.ts";

export class JsonlStorageAdapter implements StorageAdapter {
  private readonly filePath: string;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async listFragments(): Promise<Fragment[]> {
    await this.ensureFile();
    const raw = await readFile(this.filePath, "utf8");
    if (raw.trim().length === 0) {
      return [];
    }

    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Fragment);
  }

  async upsertFragment(fragment: Fragment): Promise<void> {
    await this.enqueueWrite(async () => {
      const fragments = await this.readFragmentsFromDisk();
      const existingIndex = fragments.findIndex((entry) => entry.id === fragment.id);

      if (existingIndex >= 0) {
        fragments[existingIndex] = fragment;
      } else {
        fragments.push(fragment);
      }

      await this.writeFragmentsToDisk(fragments);
    });
  }

  async replaceFragments(fragments: Fragment[]): Promise<void> {
    await this.enqueueWrite(async () => {
      await this.writeFragmentsToDisk(fragments);
    });
  }

  private async ensureFile(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    try {
      await readFile(this.filePath, "utf8");
    } catch {
      await writeFile(this.filePath, "", "utf8");
    }
  }

  private async readFragmentsFromDisk(): Promise<Fragment[]> {
    await this.ensureFile();
    const raw = await readFile(this.filePath, "utf8");
    if (raw.trim().length === 0) {
      return [];
    }

    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Fragment);
  }

  private async writeFragmentsToDisk(fragments: Fragment[]): Promise<void> {
    await this.ensureFile();
    const payload = fragments.map((fragment) => JSON.stringify(fragment)).join("\n");
    const tempPath = `${this.filePath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, payload.length > 0 ? `${payload}\n` : "", "utf8");
    await rename(tempPath, this.filePath);
  }

  private async enqueueWrite(operation: () => Promise<void>): Promise<void> {
    const next = this.writeChain.then(operation);
    this.writeChain = next.catch(() => undefined);
    await next;
  }
}
