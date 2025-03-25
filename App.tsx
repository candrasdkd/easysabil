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
import CategoryOrderScreen from './src/features/categoryOrder';
import ListOrderScreen from './src/features/listOrder';

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
  const OrderStack = () => {
    return (
      <Stack.Navigator>
        <Stack.Screen name="CategoryOrder" component={CategoryOrderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ListOrder" component={ListOrderScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    );
  };

  return (
    <PaperProvider>
      <NavigationContainer theme={DarkTheme}>
        <Drawer.Navigator
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
            name="Order"
            component={ListOrderScreen}
            options={{ title: 'Daftar Pesanan' }}
          />
          <Drawer.Screen
            name="Category"
            component={CategoryOrderScreen}
            options={{ title: 'Kategori Pesanan' }}
          />
        </Drawer.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

export default App;
