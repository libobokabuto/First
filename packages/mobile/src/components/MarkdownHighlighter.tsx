import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';

interface Props {
  text: string;
  isDark: boolean;
  fontSize?: number;
  lineHeight?: number;
}

interface Span {
  text: string;
  style?: object;
}

const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

// 亮色主题高亮色
const lightColors = {
  heading: '#8250df',
  bold: '#cf222e',
  italic: '#0550ae',
  strikethrough: '#656d76',
  code: '#d73a49',
  codeBg: '#f6f8fa',
  link: '#0969da',
  image: '#0969da',
  blockquote: '#2da44e',
  listMarker: '#0550ae',
  hr: '#d0d7de',
  plain: '#24292f',
};

// 暗色主题高亮色
const darkColors = {
  heading: '#d2a8ff',
  bold: '#ff7b72',
  italic: '#79c0ff',
  strikethrough: '#6e7681',
  code: '#d2a8ff',
  codeBg: '#161b22',
  link: '#58a6ff',
  image: '#58a6ff',
  blockquote: '#3fb950',
  listMarker: '#79c0ff',
  hr: '#30363d',
  plain: '#c9d1d9',
};

/** 解析一行内的 Markdown 内联语法，返回 Span 数组 */
function parseInline(line: string, colors: typeof lightColors): Span[] {
  const spans: Span[] = [];
  let i = 0;
  const len = line.length;

  while (i < len) {
    // 行内代码 `code`
    if (line[i] === '`' && line[i + 1] !== '`') {
      const end = line.indexOf('`', i + 1);
      if (end !== -1) {
        spans.push({
          text: line.slice(i, end + 1),
          style: { color: colors.code, backgroundColor: colors.codeBg },
        });
        i = end + 1;
        continue;
      }
    }

    // 链接 [text](url)
    if (line[i] === '[') {
      const closeBracket = line.indexOf(']', i);
      const openParen = closeBracket !== -1 ? line.indexOf('(', closeBracket) : -1;
      const closeParen = openParen !== -1 ? line.indexOf(')', openParen) : -1;
      if (
        closeBracket !== -1 &&
        openParen === closeBracket + 1 &&
        closeParen !== -1 &&
        closeBracket > i
      ) {
        spans.push({
          text: line.slice(i, closeParen + 1),
          style: { color: colors.link },
        });
        i = closeParen + 1;
        continue;
      }
    }

    // 图片 ![alt](url)
    if (line[i] === '!' && line[i + 1] === '[') {
      const closeBracket = line.indexOf(']', i + 1);
      const openParen = closeBracket !== -1 ? line.indexOf('(', closeBracket) : -1;
      const closeParen = openParen !== -1 ? line.indexOf(')', openParen) : -1;
      if (
        closeBracket !== -1 &&
        openParen === closeBracket + 1 &&
        closeParen !== -1
      ) {
        spans.push({
          text: line.slice(i, closeParen + 1),
          style: { color: colors.image },
        });
        i = closeParen + 1;
        continue;
      }
    }

    // 粗体 **text** 或 __text__
    if (
      (line[i] === '*' && line[i + 1] === '*' && line[i + 2] !== ' ') ||
      (line[i] === '_' && line[i + 1] === '_' && line[i + 2] !== ' ')
    ) {
      const marker = line[i] + line[i + 1];
      const end = line.indexOf(marker, i + 2);
      if (end !== -1 && end > i + 2) {
        spans.push({
          text: marker,
          style: { color: colors.bold, fontWeight: '700' as const },
        });
        spans.push({
          text: line.slice(i + 2, end),
          style: { color: colors.bold, fontWeight: '700' as const },
        });
        spans.push({
          text: marker,
          style: { color: colors.bold, fontWeight: '700' as const },
        });
        i = end + 2;
        continue;
      }
    }

    // 删除线 ~~text~~
    if (line[i] === '~' && line[i + 1] === '~') {
      const end = line.indexOf('~~', i + 2);
      if (end !== -1 && end > i + 2) {
        spans.push({
          text: line.slice(i, end + 2),
          style: {
            color: colors.strikethrough,
            textDecorationLine: 'line-through' as const,
          },
        });
        i = end + 2;
        continue;
      }
    }

    // 斜体 *text* 或 _text_ (单字符，且不是 ** 或 __ 的一部分)
    if (
      (line[i] === '*' && line[i + 1] !== '*' && line[i + 1] !== ' ') ||
      (line[i] === '_' && line[i + 1] !== '_' && line[i + 1] !== ' ')
    ) {
      const marker = line[i];
      const end = line.indexOf(marker, i + 1);
      if (end !== -1 && end > i + 1) {
        spans.push({
          text: marker,
          style: { color: colors.italic, fontStyle: 'italic' as const },
        });
        spans.push({
          text: line.slice(i + 1, end),
          style: { color: colors.italic, fontStyle: 'italic' as const },
        });
        spans.push({
          text: marker,
          style: { color: colors.italic, fontStyle: 'italic' as const },
        });
        i = end + 1;
        continue;
      }
    }

    // 普通字符
    spans.push({ text: line[i] });
    i++;
  }

  return spans;
}

