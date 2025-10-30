import { createStackNavigator } from "@react-navigation/stack";
import { RootStackParamList } from "./RootStackParamList";
import Profile from "../screens/Profile/Profile";
import AddressBook from "../screens/Profile/AddressBook";
import SearchAddress from "../screens/Profile/SearchAddress";
import PersonalDetails from "../screens/Profile/PersonalDetails";
import EditAttributes from "../screens/Profile/EditAttributes";
import AddAddress from "../screens/Profile/AddAddress";
import PaymentInformation from "../screens/Profile/AddPayment";
import CatalogueList from "../screens/Profile/CatalogueList";
import ServiceCatalogue, { ServiceCatalogueForm } from "../screens/ServiceCatalogueForm";
import PaymentBook from "../screens/Profile/PaymentBook";
import AddPayment from "../screens/Profile/AddPayment";

const Stack = createStackNavigator<RootStackParamList>();

const ProfileStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Profile" component={Profile} />

        {/* Personal Details */}
        <Stack.Screen name="PersonalDetails" component={PersonalDetails} />


        {/* Address Book */}
        <Stack.Screen name="AddressBook" component={AddressBook} />
        <Stack.Screen name="SearchAddress" component={SearchAddress} />

        <Stack.Screen name="PaymentBook" component={PaymentBook} />
        <Stack.Screen name="AddPayment" component={AddPayment} />
        <Stack.Screen name="CatalogueList" component={CatalogueList} />
        <Stack.Screen name="ServiceCatalogueForm" component={ServiceCatalogueForm} />
    </Stack.Navigator>
);

export default ProfileStack;