import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';

interface Props {
  onInsert: (text: string) => void;
  isDark: boolean;
}

interface ToolItem {
  label: string;
  insert: string;
  description: string;
}

const tools: ToolItem[] = [
  { label: '#', insert: '# ', description: '标题1' },
  { label: '##', insert: '## ', description: '标题2' },
  { label: '###', insert: '### ', description: '标题3' },
  { label: 'B', insert: '****', description: '加粗' },
  { label: 'I', insert: '**', description: '斜体' },
  { label: '~', insert: '~~~~', description: '删除线' },
  { label: '`', insert: '``', description: '代码' },
  { label: '```', insert: '```\n\n```', description: '代码块' },
  { label: '-', insert: '- ', description: '无序列表' },
  { label: '1.', insert: '1. ', description: '有序列表' },
  { label: '[ ]', insert: '- [ ] ', description: '任务列表' },
  { label: '>', insert: '> ', description: '引用' },
  { label: '[]()', insert: '[]()', description: '链接' },
  { label: '![]()', insert: '![]()', description: '图片' },
  { label: '---', insert: '\n---\n', description: '分割线' },
  { label: '|', insert: '|  |  |\n|--|--|\n|  |  |', description: '表格' },
];

const KeyboardToolbar: React.FC<Props> = ({ onInsert, isDark }) => {
  const bgColor = isDark ? '#161b22' : '#f0f0f5';
  const borderColor = isDark ? '#30363d' : '#e0e0e0';
  const btnBg = isDark ? '#21262d' : '#e8e8ed';
  const textColor = isDark ? '#c9d1d9' : '#333';

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderTopColor: borderColor }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
      >
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.label}
            style={[styles.button, { backgroundColor: btnBg }]}
            onPress={() => onInsert(tool.insert)}
            activeOpacity={0.6}
          >
            <Text style={[styles.buttonText, { color: textColor }]}>
              {tool.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingVertical: 6,
    paddingLeft: 4,
  },
  scrollContent: {
    paddingHorizontal: 8,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 32,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
});

export default KeyboardToolbar;
