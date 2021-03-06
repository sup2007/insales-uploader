'use strict';
import log from 'fancy-log';
import logger from '../logger';
import checkNewVersion from './checkNewVersion';
import {startWatching,stopWatching} from '../watcher/';
import sortAssetFolders from '../options/sortAssetFolders';
import updateAssets from '../insalesApi/updateAssets';
import updateListThemes from '../insalesApi/updateListThemes';
import testOnline from '../help/testOnline';
import sessionTime from '../tools/sessionTime';
import openBrowser from '../tools/openBrowser';
import checkLocalAssets from './checkLocalAssets';

/**
 * Отслеживание изменений
 * @param  {function} onUpdate колбек после изменения в файле
 */
export default function watch (onUpdate) {
  const options = this.options;
  const paths = this.paths;

  return new Promise((resolve, reject) => {

    testOnline('Отсутствует соединение с интернетом!')
      .then(checkNewVersion)
      .then(() => {
        return updateAssets(options);
      })
      .then(assets => {
        return sortAssetFolders.apply(this, [assets]);
      })
      .then(() => {
        return checkLocalAssets.apply(this);
      })
      .then(() => {
        if (this.options.theme.assetsSync) {
          return this.initAssets();
        }else{
          return Promise.resolve();
        }
      })
      .then(() => {
        return startWatching.apply(this, [onUpdate]);
      })
      .then(() => {
        return updateListThemes.apply(this);
      })
      .then((theme) => {
        if (theme.current.title) logger.send('Тема:', theme.current.title);
        logger.send('Статус темы:', theme.current.type);
        logger.send('URL:', options.themeUrl);

        return;
      })
      .then(() => {
        if (this.options.util.openBrowser) {
          return openBrowser(options.themeUrl);
        }else{
          return Promise.resolve();
        }
      })
      .then(() => {
        return sessionTime();
      })
      .then(() => {
        resolve(this)
      })
      .catch(err => {
        if (err) log(err);
        stopWatching.apply(this);
        reject(this);
      })
  });
};
