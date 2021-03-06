import fs from 'fs';
import crypto from 'crypto';
import upath from 'upath';
import cpFile from 'cp-file';
import fileMissing from '../help/fileMissing.js';

/**
 * Синхронизировать измененные ассеты
 */
export function syncChange(instance, file, cllbck) {
  if (instance.options.theme.assetsSync) {
    if (!cllbck) cllbck = ()=>{};

    let fileInfo = instance.getFileInfo(file, true);
    let syncPath = testFileSychro(fileInfo);
    syncFile(fileInfo, syncPath, instance, file);

    cllbck()
  }else{
    cllbck();
  }
}

// синхронизация удаления
export function syncUnlink(instance, pathToUnlink, cllbck) {
  if (pathToUnlink && instance.options.theme.assetsSync) {
    if (!cllbck) cllbck = ()=>{};

    let fileInfo = instance.getFileInfo({path: pathToUnlink}, false);
    let syncPath = testFileSychro(fileInfo);
    if (syncPath) {
      fileMissing(syncPath)
        .catch(()=>{
          try {
            fs.unlinkSync(syncPath);
            cllbck(fileInfo.isAsset)
          } catch (e) {
            cllbck(fileInfo.isAsset)
            return;
          }
        })
    }else{
      cllbck(fileInfo.isAsset)
    }
  }else{
    cllbck();
  }
}

// Получить путь для синхронизации
function testFileSychro(FileInfo) {
  let syncPath = null;
  let asset = FileInfo.asset;

  if (asset.insalesInfo.type == 'Asset::Media') {
    syncPath = (upath.normalize(FileInfo.path).localeCompare(asset.pathKey) === 0) ? asset.pathMedia : asset.pathKey;
  }

  return syncPath;
}

// Синхронизировать файл
function syncFile(fileInfo, syncPath, instance, file) {
  if (!syncPath) {
    return false;
  }
  let syncFileInfo = instance.getFileInfo({path: syncPath}, true);
  let fileProps = fileInfo.insalesInfo
  let syncFileProps = syncFileInfo.insalesInfo;
  let prop = (typeof fileInfo.insalesInfo.content === 'string') ? 'content' : 'attachment';
  let isString = (typeof syncFileProps[prop] === 'string' && typeof fileProps[prop] === 'string');
  // true если синхронизован
  let isSync = false;

  if (isString) {
    let stats1 = fs.statSync(file.path)
    let stats2 = fs.statSync(syncPath)
    let fileSizeInBytes1 = Number(stats1.size);
    let fileSizeInBytes2 = Number(stats2.size);

    isSync = fileSizeInBytes2 === fileSizeInBytes1;
    if (syncFileProps[prop] === '') {
      isSync = (syncFileProps[prop] === '' && fileProps[prop] === '');
    }

    if (fileSizeInBytes1 === fileSizeInBytes2) {
      let hash1 = md5FileSync(file.path);
      let hash2 = md5FileSync(syncPath);

      isSync = (hash1 === hash2);
    }
  }

  if (!isSync) {
    cpFile.sync(file.path, syncPath);
    return isSync;
  }
}


const BUFFER_SIZE = 8192

function md5FileSync(filename) {
  const fd = fs.openSync(filename, 'r')
  const hash = crypto.createHash('md5')
  const buffer = Buffer.alloc(BUFFER_SIZE)

  try {
    let bytesRead

    do {
      bytesRead = fs.readSync(fd, buffer, 0, BUFFER_SIZE)
      hash.update(buffer.slice(0, bytesRead))
    } while (bytesRead === BUFFER_SIZE)
  } finally {
    fs.closeSync(fd)
  }

  return hash.digest('hex')
}
