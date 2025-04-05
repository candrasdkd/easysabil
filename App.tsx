/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from './src/features/home';
import SensusScreen from './src/features/sensus';
import 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import CreateUserScreen from './src/features/createUser';
import UpdateUserScreen from './src/features/updateUser';
import OrderCategoryScreen from './src/features/orderCategory';
import OrderListScreen from './src/features/orderList';
import OrderCalculatorScreen from './src/features/orderCalculator';
import FamilyListScreen from './src/features/familyList';
import SplashScreen from './src/features/splash';
import CustomDrawerContent from './src/components/CustomDrawerContent';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function App(): React.JSX.Element {
  const SensusStack = () => {
    return (
      <Stack.Navigator>
        <Stack.Screen name="ListSensus" component={SensusScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreateUser" component={CreateUserScreen} options={{ headerShown: false }} />
        <Stack.Screen name="UpdateUser" component={UpdateUserScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    );
  };

  const MainApp = () => {
    return (
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: '#121212' },
          headerTintColor: '#fff',
          drawerStyle: { backgroundColor: '#121212' },
          drawerActiveTintColor: '#fff',
          drawerInactiveTintColor: '#aaa',
          drawerLabelStyle: { fontSize: 16 },
        }}
      >
        <Drawer.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Dashboard' }}
        />
        <Drawer.Screen
          name="Sensus"
          component={SensusStack}
          options={{ title: 'Data Sensus' }}
        />
        <Drawer.Screen
          name="ListOrder"
          component={OrderListScreen}
          options={{ title: 'Daftar Pesanan' }}
        />
        <Drawer.Screen
          name="CategoryOrder"
          component={OrderCategoryScreen}
          options={{ title: 'Kategori Pesanan' }}
        />
        <Drawer.Screen
          name="ListFamily"
          component={FamilyListScreen}
          options={{ title: 'Daftar Keluarga' }}
        />
        <Drawer.Screen
          name="OrderCalculator"
          component={OrderCalculatorScreen}
          options={{ title: 'Kalkulator Pesanan' }}
        />
      </Drawer.Navigator>
    );
  };

  return (
    <PaperProvider>
      <NavigationContainer theme={DarkTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="MainApp" component={MainApp} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

export default App;
