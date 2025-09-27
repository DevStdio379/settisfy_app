import { useTheme } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import { IMAGES } from '../../constants/Images';
import { COLORS, SIZES } from '../../constants/theme';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import Header from '../../layout/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useUser, defaultUser, User } from '../../context/UserContext';
import CardInfoStyle from '../../components/Card/CardInfoStyle';
import PillStyle from '../../components/Pills/PillStyle';
import { fetchLendingsByUser } from '../../services/BorrowingServices';
import { set } from 'date-fns';
import { getOrCreateChat } from '../../services/ChatServices';

type ProviderDashboardScreenProps = StackScreenProps<RootStackParamList, 'ProviderDashboard'>;

const ProviderDashboard = ({ navigation }: ProviderDashboardScreenProps) => {

    const tips =
        [
            {
                imageUri: 'https://firebasestorage.googleapis.com/v0/b/tags-1489a.appspot.com/o/static%2Fyard-sale.jpg?alt=media&token=90c4772e-450f-4431-85a7-c0d1e48f286c',
                title: 'Help Your Service Stand Out',
                description: 'Learn how to maximize your earnings.',
            },
            {
                imageUri: 'https://firebasestorage.googleapis.com/v0/b/tags-1489a.appspot.com/o/static%2Ffence%20sharing.jpg?alt=media&token=6409463f-31f9-466f-a895-2e5506438f5f',
                title: 'How to do Job Safely',
                description: 'Tips for safe lending practices.',
            },
        ]



    const theme = useTheme();
    const { user, updateUserData, setUser } = useUser();
    const [loading, setLoading] = useState(true);
    const { colors }: { colors: any } = theme;
    const [refreshing, setRefreshing] = useState(false);
    const [lendings, setLendings] = useState<any[]>([]);

    const fetchData = async () => {
        if (user?.uid) {
            const myListingsData = await fetchLendingsByUser(user.uid);
            myListingsData.sort((a: any, b: any) => {
                const startDateA = new Date(a.startDate).getTime();
                const startDateB = new Date(b.startDate).getTime();
                return startDateB - startDateA;
            });
            setLendings(myListingsData);
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

    const handleChat = async (user: User, otherUser: User) => {
        // const chatId = await getOrCreateChat(user, otherUser);
        // if (chatId) {
        //     navigation.navigate("Chat", { chatId: chatId });
        // }
    };


    return (
        <View style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: 15 }}>
            <View style={{ paddingTop: 50, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
                {user?.isActive ? (
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 14, color: COLORS.title }}>{user.currentAddress?.addressName}</Text>
                        </View>
                        <Text style={{ fontSize: 30, fontWeight: 'bold', color: COLORS.title }}>Settler Dashboard</Text>
                    </View>
                ) : (
                    <View>
                        <Text style={{ fontSize: 30, fontWeight: 'bold', color: COLORS.title }}>BorrowNest</Text>
                        <Text style={{ fontSize: 16, color: COLORS.title }}>Borrow & lend items around you.</Text>
                    </View>
                )}
                <TouchableOpacity
                    onPress={() => navigation.navigate('Profile')}
                    activeOpacity={0.5}
                    style={{ justifyContent: 'center', alignItems: 'center' }}
                >
                    <Image
                        source={{ uri: user?.profileImageUrl || 'https://via.placeholder.com/150' }}
                        style={{
                            width: 60,
                            height: 60,
                            borderRadius: 60,
                        }}
                    />
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }>
                <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <View style={[styles.arrivaldata, { flex: 1, margin: 5, padding: 20, alignItems: 'center' }]}>
                        <Ionicons name="wallet-outline" size={30} color={COLORS.primary} style={{ marginBottom: 10 }} />
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.title, textAlign: 'center' }}>
                            Total Earnings
                        </Text>
                        <Text style={{ fontSize: 14, color: COLORS.title, textAlign: 'center' }}>
                            $XXX.XX
                        </Text>
                    </View>
                    <View style={[styles.arrivaldata, { flex: 1, margin: 5, padding: 20, alignItems: 'center' }]}>
                        <Ionicons name="time-outline" size={30} color={COLORS.primary} style={{ marginBottom: 10 }} />
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.title, textAlign: 'center' }}>
                            Pending Balance
                        </Text>
                        <Text style={{ fontSize: 14, color: COLORS.title, textAlign: 'center' }}>
                            $XXX.XX
                        </Text>
                    </View>
                    <View style={[styles.arrivaldata, { flex: 1, margin: 5, padding: 20, alignItems: 'center' }]}>
                        <Ionicons name="lock-closed-outline" size={30} color={COLORS.primary} style={{ marginBottom: 10 }} />
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.title, textAlign: 'center' }}>
                            Deposit Held
                        </Text>
                        <Text style={{ fontSize: 14, color: COLORS.title, textAlign: 'center' }}>
                            $XXX.XX
                        </Text>
                    </View>
                </View>
                <View style={{ marginTop: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.title }}>
                            Recent Requests
                        </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('MyRequests')}>
                            <Text style={{ fontSize: 14, color: COLORS.primary }}>
                                View All
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ justifyContent: 'center' }} showsHorizontalScrollIndicator={false}>
                        {lendings.slice(0, 2).map((lending, index) => (
                            <View key={index} style={[styles.ProviderDashboardcard, { flex: 1, padding: 5, borderWidth: 1, borderColor: '#EFEFEF', borderRadius: 10 }]}>
                                <View style={styles.cardimg}>
                                    <Image
                                        source={{ uri: lending.product.imageUrls[0] || 'https://via.placeholder.com/150' }}
                                        style={{ width: 50, height: 50, borderRadius: 10 }}
                                    />
                                </View>
                                <View>
                                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.title }}>
                                        {lending.product.title || 'Unknown Product'}
                                    </Text>
                                    <Text style={{ fontSize: 14, color: COLORS.title }}>
                                        {lending.firstName + ' ' + lending.lastName || 'Unknown Borrower'}
                                    </Text>
                                    <Text style={{ fontSize: 14 }}>
                                        {new Date(lending.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}, {new Date(lending.startDate).toLocaleDateString('en-GB', { weekday: 'short' })} - {new Date(lending.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}, {new Date(lending.endDate).toLocaleDateString('en-GB', { weekday: 'short' })}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => { if (user?.uid && lending.product.ownerID) handleChat(user, lending.product.ownerID) }}
                                    style={{
                                        marginLeft: 'auto',
                                        borderWidth: 1,
                                        borderColor: COLORS.blackLight,
                                        padding: 10,
                                        borderRadius: 10,
                                    }}
                                >
                                    {/* <Text style={{ fontSize: 14, color: COLORS.primary }}>
                                        {lending.userId} && {lending.product.ownerID}
                                    </Text> */}
                                    <Ionicons name="chatbubble-ellipses-outline" size={20} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>
                <View style={{ marginTop: 10 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.title, marginBottom: 10 }}>
                        Owner Resources and Tips
                    </Text>
                    <ScrollView showsHorizontalScrollIndicator={false}>
                        {tips.map((resource, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.ProviderDashboardcard,
                                    { alignItems: 'center', borderWidth: 1, borderColor: '#EFEFEF', borderRadius: 10 },
                                ]}
                            >
                                <Image
                                    source={{ uri: resource.imageUri }}
                                    style={{ width: 100, height: 100, margin: 5, borderRadius: 15, }}
                                />
                                <View>
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.title }}>
                                        {resource.title}
                                    </Text>
                                    <Text style={{ fontSize: 14, color: COLORS.title, }}>
                                        {resource.description}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    arrivaldata: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        //width:'100%',
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    sectionimg: {
        height: 104,
        width: 104,
        borderRadius: 150,
        backgroundColor: COLORS.primary,
        overflow: 'hidden',
        marginBottom: 25
    },
    brandsubtitle2: {
        fontSize: 12
    },
    brandsubtitle3: {
        fontSize: 12,
        color: COLORS.title
    },
    ProviderDashboardcard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginRight: 10,
        marginBottom: 20
    },
    cardimg: {
        height: 54,
        width: 54,
        borderRadius: 10,
        backgroundColor: COLORS.card,
        shadowColor: "rgba(0,0,0,0.5)",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 20.27,
        elevation: 5,
        alignItems: 'center',
        justifyContent: 'center'
    },
})

export default ProviderDashboard