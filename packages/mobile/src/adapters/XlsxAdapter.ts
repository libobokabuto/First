import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';

/** XLSX/CSV 适配器：将表格文件转换为 HTML */
export class XlsxAdapter {
  /**
   * 读取 XLSX/CSV 文件并转换为 HTML 表格
   * @param fileUri 文件 URI
   * @param fileName 文件名（用于判断格式）
   * @returns 渲染后的 HTML 字符串
   */
  async convertToHtml(fileUri: string, fileName: string): Promise<string> {
    // 读取文件为 base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const isCSV = fileName.toLowerCase().endsWith('.csv');

    // 解析工作簿
    let workbook: XLSX.WorkBook;
    if (isCSV) {
      // CSV 文件：先解码为字符串再解析
      const csvText = atob(base64);
      workbook = XLSX.read(csvText, { type: 'string' });
    } else {
      // XLSX 等：用 base64 解析
      workbook = XLSX.read(base64, { type: 'base64' });
    }

    // 生成所有工作表的 HTML
    const sheetNames = workbook.SheetNames;
    let htmlParts: string[] = [];

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const sheetHtml = XLSX.utils.sheet_to_html(sheet, {
        id: `sheet-${sheetName}`,
        editable: false,
      });

      // 只对第一个工作表使用完整 HTML，其余的添加标题分隔
      if (sheetNames.length > 1) {
        htmlParts.push(`<h3 class="sheet-title">${sheetName}</h3>`);
      }
      htmlParts.push(sheetHtml);
    }

    return htmlParts.join('\n');
  }
}

/** 注入样式包装，使表格 HTML 在 WebView 中正常渲染 */
export function wrapXlsxHtml(html: string, isDark: boolean): string {
  const bgColor = isDark ? '#0d1117' : '#ffffff';
  const textColor = isDark ? '#c9d1d9' : '#24292f';
  const headerBg = isDark ? '#161b22' : '#f6f8fa';
  const borderColor = isDark ? '#30363d' : '#d0d7de';
  const altRowBg = isDark ? '#161b22' : '#f6f8fa';
  const sheetTitleColor = isDark ? '#e6edf3' : '#1a1a2e';

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes">
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: ${textColor};
    background-color: ${bgColor};
    padding: 8px;
    margin: 0;
  }
  .sheet-title {
    font-size: 18px;
    font-weight: 700;
    color: ${sheetTitleColor};
    margin: 16px 8px 8px;
    padding-bottom: 8px;
    border-bottom: 2px solid ${borderColor};
  }
  table {
    border-collapse: collapse;
    font-size: 13px;
    margin: 8px 0 16px;
  }
  table th, table td {
    border: 1px solid ${borderColor};
    padding: 6px 10px;
    text-align: left;
    white-space: nowrap;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  table th {
    background-color: ${headerBg};
    font-weight: 700;
    position: sticky;
    top: 0;
  }
  table tr:nth-child(even) td {
    background-color: ${altRowBg};
  }
  /* 整个表格可水平滚动 */
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
</style>
</head>
<body>
  <div class="table-wrapper">
    ${html}
  </div>
</body>
</html>`;
}
