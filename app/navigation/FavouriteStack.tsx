import { createStackNavigator } from "@react-navigation/stack";
import { RootStackParamList } from "./RootStackParamList";
import Home from "../screens/Home/Home";
import Search from "../screens/Home/Search";
import SearchResults from "../screens/Home/SearchResults";
import FavouriteCollection from "../screens/Favourite/FavouriteCollection";

const Stack = createStackNavigator<RootStackParamList>();

const FavouriteStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="FavouriteCollection" component={FavouriteCollection} />
    </Stack.Navigator>
);

export default FavouriteStack;