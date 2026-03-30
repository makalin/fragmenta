import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { Fragment } from "../memory/schema.ts";
import type { StorageAdapter } from "./adapter.ts";

type DatabaseSync = import("node:sqlite").DatabaseSync;

export class SqliteStorageAdapter implements StorageAdapter {
  private database?: DatabaseSync;
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async listFragments(): Promise<Fragment[]> {
    const db = await this.getDatabase();
    const rows = db
      .prepare(
        `SELECT id, content, tags, created_at, last_accessed, access_count, importance, metadata
         FROM fragments
         ORDER BY created_at DESC, id ASC`
      )
      .all() as Array<Record<string, unknown>>;

    return rows.map((row) => this.deserializeFragment(row));
  }

  async upsertFragment(fragment: Fragment): Promise<void> {
    const db = await this.getDatabase();
    db.prepare(
      `INSERT INTO fragments (id, content, tags, created_at, last_accessed, access_count, importance, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         content = excluded.content,
         tags = excluded.tags,
         created_at = excluded.created_at,
         last_accessed = excluded.last_accessed,
         access_count = excluded.access_count,
         importance = excluded.importance,
         metadata = excluded.metadata`
    ).run(
      fragment.id,
      fragment.content,
      JSON.stringify(fragment.tags),
      fragment.created_at,
      fragment.last_accessed,
      fragment.access_count,
      fragment.importance,
      JSON.stringify(fragment.metadata ?? null)
    );
  }

  async replaceFragments(fragments: Fragment[]): Promise<void> {
    const db = await this.getDatabase();
    db.exec("BEGIN");

    try {
      db.exec("DELETE FROM fragments");
      const statement = db.prepare(
        `INSERT INTO fragments (id, content, tags, created_at, last_accessed, access_count, importance, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );

      for (const fragment of fragments) {
        statement.run(
          fragment.id,
          fragment.content,
          JSON.stringify(fragment.tags),
          fragment.created_at,
          fragment.last_accessed,
          fragment.access_count,
          fragment.importance,
          JSON.stringify(fragment.metadata ?? null)
        );
      }

      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  async close(): Promise<void> {
    this.database?.close();
    this.database = undefined;
  }

  private async getDatabase(): Promise<DatabaseSync> {
    if (this.database) {
      return this.database;
    }

    await mkdir(dirname(this.filePath), { recursive: true });
    const { DatabaseSync } = await import("node:sqlite");
    const database = new DatabaseSync(this.filePath);
    database.exec(
      `CREATE TABLE IF NOT EXISTS fragments (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        tags TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_accessed INTEGER NOT NULL,
        access_count INTEGER NOT NULL,
        importance REAL NOT NULL,
        metadata TEXT
      )`
    );

    this.database = database;
    return database;
  }

  private deserializeFragment(row: Record<string, unknown>): Fragment {
    return {
      id: String(row.id),
      content: String(row.content),
      tags: JSON.parse(String(row.tags)) as string[],
      created_at: Number(row.created_at),
      last_accessed: Number(row.last_accessed),
      access_count: Number(row.access_count),
      importance: Number(row.importance),
      metadata: row.metadata ? (JSON.parse(String(row.metadata)) as Record<string, unknown> | undefined) : undefined
    };
  }
}
