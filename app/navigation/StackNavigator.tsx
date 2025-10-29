import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './RootStackParamList';
import { View } from 'react-native';

import OnBoarding from '../screens/Auth/Onboarding';
import SignUp from '../screens/Auth/SignUp';
import SignIn from '../screens/Auth/SignIn';
import MyCalendar from '../screens/ProviderPanel/MyRequests';
import EditAttributes from '../screens/Profile/EditAttributes';
import PersonalDetails from '../screens/Profile/PersonalDetails';
import AddressBook from '../screens/Profile/AddressBook';
import Profile from '../screens/Profile/Profile';
import SearchAddress from '../screens/Profile/SearchAddress';
import AddAddress from '../screens/Profile/AddAddress';
import EditLocationPinPoint from '../screens/Profile/EditLocationPinPoint';
import PaymentInformation from '../screens/Profile/PaymentInformation';
import Products from '../screens/Products/Products';
import ProductDetails from '../screens/Products/ProductDetails';
import MyBorrowingDetails from '../screens/MyBookings/MyBookingDetails';
import LendingDetails from '../screens/ProviderPanel/MyRequestDetails';
import LenderAddReview from '../screens/ProviderPanel/SettlerAddReview';
import MyBorrowings from '../screens/MyBookings/MyBookings';
import Temp from '../screens/Temp';
import Chat from '../screens/Chat/Chat';
import ChatList from '../screens/Chat/ChatList';
import NewChat from '../screens/Chat/NewChat';
import PaymentSuccess from '../screens/Products/PaymentSuccess';
import AddressMapView from '../screens/Profile/AddressMapView';
import BottomNavigation from './BottomNavigation';
import AccountVerification from '../screens/Auth/AccountVerification';
import ProviderDashboard from '../screens/ProviderPanel/ProviderDashboard';
import MyServices from '../screens/ProviderPanel/MyServices';
import MyBookingDetails from '../screens/MyBookings/MyBookingDetails';
import MyBookings from '../screens/MyBookings/MyBookings';
import QuoteService from '../screens/Products/QuoteService';
import BookingAddReview from '../screens/MyBookings/BookingAddReview';
import ServiceCatalogue, { ServiceCatalogueForm } from '../screens/ServiceCatalogueForm';
import SettlerAddReview from '../screens/ProviderPanel/SettlerAddReview';
import SettlerServiceForm from '../screens/ProviderPanel/SettlerServiceForm';
import BookingCancelForm from '../screens/MyBookings/BookingCancelForm';


const StackComponent = createStackNavigator<RootStackParamList>();

const StackNavigator = () => {
	return (
		<View style={{ width: '100%', flex: 1 }}>
			<StackComponent.Navigator
				initialRouteName='BottomNavigation'
				screenOptions={{
					headerShown: false,
					cardStyle: { backgroundColor: "transparent" },
					// cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
				}}
			>
				<StackComponent.Screen name="OnBoarding" component={OnBoarding} />
				<StackComponent.Screen name="SignUp" component={SignUp} />
				<StackComponent.Screen name="SignIn" component={SignIn} />
				<StackComponent.Screen name="AccountVerification" component={AccountVerification} />

				{/* Borrower */}

				<StackComponent.Screen name="BottomNavigation" component={BottomNavigation} />
				<StackComponent.Screen name="Products" component={Products} />
				<StackComponent.Screen name="ProductDetails" component={ProductDetails} />
				<StackComponent.Screen name="MyBookings" component={MyBookings} />
				<StackComponent.Screen name="MyBookingDetails" component={MyBookingDetails} />
				<StackComponent.Screen name="BookingAddReview" component={BookingAddReview} />
				<StackComponent.Screen name="BookingCancelForm" component={BookingCancelForm} />
				<StackComponent.Screen name="Profile" component={Profile} />
				<StackComponent.Screen name="ChatList" component={ChatList} />
				<StackComponent.Screen name="NewChat" component={NewChat} />
				<StackComponent.Screen name="Chat" component={Chat} />
				<StackComponent.Screen name="PersonalDetails" component={PersonalDetails} />
				<StackComponent.Screen name="EditAttributes" component={EditAttributes} />
				<StackComponent.Screen name="AddressBook" component={AddressBook} />
				<StackComponent.Screen name="SearchAddress" component={SearchAddress} />
				<StackComponent.Screen name="AddressMapView" component={AddressMapView} />
				<StackComponent.Screen name="AddAddress" component={AddAddress} />
				<StackComponent.Screen name="EditLocationPinPoint" component={EditLocationPinPoint} />
				<StackComponent.Screen name="PaymentInformation" component={PaymentInformation} />
				<StackComponent.Screen name="PaymentSuccess" component={PaymentSuccess} />

				<StackComponent.Screen name="ProviderDashboard" component={ProviderDashboard} />
				<StackComponent.Screen name="MyServices" component={MyServices} />
				<StackComponent.Screen name="SettlerServiceForm" component={SettlerServiceForm} />
				<StackComponent.Screen name="MyRequestDetails" component={LendingDetails} />
				<StackComponent.Screen name="SettlerAddReview" component={SettlerAddReview} />

				<StackComponent.Screen name="Temp" component={Temp} />
				<StackComponent.Screen name="ServiceCatalogueForm" component={ServiceCatalogueForm}/>

				{/* Services Quotation Screens */}
				<StackComponent.Screen name="QuoteService" component={QuoteService} />

			</StackComponent.Navigator>
		</View>
	)
}

export default StackNavigator;