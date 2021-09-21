import fs from "fs";
import { cosmiconfig } from "cosmiconfig";

const fsp = fs.promises;

export async function getAllCosmicFolders(startFolder: string) {
  const allFiles = await fsp.readdir(startFolder);

  const onlyFolders: string[] = await asyncFilter(
    allFiles,
    async (fileOrDir) => {
      const directory = `${startFolder}/${fileOrDir}`;
      try {
        const stats = await fsp.lstat(directory);
        return stats.isDirectory();
      } catch (err) {
        console.log(fileOrDir, err);
        return false;
      }
    }
  );

  const explorer = cosmiconfig("morn", {
    stopDir: startFolder,
  });

  const onlyExplorerFolders: string[] = await asyncFilter(
    onlyFolders,
    async (folder) => {
      const directory = `${startFolder}/${folder}`;
      const config = await explorer.search(directory);

      return config !== null;
    }
  );

  return onlyExplorerFolders.map((folders) => {
    return {
      label: folders,
      value: folders,
      directory: `${startFolder}/${folders}`,
    };
  });
}

async function asyncFilter<T>(
  arr: T[],
  predicate: (t: T) => boolean | Promise<boolean>
) {
  const results = await Promise.all(arr.map(predicate));

  return arr.filter((_v, index) => results[index]);
}
