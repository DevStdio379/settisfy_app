import 'react-native-gesture-handler';
import Route from './app/navigation/Route';
import { StripeProvider } from '@stripe/stripe-react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Alert, LogBox, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { UserProvider } from './app/context/UserContext';
import { Provider } from 'react-redux';
import { store } from './app/redux/store';

LogBox.ignoreLogs([
  'You are initializing Firebase Auth for React Native without providing',
]);

export default function App() {
  const requestLocationPermission = async () => {
    const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

    const result = await check(permission);
    if (result === RESULTS.DENIED) {
      const requestResult = await request(permission);
      if (requestResult === RESULTS.GRANTED) {
      } else {
        // Alert.alert("Permission Denied", "Location permission is required to use this feature");
      }
    } else if (result === RESULTS.GRANTED) {
      // Alert.alert("Permission Granted", "Location permission is already granted");
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StripeProvider
        publishableKey="pk_test_51Q87cAGEbMZg2VhUeP5msjeJkRg0Rp0qOG9rmvYZh2jaNOZXQUzT6svOg1H6ZixSJUa3mrnA9xnjnt2CpuoymZfl004PdjQOgW"
        merchantIdentifier="merchant.identifier" // required for Apple Pay
        urlScheme="your-url-scheme" // required for 3D Secure and bank redirects
      >
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1 }}>
            <Provider store={store}>
              <UserProvider>
                <Route />
              </UserProvider>
            </Provider>
          </SafeAreaView>
        </SafeAreaProvider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}
