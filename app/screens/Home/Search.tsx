import React, { useState, useEffect } from "react";
import {
    View,
    TextInput,
    FlatList,
    Text,
    TouchableOpacity,
    ActivityIndicator
} from "react-native";
import { searchProducts } from "../../services/ProductServices";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/RootStackParamList";
import { StackScreenProps } from "@react-navigation/stack";
import { COLORS, SIZES } from "../../constants/theme";
import Ionicons from "react-native-vector-icons/Ionicons";

type SearchProps = StackScreenProps<RootStackParamList, 'Search'>
const Search = ({ navigation }: SearchProps) => {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [allSearchResults, setAllSearchResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                const results = await searchProducts(query);
                setAllSearchResults(results);
                setSuggestions(results.slice(0, 5)); // Limit suggestions to 5
            } catch (err) {
                console.error("Error fetching suggestions:", err);
            } finally {
                setLoading(false);
            }
        };

        const delayDebounce = setTimeout(fetchSuggestions, 300); // Debounce input
        return () => clearTimeout(delayDebounce);
    }, [query]);

    const handleSearch = (selectedQuery?: string) => {
        const finalQuery = selectedQuery || query;
        navigation.navigate("SearchResults", { query: finalQuery, allSearchResults: allSearchResults });
    };

    return (
        <View style={{ backgroundColor: COLORS.background, flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 10 }}>
                <TouchableOpacity
                    style={{ padding: 10, borderColor: COLORS.inputBackground, borderWidth: 1, borderRadius: 10 }}
                    onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={20} color={COLORS.black} />
                </TouchableOpacity>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.goBack()}>
                    <View style={{ width: SIZES.width * 0.8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderColor: COLORS.inputBackground, borderWidth: 1, borderRadius: 20, paddingLeft: 10 }}>
                        <TextInput
                            placeholderTextColor={COLORS.blackLight}
                            placeholder="Search for borrowable items..."
                            value={query}
                            onChangeText={setQuery}
                            onSubmitEditing={() => handleSearch()} // Search on enter
                            style={{
                                height: 40,
                                flex: 1,
                                color: COLORS.black,
                            }}
                        />
                        <View style={{ padding: 10 }}>
                            <Ionicons name="search" size={20} color={COLORS.black} />
                        </View>
                    </View>
                </TouchableOpacity>
                {/* <TouchableOpacity
                    style={{ backgroundColor: COLORS.inputBackground, padding: 10, borderColor: COLORS.inputBackground, borderWidth: 1, borderRadius: 10, }}
                    onPress={() => navigation.goBack()}>
                    <Ionicons name="filter" size={20} color={COLORS.black} />
                </TouchableOpacity> */}
                <View></View>
            </View>


            {loading && <ActivityIndicator size="small" color="gray" />}

            {/* Suggestions List */}
            <FlatList
                data={suggestions}
                style={{ marginHorizontal: 15 }}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={{ padding: 10, borderBottomWidth: 0.5 }}
                        onPress={() => handleSearch(item.title)}
                    >
                        <Text>{item.title}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

export default Search;
