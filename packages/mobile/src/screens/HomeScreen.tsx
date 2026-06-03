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
  const adapterInfo = `${adapter.name} (${adapter.extensions.join(', ')})`;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>DocKit</Text>
        <Text style={styles.subtitle}>全能文档阅读编辑器</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>已加载适配器</Text>
          <Text style={styles.infoValue}>{adapterInfo}</Text>
        </View>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('FileList')}
        >
          <Text style={styles.startButtonText}>开始使用</Text>
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
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  startButton: {
    marginTop: 24,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 10,
  },
  startButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
});

export default HomeScreen;
