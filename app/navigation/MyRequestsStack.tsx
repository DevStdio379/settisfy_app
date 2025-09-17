import { createStackNavigator } from "@react-navigation/stack";
import { RootStackParamList } from "./RootStackParamList";
import MyRequestDetails from "../screens/ProviderPanel/MyRequestDetails";
import MyRequests from "../screens/ProviderPanel/MyRequests";

const Stack = createStackNavigator<RootStackParamList>();

const MyRequestsStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MyRequests" component={MyRequests} />
        <Stack.Screen name="MyRequestDetails" component={MyRequestDetails} />
    </Stack.Navigator>
);

export default MyRequestsStack;