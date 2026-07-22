import { readJsonFile, writeJsonFile } from "./json.repository";

/** Product JSON persistence boundary retained until the database migration phase. */
export function createProductRepository<T>(dataDir: string, filePath: string) {
  return {
    load: (fallback: T[]) => readJsonFile<T[]>(filePath, fallback),
    save: (products: T[]) => writeJsonFile(dataDir, filePath, products),
  };
}
