import * as fs from 'fs';
import { dirname } from 'path';

// TODO: Update to use fs.promises

export async function mkdir(dir: string) {
  return new Promise<void>((fulfill, reject) => {
    fs.mkdir(dir, { recursive: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        fulfill();
      }
    });
  });
}

export async function copyFile(source: string, destination: string) {
  return new Promise<void>((fulfill, reject) => {
    fs.copyFile(source, destination, (err) => {
      if (err) {
        reject(err);
      } else {
        fulfill();
      }
    });
  });
}

export async function fileSize(fileName: string) {
  return new Promise((fulfill, reject) => {
    fs.stat(fileName, function (err, stat) {
      if (err == null) {
        fulfill(stat.size);
      } else {
        throw new Error(err.code);
      }
    });
  });
}

export async function fileExists(fileName: string) {
  return new Promise((fulfill, reject) => {
    fs.stat(fileName, function (err, stat) {
      if (err == null) {
        fulfill(true);
      } else if (err.code === 'ENOENT') {
        fulfill(false);
      } else {
        throw new Error(err.code);
      }
    });
  });
}

export const getNoExifFileName = (sourceFileName: string, destinationDirectory: string) => {
  return 'Undated' + sourceFileName;
};

const getImportedFileName = (sourceFileName: string) => {
  return sourceFileName.replace(process.env.MOUNTED_SOURCE_DIRECTORY || '/Nonexistant', process.env.MOUNTED_IMPORTED_DIRECTORY || '/Nonexistant');
};

export async function moveOriginalToImportedDirectory(sourceFileName: string, sourceDirectory: string) {
  const destination = getImportedFileName(sourceFileName);

  const dirName = dirname(destination);
  await mkdir(dirName);

  return new Promise<void>((fulfill, reject) => {
    fs.rename(sourceFileName, destination, (err) => {
      if (err) {
        reject(err);
      } else {
        fulfill();
      }
    });
  });
}
