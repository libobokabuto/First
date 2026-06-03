import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore, ThemeMode } from '../store/settingsStore';

interface ThemeOption {
  value: ThemeMode;
  label: string;
  description: string;
}

const themeOptions: ThemeOption[] = [
  { value: 'light', label: '☀️ 亮色', description: '始终使用亮色主题' },
  { value: 'dark', label: '🌙 暗色', description: '始终使用暗色主题' },
  { value: 'system', label: '📱 跟随系统', description: '根据系统设置自动切换' },
];

const SettingsScreen: React.FC = () => {
  const { theme, setTheme } = useSettingsStore();

  const isDark = useMemo(() => {
    return theme === 'dark';
  }, [theme]);

  const bg = isDark ? '#0d1117' : '#f5f5f5';
  const cardBg = isDark ? '#161b22' : '#ffffff';
  const textColor = isDark ? '#c9d1d9' : '#1a1a2e';
  const subTextColor = isDark ? '#8b949e' : '#666';
  const borderColor = isDark ? '#30363d' : '#e0e0e0';
  const activeBg = isDark ? '#1f6feb' : '#1a1a2e';
  const activeText = '#ffffff';
  const sectionTitleColor = isDark ? '#8b949e' : '#999';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 主题设置 */}
        <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
          外观
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionRow,
                themeOptions.indexOf(option) < themeOptions.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: borderColor,
                },
              ]}
              onPress={() => setTheme(option.value)}
              activeOpacity={0.6}
            >
              <View style={styles.optionInfo}>
                <Text style={[styles.optionLabel, { color: textColor }]}>
                  {option.label}
                </Text>
                <Text style={[styles.optionDesc, { color: subTextColor }]}>
                  {option.description}
                </Text>
              </View>
              <View
                style={[
                  styles.radio,
                  { borderColor: theme === option.value ? activeBg : borderColor },
                  theme === option.value && { backgroundColor: activeBg },
                ]}
              >
                {theme === option.value && (
                  <Text style={[styles.radioDot, { color: activeText }]}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 关于 */}
        <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
          关于
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: textColor }]}>应用名称</Text>
            <Text style={[styles.aboutValue, { color: subTextColor }]}>DocKit</Text>
          </View>
          <View style={[styles.aboutDivider, { backgroundColor: borderColor }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: textColor }]}>版本</Text>
            <Text style={[styles.aboutValue, { color: subTextColor }]}>0.1.0</Text>
          </View>
          <View style={[styles.aboutDivider, { backgroundColor: borderColor }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: textColor }]}>技术栈</Text>
            <Text style={[styles.aboutValue, { color: subTextColor }]}>Expo + React Native</Text>
          </View>
          <View style={[styles.aboutDivider, { backgroundColor: borderColor }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: textColor }]}>描述</Text>
            <Text style={[styles.aboutValue, { color: subTextColor }]}>
              全能文档阅读编辑器
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 20,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioDot: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  aboutDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  aboutLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  aboutValue: {
    fontSize: 14,
  },
});

export default SettingsScreen;
