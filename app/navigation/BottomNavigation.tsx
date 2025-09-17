import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabParamList } from './BottomTabParamList';
import ChatListScreen from '../screens/Chat/ChatList';
import ProfileScreen from '../screens/Profile/Profile';
import BottomMenu from '../layout/BottomMenu';
import { useUser } from '../context/UserContext';
import ProviderDashboard from '../screens/ProviderPanel/ProviderDashboard';
import MyServicesScreen from '../screens/ProviderPanel/MyServices';
import HomeStack from './HomeStack';
import ProfileStack from './ProfileStack';
import FavouriteStack from './FavouriteStack';
import MyLendingsStack from './MyRequestsStack';
import MyBorrowingsStack from './MyBorrowingStack';
import MyRequestsStack from './MyRequestsStack';


const Tab = createBottomTabNavigator<BottomTabParamList>();


const BottomNavigation = () => {
    const { user } = useUser();

    if (!user) {
        return null;
    }
    
    return (
        user.accountType === 'borrower' ? (
            <Tab.Navigator
                initialRouteName='HomeStack'
                screenOptions={{
                    headerShown: false
                }}
                tabBar={(props: any) => <BottomMenu {...props} />}
            >
                <Tab.Screen
                    name='HomeStack'
                    component={HomeStack}  // Use HomeStack here
                />
                <Tab.Screen
                    name='FavouriteStack'
                    component={FavouriteStack}
                />
                <Tab.Screen
                    name='MyBorrowingsStack'
                    component={MyBorrowingsStack}
                />
                <Tab.Screen
                    name='ChatList'
                    component={ChatListScreen}
                />
                <Tab.Screen
                    name='ProfileStack'
                    component={ProfileStack}
                />
            </Tab.Navigator>
        ) : user.accountType === 'lender' && (
            <Tab.Navigator
                initialRouteName='ProviderDashboard'
                screenOptions={{
                    headerShown: false
                }}
                tabBar={(props: any) => <BottomMenu {...props} />}
            >
                <Tab.Screen
                    name='ProviderDashboard'
                    component={ProviderDashboard}
                />
                <Tab.Screen
                    name='MyServices'
                    component={MyServicesScreen}
                />
                <Tab.Screen
                    name='MyRequestsStack'
                    component={MyRequestsStack}
                />
                <Tab.Screen
                    name='ChatList'
                    component={ChatListScreen}
                />
                <Tab.Screen
                    name='ProfileStack'
                    component={ProfileStack}
                />
            </Tab.Navigator>
        )
    )
}

export default BottomNavigation;