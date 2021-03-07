import * as moment from 'moment';
import { exec, ExecException } from 'child_process';
import * as _ from 'lodash';

export async function readExif(fileName: string): Promise<ExifToolData | undefined> {
  return new Promise((fulfill, reject) => {
    exec(`exiftool -j "${fileName}"`, (error: ExecException, stdout: string) => {
      if (error) {
        fulfill(undefined);
      } else {
        const exifData = JSON.parse(stdout) as ExifToolData[];

        if (exifData.length > 0) {
          fulfill(exifData[0]);
        } else {
          fulfill(undefined);
        }
      }
    });
  });
}

export interface ImageData {
  cameraMake?: string | undefined;
  cameraModel?: string | undefined;
  createdYear?: number | undefined;
  createdMonth?: number | undefined;
  createdDay?: number | undefined;
  createdHour?: number | undefined;
  createdMinute?: number | undefined;
  createdSecond?: number | undefined;
  createdMilliseconds?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
}

interface ExifToolData {
  SubSecTimeOriginal: number;
  Make: string;
  Model: string;
  ImageWidth: number;
  ImageHeight: number;
  CreateDate: string;
  GPSLatitude: string;
  GPSLatitudeRef: string;
  GPSLongitude: string;
  GPSLongitudeRef: string;
}

export function getImageData(exifData: ExifToolData) {
  const createdDate = moment(exifData.CreateDate, 'YYYY:MM:DD HH:mm:ss');

  const milliseconds = exifData.SubSecTimeOriginal || 0;

  return {
    cameraMake: exifData.Make,
    cameraModel: exifData.Model,
    createdYear: createdDate.year(), //
    createdMonth: createdDate.month() + 1,
    createdDay: createdDate.date(),
    createdHour: createdDate.hour(),
    createdMinute: createdDate.minute(),
    createdSecond: createdDate.second(),
    createdMilliseconds: milliseconds,
    width: exifData.ImageWidth,
    height: exifData.ImageHeight,
  }
}

export function getTimestamp(imageData: ImageData) {
  const year = _.padStart(`${imageData.createdYear}`, 4, '0');
  const month = _.padStart(`${imageData.createdMonth}`, 2, '0');
  const day = _.padStart(`${imageData.createdDay}`, 2, '0');
  const hour = _.padStart(`${imageData.createdHour}`, 2, '0');
  const minute = _.padStart(`${imageData.createdMinute}`, 2, '0');
  const second = _.padStart(`${imageData.createdSecond}`, 2, '0');
  const milliseconds = _.padStart(`${imageData.createdMilliseconds || 0}`, 3, '0');

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    milliseconds,
    timestamp: `${year}-${month}-${day} ${hour}:${minute}:${second}.${milliseconds}`,
  };
}
