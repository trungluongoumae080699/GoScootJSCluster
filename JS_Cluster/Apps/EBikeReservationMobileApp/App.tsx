/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';
import { MobileAppBike } from '@trungthao/mobile_app_dto';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import EntryScreen from './src/Screens/Entry';
import LogInScreen from './src/Screens/LogIn';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapView from './src/Screens/MapView';
import TripDetail from './src/Screens/TripDetail';
import ForgetPassword from './src/Screens/ForgetPassword';
import SignUp from './src/Screens/SignUp';
import MyTrip from './src/Screens/MyTrip';
import { AppProvider } from './src/Components/Context/GlobalContext';




function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const Stack = createNativeStackNavigator();
  const Tab = createBottomTabNavigator();

  function MainTabs() {
    return (
      <Tab.Navigator initialRouteName='MapView'>
        <Tab.Screen name="Map" component={MapView} />
        <Tab.Screen name="MyTrips" component={MyTrip} />
      </Tab.Navigator>
    );

  }
  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName='Entry'>
          <Stack.Screen name='Entry' component={EntryScreen} options={{ headerShown: false }}  />
          <Stack.Screen name="LogIn" component={LogInScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ForgetPassword" component={ForgetPassword} options={{ headerShown: false }} />
          <Stack.Screen name="SignUp" component={SignUp} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>

  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <NewAppScreen
        templateFileName="App.tsx"
        safeAreaInsets={safeAreaInsets}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
