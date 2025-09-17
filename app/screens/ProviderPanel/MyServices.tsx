import React, { useEffect, useState, useCallback, useRef } from 'react'
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Animated } from 'react-native'
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import { IMAGES } from '../../constants/Images';
import { COLORS, SIZES } from '../../constants/theme';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import Header from '../../layout/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useUser } from '../../context/UserContext';
import { fetchUserProductListings, Product } from '../../services/ProductServices';
import { Borrowing, fetchLendingsByUser } from '../../services/BorrowingServices';

type MyServicesScreenProps = StackScreenProps<RootStackParamList, 'MyServices'>;

const MyServices = ({ navigation, route }: MyServicesScreenProps) => {
    const { user } = useUser();
    const [activeListings, setActiveListings] = useState<any[]>([]);
    const [inactiveListings, setinActiveListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const scrollViewHome = useRef<any>(null);
    const buttons = ['Active', 'Inactive'];
    const scrollX = useRef(new Animated.Value(0)).current;
    const onCLick = (i: any) => scrollViewHome.current.scrollTo({ x: i * SIZES.width });
    const [activeIndex, setActiveIndex] = useState(0);

    const fetchData = async () => {
        if (user?.uid) {

            const myListingsData = await fetchUserProductListings(user.uid);
            const userLendings = await fetchLendingsByUser(user.uid);
            const myListingsWithBorrowings = myListingsData.map((listing: Product) => {
                const borrowingCounts = userLendings.filter((borrowing: Borrowing) => borrowing.product.id === listing.id).length;
                const hasActiveBorrowing = userLendings.some(
                    (borrowing: Borrowing) => borrowing.product.id === listing.id && borrowing.status < 6
                );
                return { ...listing, productBorrowingCount: borrowingCounts, activeBorrowing: hasActiveBorrowing };
            });
            const activeListings = myListingsWithBorrowings.filter(listing => listing.isActive);
            const inactiveListings = myListingsWithBorrowings.filter(listing => !listing.isActive);
            setActiveListings(activeListings);
            setinActiveListings(inactiveListings);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [user?.uid]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData().then(() => setRefreshing(false));
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={{ backgroundColor: COLORS.background, flex: 1 }}>
            <View style={{ height: 80, borderBottomColor: COLORS.card, borderBottomWidth: 1 }}>
                <View
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 5 }}>
                    <View style={{ flex: 1, alignItems: 'flex-start' }}>
                        {/* left header element */}
                    </View>
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.title, textAlign: 'center', marginVertical: 10 }}>My Services</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <TouchableOpacity
                            style={{
                                borderRadius: 50,
                                padding: 10,
                            }}
                            onPress={() => navigation.navigate('AddListing', { listing: null })}
                        >
                            <Ionicons name="add" size={25} color={COLORS.title} />
                        </TouchableOpacity>
                    </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {buttons.map((btn: any, i: number) => (
                        <View key={i} style={{ flexDirection: 'row', width: SIZES.width * 0.5, paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                            <TouchableOpacity
                                style={{ width: '100%', justifyContent: 'center', alignItems: 'center', }}
                                onPress={() => {
                                    setActiveIndex(i);
                                    if (onCLick) {
                                        onCLick(i);
                                    }
                                }}
                            >
                                <Text style={{ color: COLORS.text, paddingBottom: 5, }}>{btn}</Text>
                                {activeIndex === i && <View style={{ height: 3, width: '100%', backgroundColor: 'black' }} />}
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            </View>
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
                {buttons.map((button, index) => (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        style={{ width: SIZES.width, paddingTop: 10 }}
                        key={index}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    >
                        <View style={{}}>
                            {index === 0 && (
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 70, alignItems: 'flex-start' }}
                                >
                                    <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15, paddingBottom: 40, paddingTop: 10 }]}>
                                        <View>
                                            {
                                                activeListings.map((data: any, index) => (
                                                    <View style={{ marginVertical: 5, height: 100 }} key={index}>
                                                        <TouchableOpacity
                                                            activeOpacity={0.8}
                                                            onPress={() => navigation.navigate('AddListing', { listing: data })}
                                                            style={{
                                                                borderRadius: 10,
                                                                borderWidth: 1,
                                                                borderColor: COLORS.blackLight,
                                                                backgroundColor: COLORS.card,
                                                            }}>
                                                            <View style={[GlobalStyleSheet.flexcenter, { justifyContent: 'flex-start' }]}>
                                                                {data.imageUrls && data.imageUrls.length > 0 ? (
                                                                    <View style={{ width: '30%' }}>
                                                                        <Image
                                                                            style={{ height: '100%', width: '100%', resizeMode: 'cover', borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }}
                                                                            source={{ uri: data.imageUrls[0] }}
                                                                        />
                                                                    </View>
                                                                ) : (
                                                                    <View style={{ width: '30%', height: '100%', backgroundColor: COLORS.background, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
                                                                        <Ionicons name={'image-outline'} size={30} color={COLORS.black} style={{ opacity: .5 }} />
                                                                    </View>
                                                                )}
                                                                <View style={{ width: '70%', padding: 10 }}>
                                                                    <Text numberOfLines={1} style={{ fontSize: 13, color: COLORS.black, opacity: 0.7 }}>
                                                                        {data.address ? data.address : 'No address provided'}
                                                                    </Text>
                                                                    <Text numberOfLines={1} style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.black }}>{data.title ? data.title : 'Unlisted title'}</Text>
                                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                        <Text style={{ fontSize: 14, color: COLORS.black, opacity: .5 }}>£{data.lendingRate ? Number(data.lendingRate).toFixed(2) + '/day' : 'Undefined rate'}</Text>
                                                                        <Text style={{ fontSize: 14, color: COLORS.black, opacity: .5, marginLeft: 10 }}>
                                                                            {data.depositAmount ? `Deposit: £${Number(data.depositAmount).toFixed(2)}` : 'No deposit'}
                                                                        </Text>
                                                                    </View>
                                                                    <Text>Borrowed {data.productBorrowingCount} times</Text>
                                                                    {data.activeBorrowing && (
                                                                        <View
                                                                            style={{
                                                                                height: 10,
                                                                                width: 10,
                                                                                borderRadius: 5,
                                                                                backgroundColor: COLORS.primary,
                                                                                position: 'absolute',
                                                                                top: 5,
                                                                                right: 5,
                                                                            }}
                                                                        />
                                                                    )}
                                                                </View>
                                                            </View>
                                                        </TouchableOpacity>
                                                    </View>
                                                ))
                                            }
                                        </View>
                                    </View>
                                </ScrollView>
                            )}
                            {index === 1 && (
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 70, alignItems: 'flex-start' }}
                                >
                                    <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15, paddingBottom: 40, paddingTop: 10 }]}>
                                        <View>
                                            {
                                                inactiveListings.map((data: any, index) => (
                                                    <View style={{ marginVertical: 5, height: 100 }} key={index}>
                                                        <TouchableOpacity
                                                            activeOpacity={0.8}
                                                            onPress={() => navigation.navigate('AddListing', { listing: data })}
                                                            style={{
                                                                borderRadius: 10,
                                                                borderWidth: 1,
                                                                borderColor: COLORS.blackLight,
                                                                backgroundColor: COLORS.card,
                                                            }}>
                                                            <View style={[GlobalStyleSheet.flexcenter, { justifyContent: 'flex-start' }]}>
                                                                {data.imageUrls && data.imageUrls.length > 0 ? (
                                                                    <View style={{ width: '30%' }}>
                                                                        <Image
                                                                            style={{ height: '100%', width: '100%', resizeMode: 'cover', borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }}
                                                                            source={{ uri: data.imageUrls[0] }}
                                                                        />
                                                                    </View>
                                                                ) : (
                                                                    <View style={{ width: '30%', height: '100%', backgroundColor: COLORS.background, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
                                                                        <Ionicons name={'image-outline'} size={30} color={COLORS.black} style={{ opacity: .5 }} />
                                                                    </View>
                                                                )}
                                                                <View style={{ width: '70%', padding: 10 }}>
                                                                    <Text numberOfLines={1} style={{ fontSize: 16, color: COLORS.black }}>{data.title ? data.title : 'Unlisted title'}</Text>
                                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                        <Text style={{ fontSize: 14, color: COLORS.black, opacity: .5 }}>{data.lendingRate ? data.lendingRate : 'Undefined rate'}</Text>
                                                                    </View>
                                                                    <Text style={{ fontSize: 14, color: COLORS.black, opacity: .5 }}>{data.isActive === true ? 'active' : 'inactive'}</Text>
                                                                </View>
                                                            </View>
                                                        </TouchableOpacity>
                                                    </View>
                                                ))
                                            }
                                        </View>
                                    </View>
                                </ScrollView>
                            )}
                        </View>
                    </ScrollView>
                ))}
            </ScrollView>
        </View>
    )
}

export default MyServices