import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './RootStackParamList';
import { View } from 'react-native';

import OnBoarding from '../screens/Auth/Onboarding';
import SignUp from '../screens/Auth/SignUp';
import SignIn from '../screens/Auth/SignIn';
import MyCalendar from '../screens/LenderPanel/MyLendings';
import LenderDashboard from '../screens/LenderPanel/LenderDashboard';
import Listings from '../screens/LenderPanel/Listings';
import AddListing from '../screens/LenderPanel/AddListing';
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
import MyBorrowingDetails from '../screens/MyBorrowings/MyBorrowingDetails';
import LendingDetails from '../screens/LenderPanel/LendingDetails';
import BorrowerAddReview from '../screens/Products/BorrowerAddReview';
import LenderAddReview from '../screens/LenderPanel/LenderAddReview';
import MyBorrowings from '../screens/MyBorrowings/MyBorrowings';
import Temp from '../screens/Temp';
import Chat from '../screens/Chat/Chat';
import ChatList from '../screens/Chat/ChatList';
import NewChat from '../screens/Chat/NewChat';
import PaymentSuccess from '../screens/Products/PaymentSuccess';
import AddressMapView from '../screens/Profile/AddressMapView';
import BottomNavigation from './BottomNavigation';
import AccountVerification from '../screens/Auth/AccountVerification';


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
				<StackComponent.Screen name="MyBorrowings" component={MyBorrowings} />
				<StackComponent.Screen name="MyBorrowingDetails" component={MyBorrowingDetails} />
				<StackComponent.Screen name="BorrowerAddReview" component={BorrowerAddReview} />
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

				<StackComponent.Screen name="LenderDashboard" component={LenderDashboard} />
				<StackComponent.Screen name="Listings" component={Listings} />
				<StackComponent.Screen name="AddListing" component={AddListing} />
				<StackComponent.Screen name="LendingDetails" component={LendingDetails} />
				<StackComponent.Screen name="LenderAddReview" component={LenderAddReview} />

				<StackComponent.Screen name="Temp" component={Temp} />

			</StackComponent.Navigator>
		</View>
	)
}

export default StackNavigator;