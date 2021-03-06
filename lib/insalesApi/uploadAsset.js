'use strict';
import InsalesApi from 'insales';
import logger from '../logger';

/**
 * Загрузить ассет на сервер
 */
export default function uploadAsset (asset, path, options, log = true) {
  const InSales = InsalesApi(options.insalesApi);
  return new Promise((resolve, reject) => {
    InSales.uploadAsset({
      token: options.account.token,
      url: options.account.url,
      theme: options.theme.id,
      asset
    }).then(output => {
      if (log) logger.blue(`Upload: ${asset.type}: ${asset.name} from ${path}`);
      resolve()
    }).catch(err => {
      logger.error('error upload:' + asset.name);
      if (err.msg) {
        console.log(err.msg);
      }
      resolve()
    });
  });
}
