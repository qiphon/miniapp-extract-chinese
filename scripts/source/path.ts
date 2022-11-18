import { getFilePath, md5 } from './file';

/**
 * @file 项目配置路径
 */
const path = require('path');

export const Paths = {
  base: path.join(__dirname, '../../miniprogram/'),
  translateDir: ['pages', 'packageA', 'components'],
  /** 供小程序使用的TS文件存放的位置 */
  outFile: path.join(__dirname, '../../miniprogram/lang.ts'),
  outExcelPath: path.join(__dirname, '../../translate.xlsx'),
};

export const config = {
  /** 目前只支持 wxml */
  matchFile: '.wxml',
  /** 是否替换提取的文本 */
  isReplaceFile: true,
  /** 文本替换模版 */
  replaceTemplate: (key: string) => `{{lang['${key}'].zh}}`,
  /** 生成key的规则，小心修改，修改后将影响所有的翻译生成的key,可能会有key 重复，或相同文案key不同的问题
   * @params path {string} 页面路径 eg. pages/index/index
   * @params text {string} 要翻译的文案
   */
  generateKeyPath: (pathStr: string, text: string) => {
    const path = getFilePath(pathStr);
    return {
      md5: md5(path + text),
      raw: path + text,
      path,
    };
  },
};
