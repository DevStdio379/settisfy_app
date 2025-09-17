import { createStackNavigator } from "@react-navigation/stack";
import { BottomTabParamList } from "./BottomTabParamList";
import MyBookings from "../screens/MyBookings/MyBookings";
import MyBookingDetails from "../screens/MyBookings/MyBookingDetails";

const Stack = createStackNavigator<BottomTabParamList>();

const MyBookingsStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MyBookings" component={MyBookings} />
        <Stack.Screen name="MyBookingDetails" component={MyBookingDetails} />
    </Stack.Navigator>
);

export default MyBookingsStack;