import { useTheme } from '@react-navigation/native';
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, Alert, Animated, Easing, FlatList, Dimensions, ScrollView, RefreshControl, ActivityIndicator, TextInput, Linking } from 'react-native'
import { IMAGES } from '../../constants/Images';
import { COLORS, SIZES } from '../../constants/theme';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import MapView, { Marker } from 'react-native-maps';
import Header from '../../layout/Header';
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import { fetchSelectedBorrowing, Borrowing, updateBorrowing } from '../../services/BorrowingServices';
import { fetchSelectedUser, User, useUser } from '../../context/UserContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { createReview, getReviewByBookingId, Review } from '../../services/ReviewServices';
import axios from 'axios';
import { Booking, BookingWithUser, fetchSelectedBooking, subscribeToBookings, subscribeToOneBooking, updateBooking } from '../../services/BookingServices';
import { getOrCreateChat } from '../../services/ChatServices';
import Input from '../../components/Input/Input';
import { fetchSelectedSettlerService, fetchSettlerServices, updateSettlerService } from '../../services/SettlerServiceServices';
import { fetchSelectedCatalogue, updateCatalogue } from '../../services/CatalogueServices';
import { deleteField } from 'firebase/firestore';

type MyBookingDetailsScreenProps = StackScreenProps<RootStackParamList, 'MyBookingDetails'>;


