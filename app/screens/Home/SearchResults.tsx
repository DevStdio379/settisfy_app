import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, FlatList } from 'react-native'
import React from 'react'
import { useTheme } from '@react-navigation/native';
import Header from '../../layout/Header';
import { IMAGES } from '../../constants/Images';
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import { COLORS, SIZES } from '../../constants/theme';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import Cardstyle4 from '../../components/Card/Cardstyle4';
import Ionicons from 'react-native-vector-icons/Ionicons';

type SearchResultsScreenProps = StackScreenProps<RootStackParamList, 'SearchResults'>

export const SearchResults = ({ navigation, route }: SearchResultsScreenProps) => {

    const { query, allSearchResults } = route.params;

    return (
        <View style={{ backgroundColor: COLORS.background, flex: 1 }}>
            {/* <Header title="Search Results" leftIcon="arrow-back" onLeftPress={() => navigation.goBack()} /> */}
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
                            value={query}
                            style={{
                                height: 40,
                                flex: 1,
                                paddingLeft: 10,
                                color: COLORS.black,
                            }}
                            placeholder="Search..."
                            placeholderTextColor={COLORS.placeholder}
                            readOnly={true}
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
            {allSearchResults && allSearchResults.length > 0 ? (
                <FlatList
                    data={allSearchResults}
                    scrollEnabled={false}
                    renderItem={({ item }: { item: any }) => {
                        if (item.empty) {
                            // Render an invisible spacer if the item is marked as "empty"
                            return <View style={{ flex: 1, margin: 5, backgroundColor: 'transparent' }} />;
                        }

                        return (
                            <View style={{ flex: 1, margin: 5 }}>
                                <Cardstyle4
                                    id={item.id}
                                    imageUrl={item.imageUrls[0]}
                                    price={item.basePrice}
                                    ownerID={item.ownerID}
                                    description={item.description}
                                    location={item.address}
                                    title={item.title}
                                    onPress={() => navigation.navigate('QuoteCleaning', { service: item })}
                                    // onPress5={() => addItemToWishList(item)}
                                    product={true}
                                    deposit={item.depositAmount}
                                    ratingCount={item.ratingCount ?? 0}
                                    averageRating={item.averageRating ?? 0}                            />
                            </View>
                        );
                    }} // Assign renderItem function
                    keyExtractor={(item) => item.id?.toString() ?? ''} // Unique key for each item
                    numColumns={2} // Set number of columns to 2
                    columnWrapperStyle={{ justifyContent: 'space-between' }} // Space between columns
                    showsVerticalScrollIndicator={false} // Hide the scroll indicator
                    contentContainerStyle={{ paddingBottom: 150 }} // Ensure space at the bottom
                />
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: COLORS.text, fontSize: SIZES.h2 }}>No search results found</Text>
                </View>
            )}
        </View>
    );
};

export default SearchResults