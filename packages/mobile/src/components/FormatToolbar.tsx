import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';

export type FormatAction =
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'ul'
  | 'ol'
  | 'blockquote'
  | 'codeblock'
  | 'link'
  | 'image';

interface FormatButton {
  action: FormatAction;
  label: string;
  description: string;
}

const formatButtons: FormatButton[] = [
  { action: 'bold', label: 'B', description: '加粗' },
  { action: 'italic', label: 'I', description: '斜体' },
  { action: 'strikethrough', label: 'S', description: '删除线' },
  { action: 'h1', label: 'H1', description: '标题1' },
  { action: 'h2', label: 'H2', description: '标题2' },
  { action: 'h3', label: 'H3', description: '标题3' },
  { action: 'ul', label: '•', description: '无序列表' },
  { action: 'ol', label: '1.', description: '有序列表' },
  { action: 'blockquote', label: '"', description: '引用块' },
  { action: 'codeblock', label: '</>', description: '代码块' },
  { action: 'link', label: '🔗', description: '链接' },
  { action: 'image', label: '🖼', description: '图片' },
];

interface Props {
  onFormat: (action: FormatAction) => void;
  isDark: boolean;
}

const FormatToolbar: React.FC<Props> = ({ onFormat, isDark }) => {
  const [collapsed, setCollapsed] = useState(true);
  const animHeight = useRef(new Animated.Value(0)).current;

  const toggleCollapse = () => {
    if (collapsed) {
      setCollapsed(false);
      Animated.timing(animHeight, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(animHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setCollapsed(true));
    }
  };

  const bgColor = isDark ? '#161b22' : '#f0f0f5';
  const borderColor = isDark ? '#30363d' : '#e0e0e0';
  const btnBg = isDark ? '#21262d' : '#e8e8ed';
  const textColor = isDark ? '#c9d1d9' : '#333';
  const activeBtnBg = isDark ? '#1f6feb' : '#1a1a2e';
  const activeTextColor = '#ffffff';
  const toggleBg = isDark ? '#0d1117' : '#e0e0e5';
  const toggleTextColor = isDark ? '#8b949e' : '#666';

  const maxGridHeight = animHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  return (
    <View style={[styles.wrapper, { backgroundColor: bgColor, borderTopColor: borderColor }]}>
      {/* 收起/展开切换条 */}
      <TouchableOpacity
        style={[styles.toggleBar, { backgroundColor: toggleBg }]}
        onPress={toggleCollapse}
        activeOpacity={0.7}
      >
        <Text style={[styles.toggleText, { color: toggleTextColor }]}>
          格式工具栏
        </Text>
        <Text style={[styles.toggleArrow, { color: toggleTextColor }]}>
          {collapsed ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {/* 按钮网格 */}
      {!collapsed && (
        <Animated.View style={[styles.gridWrapper, { maxHeight: maxGridHeight, opacity: animHeight }]}>
          <ScrollView
            horizontal={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContent}
          >
            <View style={styles.grid}>
              {formatButtons.map((btn) => (
                <TouchableOpacity
                  key={btn.action}
                  style={[styles.gridButton, { backgroundColor: btnBg }]}
                  onPress={() => onFormat(btn.action)}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.gridButtonText, { color: textColor }]}>
                    {btn.label}
                  </Text>
                  <Text style={[styles.gridButtonDesc, { color: isDark ? '#8b949e' : '#888' }]}>
                    {btn.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
  },
  toggleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toggleArrow: {
    fontSize: 10,
  },
  gridWrapper: {
    overflow: 'hidden',
  },
  gridContent: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gridButton: {
    width: '30%',
    flexGrow: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  gridButtonText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  gridButtonDesc: {
    fontSize: 10,
    marginTop: 2,
  },
});

export default FormatToolbar;
