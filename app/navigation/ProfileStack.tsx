import { createStackNavigator } from "@react-navigation/stack";
import { RootStackParamList } from "./RootStackParamList";
import Profile from "../screens/Profile/Profile";
import AddressBook from "../screens/Profile/AddressBook";
import SearchAddress from "../screens/Profile/SearchAddress";
import PersonalDetails from "../screens/Profile/PersonalDetails";
import EditAttributes from "../screens/Profile/EditAttributes";
import AddAddress from "../screens/Profile/AddAddress";
import PaymentInformation from "../screens/Profile/PaymentInformation";

const Stack = createStackNavigator<RootStackParamList>();

const ProfileStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Profile" component={Profile} />

        {/* Personal Details */}
        <Stack.Screen name="PersonalDetails" component={PersonalDetails} />


        {/* Address Book */}
        <Stack.Screen name="AddressBook" component={AddressBook} />
        <Stack.Screen name="SearchAddress" component={SearchAddress} />

        <Stack.Screen name="PaymentInformation" component={PaymentInformation} />
    </Stack.Navigator>
);

export default ProfileStack;