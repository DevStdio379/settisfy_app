import { createStackNavigator } from "@react-navigation/stack";
import MyBorrowingDetails from "../screens/MyBorrowings/MyBorrowingDetails";
import MyBorrowings from "../screens/MyBorrowings/MyBorrowings";
import { BottomTabParamList } from "./BottomTabParamList";

const Stack = createStackNavigator<BottomTabParamList>();

const MyBorrowingsStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MyBorrowings" component={MyBorrowings} />
        <Stack.Screen name="MyBorrowingDetails" component={MyBorrowingDetails} />
    </Stack.Navigator>
);

export default MyBorrowingsStack;