import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, StyleSheet, Animated, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import { COLORS, SIZES } from '../../constants/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import Cardstyle4 from '../../components/Card/Cardstyle4';
import { useUser } from '../../context/UserContext';
import { fetchProducts, Product } from '../../services/ProductServices';
import { Banner, fetchBanners } from '../../services/BannerServices';
import TabButtonStyleHome from '../../components/Tabs/TabButtonStyleHome';
import Carousel from '../../components/Carousel';
import { auth, db } from '../../services/firebaseConfig';
import { arrayRemove, arrayUnion, deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../redux/store';
import { fetchFavorites } from '../../redux/favoriteSlice';
import FavoriteButton from '../../components/FavoriteButton';
import { serviceCatalogue } from '../../constants/ServiceCatalogue'; 

type HomeScreenProps = StackScreenProps<RootStackParamList, 'Home'>

export const Home = ({ navigation }: HomeScreenProps) => {

    const [loading, setLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useUser();
    const userId = user?.uid || ''; // replace with actual auth user id
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        dispatch(fetchFavorites(userId));
    }, []);

    const theme = useTheme();
    const { colors }: { colors: any; } = theme;

    const renderItem = ({ item }: { item: any }) => {
        if (item.empty) {
            // Render an invisible spacer if the item is marked as "empty"
            return <View style={{ flex: 1, margin: 5, backgroundColor: 'transparent' }} />;
        }

        return (
            <View style={{ flex: 1, margin: 5 }}>
                <Cardstyle4
                    id={item.id}
                    title={item.title}
                    imageUrl={item.image}
                    description={item.description}
                    onPress={() => navigation.navigate('QuoteCleaning')}
                    product={true}
                    averageRating={item.averageRating}
                    ratingCount={item.ratingCount}
                />
            </View>
        );
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
    }, []);

    const scrollViewHome = useRef<any>(null);


    const buttons = ['Essentials', 'Home Services',
        'Handyman & Repairs', 'Moving & Delivery', 'Personal Assistance', 'Tech Help', 'Pet Care', 'Wellness Support', 'More'];

    const scrollX = useRef(new Animated.Value(0)).current;
    const onCLick = (i: any) => scrollViewHome.current.scrollTo({ x: i * SIZES.width });

    return (
        loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        ) : (
            <View style={{ backgroundColor: COLORS.background }}>
                <View style={{ paddingHorizontal: 15, paddingBottom: 10 }}>
                    <View style={{ paddingTop: 50, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
                        {user?.isActive ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 5 }}>
                                {user?.profileImageUrl ? (
                                    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                                        <Image
                                            source={{ uri: user.profileImageUrl }}
                                            style={{ width: 50, height: 50, borderRadius: 25 }}
                                        />
                                    </TouchableOpacity>
                                ) : (
                                    <Ionicons name="person-circle-outline" size={55} color={COLORS.blackLight} />
                                )}
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={{ fontSize: 14, color: COLORS.title }}>{user.currentAddress?.addressName}</Text>
                                    <Text style={{ fontSize: 25, fontWeight: 'bold', color: COLORS.title }}>Hello {user.firstName} {user.lastName}</Text>
                                </View>
                            </View>
                        ) : (
                            <View>
                                <Text style={{ fontSize: 30, fontWeight: 'bold', color: COLORS.title }}>Settisfy</Text>
                                <Text style={{ fontSize: 16, color: COLORS.title }}>On-demand service platform.</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Search')}
                            activeOpacity={0.5}
                            style={{ justifyContent: 'center', alignItems: 'center' }}
                        >
                            <Ionicons name='search' size={28} color={COLORS.black} />
                        </TouchableOpacity>
                    </View>
                    <TabButtonStyleHome
                        buttons={buttons}
                        onClick={onCLick}
                        scrollX={scrollX}
                    />
                </View>
                <View style={{ paddingHorizontal: 10, paddingBottom: 300 }}>
                    <ScrollView
                        ref={scrollViewHome}
                        horizontal
                        pagingEnabled
                        scrollEventThrottle={16}
                        scrollEnabled={false}
                        decelerationRate="fast"
                        showsHorizontalScrollIndicator={false}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                            { useNativeDriver: false },
                        )}
                    >
                        {buttons.map((button, index) => {
                            return (
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    style={{ width: SIZES.width }}
                                    key={index}
                                    refreshControl={
                                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                                    }
                                >
                                    <View style={[GlobalStyleSheet.container, { paddingBottom: 20 }]}>
                                        <FlatList
                                            data={serviceCatalogue.filter(serviceCatalogue => serviceCatalogue.category === button)}
                                            scrollEnabled={false}
                                            renderItem={renderItem} // Assign renderItem function
                                            keyExtractor={(item) => item.id?.toString() ?? ''} // Unique key for each item
                                            numColumns={2} // Set number of columns to 2
                                            columnWrapperStyle={{ justifyContent: 'space-between' }} // Space between columns
                                            showsVerticalScrollIndicator={false} // Hide the scroll indicator
                                            contentContainerStyle={{ paddingBottom: 150 }} // Ensure space at the bottom
                                        />
                                    </View>
                                </ScrollView>
                            )
                        })}

                    </ScrollView>

                </View>
            </View>
        )
    );
};

const styles = StyleSheet.create({
    profilecard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginRight: 10,
        marginBottom: 20
    },
    flex: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center'
    },
    TextInput: {

        fontSize: 16,
        color: COLORS.title,
        height: 60,
        borderRadius: 61,
        paddingHorizontal: 40,
        paddingLeft: 30,
        borderWidth: 1,
        borderColor: '#EBEBEB',
        backgroundColor: '#FAFAFA'
    },
    brandsubtitle3: {
        fontSize: 12,
        color: COLORS.title
    },
    title3: {
        fontSize: 24,
        color: '#8ABE12',
        //textAlign:'right'
    },
    text: {
        color: 'black',
    },
})

export default Home;
