import * as fs from 'fs';
import * as path from 'path';
import * as Image from './image';
import * as Utils from './utils';

const sourceDirectory = process.env.MOUNTED_SOURCE_DIRECTORY || '/Nonexistant';
const supportedFileExtensions = ['.jpg', '.cr2', '.heic', '.mov', '.mpg', '.mp4', '.mts', '.jpeg', '.png', '.orf', '.tif', '.tiff', '.avi', '.dng'];
const destinationDirectory = process.env.MOUNTED_DESTINATION_DIRECTORY || '/Nonexistant';

function getFileName(originalFileName: string, imageData: Image.ImageData) {
  const { year, month, day, hour, minute, second, milliseconds } = Image.getTimestamp(imageData);

  const extension = path.extname(originalFileName).toLowerCase();

  return `${year}/${year}.${month}/${year}.${month}.${day} ${hour}.${minute}.${second}.${milliseconds}${extension}`;
}

async function copyIntoArchive(source: string, destination: string, sourceDirectory: string) {
  const dir = path.dirname(destination);
  const fullDir = path.join(destinationDirectory, dir);
  const fullPath = path.join(destinationDirectory, destination);

  try {
    await Utils.mkdir(fullDir);

    const exists = await Utils.fileExists(destination);

    const newSize = await Utils.fileSize(source);
    const existingSize = exists ? await Utils.fileSize(destination) : 0;

    if (!exists || newSize > existingSize) {
      await Utils.copyFile(source, fullPath);
    }

    await Utils.moveOriginalToImportedDirectory(source, sourceDirectory);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

async function processImage(index: number, originalFileName: string, sourceDirectory: string) {
  try {
    const exifData = await Image.readExif(originalFileName);
    if (!exifData) {
      const fileName = Utils.getNoExifFileName(originalFileName, destinationDirectory);
      await copyIntoArchive(originalFileName, fileName, sourceDirectory);

      console.info(`${index}\t🔴 📷 ${fileName}`);
      return;
    }

    const imageData = Image.getImageData(exifData);

    if (Number.isNaN(imageData.createdMonth)) {
      const fileName = Utils.getNoExifFileName(originalFileName, destinationDirectory);
      await copyIntoArchive(originalFileName, fileName, sourceDirectory);

      console.info(`${index}\t🟡 📷 ${fileName}`);

      return;
    }

    const fileName = getFileName(originalFileName, imageData);
    console.info(`${index}\t🟢 📷 ${fileName}`);

    await copyIntoArchive(originalFileName, fileName, sourceDirectory);
  } catch (error) {
    console.error('Error: ' + JSON.stringify(error, undefined, 2));
  }
}

async function* getFiles(sourceDirectory: string): AsyncIterableIterator<{ fileName: string; sourceDirectory: string }> {
  const subdirectories = await fs.promises.readdir(sourceDirectory);
  for (const subdir of subdirectories) {
    const resolvedFileName = path.resolve(sourceDirectory, subdir);
    if ((await fs.promises.stat(resolvedFileName)).isDirectory()) {
      yield* getFiles(resolvedFileName);
    } else {
      yield { fileName: resolvedFileName, sourceDirectory: sourceDirectory };
    }
  }
}

export async function main() {
  let localIndex = 0;

  for await (const sourceFile of getFiles(sourceDirectory)) {
    if (supportedFileExtensions.some((extension) => sourceFile.fileName.toLowerCase().endsWith(extension.toLowerCase()))) {
      localIndex++;
      await processImage(localIndex, sourceFile.fileName, sourceFile.sourceDirectory);
    }
  }
}

main();
