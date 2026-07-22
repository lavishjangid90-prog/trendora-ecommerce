import { readJsonFile, writeJsonFile } from "./json.repository";

export function createUserRepository<TUser>(dataDir: string, filePath: string) {
  return {
    load: (fallback: TUser[]) => readJsonFile<TUser[]>(filePath, fallback),
    save: (users: TUser[]) => writeJsonFile(dataDir, filePath, users),
  };
}
