/**
 * @file 根据文字数组生成多语言文案
 */

import { config, Paths } from './path';
import * as _ from 'lodash';
import * as fs from 'fs';
import { exportExcelFromData } from './exportExcel';

/**
 * @desc 这个字段根据具体要求配置
 * 是否将下面数组中翻译的文案添加到小程序的语言文件中（如果这个文案存在，那么key会相同，不会导致出现2条同样的数据）
 */
const isAddNewText2LangsFile = true;
/**
 * @desc 数组字段说明
 * {
 *    // filePath： 例如pages/index/index 这个文件，filePath 为 pagesIndexIndex, value中的值为要翻译的文案
 *    filePath: [要添加key的文案]
 * }
 */

const additionTranslateText = [{ pagesIndexIndex: ['测试文案', '测试文案2'] }];

let outFile: Record<string, any> = {};
/** 新增加的文案文件，导出Excel时使用 */
let newOutFile: Record<string, any> = {};
let outFileString = `export default {}`;
export const createFile = () => {
  fs.writeFileSync(Paths.outFile, outFileString, 'utf-8');
};

new Promise(r => {
  // node 下，不支持动态import，目前使用覆盖写形式
  if (isAddNewText2LangsFile) {
    import(Paths.outFile)
      .then(data => {
        // console.log(data, 'file');
        if (!data?.default) {
          createFile();
          r('');
        } else {
          outFile = data.default;
          r('');
        }
      })
      .catch(() => {
        // 不存在 - 创建新文件
        createFile();
        r('');
      });
  } else {
    r('');
  }
}).then(() => {
  additionTranslateText.forEach(pathObj => {
    const path = Object.keys(pathObj)[0];
    pathObj[path].forEach(word => {
      const { md5, raw, path: usedPath } = config.generateKeyPath(path, word);
      if (isAddNewText2LangsFile && !_.get(outFile, `${usedPath}.${md5}`)) {
        _.set(
          newOutFile /** 需要把无用的路径截取掉，不然会导致MD5 的key 是动态的 */,
          `${usedPath}.${md5}`,
          {
            zh: word,
            en: raw,
          },
        );
      }
      _.set(
        outFile /** 需要把无用的路径截取掉，不然会导致MD5 的key 是动态的 */,
        `${usedPath}.${md5}`,
        {
          zh: word,
          en: raw,
        },
      );
    });
  });

  fs.writeFile(
    Paths.outFile,
    `export default ${JSON.stringify(outFile)}`,
    { encoding: 'utf-8' },
    err => {
      if (err) {
        console.log(`写入失败。。。。。`);
        console.log(err);
      } else {
        console.log(`写入完成`);
      }
    },
  );

  exportExcelFromData(newOutFile);
});
