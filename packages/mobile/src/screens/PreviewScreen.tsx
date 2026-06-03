import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { MarkdownAdapter } from '@docket/shared';

type Props = NativeStackScreenProps<RootStackParamList, 'Preview'>;

const adapter = new MarkdownAdapter();

const PreviewScreen: React.FC<Props> = ({ route }) => {
  const { fileUri, fileName } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAndRender = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const encoder = new TextEncoder();
      const buffer = encoder.encode(content).buffer as ArrayBuffer;
      const model = await adapter.read(buffer, fileName);
      const renderedHtml = await adapter.renderToHtml(model, {
        darkMode: isDark,
        maxWidth: '100%',
      });
      setHtml(renderedHtml);
    } catch (e) {
      console.error('加载文件失败', e);
      setError('无法加载文件内容，请检查文件是否存在。');
    } finally {
      setLoading(false);
    }
  }, [fileUri, fileName, isDark]);

  useEffect(() => {
    loadAndRender();
  }, [loadAndRender]);

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

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled={false}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

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