/** 判断一行是否为水平分隔线 */
function isHorizontalRule(line: string): boolean {
  const trimmed = line.trim();
  return /^[-*_]{3,}$/.test(trimmed);
}

/** 将 Markdown 文本渲染为带语法高亮的 React Native 组件 */
const MarkdownHighlighter: React.FC<Props> = ({
  text,
  isDark,
  fontSize = 14,
  lineHeight = 22,
}) => {
  const colors = isDark ? darkColors : lightColors;
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];

  let inCodeBlock = false;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const trimmed = line.trimStart();

    // 代码块边界 ``` 或 ~~~
    if (/^```/.test(trimmed) || /^~~~/.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      nodes.push(
        <Text key={li} style={{ color: colors.code, fontFamily: monoFont }}>
          {line}
        </Text>
      );
      nodes.push('\n');
      continue;
    }

    // 代码块内部
    if (inCodeBlock) {
      nodes.push(
        <Text key={li} style={{ color: colors.code, fontFamily: monoFont }}>
          {line}
        </Text>
      );
      nodes.push('\n');
      continue;
    }

    // 空行
    if (trimmed === '') {
      nodes.push('\n');
      continue;
    }

    // 水平分割线
    if (isHorizontalRule(line)) {
      nodes.push(
        <Text key={li} style={{ color: colors.hr }}>
          {line}
        </Text>
      );
      nodes.push('\n');
      continue;
    }

    // 标题 # - ######
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      nodes.push(
        <Text key={li} style={{ color: colors.heading, fontWeight: '700' }}>
          {line}
        </Text>
      );
      nodes.push('\n');
      continue;
    }

    // 引用块 >
    if (trimmed.startsWith('>')) {
      // 引用块内容也可以有内联格式
      const spans = parseInline(trimmed, colors);
      nodes.push(
        <Text key={li} style={{ color: colors.blockquote }}>
          {spans.map((s, si) => (
            <Text key={si} style={s.style ?? { color: colors.blockquote }}>
              {s.text}
            </Text>
          ))}
        </Text>
      );
      nodes.push('\n');
      continue;
    }

    // 无序列表 - * +
    const ulMatch = trimmed.match(/^(\s*)([-*+])\s+(.*)/);
    if (ulMatch) {
      const indent = ulMatch[1];
      const marker = ulMatch[2];
      const rest = ulMatch[3];
      nodes.push(
        <Text key={li}>
          <Text>{indent}</Text>
          <Text style={{ color: colors.listMarker }}>{marker} </Text>
          {renderInlines(rest, colors)}
        </Text>
      );
      nodes.push('\n');
      continue;
    }

    // 有序列表 1. 2. etc
    const olMatch = trimmed.match(/^(\s*)(\d+)\.\s+(.*)/);
    if (olMatch) {
      const indent = olMatch[1];
      const marker = olMatch[2] + '.';
      const rest = olMatch[3];
      nodes.push(
        <Text key={li}>
          <Text>{indent}</Text>
          <Text style={{ color: colors.listMarker }}>{marker} </Text>
          {renderInlines(rest, colors)}
        </Text>
      );
      nodes.push('\n');
      continue;
    }

    // 任务列表 - [ ] / - [x]
    const taskMatch = trimmed.match(/^(\s*)([-*+])\s+\[([ x])\]\s+(.*)/);
    if (taskMatch) {
      const indent = taskMatch[1];
      const marker = taskMatch[2];
      const checked = taskMatch[3];
      const rest = taskMatch[4];
      const checkbox = checked === 'x' ? '☑' : '☐';
      nodes.push(
        <Text key={li}>
          <Text>{indent}</Text>
          <Text style={{ color: colors.listMarker }}>{marker} </Text>
          <Text style={{ color: colors.code }}>[{checked}] </Text>
          {renderInlines(rest, colors)}
        </Text>
      );
      nodes.push('\n');
      continue;
    }

    // 表格行 (以 | 开头或包含 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      nodes.push(
        <Text key={li} style={{ color: colors.code }}>
          {line}
        </Text>
      );
      nodes.push('\n');
      continue;
    }

    // 普通段落（有内联元素）
    nodes.push(
      <Text key={li}>
        {renderInlines(line, colors)}
      </Text>
    );
    nodes.push('\n');
  }

  return (
    <Text style={[styles.container, { fontSize, lineHeight }]}>
      {nodes}
    </Text>
  );
};

/** 渲染行内元素为一个 Text 片段 */
function renderInlines(line: string, colors: typeof lightColors): React.ReactNode[] {
  const spans = parseInline(line, colors);
  return spans.map((s, si) => (
    <Text key={si} style={s.style ?? { color: colors.plain }}>
      {s.text}
    </Text>
  ));
}

const styles = StyleSheet.create({
  container: {
    fontFamily: monoFont,
  },
});

export default MarkdownHighlighter;
