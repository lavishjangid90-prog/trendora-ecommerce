import fs from "fs/promises";

/** JSON persistence adapter retained for Phase 1 compatibility. */
export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const contents = await fs.readFile(filePath, "utf8");
    return JSON.parse(contents) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile(dataDir: string, filePath: string, data: unknown) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}