const MyBookingDetails = ({ navigation, route }: MyBookingDetailsScreenProps) => {

    const { user } = useUser();
    const [settler, setSettler] = useState<User>();
    const mapRef = useRef<MapView | null>(null);
    const [booking, setBooking] = useState<Booking>(route.params.booking);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [status, setStatus] = useState<number>(booking.status);

    const scrollViewHome = useRef<any>(null);
    const buttons = ['Transaction Summary', 'Service Notes'];
    const scrollX = useRef(new Animated.Value(0)).current;
    const onCLick = (i: any) => scrollViewHome.current.scrollTo({ x: i * SIZES.width });
    const [activeIndex, setActiveIndex] = useState(0);

    const CODE_LENGTH = 7;
    const [returnCode, setCollectionCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const inputs = useRef<Array<TextInput | null>>(Array(CODE_LENGTH).fill(null));
    const [review, setReview] = useState<Review>();

    // selected settler
    const [selectedSettlerId, setSelectedSettlerId] = useState<string>('');
    const [selectedSettlerFirstName, setSelectedSettlerFirstName] = useState<string>('');
    const [selectedSettlerLastName, setSelectedSettlerLastName] = useState<string>('');

    const [selectedNotesToSettlerImageUrl, setSelectedNotesToSettlerImageUrl] = useState<string | null>(null);
    const [notesToSettlerImageUrls, setNotesToSettlerImageUrls] = useState<string[]>([]);
    const [notesToSettler, setNotesToSettler] = useState<string>('');
    const [bookingWithSettlerProfiles, setBookingWithSettlerProfiles] = useState<BookingWithUser[]>();
    const [index, setIndex] = useState(0);
    const [profileIndex, setProfileIndex] = useState(0);


    const handleChat = async (userId: string, otherUserId: string) => {
        const chatId = await getOrCreateChat(userId, otherUserId, booking);
        if (chatId) {
            navigation.navigate("Chat", { chatId: chatId });
        }
    };

    const fetchSelectedBookingData = async () => {
        if (booking) {
            // Alert.alert('1 Borrowing found');
            try {
                const selectedBooking = await fetchSelectedBooking(booking.id || 'undefined');
                if (selectedBooking) {
                    setBooking(selectedBooking)
                    setStatus(selectedBooking.status);

                    if (booking.notesToSettlerImageUrls) {
                        setSelectedNotesToSettlerImageUrl(booking.notesToSettlerImageUrls[0])
                    }

                    if (booking.settlerId) {
                        const fetchedSettler = await fetchSelectedUser(selectedBooking.settlerId || 'undefined');
                        if (fetchedSettler) {
                            setSettler(fetchedSettler);
                        }
                    }

                    const fetchedReview = await getReviewByBookingId(selectedBooking.catalogueService.id || 'undefined', selectedBooking.id || 'unefined');
                    if (fetchedReview) {
                        // Alert.alert('B Review found');
                        setReview(fetchedReview);
                    } else {
                        // Alert.alert('B Review not found');
                    }
                }
            } catch (error) {
                console.error('Failed to fetch selected borrowing details:', error);
            }
        } else {
            // Alert.alert('B Borrowing not found');
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!booking.id) return;

        const unsubscribe = subscribeToOneBooking(booking.id, (job) => {
            if (job) {
                console.log("Job updated:", job);
            } else {
                console.log("Job deleted or not found");
            }
        });

        const fetchData = async () => {
            if (booking) {
                // Alert.alert('2 Borrowing found');
                setImages(booking.catalogueService.imageUrls);
                setSelectedImage(booking.catalogueService.imageUrls[0]);
                setBooking(booking);

                if (booking.acceptors) {
                    setSelectedSettlerId(booking.acceptors[0].settlerId)
                }

                const selectedBooking = await fetchSelectedBooking(booking.id || 'undefined');
                if (selectedBooking && selectedBooking?.settlerId) {
                    const fetchedSettler = await fetchSelectedUser(selectedBooking.settlerId);
                    if (fetchedSettler) {
                        setSettler(fetchedSettler);
                    }

                    const fetchedReview = await getReviewByBookingId(selectedBooking.catalogueService.id || 'undefined', selectedBooking.id || 'undefined');
                    if (fetchedReview && fetchedReview.id) {
                        setReview(fetchedReview);
                    }
                }

                const bookingWithSettlerProfilesData = await Promise.all(
                    booking.acceptors!.map(async (profile) => {
                        const settlerProfileData = await fetchSelectedUser(profile.settlerId);
                        const settlerJobProfile = await fetchSelectedSettlerService(profile.settlerServiceId);
                        return {
                            ...booking,
                            settlerProfile: settlerProfileData,
                            settlerJobProfile: settlerJobProfile
                        }
                    })
                )

                setBookingWithSettlerProfiles(bookingWithSettlerProfilesData)

                if (selectedBooking?.notesToSettlerImageUrls) {
                    setSelectedNotesToSettlerImageUrl(selectedBooking.notesToSettlerImageUrls[0])
                }

            } else {
                // Alert.alert('B Borrowing not found');
            }
        };
        setStatus(booking.status);
        fetchData();
        return () => unsubscribe();
    }, [booking.id]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSelectedBookingData().then(() => setRefreshing(false));
    }, []);

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', weekday: 'short' };
        return date.toLocaleDateString('en-GB', options);
    };

    const steps = [
        { label: "Booking\nCreated", date: 'Job\nbroadcast', completed: (status ?? 0) >= 0 },
        { label: "Settler\nSelected", date: "Check\nservice code", completed: (status ?? 0) >= 1 },
        { label: "Active\nService", date: "\n", completed: (status ?? 0) >= 2 },
        { label: "Service\nCompleted", date: "Evaluate\ncompletion", completed: (status ?? 0) >= 3 },
        { label: "Booking\nCompleted", date: 'Release\npayment', completed: (status ?? 0) >= 5 },
    ];

    const actions = [
        { buttonTitle: 'Report Issue', onPressAction: () => Alert.alert('Report Issue Pressed') },
        { buttonTitle: 'Contact Support', onPressAction: () => Alert.alert('Contact Support Pressed') },
    ];


    const greetings = 'Hi there, thank you for your rent. We hope that you can take the advantage of this item during your borrowing period Beforehand, here’s the information that you might need during your borrowing terms.';

    // Handle release-payment methods
    const [currency] = useState('GBP');
    const [connectedAccountId] = useState('acct_1RiaVN4gRYsyHwtX'); // Replace with real lender ID

    // const handleReleasePayment = async () => {
    //     try {
    //         setLoading(true);
    //         const response = await axios.post(
    //             'https://us-central1-tags-1489a.cloudfunctions.net/api/release-to-lender',
    //             {
    //                 amount: (booking.total - booking.product.depositAmount) * 100,
    //                 currency,
    //                 connectedAccountId,
    //                 borrowingId: booking.id,
    //             }
    //         );

    //         Alert.alert('Success', 'Funds released to Lender!');
    //         return { success: true, data: response.data }; // ✅ return success and data
    //     } catch (error: any) {
    //         console.error('[Release Transfer Error]', error.response?.data || error.message);
    //         Alert.alert('Error', error.response?.data?.error || 'Transfer failed.');
    //         return { success: false, error: error.response?.data?.error || error.message }; // ✅ return failure
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const handleReleasePayment = async () => {
        return { success: true, data: {} };
    }

    return (
        <View style={{ backgroundColor: COLORS.background, flex: 1 }}>
            <View style={{ height: 60, borderBottomColor: COLORS.card, borderBottomWidth: 1 }}>
                <View
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 5 }}>
                    <View style={{ flex: 1, alignItems: 'flex-start' }}>
                        <TouchableOpacity
                            onPress={() => { index === 0 ? navigation.goBack() : setIndex(index - 1) }}
                            style={{
                                height: 40,
                                width: 40,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Ionicons size={30} color={COLORS.black} name='chevron-back-outline' />
                        </TouchableOpacity>
                    </View>
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.title, textAlign: 'center', marginVertical: 10 }}>Booking Details</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        {/* right header element */}
                    </View>
                </View>
            </View>
            {index === 0 && (
                <View>
                    {booking ? (
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ flexGrow: 1, paddingBottom: 70, alignItems: 'flex-start' }}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                            }
                        >
                            <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15, paddingBottom: 40 }]}>
                                {/* Progress Section */}
                                <View style={{ alignItems: "center", marginVertical: 20 }}>
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            width: "100%",
                                        }}
                                    >
                                        {steps.map((step, index) => (
                                            <View key={index} style={{ flex: 1, alignItems: "center" }}>
                                                {/* Connector line to previous step */}
                                                {index > 0 && (
                                                    <View
                                                        style={{
                                                            position: "absolute",
                                                            left: -((SIZES.width / steps.length) / 2 - 16), // half distance minus circle radius
                                                            top: 16, // vertical center of circle
                                                            width: (SIZES.width / steps.length) - 32, // width between circles
                                                            height: 2,
                                                            backgroundColor: step.completed ? COLORS.primary : "#f3f3f3",
                                                            zIndex: -1,
                                                        }}
                                                    />
                                                )}

                                                {/* Step Circle */}
                                                <View
                                                    style={{
                                                        height: 32,
                                                        width: 32,
                                                        borderRadius: 16,
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        backgroundColor: step.completed ? COLORS.primary : "#f3f3f3",
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: step.completed ? "white" : "gray",
                                                            fontSize: 18,
                                                            fontWeight: "bold",
                                                        }}
                                                    >
                                                        {step.completed ? "✓" : "X"}
                                                    </Text>
                                                </View>

                                                {/* Step Label + Date */}
                                                <Text
                                                    style={{
                                                        textAlign: "center",
                                                        fontSize: 12,
                                                        fontWeight: "600",
                                                        marginTop: 8,
                                                        color: COLORS.title,
                                                    }}
                                                >
                                                    {step.label}
                                                </Text>
                                                {step.date && (
                                                    <Text
                                                        style={{
                                                            textAlign: "center",
                                                            fontSize: 10,
                                                            color: "gray",
                                                        }}
                                                    >
                                                        {step.date}
                                                    </Text>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                </View>
                                {/* Collection Code Card */}
                                <View style={{ backgroundColor: "#f3f3f3", padding: 16, borderRadius: 12, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginVertical: 20, marginHorizontal: 10 }}>
                                    {status === 0 ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 4 }}>Broadcasting your service request</Text>
                                            <Text style={{ fontSize: 12, color: COLORS.blackLight2, textAlign: 'center' }}>This usually takes about 1-2 hours waiting</Text>
                                            <View style={[GlobalStyleSheet.line, { marginVertical: 10 }]} />
                                            {
                                                booking.acceptors && booking.acceptors.length === 0 ? (
                                                    <Text style={{ fontSize: 14, color: COLORS.danger, marginBottom: 8 }}>
                                                        No settler has accepted your job yet.
                                                    </Text>
                                                ) : (
                                                    <View style={{ width: '100%', }}>
                                                        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
                                                            <Text style={{ fontSize: 14, color: COLORS.black }}>Preferred Settler</Text>
                                                            <TouchableOpacity
                                                                onPress={() => { setIndex(1) }}
                                                            >
                                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                    <Text style={{ fontSize: 13, color: COLORS.blackLight, marginRight: 4 }}>
                                                                        More Settler
                                                                    </Text>
                                                                    <Ionicons name="chevron-forward-outline" size={18} color={COLORS.blackLight2} />
                                                                </View>
                                                            </TouchableOpacity>

                                                        </View>
                                                        {bookingWithSettlerProfiles && bookingWithSettlerProfiles[profileIndex] && (
                                                            <TouchableOpacity
                                                                key={index}
                                                                style={[{ paddingVertical: 10, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: "#ccc", backgroundColor: "#fff", }, bookingWithSettlerProfiles[profileIndex].settlerProfile?.uid === selectedSettlerId && { borderColor: COLORS.primary }]}
                                                                onPress={async () => {
                                                                    setIndex(2);
                                                                    setProfileIndex(index);
                                                                }}
                                                                activeOpacity={0.8}
                                                            >

                                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                                                                    <View>
                                                                        {
                                                                            bookingWithSettlerProfiles[profileIndex].settlerProfile?.profileImageUrl ? (
                                                                                <Image
                                                                                    source={{ uri: bookingWithSettlerProfiles[profileIndex].settlerProfile?.profileImageUrl }}
                                                                                    style={{
                                                                                        width: 50,
                                                                                        height: 50,
                                                                                        borderRadius: 20,
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <View
                                                                                    style={{
                                                                                        width: 50,
                                                                                        height: 50,
                                                                                        borderRadius: 20,
                                                                                        backgroundColor: COLORS.card,
                                                                                        justifyContent: 'center',
                                                                                        alignItems: 'center',
                                                                                    }}
                                                                                >
                                                                                    <Ionicons name="person" size={30} color={COLORS.blackLight} />
                                                                                </View>
                                                                            )
                                                                        }
                                                                    </View>
                                                                    <View style={{ flex: 7, paddingLeft: 20 }}>
                                                                        <TouchableOpacity onPress={() => {
                                                                            setProfileIndex(index);
                                                                            setIndex(2);
                                                                        }}>
                                                                            <View style={{}}>
                                                                                <Text style={{ fontSize: 17, fontWeight: 'bold', color: COLORS.black }} numberOfLines={1} ellipsizeMode="tail">{bookingWithSettlerProfiles[profileIndex].settlerProfile?.firstName} {bookingWithSettlerProfiles[profileIndex].settlerProfile?.lastName} [{profileIndex}]</Text>
                                                                            </View>
                                                                        </TouchableOpacity>
                                                                        <Text style={{ fontSize: 14, color: COLORS.black }}>{bookingWithSettlerProfiles[profileIndex].settlerJobProfile?.averageRatings === 0 ? 'No ratings' : `${bookingWithSettlerProfiles[profileIndex].settlerJobProfile?.averageRatings} (${bookingWithSettlerProfiles[profileIndex].settlerJobProfile?.jobsCount})`}</Text>
                                                                    </View>
                                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                        <Ionicons name="chevron-forward-outline" size={25} color={COLORS.blackLight2} />
                                                                    </View>
                                                                </View>
                                                            </TouchableOpacity>
                                                        )}
                                                        <View style={[GlobalStyleSheet.line, { marginTop: 10 }]} />
                                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center", paddingTop: 10 }}>
                                                            <Text style={{ fontWeight: 'bold' }}>Select this settler?</Text>
                                                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                                                                <TouchableOpacity
                                                                    style={{
                                                                        backgroundColor: COLORS.primary,
                                                                        padding: 10,
                                                                        borderRadius: 10,
                                                                        marginVertical: 10,
                                                                        width: '40%',
                                                                        alignItems: 'center',
                                                                    }}
                                                                    onPress={() => { }}
                                                                >
                                                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>No</Text>
                                                                </TouchableOpacity>
                                                                <TouchableOpacity
                                                                    style={{
                                                                        backgroundColor: COLORS.primary,
                                                                        padding: 10,
                                                                        borderRadius: 10,
                                                                        marginVertical: 10,
                                                                        width: '40%',
                                                                        alignItems: 'center',
                                                                    }}
                                                                    onPress={async () => {
                                                                        if (!booking.acceptors) {
                                                                            Alert.alert('No settlers found.');
                                                                            return;
                                                                        }

                                                                        const selectedAcceptor = booking.acceptors[profileIndex];
                                                                        if (!selectedAcceptor) {
                                                                            Alert.alert('Select a settler');
                                                                            return;
                                                                        }
                                                                        await updateBooking(booking.id || '', {
                                                                            status: status! + 1,
                                                                            settlerId: booking.acceptors[profileIndex].settlerId,
                                                                            settlerServiceId: booking.acceptors[profileIndex].settlerServiceId,
                                                                            settlerFirstName: booking.acceptors[profileIndex].firstName,
                                                                            settlerLastName: booking.acceptors[profileIndex].lastName,
                                                                            serviceStartCode: Math.floor(1000000 + Math.random() * 9000000).toString()
                                                                        });

                                                                        const selectedSettler = await fetchSelectedUser(booking.acceptors[profileIndex].settlerId || 'undefined');
                                                                        if (selectedSettler) {
                                                                            setSettler(selectedSettler);
                                                                        }

                                                                        setSelectedSettlerId(booking.settlerId || '');
                                                                        setSelectedSettlerFirstName(booking.settlerFirstName || '');
                                                                        setSelectedSettlerLastName(booking.settlerLastName || '');
                                                                        setStatus(status! + 1);
                                                                        onRefresh();
                                                                    }}
                                                                >
                                                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Yes</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    </View>
                                                )}
                                        </View>
                                    ) : status === 1 ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Your reference number is</Text>
                                            <Text style={{ fontSize: 24, fontWeight: "bold", color: "indigo" }}>{booking.serviceStartCode}</Text>
                                            <Text style={{ fontSize: 10, color: COLORS.blackLight2, textAlign: 'center', paddingBottom: 10 }}>Please check the code with your settler. The code must match between customer & settler before confirming.</Text>
                                            <View style={[GlobalStyleSheet.line]} />
                                            <View style={{ width: "100%", alignItems: "center", justifyContent: "center", paddingTop: 10 }}>
                                                <Text style={{ fontWeight: 'bold' }}>Please confirm this service start</Text>
                                                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                                                    <TouchableOpacity
                                                        style={{
                                                            backgroundColor: COLORS.primary,
                                                            padding: 10,
                                                            borderRadius: 10,
                                                            marginVertical: 10,
                                                            width: '40%',
                                                            alignItems: 'center',
                                                        }}
                                                        onPress={() => { }}
                                                    >
                                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>No</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={{
                                                            backgroundColor: COLORS.primary,
                                                            padding: 10,
                                                            borderRadius: 10,
                                                            marginVertical: 10,
                                                            width: '40%',
                                                            alignItems: 'center',
                                                        }}
                                                        onPress={async () => {
                                                            await updateBooking(booking.id || 'undefined', { status: status! + 1 });
                                                            setStatus(status! + 1);
                                                        }}
                                                    >
                                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Yes</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    ) : status === 2 ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text>The service is now in progress</Text>
                                            <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 4 }}>
                                                {booking?.selectedDate ? `${Math.ceil((new Date(booking.selectedDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left` : "N/A"}
                                            </Text>
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: COLORS.primary,
                                                    padding: 10,
                                                    borderRadius: 10,
                                                    marginVertical: 10,
                                                    width: '80%',
                                                    alignItems: 'center',
                                                }}
                                                onPress={() => { handleChat(user?.uid || '', booking.settlerId || ''); }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Message Settler</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : status === 3 ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontWeight: 'bold' }}>Please confirm your job completion</Text>
                                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: COLORS.primary,
                                                        padding: 10,
                                                        borderRadius: 10,
                                                        marginVertical: 10,
                                                        width: '40%',
                                                        alignItems: 'center',
                                                    }}
                                                    onPress={() => { }}
                                                >
                                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>No</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: COLORS.primary,
                                                        padding: 10,
                                                        borderRadius: 10,
                                                        marginVertical: 10,
                                                        width: '40%',
                                                        alignItems: 'center',
                                                    }}
                                                    onPress={async () => {
                                                        if (booking.id) {
                                                            await updateBooking(booking.id, { status: status! + 1 });

                                                            const selectedSettlerService = await fetchSelectedSettlerService(booking.settlerServiceId)

                                                            if (selectedSettlerService) {
                                                                const updatedJobsCount = selectedSettlerService?.jobsCount + 1
                                                                await updateSettlerService(booking.settlerServiceId, { jobsCount: updatedJobsCount })
                                                            }
                                                        }
                                                        setStatus(status! + 1);
                                                    }}
                                                >
                                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Yes</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ) : status === 4 ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>You're in cooldown period.</Text>
                                            <Text style={{ fontSize: 13, color: COLORS.blackLight2, textAlign: 'center', paddingBottom: 10 }}>Take this time to review the service and let us know if something doesn’t look right.</Text>
                                            <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 4 }}>
                                                {booking?.selectedDate ? `${Math.ceil((new Date(booking.selectedDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left` : "N/A"}
                                            </Text>
                                            <View style={[GlobalStyleSheet.line, { marginVertical: 10 }]} />
                                            <Text style={{ fontWeight: 'bold' }}>Release payment to settler?</Text>
                                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: COLORS.primary,
                                                        padding: 10,
                                                        borderRadius: 10,
                                                        marginVertical: 10,
                                                        width: '40%',
                                                        alignItems: 'center',
                                                    }}
                                                    onPress={() => { }}
                                                >
                                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>No</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: COLORS.primary,
                                                        padding: 10,
                                                        borderRadius: 10,
                                                        marginVertical: 10,
                                                        width: '40%',
                                                        alignItems: 'center',
                                                    }}
                                                    onPress={async () => {
                                                        if (booking.id) {
                                                            await updateBooking(booking.id, { status: status! + 1 });
                                                        }
                                                        setStatus(status! + 1);
                                                    }}
                                                >
                                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Yes</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ) : status === 7 ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Your settler just updated your quotation</Text>
                                            <Text style={{ fontSize: 13, color: COLORS.blackLight2, textAlign: 'center', paddingBottom: 10 }}>You can choose to accept or reject the update. Kindly discuss with the settler on-site.</Text>
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: COLORS.primary,
                                                    padding: 10,
                                                    borderRadius: 10,
                                                    marginVertical: 10,
                                                    width: '80%',
                                                    alignItems: 'center',
                                                }}
                                                onPress={() => { setIndex(3) }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>View Quotation Update</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontWeight: 'bold' }}>{booking.status === 5 ? 'Your feedback matters for this platform' : 'This job is completed'}</Text>
                                            {booking.status === 6 ? (
                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: COLORS.primary,
                                                        padding: 10,
                                                        borderRadius: 10,
                                                        marginVertical: 10,
                                                        width: '80%',
                                                        alignItems: 'center',
                                                    }}
                                                    onPress={() => {
                                                        console.log('Review found');
                                                        navigation.navigate('BookingAddReview', { booking: booking });
                                                    }}
                                                >
                                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>View Review</Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: COLORS.primary,
                                                        padding: 10,
                                                        borderRadius: 10,
                                                        marginVertical: 10,
                                                        width: '80%',
                                                        alignItems: 'center',
                                                    }}
                                                    onPress={() => {
                                                        console.log('Review found');
                                                        navigation.navigate('BookingAddReview', { booking: booking });
                                                    }}
                                                >
                                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Review</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )
                                    }
                                </View>
                                {/* Settler Details Card */}
                                <View style={{ width: '100%', paddingHorizontal: 15, borderRadius: 20, borderColor: COLORS.blackLight, borderWidth: 1, marginBottom: 20 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginVertical: 10 }}>
                                        <View style={{ flex: 1, alignItems: 'center', paddingLeft: 10 }}>
                                            {
                                                settler?.profileImageUrl ? (
                                                    <Image
                                                        source={{ uri: settler.profileImageUrl }}
                                                        style={{
                                                            width: 60,
                                                            height: 60,
                                                            borderRadius: 20,
                                                        }}
                                                    />
                                                ) : (
                                                    <View
                                                        style={{
                                                            width: 60,
                                                            height: 60,
                                                            borderRadius: 20,
                                                            backgroundColor: COLORS.card,
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <Ionicons name="person" size={30} color={COLORS.blackLight} />
                                                    </View>
                                                )
                                            }
                                        </View>
                                        <View style={{ flex: 7, paddingLeft: 20 }}>
                                            <TouchableOpacity onPress={() => navigation.navigate('QuoteService', { service: booking.catalogueService })}>
                                                <View style={{ width: SIZES.width * 0.63 }}>
                                                    <Text style={{ fontSize: 17, fontWeight: 'bold', color: COLORS.black }} numberOfLines={1} ellipsizeMode="tail">Settled by: {booking.settlerFirstName} {booking.settlerLastName}</Text>
                                                </View>
                                            </TouchableOpacity>
                                            <Text style={{ fontSize: 14, color: COLORS.black }}>4.5 ratings</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => { if (user && settler) handleChat(user.uid, settler.uid) }}
                                            style={{
                                                backgroundColor: COLORS.borderColor,
                                                padding: 15,
                                                borderRadius: 10,
                                            }}
                                        >
                                            <Ionicons name="chatbubble-ellipses-outline" size={24} color={COLORS.blackLight2} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={[GlobalStyleSheet.line]} />
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {buttons.map((btn: any, i: number) => (
                                        <View key={i} style={{ flexDirection: 'row', width: SIZES.width * 0.5, paddingHorizontal: 10, paddingTop: 20, justifyContent: 'space-between', alignItems: 'center', }} >
                                            <TouchableOpacity
                                                key={btn}
                                                style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}
                                                onPress={() => {
                                                    setActiveIndex(i);
                                                    if (onCLick) {
                                                        onCLick(i);
                                                    }
                                                }}
                                            >
                                                <Text style={{ color: COLORS.text, paddingBottom: 5 }}>{btn}</Text>
                                                {activeIndex === i && (
                                                    <View style={{ height: 3, width: '100%', backgroundColor: 'black' }} />
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>

                                <ScrollView
                                    ref={scrollViewHome}
                                    horizontal
                                    pagingEnabled
                                    scrollEventThrottle={16}
                                    scrollEnabled={false}
                                    decelerationRate="fast"
                                    style={{ width: SIZES.width, paddingHorizontal: 10 }}
                                    showsHorizontalScrollIndicator={false}
                                    onScroll={Animated.event(
                                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                                        { useNativeDriver: false },
                                    )}
                                >
                                    {buttons.map((button, index) => (
                                        <View key={index} style={{ width: SIZES.width }}>
                                            <View style={{ width: '90%' }}>
                                                {index === 0 && (
                                                    <View style={{ width: '100%', paddingTop: 20, gap: 10 }}>
                                                        {/* Product Info */}
                                                        <View style={{ flexDirection: "row", marginBottom: 20 }}>
                                                            <Image
                                                                source={{ uri: images[0] }}
                                                                style={{ width: 100, height: 100, borderRadius: 8, marginRight: 16 }}
                                                            />
                                                            <View style={{ flex: 1, marginTop: 5 }}>
                                                                <Text style={{ fontSize: 16, marginBottom: 5 }}>
                                                                    <Text style={{ color: "#E63946", fontWeight: "bold" }}>£{booking.total}</Text> / Session {" "}
                                                                    {/* <Text style={styles.originalPrice}>£40.20</Text> */}
                                                                </Text>
                                                                <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5, color: COLORS.title }}>{booking.catalogueService.title}</Text>
                                                                <Text style={{ fontSize: 12, color: COLORS.black }}>Product ID: {booking.catalogueService.id}</Text>
                                                            </View>
                                                        </View>
                                                        <View style={GlobalStyleSheet.line} />
                                                        {/* Borrowing Period and Delivery Method */}
                                                        <View
                                                            style={{
                                                                flexDirection: "row",
                                                                justifyContent: "space-between",
                                                                alignItems: "flex-start",
                                                                marginBottom: 10,
                                                                width: "100%",
                                                                gap: 10, // optional, for small spacing between columns
                                                            }}
                                                        >
                                                            {/* Left Column */}
                                                            <View style={{ flex: 1, paddingVertical: 10 }}>
                                                                <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.title }}>Booking ID:</Text>
                                                                <Text style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
                                                                    {booking.id}
                                                                </Text>

                                                                <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.title }}>Service Location:</Text>
                                                                <Text style={{ fontSize: 14, color: "#666" }}>
                                                                    {booking.selectedAddress?.addressName || ""}
                                                                </Text>
                                                            </View>

                                                            {/* Right Column */}
                                                            <View style={{ flex: 1, paddingVertical: 10 }}>
                                                                <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.title }}>Reference Number:</Text>
                                                                <Text style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
                                                                    {booking.serviceStartCode || "N/A"}
                                                                </Text>

                                                                <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.title }}>Service Date:</Text>
                                                                <Text style={{ fontSize: 14, color: COLORS.title }}>
                                                                    {booking.selectedDate}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <View style={GlobalStyleSheet.line} />
                                                        {/* Borrowing Rate Breakdown */}
                                                        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5, color: COLORS.title, marginTop: 10 }}>Service Pricing Breakdown</Text>
                                                        <View style={{ marginBottom: 20 }}>
                                                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                                                <Text style={{ fontSize: 14, color: "#333" }}>Service Price</Text>
                                                                <Text style={{ fontSize: 14, fontWeight: "bold" }}>£{booking.catalogueService.basePrice}</Text>
                                                            </View>
                                                            {booking.addons && booking.addons.map((addon) => (
                                                                <View key={addon.name} style={{ flexDirection: "column" }}>
                                                                    {addon.subOptions.map((opt) => (
                                                                        <View key={opt.label} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                                                            <Text style={{ fontSize: 14, color: "#333" }}>
                                                                                {addon.name}: {opt.label}
                                                                            </Text>
                                                                            <Text style={{ fontSize: 14, color: "#333", fontWeight: 'bold' }}>£{opt.additionalPrice}</Text>
                                                                        </View>
                                                                    ))}
                                                                </View>
                                                            ))}
                                                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                                                <Text style={{ fontSize: 14, color: "#333" }}>Platform Fee</Text>
                                                                <Text style={{ fontSize: 14, color: "#333" }}></Text>
                                                                <Text style={{ fontSize: 14, fontWeight: "bold" }}>£2.00</Text>
                                                            </View>
                                                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                                                <View style={{ justifyContent: 'center', alignItems: 'flex-start' }}>
                                                                    <Text style={{ fontSize: 14, color: "#333" }}>Additional Charge (by settler)</Text>
                                                                    <Text style={{ fontSize: 14, width: SIZES.width * 0.8, marginTop: 5, color: "#333", backgroundColor: COLORS.primaryLight, padding: 10, borderRadius: 10, }}>{booking.manualQuoteDescription}</Text>
                                                                </View>
                                                                <View style={{ justifyContent: 'center' }}>
                                                                    <Text style={{ fontSize: 14, fontWeight: "bold" }}>RM{booking.manualQuotePrice}</Text>
                                                                </View>
                                                            </View>
                                                            <View style={[{ backgroundColor: COLORS.black, height: 1, margin: 10, width: '90%', alignSelf: 'center' },]} />
                                                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                                                <Text style={{ fontSize: 14, fontWeight: "bold" }}>Total</Text>
                                                                <Text style={{ fontSize: 14, color: "#333", fontWeight: "bold" }}>£{booking.total}</Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                )}
                                                {index === 1 && (
                                                    <View style={{ width: '100%', paddingTop: 20, gap: 10 }}>
                                                        <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.title, marginTop: 10 }}>Notes to Settler</Text>
                                                        <View
                                                            style={{
                                                                width: '100%',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                gap: 10,
                                                                paddingTop: 0,
                                                            }}
                                                        >
                                                            {/* Large Preview Image */}
                                                            {booking.notesToSettlerImageUrls ? (
                                                                <View
                                                                    style={{
                                                                        flex: 1,
                                                                        width: '100%',
                                                                        justifyContent: 'flex-start',
                                                                        alignItems: 'flex-start',
                                                                    }}
                                                                >
                                                                    <Image
                                                                        source={{ uri: selectedNotesToSettlerImageUrl || booking.notesToSettlerImageUrls[0] }}
                                                                        style={{
                                                                            width: '100%',
                                                                            height: 300,
                                                                            borderRadius: 10,
                                                                            marginBottom: 10,
                                                                        }}
                                                                        resizeMode="cover"
                                                                    />

                                                                    {/* Thumbnail List */}
                                                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                                        {booking.notesToSettlerImageUrls.map((imageUri, index) => (
                                                                            <TouchableOpacity
                                                                                key={index}
                                                                                onPress={() => setSelectedNotesToSettlerImageUrl(imageUri)}
                                                                            >
                                                                                <Image
                                                                                    source={{ uri: imageUri }}
                                                                                    style={{
                                                                                        width: 80,
                                                                                        height: 80,
                                                                                        marginRight: 10,
                                                                                        borderRadius: 10,
                                                                                        borderWidth: selectedNotesToSettlerImageUrl === imageUri ? 3 : 0,
                                                                                        borderColor:
                                                                                            selectedNotesToSettlerImageUrl === imageUri
                                                                                                ? COLORS.primary
                                                                                                : 'transparent',
                                                                                    }}
                                                                                />
                                                                            </TouchableOpacity>
                                                                        ))}
                                                                    </ScrollView>
                                                                    {selectedNotesToSettlerImageUrl && (
                                                                        <View style={{ width: '100%' }}>
                                                                            <Text style={{ fontSize: 15, fontWeight: "bold", color: COLORS.title, marginVertical: 10 }}>Add what do you want the settler to know here</Text>
                                                                            <Input
                                                                                readOnly={true}
                                                                                backround={COLORS.card}
                                                                                style={{
                                                                                    fontSize: 12,
                                                                                    borderRadius: 12,
                                                                                    backgroundColor: COLORS.input,
                                                                                    borderColor: COLORS.inputBorder,
                                                                                    borderWidth: 1,
                                                                                    height: 150,
                                                                                }}
                                                                                inputicon
                                                                                placeholder={`e.g. Got a grassy platform.`}
                                                                                multiline={true}  // Enable multi-line input
                                                                                numberOfLines={10} // Suggest the input area size
                                                                                value={booking.notesToSettler ? booking.notesToSettler : ''}
                                                                            />
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            ) : (
                                                                // Placeholder when no image is selected
                                                                <TouchableOpacity
                                                                    onPress={() => { }}
                                                                    activeOpacity={0.8}
                                                                    style={{
                                                                        width: '100%',
                                                                        height: 100,
                                                                        borderRadius: 10,
                                                                        marginBottom: 10,
                                                                        backgroundColor: COLORS.card,
                                                                        justifyContent: 'center',
                                                                        alignItems: 'center',
                                                                        borderWidth: 1,
                                                                        borderColor: COLORS.blackLight,
                                                                    }}
                                                                >
                                                                    <Ionicons name="add-outline" size={30} color={COLORS.blackLight} />
                                                                    <Text style={{ color: COLORS.blackLight, fontSize: 14 }}>
                                                                        No photos
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            )}
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </ScrollView>
                                <View style={[GlobalStyleSheet.line, { marginTop: 15 }]} />
                                <View style={{ width: '100%', }}>
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>Quick Actions</Text>
                                    <FlatList
                                        scrollEnabled={false}
                                        data={actions}
                                        keyExtractor={(item, index) => index.toString()}
                                        numColumns={2}
                                        columnWrapperStyle={{ justifyContent: 'space-between', marginTop: 20 }}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: COLORS.background,
                                                    padding: 10,
                                                    borderRadius: 10,
                                                    borderWidth: 1,
                                                    borderColor: COLORS.blackLight,
                                                    width: '48%',
                                                    alignItems: 'center',
                                                }}
                                                onPress={item.onPressAction}
                                            >
                                                <Text style={{ color: COLORS.black, fontWeight: 'bold' }}>{item.buttonTitle}</Text>
                                            </TouchableOpacity>
                                        )}
                                    />
                                    <View style={{ marginTop: 40 }} >
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            style={{
                                                paddingHorizontal: 20,
                                                borderRadius: 30,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 10
                                            }}
                                            onPress={() => { }}
                                        >
                                            <Text style={{ fontSize: 14, color: COLORS.danger, lineHeight: 21, fontWeight: 'bold', textDecorationLine: 'underline' }}>Cancel Booking</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: COLORS.black }}>Product not found 404</Text>
                        </View>
                    )}
                </View>
            )}
            {index === 1 && (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 70, paddingHorizontal: 10, alignItems: 'flex-start' }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {bookingWithSettlerProfiles && bookingWithSettlerProfiles.map((profile, index) => {
                        const isSelected = selectedSettlerId === profile.settlerProfile?.uid;
                        return (
                            <View style={{ width: '100%', paddingVertical: 10 }}>
                                <TouchableOpacity
                                    key={index}
                                    style={[{ paddingVertical: 10, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: "#ccc", backgroundColor: "#fff", }, isSelected && { borderColor: COLORS.primary }]}
                                    onPress={async () => {
                                        setProfileIndex(index);
                                        setIndex(1);
                                    }}
                                    activeOpacity={0.8}
                                >

                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                                        <View>
                                            {
                                                profile.settlerProfile?.profileImageUrl ? (
                                                    <Image
                                                        source={{ uri: profile.settlerProfile?.profileImageUrl }}
                                                        style={{
                                                            width: 50,
                                                            height: 50,
                                                            borderRadius: 20,
                                                        }}
                                                    />
                                                ) : (
                                                    <View
                                                        style={{
                                                            width: 50,
                                                            height: 50,
                                                            borderRadius: 20,
                                                            backgroundColor: COLORS.card,
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <Ionicons name="person" size={30} color={COLORS.blackLight} />
                                                    </View>
                                                )
                                            }
                                        </View>
                                        <View style={{ flex: 7, paddingLeft: 20 }}>
                                            <TouchableOpacity onPress={() => {
                                                setIndex(0);
                                                setProfileIndex(index);
                                                setSelectedSettlerId(profile.settlerProfile?.uid || '');
                                            }}>
                                                <View style={{}}>
                                                    <Text style={{ fontSize: 17, fontWeight: 'bold', color: COLORS.black }} numberOfLines={1} ellipsizeMode="tail">{profile.settlerProfile?.firstName} {profile.settlerProfile?.lastName}</Text>
                                                    <Text style={{ fontSize: 14, color: COLORS.black }}>{profile.settlerJobProfile?.averageRatings === 0 ? 'No ratings' : `${profile.settlerJobProfile?.averageRatings} (${profile.settlerJobProfile?.jobsCount})`}</Text>
                                                    <Text>{profile.settlerJobProfile?.serviceCardBrief}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={{ flex: 1, alignItems: 'flex-start' }}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setIndex(2);
                                                    setProfileIndex(index);
                                                }}
                                                style={{
                                                    height: 40,
                                                    width: 40,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Ionicons size={30} color={COLORS.black} name='chevron-forward-outline' />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </ScrollView>
            )}
            {index === 2 && (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 70, paddingHorizontal: 10, alignItems: 'flex-start' }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {bookingWithSettlerProfiles && bookingWithSettlerProfiles[profileIndex] && (
                        <View style={{ width: '100%', paddingHorizontal: 15 }}>
                            <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', paddingTop: 40 }}>
                                {
                                    bookingWithSettlerProfiles[profileIndex].settlerProfile?.profileImageUrl ? (
                                        <Image
                                            source={{ uri: bookingWithSettlerProfiles[profileIndex].settlerProfile?.profileImageUrl }}
                                            style={{
                                                width: 100,
                                                height: 100,
                                                borderRadius: 50,
                                            }}
                                        />
                                    ) : (
                                        <View
                                            style={{
                                                width: 100,
                                                height: 100,
                                                borderRadius: 50,
                                                backgroundColor: COLORS.card,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Ionicons name="person" size={30} color={COLORS.blackLight} />
                                        </View>
                                    )
                                }
                                <Text style={{ paddingTop: 10, fontSize: 16, fontWeight: 'bold' }}>{bookingWithSettlerProfiles[profileIndex].settlerProfile?.firstName} {bookingWithSettlerProfiles[profileIndex].settlerProfile?.lastName}</Text>
                                <Text style={{ paddingBottom: 10 }}>
                                    In service since {bookingWithSettlerProfiles[profileIndex].settlerProfile!.createAt
                                        .toDate()
                                        .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </Text>
                            </View>
                            <View style={[GlobalStyleSheet.line]} />
                            <Text style={{ paddingTop: 10, fontSize: 14, fontWeight: 'bold' }}>Bio.</Text>
                            <Text style={{ paddingVertical: 10 }}>{bookingWithSettlerProfiles[profileIndex].settlerJobProfile?.serviceCardBrief}</Text>
                            <View style={[GlobalStyleSheet.line]} />
                            <Text style={{ paddingTop: 10, fontSize: 14, fontWeight: 'bold' }}>Service Gallery</Text>
                            <Text style={{ paddingTop: 10 }}>On the way</Text>
                        </View>
                    )}
                </ScrollView>
            )}
            {index === 3 && (
                <View>
                    {booking ? (
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 70, alignItems: 'center' }}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                            }
                        >
                            <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15, paddingBottom: 40 }]}>
                                {/* Settler Details Card */}
                                <View style={{ backgroundColor: "#f3f3f3", padding: 16, borderRadius: 12, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginVertical: 20, marginHorizontal: 10 }}>
                                    <View style={{ width: "100%", alignItems: "center", justifyContent: "center", paddingTop: 10 }}>
                                        <Text style={{ fontWeight: 'bold' }}>Please Respond to This Quotation Update</Text>
                                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: COLORS.primary,
                                                    padding: 10,
                                                    borderRadius: 10,
                                                    marginVertical: 10,
                                                    width: '40%',
                                                    alignItems: 'center',
                                                }}
                                                onPress={async () => {
                                                    await updateBooking(booking.id!, {
                                                        newAddons: deleteField(),
                                                        newTotal: deleteField(),
                                                        newManualQuoteDescription: deleteField(),
                                                        newManualQuotePrice: deleteField(),
                                                        isQuoteUpdateSuccess: false,
                                                        status: 2,
                                                    });
                                                    setIndex(0);
                                                }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>No</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: COLORS.primary,
                                                    padding: 10,
                                                    borderRadius: 10,
                                                    marginVertical: 10,
                                                    width: '40%',
                                                    alignItems: 'center',
                                                }}
                                                onPress={async () => {
                                                    await updateBooking(booking.id!, {
                                                        addons: booking.newAddons,
                                                        total: booking.newTotal,
                                                        manualQuoteDescription: booking.newManualQuoteDescription,
                                                        manualQuotePrice: booking.newManualQuotePrice,
                                                        newAddons: deleteField(),
                                                        newTotal: deleteField(),
                                                        newManualQuoteDescription: deleteField(),
                                                        newManualQuotePrice: deleteField(),
                                                        isQuoteUpdateSuccess: true,
                                                        status: 2
                                                    });
                                                    setIndex(0);
                                                }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Yes</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <View style={[GlobalStyleSheet.line]} />
                                <View style={{ width: '100%', paddingTop: 20, gap: 10 }}>
                                    {/* Product Info */}
                                    <View style={{ flexDirection: "row", marginBottom: 20 }}>
                                        <Image
                                            source={{ uri: images[0] }}
                                            style={{ width: 100, height: 100, borderRadius: 8, marginRight: 16 }}
                                        />
                                        <View style={{ flex: 1, marginTop: 5 }}>
                                            <Text style={{ fontSize: 16, marginBottom: 5 }}>
                                                <Text style={{ color: "#E63946", fontWeight: "bold" }}>£{booking.total}</Text> / Session {" "}
                                                {/* <Text style={styles.originalPrice}>£40.20</Text> */}
                                            </Text>
                                            <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5, color: COLORS.title }}>{booking.catalogueService.title}</Text>
                                            <Text style={{ fontSize: 12, color: COLORS.black }}>Product ID: {booking.catalogueService.id}</Text>
                                        </View>
                                    </View>
                                    <View style={GlobalStyleSheet.line} />
                                    {/* Borrowing Period and Delivery Method */}
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            marginBottom: 10,
                                            width: "100%",
                                            gap: 10, // optional, for small spacing between columns
                                        }}
                                    >
                                        {/* Left Column */}
                                        <View style={{ flex: 1, paddingVertical: 10 }}>
                                            <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.title }}>Booking ID:</Text>
                                            <Text style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
                                                {booking.id}
                                            </Text>

                                            <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.title }}>Service Location:</Text>
                                            <Text style={{ fontSize: 14, color: "#666" }}>
                                                {booking.selectedAddress?.addressName || ""}
                                            </Text>
                                        </View>

                                        {/* Right Column */}
                                        <View style={{ flex: 1, paddingVertical: 10 }}>
                                            <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.title }}>Reference Number:</Text>
                                            <Text style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
                                                {booking.serviceStartCode || "N/A"}
                                            </Text>

                                            <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.title }}>Service Date:</Text>
                                            <Text style={{ fontSize: 14, color: COLORS.title }}>
                                                {booking.selectedDate}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={GlobalStyleSheet.line} />
                                    {/* Borrowing Rate Breakdown */}
                                    <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5, color: COLORS.title, marginTop: 10 }}>Service Pricing Breakdown</Text>
                                    <View style={{ marginBottom: 20 }}>
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                            <Text style={{ fontSize: 14, color: "#333" }}>Service Price</Text>
                                            <Text style={{ fontSize: 14, fontWeight: "bold" }}>£{booking.catalogueService.basePrice}</Text>
                                        </View>
                                        {booking.newAddons && booking.newAddons.map((addon) => (
                                            <View key={addon.name} style={{ flexDirection: "column" }}>
                                                {addon.subOptions.map((opt) => (
                                                    <View key={opt.label} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                                        <Text style={{ fontSize: 14, color: "#333" }}>
                                                            {addon.name}: {opt.label}
                                                        </Text>
                                                        <Text style={{ fontSize: 14, color: "#333", fontWeight: 'bold' }}>£{opt.additionalPrice}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        ))}
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                            <Text style={{ fontSize: 14, color: "#333" }}>Platform Fee</Text>
                                            <Text style={{ fontSize: 14, color: "#333" }}></Text>
                                            <Text style={{ fontSize: 14, fontWeight: "bold" }}>£2.00</Text>
                                        </View>
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                            <View style={{ justifyContent: 'center', alignItems: 'flex-start' }}>
                                                <Text style={{ fontSize: 14, color: "#333" }}>Additional Charge (by settler)</Text>
                                                <Text style={{ fontSize: 14, width: SIZES.width * 0.8, marginTop: 5, color: "#333", backgroundColor: COLORS.primaryLight, padding: 10, borderRadius: 10, }}>{booking.newManualQuoteDescription}</Text>
                                            </View>
                                            <View style={{ justifyContent: 'center' }}>
                                                <Text style={{ fontSize: 14, fontWeight: "bold" }}>RM{booking.newManualQuotePrice}</Text>
                                            </View>
                                        </View>
                                        <View style={[{ backgroundColor: COLORS.black, height: 1, margin: 10, width: '90%', alignSelf: 'center' },]} />
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                            <Text style={{ fontSize: 14, fontWeight: "bold" }}>Total</Text>
                                            <Text style={{ fontSize: 14, color: "#333", fontWeight: "bold" }}>£{booking.newTotal}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={[GlobalStyleSheet.line, { marginTop: 15 }]} />
                                <View style={{ width: '100%', }}>
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>Quick Actions</Text>
                                    <FlatList
                                        scrollEnabled={false}
                                        data={actions}
                                        keyExtractor={(item, index) => index.toString()}
                                        numColumns={2}
                                        columnWrapperStyle={{ justifyContent: 'space-between', marginTop: 20 }}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: COLORS.background,
                                                    padding: 10,
                                                    borderRadius: 10,
                                                    borderWidth: 1,
                                                    borderColor: COLORS.blackLight,
                                                    width: '48%',
                                                    alignItems: 'center',
                                                }}
                                                onPress={item.onPressAction}
                                            >
                                                <Text style={{ color: COLORS.black, fontWeight: 'bold' }}>{item.buttonTitle}</Text>
                                            </TouchableOpacity>
                                        )}
                                    />
                                    <View style={{ marginTop: 40 }} >
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            style={{
                                                paddingHorizontal: 20,
                                                borderRadius: 30,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 10
                                            }}
                                            onPress={() => { }}
                                        >
                                            <Text style={{ fontSize: 14, color: COLORS.danger, lineHeight: 21, fontWeight: 'bold', textDecorationLine: 'underline' }}>Cancel Booking</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: COLORS.black }}>Product not found 404</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    )
}

export default MyBookingDetails