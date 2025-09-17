import { createStackNavigator } from "@react-navigation/stack";
import { RootStackParamList } from "./RootStackParamList";
import LendingDetails from "../screens/LenderPanel/LendingDetails";
import MyLendings from "../screens/LenderPanel/MyLendings";

const Stack = createStackNavigator<RootStackParamList>();

const MyLendingsStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MyLendings" component={MyLendings} />
        <Stack.Screen name="LendingDetails" component={LendingDetails} />
    </Stack.Navigator>
);

export default MyLendingsStack;