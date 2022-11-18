/**
 * @file 多语言文件导出Excel 只能使用node执行
 * @author qifeng
 */
// @ts-ignore
import * as ExcelJS from 'exceljs';
import { Paths } from './path';

export type ExportExcelData = {
  [k: string]: {
    [k: string]: {
      zh: string;
      [k: string]: string;
    };
  };
};

export const exportExcelFromData = (langs: ExportExcelData) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('carbonAccount', {
    pageSetup: { fitToPage: true, fitToHeight: 5, fitToWidth: 7 },
  });

  const rows = Object.values(langs)
    .reduce((tmp, next) => {
      // @ts-ignore
      return tmp.concat(Object.entries(next));
    }, [])
    // @ts-ignore
    .map(([key, value]) => [key, value.zh]);
  worksheet.addRows(rows);

  workbook.xlsx.writeFile(Paths.outExcelPath);
};

export const exportExcelFromFile = (filePath: string) => {
  import(filePath).then(data => {
    const langs = data.default as ExportExcelData;
    exportExcelFromData(langs);
  });
};
