import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MarkdownAdapter } from '@docket/shared';
import type { RootStackParamList } from '../navigation/AppNavigator';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavProp>();
  const adapter = new MarkdownAdapter();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>DocKit</Text>
        <Text style={styles.subtitle}>全能文档阅读编辑器</Text>

        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => navigation.navigate('FileList')}
        >
          <Text style={styles.mainButtonText}>开始使用</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.settingsButtonText}>⚙ 设置</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  mainButton: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  mainButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  settingsButton: {
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f5',
  },
  settingsButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
});

export default HomeScreen;
