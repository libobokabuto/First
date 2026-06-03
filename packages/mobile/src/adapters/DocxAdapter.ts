import * as FileSystem from 'expo-file-system';
import mammoth from 'mammoth';

/** DOCX 适配器：将 .docx 文件转换为 HTML */
export class DocxAdapter {
  /**
   * 读取 DOCX 文件并转换为 HTML
   * @param fileUri 文件 URI
   * @returns 渲染后的 HTML 字符串
   */
  async convertToHtml(fileUri: string): Promise<string> {
    // 读取文件为 base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 将 base64 转换为 ArrayBuffer
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const buffer = bytes.buffer as ArrayBuffer;

    // 使用 mammoth 转换
    const result = await mammoth.convertToHtml(
      { arrayBuffer: buffer },
      {
        // 样式映射配置
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Heading 4'] => h4:fresh",
          "r[style-name='Strong'] => strong",
          "r[style-name='Emphasis'] => em",
        ],
        convertImage: mammoth.images.imgElement((image) => {
          return image.read('base64').then((imageBuffer) => {
            return {
              src: `data:${image.contentType};base64,${imageBuffer}`,
            };
          });
        }),
      },
    );

    if (result.messages.length > 0) {
      console.log('DOCX 转换警告:', result.messages);
    }

    return result.value;
  }
}

/** 注入样式包装，使 DOCX HTML 在 WebView 中正常渲染 */
export function wrapDocxHtml(html: string, isDark: boolean): string {
  const bgColor = isDark ? '#0d1117' : '#ffffff';
  const textColor = isDark ? '#c9d1d9' : '#24292f';
  const linkColor = isDark ? '#58a6ff' : '#0969da';
  const tableBorder = isDark ? '#30363d' : '#d0d7de';
  const tableBg = isDark ? '#161b22' : '#f6f8fa';
  const codeBg = isDark ? '#161b22' : '#f6f8fa';

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    color: ${textColor};
    background-color: ${bgColor};
    padding: 16px;
    margin: 0;
    word-wrap: break-word;
  }
  h1, h2, h3, h4, h5, h6 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
  }
  h1 { font-size: 2em; border-bottom: 1px solid ${tableBorder}; padding-bottom: 0.3em; }
  h2 { font-size: 1.5em; border-bottom: 1px solid ${tableBorder}; padding-bottom: 0.3em; }
  h3 { font-size: 1.25em; }
  p { margin: 0 0 16px; }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 16px 0;
    overflow-x: auto;
    display: block;
  }
  table th, table td {
    border: 1px solid ${tableBorder};
    padding: 8px 12px;
    text-align: left;
  }
  table th {
    background-color: ${tableBg};
    font-weight: 600;
  }
  table tr:nth-child(even) {
    background-color: ${tableBg};
  }
  img {
    max-width: 100%;
    height: auto;
  }
  a {
    color: ${linkColor};
    text-decoration: none;
  }
  code {
    background-color: ${codeBg};
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9em;
  }
  pre {
    background-color: ${codeBg};
    padding: 16px;
    border-radius: 6px;
    overflow-x: auto;
  }
  pre code {
    background: none;
    padding: 0;
  }
  blockquote {
    border-left: 4px solid ${tableBorder};
    margin: 0 0 16px;
    padding: 0 16px;
    color: ${isDark ? '#8b949e' : '#57606a'};
  }
  ul, ol {
    padding-left: 24px;
    margin: 0 0 16px;
  }
  li { margin-bottom: 4px; }
</style>
</head>
<body>${html}</body>
</html>`;
}
