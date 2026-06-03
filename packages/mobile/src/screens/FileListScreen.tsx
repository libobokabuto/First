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
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useFileStore } from '../store/fileStore';

interface FileItem {
  uri: string;
  name: string;
  size?: number;
}

type TabType = 'recent' | 'browse';

const FileListScreen: React.FC = () => {
  const { recentFiles, addRecentFile, removeRecentFile } = useFileStore();
  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [browseFiles, setBrowseFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newFileModalVisible, setNewFileModalVisible] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const scanMdFiles = useCallback(async () => {
    setLoading(true);
    try {
      const docDir = FileSystem.documentDirectory;
      if (!docDir) return;

      const items = await FileSystem.readDirectoryAsync(docDir);
      const mdFiles: FileItem[] = [];

      for (const name of items) {
        if (name.endsWith('.md')) {
          const uri = docDir + name;
          try {
            const info = await FileSystem.getInfoAsync(uri, { size: true });
            if (info.exists) {
              mdFiles.push({
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

      mdFiles.sort((a, b) => a.name.localeCompare(b.name));
      setBrowseFiles(mdFiles);
    } catch (e) {
      console.error('扫描文件失败', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 首次加载时扫描
  React.useEffect(() => {
    scanMdFiles();
  }, [scanMdFiles]);

  const handlePickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/markdown', 'text/*', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const file = result.assets[0];
        addRecentFile({ uri: file.uri, name: file.name });
      }
    } catch (e) {
      Alert.alert('错误', '打开文件失败');
    }
  }, [addRecentFile]);

  const handleOpenFile = useCallback(
    (file: { uri: string; name: string }) => {
      addRecentFile(file);
      // TODO: 任务3中导航到预览页面
      Alert.alert('打开文件', `即将打开: ${file.name}`);
    },
    [addRecentFile]
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
      scanMdFiles();
      Alert.alert('成功', `已创建 ${fileName}`);
    } catch (e) {
      Alert.alert('错误', '创建文件失败');
    }
  }, [newFileName, addRecentFile, scanMdFiles]);

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

  const renderBrowseItem = ({ item }: { item: FileItem }) => (
    <TouchableOpacity
      style={styles.fileItem}
      onPress={() => handleOpenFile(item)}
    >
      <View style={styles.fileIcon}>
        <Text style={styles.fileIconText}>MD</Text>
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName}>{item.name}</Text>
        <Text style={styles.fileMeta}>{formatFileSize(item.size)}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  const renderRecentItem = ({ item }: { item: { uri: string; name: string; lastOpened: number } }) => (
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
      <View style={styles.fileIcon}>
        <Text style={styles.fileIconText}>MD</Text>
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName}>{item.name}</Text>
        <Text style={styles.fileMeta}>{formatTime(item.lastOpened)}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

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
        <TouchableOpacity style={styles.toolButton} onPress={scanMdFiles}>
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
              <RefreshControl refreshing={loading} onRefresh={scanMdFiles} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📄</Text>
                <Text style={styles.emptyText}>没有找到 .md 文件</Text>
                <Text style={styles.emptyHint}>
                  点击「选择文件」选择已有文件，或「新建」创建一个
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
