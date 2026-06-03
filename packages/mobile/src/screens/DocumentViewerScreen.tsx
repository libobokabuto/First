import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { DocxAdapter, wrapDocxHtml } from '../adapters/DocxAdapter';
import { XlsxAdapter, wrapXlsxHtml } from '../adapters/XlsxAdapter';
import { useSettingsStore, ThemeMode } from '../store/settingsStore';

type Props = NativeStackScreenProps<RootStackParamList, 'DocumentViewer'>;

/** 支持的文件扩展名及对应适配器类型 */
type ViewerType = 'pdf' | 'docx' | 'xlsx' | 'csv' | 'unsupported';

/** 根据文件扩展名获取查看器类型 */
function getViewerType(fileName: string): ViewerType {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'docx':
    case 'doc':
      return 'docx';
    case 'xlsx':
    case 'xls':
    case 'et':
      return 'xlsx';
    case 'csv':
      return 'csv';
    default:
      return 'unsupported';
  }
}

/** 支持的文件扩展名列表 */
export const SUPPORTED_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.doc',
  '.xlsx',
  '.xls',
  '.et',
  '.csv',
];

/** 根据用户设置和系统颜色方案计算是否为暗色模式 */
function resolveIsDark(userTheme: ThemeMode, systemIsDark: boolean): boolean {
  if (userTheme === 'dark') return true;
  if (userTheme === 'light') return false;
  return systemIsDark;
}

const docxAdapter = new DocxAdapter();
const xlsxAdapter = new XlsxAdapter();

const DocumentViewerScreen: React.FC<Props> = ({ route }) => {
  const { fileUri, fileName } = route.params;
  const colorScheme = useColorScheme();
  const systemIsDark = colorScheme === 'dark';
  const { theme: userTheme } = useSettingsStore();
  const isDark = resolveIsDark(userTheme, systemIsDark);

  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerType, setViewerType] = useState<ViewerType>('unsupported');

  const loadDocument = useCallback(async () => {
    setLoading(true);
    setError(null);

    const type = getViewerType(fileName);
    setViewerType(type);

    try {
      switch (type) {
        case 'pdf':
          // PDF 直接通过 WebView 加载
          setHtml('');
          break;

        case 'docx': {
          const rawHtml = await docxAdapter.convertToHtml(fileUri);
          setHtml(wrapDocxHtml(rawHtml, isDark));
          break;
        }

        case 'xlsx':
        case 'csv': {
          const rawHtml = await xlsxAdapter.convertToHtml(fileUri, fileName);
          setHtml(wrapXlsxHtml(rawHtml, isDark));
          break;
        }

        default:
          setError(`暂不支持 ".${fileName.split('.').pop()}" 格式的预览`);
      }
    } catch (e) {
      console.error('加载文档失败', e);
      setError('无法加载文档，文件可能已损坏或格式不正确。');
    } finally {
      setLoading(false);
    }
  }, [fileUri, fileName, isDark]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const formatLabel = getFormatLabel(fileName);

  if (loading) {
    return (
      <SafeAreaView style={[styles.centered, isDark && styles.centeredDark]}>
        <ActivityIndicator size="large" color={isDark ? '#58a6ff' : '#1a1a2e'} />
        <Text style={[styles.loadingText, isDark && styles.textDark]}>
          正在加载 {formatLabel} 文档...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.centered, isDark && styles.centeredDark]}>
        <Text style={styles.errorIcon}>
          {viewerType === 'unsupported' ? '📄' : '⚠️'}
        </Text>
        <Text style={[styles.errorText, isDark && styles.textDark]}>{error}</Text>
        {viewerType === 'unsupported' && (
          <Text style={[styles.hintText, isDark && styles.textDarkLight]}>
            当前支持：PDF、DOCX、XLSX、CSV、ET
          </Text>
        )}
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0d1117' : '#ffffff' }]}>
      {viewerType === 'pdf' ? (
        <WebView
          source={{ uri: fileUri }}
          style={styles.webview}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          allowFileAccessFromFileURLs={true}
          mixedContentMode="always"
        />
      ) : (
        <WebView
          source={{ html }}
          style={styles.webview}
          originWhitelist={['*']}
          javaScriptEnabled={false}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

/** 获取文件格式标签 */
export function getFormatLabel(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  switch (ext) {
    case 'pdf':
      return 'PDF';
    case 'docx':
    case 'doc':
      return 'DOCX';
    case 'xlsx':
    case 'xls':
    case 'et':
      return 'XLSX';
    case 'csv':
      return 'CSV';
    default:
      return ext.toUpperCase();
  }
}

/** 获取文件图标文本 */
export function getFileIconLabel(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  switch (ext) {
    case 'pdf':
      return 'PDF';
    case 'docx':
    case 'doc':
      return 'DOC';
    case 'xlsx':
    case 'xls':
    case 'et':
      return 'XLS';
    case 'csv':
      return 'CSV';
    case 'md':
      return 'MD';
    default:
      return ext.slice(0, 2).toUpperCase();
  }
}

/** 获取文件图标背景色 */
export function getFileIconColor(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  switch (ext) {
    case 'pdf':
      return '#e74c3c';
    case 'docx':
    case 'doc':
      return '#2b579a';
    case 'xlsx':
    case 'xls':
    case 'et':
      return '#217346';
    case 'csv':
      return '#217346';
    case 'md':
      return '#1a1a2e';
    default:
      return '#666';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
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
  textDarkLight: {
    color: '#6e7681',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 13,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default DocumentViewerScreen;
