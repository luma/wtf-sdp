import path from 'path';
import fs from 'fs';
import Bluebird from 'bluebird';

const fsReadFile = Bluebird.promisify(fs.readFile);
const assetDirPath = path.resolve(__dirname, '../assets/');
const srcDirPath = path.resolve(__dirname, '../../src/');

const readFile = (filePath) => {
  return fsReadFile(filePath).then((src) => {
    return src.toString();
  }).catch((err) => {
    throw err;
  });
};

export const readSrcFile = (srcPath) => {
  return readFile(path.join(srcDirPath, srcPath));
};

export const readAsset = (assetPath) => {
  return readFile(path.join(assetDirPath, assetPath));
};

export const readJsonAsset = (assetPath) => {
  return readFile(path.join(assetDirPath, assetPath)).then((json) => {
    return JSON.parse(json);
  });
};
