import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSettingsStore } from '../store/settingsStore';
import HomeScreen from '../screens/HomeScreen';
import FileListScreen from '../screens/FileListScreen';
import PreviewScreen from '../screens/PreviewScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootStackParamList = {
  Home: undefined;
  FileList: undefined;
  Preview: { fileUri: string; fileName: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { theme } = useSettingsStore();

  const headerBg = '#1a1a2e';
  const headerTint = '#fff';

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: headerBg },
        headerTintColor: headerTint,
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'DocKit' }}
      />
      <Stack.Screen
        name="FileList"
        component={FileListScreen}
        options={{ title: '文件浏览' }}
      />
      <Stack.Screen
        name="Preview"
        component={PreviewScreen}
        options={({ route }) => ({
          title: route.params.fileName,
        })}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: '设置' }}
      />
    </Stack.Navigator>
  );
}
