import { createStackNavigator } from "@react-navigation/stack";
import { RootStackParamList } from "./RootStackParamList";
import Home from "../screens/Home/Home";
import Search from "../screens/Home/Search";
import SearchResults from "../screens/Home/SearchResults";

const Stack = createStackNavigator<RootStackParamList>();

const HomeStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Search" component={Search} />
        <Stack.Screen name="SearchResults" component={SearchResults} />
    </Stack.Navigator>
);

export default HomeStack;