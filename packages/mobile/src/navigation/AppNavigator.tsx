import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import FileListScreen from '../screens/FileListScreen';
import PreviewScreen from '../screens/PreviewScreen';

export type RootStackParamList = {
  Home: undefined;
  FileList: undefined;
  Preview: { fileUri: string; fileName: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#fff',
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
    </Stack.Navigator>
  );
}
