import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { MarkdownAdapter } from '@docket/shared';
import MarkdownHighlighter from '../components/MarkdownHighlighter';
import KeyboardToolbar from '../components/KeyboardToolbar';
import FormatToolbar, { FormatAction } from '../components/FormatToolbar';
import { useSettingsStore, ThemeMode } from '../store/settingsStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Preview'>;

const adapter = new MarkdownAdapter();
const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const EDITOR_FONT_SIZE = 14;
const EDITOR_LINE_HEIGHT = 22;
const AUTO_SAVE_DELAY = 2000; // 2秒无操作后自动保存

type Mode = 'preview' | 'edit';
type SaveStatus = 'saved' | 'unsaved' | 'saving';

/** 根据用户设置和系统颜色方案计算是否为暗色模式 */
function resolveIsDark(userTheme: ThemeMode, systemIsDark: boolean): boolean {
  if (userTheme === 'dark') return true;
  if (userTheme === 'light') return false;
  return systemIsDark;
}

const PreviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { fileUri, fileName } = route.params;
  const colorScheme = useColorScheme();
  const systemIsDark = colorScheme === 'dark';

  // 从设置 Store 获取用户主题偏好
  const { theme: userTheme } = useSettingsStore();
  const isDark = resolveIsDark(userTheme, systemIsDark);

  const [html, setHtml] = useState<string>('');
  const [rawContent, setRawContent] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('preview');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  // 动画值
  const previewOpacity = useRef(new Animated.Value(1)).current;
  const editOpacity = useRef(new Animated.Value(0)).current;

  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // 追踪当前光标选区 {start, end}
  const selectionRef = useRef({ start: 0, end: 0 });

  // 自动保存定时器
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 上一次自动保存时的内容（用于判断是否需要保存）
  const lastAutoSavedRef = useRef<string>('');

  // 设置 header 右侧按钮
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => toggleMode()}
        >
          <Text style={styles.headerButtonText}>
            {mode === 'preview' ? '编辑' : '预览'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, mode, saveStatus, isDark]);

  /** 将内容写入磁盘 */
  const saveToDisk = useCallback(async (content: string): Promise<boolean> => {
    setSaveStatus('saving');
    try {
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      setSaveStatus('saved');
      return true;
    } catch (e) {
      console.error('保存文件失败', e);
      setSaveStatus('unsaved');
      return false;
    }
  }, [fileUri]);

  /** 手动保存（从编辑模式回到预览模式时调用） */
  const handleSave = useCallback(async (content: string) => {
    const ok = await saveToDisk(content);
    if (ok) {
      setRawContent(content);
      lastAutoSavedRef.current = content;
    }
  }, [saveToDisk]);

  /** 自动保存（仅在编辑模式下触发） */
  const triggerAutoSave = useCallback((content: string) => {
    // 清除之前的定时器
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // 设置新的自动保存定时器
    autoSaveTimerRef.current = setTimeout(async () => {
      if (content !== lastAutoSavedRef.current) {
        const ok = await saveToDisk(content);
        if (ok) {
          lastAutoSavedRef.current = content;
        }
      }
    }, AUTO_SAVE_DELAY);
  }, [saveToDisk]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  /** 渲染预览 HTML */
  const renderPreview = useCallback(async (content: string) => {
    try {
      const encoder = new TextEncoder();
      const buffer = encoder.encode(content).buffer as ArrayBuffer;
      const model = await adapter.read(buffer, fileName);
      const renderedHtml = await adapter.renderToHtml(model, {
        darkMode: isDark,
        maxWidth: '100%',
      });
      setHtml(renderedHtml);
    } catch (e) {
      console.error('渲染失败', e);
    }
  }, [fileName, isDark]);

  /** 切换预览/编辑模式 */
  const toggleMode = useCallback(() => {
    if (mode === 'preview') {
      // 进入编辑模式：同步内容
      setEditContent(rawContent);
      setMode('edit');
      Animated.parallel([
        Animated.timing(previewOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(editOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      // 回到预览模式：先保存再渲染
      const newContent = editContent;
      // 清除自动保存定时器
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      handleSave(newContent).then(() => {
        setMode('preview');
        renderPreview(newContent);
        Animated.parallel([
          Animated.timing(previewOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(editOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
      });
    }
  }, [mode, editContent, rawContent, handleSave, renderPreview]);

  /** 初始加载文件 */
  const loadFile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      setRawContent(content);
      setEditContent(content);
      lastAutoSavedRef.current = content;
      await renderPreview(content);
    } catch (e) {
      console.error('加载文件失败', e);
      setError('无法加载文件内容，请检查文件是否存在。');
    } finally {
      setLoading(false);
    }
  }, [fileUri, renderPreview]);

  useEffect(() => {
    loadFile();
  }, [loadFile]);

  // 当主题变化时重新渲染预览
  useEffect(() => {
    if (mode === 'preview' && rawContent) {
      renderPreview(rawContent);
    }
  }, [isDark]);

  /** 在文本中查找某位置所在行的起始位置 */
  const findLineStart = (text: string, pos: number): number => {
    if (pos <= 0) return 0;
    const before = text.lastIndexOf('\n', pos - 1);
    return before === -1 ? 0 : before + 1;
  };

  /** 在文本中查找某位置所在行的结束位置 */
  const findLineEnd = (text: string, pos: number): number => {
    const after = text.indexOf('\n', pos);
    return after === -1 ? text.length : after;
  };

  /** 格式工具栏操作 —— 选区包裹/光标插入 */
  const handleFormat = useCallback((action: FormatAction) => {
    // 预览模式下点击格式按钮：先切到编辑模式，延迟执行格式化
    if (mode === 'preview') {
      setEditContent(rawContent);
      setMode('edit');
      Animated.parallel([
        Animated.timing(previewOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(editOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      // 等切换动画完成后再执行格式化
      setTimeout(() => {
        applyFormat(rawContent, action, { start: rawContent.length, end: rawContent.length });
      }, 250);
      return;
    }

    applyFormat(editContent, action, selectionRef.current);
  }, [mode, editContent, rawContent]);

  /** 实际执行格式化的核心逻辑 */
  const applyFormat = useCallback((text: string, action: FormatAction, sel: { start: number; end: number }) => {
    const { start, end } = sel;
    const hasSelection = start !== end;
    const selText = text.slice(start, end);

    let newText = text;
    let cursorPos = start;

    const lineStart = findLineStart(text, start);
    const lineEnd = findLineEnd(text, start);
    const currentLine = text.slice(lineStart, lineEnd);

    switch (action) {
      case 'bold':
        if (hasSelection) {
          newText = text.slice(0, start) + '**' + selText + '**' + text.slice(end);
          cursorPos = start + selText.length + 4;
        } else {
          newText = text.slice(0, start) + '**加粗文字**' + text.slice(end);
          cursorPos = start + 7;
        }
        break;

      case 'italic':
        if (hasSelection) {
          newText = text.slice(0, start) + '*' + selText + '*' + text.slice(end);
          cursorPos = start + selText.length + 2;
        } else {
          newText = text.slice(0, start) + '*斜体文字*' + text.slice(end);
          cursorPos = start + 6;
        }
        break;

      case 'strikethrough':
        if (hasSelection) {
          newText = text.slice(0, start) + '~~' + selText + '~~' + text.slice(end);
          cursorPos = start + selText.length + 4;
        } else {
          newText = text.slice(0, start) + '~~删除线文字~~' + text.slice(end);
          cursorPos = start + 8;
        }
        break;

      case 'h1':
        newText = text.slice(0, lineStart) + '# ' + currentLine + text.slice(lineEnd);
        cursorPos = start + 2;
        break;

      case 'h2':
        newText = text.slice(0, lineStart) + '## ' + currentLine + text.slice(lineEnd);
        cursorPos = start + 3;
        break;

      case 'h3':
        newText = text.slice(0, lineStart) + '### ' + currentLine + text.slice(lineEnd);
        cursorPos = start + 4;
        break;

      case 'ul':
        newText = text.slice(0, lineStart) + '- ' + currentLine + text.slice(lineEnd);
        cursorPos = start + 2;
        break;

      case 'ol':
        newText = text.slice(0, lineStart) + '1. ' + currentLine + text.slice(lineEnd);
        cursorPos = start + 3;
        break;

      case 'blockquote':
        newText = text.slice(0, lineStart) + '> ' + currentLine + text.slice(lineEnd);
        cursorPos = start + 2;
        break;

      case 'codeblock':
        if (hasSelection) {
          newText = text.slice(0, start) + '```\n' + selText + '\n```' + text.slice(end);
          cursorPos = start + selText.length + 8;
        } else {
          newText = text.slice(0, lineStart) + '```\n' + currentLine + '\n```' + text.slice(lineEnd);
          cursorPos = lineStart + 4;
        }
        break;

      case 'link':
        if (hasSelection) {
          newText = text.slice(0, start) + '[' + selText + '](url)' + text.slice(end);
          cursorPos = start + selText.length + 3;
        } else {
          newText = text.slice(0, start) + '[链接文字](url)' + text.slice(end);
          cursorPos = start + 6;
        }
        break;

      case 'image':
        if (hasSelection) {
          newText = text.slice(0, start) + '![' + selText + '](url)' + text.slice(end);
          cursorPos = start + selText.length + 4;
        } else {
          newText = text.slice(0, start) + '![图片描述](url)' + text.slice(end);
          cursorPos = start + 7;
        }
        break;
    }

    setEditContent(newText);
    setSaveStatus('unsaved');
    triggerAutoSave(newText);

    // 设置光标位置
    setTimeout(() => {
      inputRef.current?.setNativeProps({
        selection: { start: cursorPos, end: cursorPos },
      });
    }, 0);
  }, [triggerAutoSave]);

  /** 键盘工具栏插入（简单追加，保留兼容） */
  const handleInsert = useCallback((insertText: string) => {
    setEditContent((prev) => {
      const newContent = prev + insertText;
      setSaveStatus('unsaved');
      triggerAutoSave(newContent);
      return newContent;
    });
  }, [triggerAutoSave]);

  /** 编辑内容变化处理 */
  const handleEditChange = useCallback((text: string) => {
    setEditContent(text);
    setSaveStatus('unsaved');
    triggerAutoSave(text);
  }, [triggerAutoSave]);

  // 统计
  const wordCount = editContent.replace(/\s/g, '').length;
  const lineCount = editContent.split('\n').length;

  // 保存状态文字和颜色
  const getSaveStatusInfo = () => {
    switch (saveStatus) {
      case 'saving':
        return { text: '保存中…', color: isDark ? '#58a6ff' : '#0550ae' };
      case 'unsaved':
        return { text: '未保存', color: isDark ? '#d29922' : '#9a6700' };
      case 'saved':
      default:
        return { text: '已保存', color: isDark ? '#3fb950' : '#2da44e' };
    }
  };
  const statusInfo = getSaveStatusInfo();

  if (loading) {
    return (
      <SafeAreaView style={[styles.centered, isDark && styles.centeredDark]}>
        <ActivityIndicator size="large" color={isDark ? '#58a6ff' : '#1a1a2e'} />
        <Text style={[styles.loadingText, isDark && styles.textDark]}>
          加载中...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.centered, isDark && styles.centeredDark]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={[styles.errorText, isDark && styles.textDark]}>{error}</Text>
      </SafeAreaView>
    );
  }

  const editorBg = isDark ? '#0d1117' : '#ffffff';
  const caretColor = isDark ? '#58a6ff' : '#1a1a2e';

  return (
    <View style={[styles.container, { backgroundColor: editorBg }]}>
      {/* 预览模式 */}
      {mode === 'preview' && (
        <Animated.View style={[styles.modeContainer, { opacity: previewOpacity }]}>
          <WebView
            source={{ html }}
            style={styles.webview}
            originWhitelist={['*']}
            javaScriptEnabled={false}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      )}

      {/* 编辑模式 */}
      {mode === 'edit' && (
        <Animated.View style={[styles.modeContainer, { opacity: editOpacity }]}>
          {/* 编辑器区域 */}
          <View style={styles.editorWrapper}>
            <ScrollView
              ref={scrollRef}
              style={styles.editorScrollView}
              keyboardShouldPersistTaps="always"
            >
              <View style={styles.editorInner}>
                {/* 语法高亮背景层 */}
                <MarkdownHighlighter
                  text={editContent}
                  isDark={isDark}
                  fontSize={EDITOR_FONT_SIZE}
                  lineHeight={EDITOR_LINE_HEIGHT}
                />
                {/* 透明 TextInput 覆盖层 */}
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.editorInput,
                    {
                      color: 'transparent',
                      fontFamily: monoFont,
                      fontSize: EDITOR_FONT_SIZE,
                      lineHeight: EDITOR_LINE_HEIGHT,
                    },
                  ]}
                  value={editContent}
                  onChangeText={handleEditChange}
                  onSelectionChange={(e) => {
                    selectionRef.current = e.nativeEvent.selection;
                  }}
                  multiline
                  textAlignVertical="top"
                  scrollEnabled={false}
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  keyboardType="default"
                  caretHidden={false}
                  selectionColor={caretColor}
                  placeholder=""
                  placeholderTextColor="transparent"
                />
              </View>
            </ScrollView>
          </View>

          {/* 键盘工具栏 */}
          <KeyboardToolbar onInsert={handleInsert} isDark={isDark} />

          {/* 统计状态栏 */}
          <View style={[styles.statsBar, { backgroundColor: isDark ? '#161b22' : '#f6f8fa', borderTopColor: isDark ? '#30363d' : '#d0d7de' }]}>
            <Text style={[styles.statsText, { color: isDark ? '#8b949e' : '#57606a' }]}>
              字数: {wordCount}
            </Text>
            <Text style={[styles.statsText, { color: isDark ? '#8b949e' : '#57606a' }]}>
              行数: {lineCount}
            </Text>
            <Text style={[styles.statsText, { color: statusInfo.color, fontWeight: '600' }]}>
              {statusInfo.text}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* 格式工具栏：预览和编辑模式均显示 */}
      <FormatToolbar onFormat={handleFormat} isDark={isDark} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modeContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  // 编辑器
  editorWrapper: {
    flex: 1,
  },
  editorScrollView: {
    flex: 1,
  },
  editorInner: {
    minHeight: '100%',
    padding: 16,
    position: 'relative',
  },
  editorInput: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    textAlignVertical: 'top',
    backgroundColor: 'transparent',
  },
  // Header 按钮
  headerButton: {
    marginRight: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ffffff20',
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // 统计栏
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  statsText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  // 通用
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  centeredDark: {
    backgroundColor: '#0d1117',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },
  textDark: {
    color: '#8b949e',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default PreviewScreen;
