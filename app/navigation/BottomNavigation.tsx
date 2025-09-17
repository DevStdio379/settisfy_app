import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabParamList } from './BottomTabParamList';
import ChatListScreen from '../screens/Chat/ChatList';
import ProfileScreen from '../screens/Profile/Profile';
import BottomMenu from '../layout/BottomMenu';
import { useUser } from '../context/UserContext';
import LenderDashboard from '../screens/LenderPanel/LenderDashboard';
import ListingsScreen from '../screens/LenderPanel/Listings';
import HomeStack from './HomeStack';
import ProfileStack from './ProfileStack';
import FavouriteStack from './FavouriteStack';
import MyLendingsStack from './MyLendingsStack';
import MyBorrowingsStack from './MyBorrowingStack';


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
                initialRouteName='LenderDashboard'
                screenOptions={{
                    headerShown: false
                }}
                tabBar={(props: any) => <BottomMenu {...props} />}
            >
                <Tab.Screen
                    name='LenderDashboard'
                    component={LenderDashboard}
                />
                <Tab.Screen
                    name='Listings'
                    component={ListingsScreen}
                />
                <Tab.Screen
                    name='MyLendingsStack'
                    component={MyLendingsStack}
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