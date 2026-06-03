import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useFileStore } from '../store/fileStore';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getFileIconLabel, getFileIconColor, getFormatLabel } from './DocumentViewerScreen';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FileList'>;

/** 所有支持的文件扩展名 */
const SUPPORTED_EXTS = ['.md', '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.et', '.csv'];

/** 判断文件是否为 MD 格式 */
const isMdFile = (name: string) => name.toLowerCase().endsWith('.md');

/** 判断文件是否为支持的其他格式 */
const isSupportedFile = (name: string) => {
  const lower = name.toLowerCase();
  return SUPPORTED_EXTS.some((ext) => lower.endsWith(ext));
};

interface FileItem {
  uri: string;
  name: string;
  size?: number;
}

type TabType = 'recent' | 'browse';

const FileListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { recentFiles, addRecentFile, removeRecentFile } = useFileStore();
  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [browseFiles, setBrowseFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newFileModalVisible, setNewFileModalVisible] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const scanAllFiles = useCallback(async () => {
    setLoading(true);
    try {
      const docDir = FileSystem.documentDirectory;
      if (!docDir) return;

      const items = await FileSystem.readDirectoryAsync(docDir);
      const supportedFiles: FileItem[] = [];

      for (const name of items) {
        if (isSupportedFile(name)) {
          const uri = docDir + name;
          try {
            const info = await FileSystem.getInfoAsync(uri, { size: true });
            if (info.exists) {
              supportedFiles.push({
                uri,
                name,
                size: (info as FileSystem.FileInfo & { size?: number }).size,
              });
            }
          } catch {
            // 跳过无法读取的文件
          }
        }
      }

      supportedFiles.sort((a, b) => a.name.localeCompare(b.name));
      setBrowseFiles(supportedFiles);
    } catch (e) {
      console.error('扫描文件失败', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 首次加载时扫描
  React.useEffect(() => {
    scanAllFiles();
  }, [scanAllFiles]);

  const handlePickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/markdown',
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
          'text/comma-separated-values',
          'text/*',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const file = result.assets[0];
        addRecentFile({ uri: file.uri, name: file.name });
        if (isMdFile(file.name)) {
          navigation.navigate('Preview', {
            fileUri: file.uri,
            fileName: file.name,
          });
        } else {
          navigation.navigate('DocumentViewer', {
            fileUri: file.uri,
            fileName: file.name,
          });
        }
      }
    } catch (e) {
      Alert.alert('错误', '打开文件失败');
    }
  }, [addRecentFile, navigation]);

  const handleOpenFile = useCallback(
    (file: { uri: string; name: string }) => {
      addRecentFile(file);
      if (isMdFile(file.name)) {
        navigation.navigate('Preview', {
          fileUri: file.uri,
          fileName: file.name,
        });
      } else {
        navigation.navigate('DocumentViewer', {
          fileUri: file.uri,
          fileName: file.name,
        });
      }
    },
    [addRecentFile, navigation]
  );

  const handleCreateFile = useCallback(async () => {
    const name = newFileName.trim();
    if (!name) {
      Alert.alert('提示', '请输入文件名');
      return;
    }

    const fileName = name.endsWith('.md') ? name : `${name}.md`;
    const docDir = FileSystem.documentDirectory;
    if (!docDir) return;

    const uri = docDir + fileName;
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        Alert.alert('提示', '文件已存在');
        return;
      }

      await FileSystem.writeAsStringAsync(uri, '');
      setNewFileName('');
      setNewFileModalVisible(false);
      const createdFile = { uri, name: fileName };
      addRecentFile(createdFile);
      scanAllFiles();
      navigation.navigate('Preview', {
        fileUri: uri,
        fileName,
      });
    } catch (e) {
      Alert.alert('错误', '创建文件失败');
    }
  }, [newFileName, addRecentFile, scanAllFiles, navigation]);

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} 小时前`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} 天前`;
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const renderBrowseItem = ({ item }: { item: FileItem }) => {
    const iconLabel = getFileIconLabel(item.name);
    const iconColor = getFileIconColor(item.name);
    return (
    <TouchableOpacity
      style={styles.fileItem}
      onPress={() => handleOpenFile(item)}
    >
      <View style={[styles.fileIcon, { backgroundColor: iconColor }]}>
        <Text style={styles.fileIconText}>{iconLabel}</Text>
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName}>{item.name}</Text>
        <Text style={styles.fileMeta}>
          {getFormatLabel(item.name)}  {formatFileSize(item.size)}
        </Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
    );
  };

  const renderRecentItem = ({ item }: { item: { uri: string; name: string; lastOpened: number } }) => {
    const iconLabel = getFileIconLabel(item.name);
    const iconColor = getFileIconColor(item.name);
    return (
    <TouchableOpacity
      style={styles.fileItem}
      onPress={() => handleOpenFile(item)}
      onLongPress={() => {
        Alert.alert('移除', `确定要从最近列表中移除 "${item.name}" 吗？`, [
          { text: '取消', style: 'cancel' },
          {
            text: '移除',
            style: 'destructive',
            onPress: () => removeRecentFile(item.uri),
          },
        ]);
      }}
    >
      <View style={[styles.fileIcon, { backgroundColor: iconColor }]}>
        <Text style={styles.fileIconText}>{iconLabel}</Text>
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName}>{item.name}</Text>
        <Text style={styles.fileMeta}>
          {getFormatLabel(item.name)}  {formatTime(item.lastOpened)}
        </Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab 切换 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'browse' && styles.tabActive]}
          onPress={() => setActiveTab('browse')}
        >
          <Text style={[styles.tabText, activeTab === 'browse' && styles.tabTextActive]}>
            浏览文件
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recent' && styles.tabActive]}
          onPress={() => setActiveTab('recent')}
        >
          <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}>
            最近打开
          </Text>
        </TouchableOpacity>
      </View>

      {/* 工具栏 */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolButton} onPress={handlePickFile}>
          <Text style={styles.toolButtonText}>📂 选择文件</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolButton}
          onPress={() => setNewFileModalVisible(true)}
        >
          <Text style={styles.toolButtonText}>＋ 新建</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={scanAllFiles}>
          <Text style={styles.toolButtonText}>🔄 刷新</Text>
        </TouchableOpacity>
      </View>

      {/* 文件列表 */}
      {activeTab === 'browse' ? (
        loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1a1a2e" />
            <Text style={styles.loadingText}>扫描文件中...</Text>
          </View>
        ) : (
          <FlatList
            data={browseFiles}
            keyExtractor={(item) => item.uri}
            renderItem={renderBrowseItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={scanAllFiles} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📄</Text>
                <Text style={styles.emptyText}>没有找到支持的文档文件</Text>
                <Text style={styles.emptyHint}>
                  支持 .md .pdf .docx .xlsx .csv 等格式{'\n'}
                  点击「选择文件」或「新建」开始使用
                </Text>
              </View>
            }
          />
        )
      ) : (
        <FlatList
          data={recentFiles}
          keyExtractor={(item) => item.uri}
          renderItem={renderRecentItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyText}>最近没有打开文件</Text>
            </View>
          }
        />
      )}

      {/* 新建文件 Modal */}
      <Modal visible={newFileModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>新建 MD 文件</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="输入文件名（如 notes）"
              placeholderTextColor="#999"
              value={newFileName}
              onChangeText={setNewFileName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setNewFileName('');
                  setNewFileModalVisible(false);
                }}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleCreateFile}
              >
                <Text style={styles.modalConfirmText}>创建</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1a1a2e',
  },
  tabText: {
    fontSize: 15,
    color: '#999',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#1a1a2e',
    fontWeight: '700',
  },
  toolbar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  toolButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#f0f0f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  toolButtonText: {
    fontSize: 13,
    color: '#1a1a2e',
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 8,
    padding: 14,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileIconText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    color: '#1a1a2e',
    fontWeight: '600',
  },
  fileMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  arrow: {
    fontSize: 22,
    color: '#ccc',
    marginLeft: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    width: '85%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f0f0f5',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});

export default FileListScreen;
