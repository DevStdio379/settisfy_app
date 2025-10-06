import { createStackNavigator } from "@react-navigation/stack";
import { RootStackParamList } from "./RootStackParamList";
import Profile from "../screens/Profile/Profile";
import AddressBook from "../screens/Profile/AddressBook";
import SearchAddress from "../screens/Profile/SearchAddress";
import PersonalDetails from "../screens/Profile/PersonalDetails";
import EditAttributes from "../screens/Profile/EditAttributes";
import AddAddress from "../screens/Profile/AddAddress";
import PaymentInformation from "../screens/Profile/PaymentInformation";
import CatalogueList from "../screens/Profile/CatalogueList";
import ServiceCatalogue, { ServiceCatalogueForm } from "../screens/ServiceCatalogueForm";
import MyServices from "../screens/ProviderPanel/MyServices";
import SettlerServiceForm from "../screens/ProviderPanel/SettlerServiceForm";

const Stack = createStackNavigator<RootStackParamList>();

const MyServicesStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MyServices" component={MyServices} />
        <Stack.Screen name="SettlerServiceForm" component={SettlerServiceForm} />
    </Stack.Navigator>
);

export default MyServicesStack;