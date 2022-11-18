/**
 * @file 多语言提取脚本文件
 * @description 建议使用编译的文件执行文字提取，bunjs 执行这个脚本是生成的 key 和 node 下生成的 key 不同
 */

import { getSpecifiedFiles, getZhText } from './file';
import { config, Paths } from './path';
import * as _ from 'lodash';
import * as fs from 'fs';
import { parseDocument, DomUtils } from 'htmlparser2';
import { exportExcelFromData } from './exportExcel';

/** 翻译路径下所有的文件 */
const files = Paths.translateDir.reduce((tmp, next) => {
  return tmp.concat(getSpecifiedFiles(Paths.base + next));
}, [] as string[]);

const wxmlFiles = files.filter(f => f.endsWith(config.matchFile));
console.log(
  `找到 wxml 文件 ${wxmlFiles.length} 个 - 查找路径 ${Paths.translateDir.join(
    '、',
  )}`,
);

let outFileString = `export default {}`;
let outFile: Record<string, any> = {};
const createFile = () => {
  fs.writeFileSync(Paths.outFile, outFileString, 'utf-8');
};

/** 文本节点写入outfile */
const writeTextNode = (key: string, text: string) => {
  // const result = pinyin(text, {
  //   toneType: 'none',
  //   v: true,
  //   removeNonZh: true,
  // });
  const { md5, raw, path } = config.generateKeyPath(key, text);
  _.set(
    outFile,
    /** 需要把无用的路径截取掉，不然会导致MD5 的key 是动态的 */
    `${path}.${md5}`,
    {
      zh: text,
      en: raw,
    },
  );
  return md5;
};

const mapNodes = (nodes: ChildNode, path: string) => {
  if (
    // @ts-ignore
    (nodes.nodeType === 3 || ['text'].includes(nodes.tagName)) &&
    // @ts-ignore
    nodes.data
  ) {
    const {
      matchArr,
      trimedText,
      isHasTrinocularOperation,
      isHasVariable,
      isJust1PartHasVariable,
    } =
      // @ts-ignore
      getZhText(nodes.data);
    if (matchArr.length) {
      // 有正则的情况，使用分段抽取
      if (isHasTrinocularOperation || isJust1PartHasVariable) {
        matchArr.forEach(zh => {
          writeTextNode(path, zh);
        });
      } else {
        const key = writeTextNode(path, trimedText);
        // 只替换没有变量的部分
        if (config.isReplaceFile && !isHasVariable) {
          // @ts-ignore
          nodes.data = config.replaceTemplate(key);
        }
      }
    }
    // 导航栏文字单独处理
    // @ts-ignore
  } else if (nodes.tagName === 'navigation-bar' && nodes.attribs?.title) {
    // @ts-ignore
    const { matchArr } = getZhText(nodes.attribs?.title);
    if (matchArr.length) {
      // @ts-ignore
      const key = writeTextNode(path, nodes.attribs?.title);
      // @ts-ignore
      if (config.isReplaceFile)
        // @ts-ignore
        nodes.attribs.title = config.replaceTemplate(key);
    }
  }
  if (nodes.childNodes?.length) {
    nodes.childNodes.forEach(el => {
      mapNodes(el, path);
    });
  }
};

new Promise(r => {
  // node 下，不支持动态import，目前使用覆盖写形式

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
})
  .then(() => {
    console.log(`文字提取开始。。。`);

    let fileLen = wxmlFiles.length;
    return new Promise(r => {
      wxmlFiles.forEach((file, index) => {
        fs.readFile(file, {}, (err, data) => {
          let dom = null;
          if (err) {
            console.log(`read file error ${file}: `);
            console.log(err);
          } else {
            dom = parseDocument(data.toString(), { xmlMode: true });
            dom.children.forEach(child => {
              mapNodes(child as unknown as ChildNode, index + file);
            });
          }
          const domString = DomUtils.getInnerHTML(dom, {
            xmlMode: true,
            encodeEntities: false,
            decodeEntities: true,
          });
          const tranformedStr = domString;
          if (tranformedStr)
            fs.writeFile(file, tranformedStr, err => {
              if (err) {
                console.log(`write file fail `);
                console.log(err);
              }
            });

          console.log(`${file} 提取完成`, index);
          if (fileLen-- === 1) {
            r('');
          }
        });
      });
    });
  })
  // 文案提取结束，写入文件
  .then(() => {
    console.log(`write file start ....`);
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
    // 导出翻译文件到excel
    exportExcelFromData(outFile);
  })
  .then(() => {
    console.log('多语言提取完成');
  });
