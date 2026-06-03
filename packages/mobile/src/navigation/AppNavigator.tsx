import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import FileListScreen from '../screens/FileListScreen';

export type RootStackParamList = {
  Home: undefined;
  FileList: undefined;
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
    </Stack.Navigator>
  );
}
