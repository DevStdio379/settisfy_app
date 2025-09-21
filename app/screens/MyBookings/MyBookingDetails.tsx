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
import { createReview, getReviewByBorrowingId, Review } from '../../services/ReviewServices';
import axios from 'axios';
import { Booking, fetchSelectedBooking, updateBooking } from '../../services/BookingServices';

type MyBorrowingDetailsScreenProps = StackScreenProps<RootStackParamList, 'MyBookingDetails'>;


const MyBorrowingDetails = ({ navigation, route }: MyBorrowingDetailsScreenProps) => {

    const { user } = useUser();
    const mapRef = useRef<MapView | null>(null);
    const [booking, setBooking] = useState<Booking>(route.params.booking);
    const [accordionOpen, setAccordionOpen] = useState<{ [key: string]: boolean }>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [owner, setOwner] = useState<User>();
    const [images, setImages] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [status, setStatus] = useState<number>(booking.status);

    const scrollViewHome = useRef<any>(null);
    const buttons = ['Transaction Summary', 'Instructions'];
    const scrollX = useRef(new Animated.Value(0)).current;
    const onCLick = (i: any) => scrollViewHome.current.scrollTo({ x: i * SIZES.width });
    const [activeIndex, setActiveIndex] = useState(0);

    const CODE_LENGTH = 7;
    const [returnCode, setCollectionCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const inputs = useRef<Array<TextInput | null>>(Array(CODE_LENGTH).fill(null));
    const [review, setReview] = useState<Review>();

    const handleChange = (text: string, index: number) => {
        if (/^\d?$/.test(text)) {
            const newPin = [...returnCode];
            newPin[index] = text;
            setCollectionCode(newPin);

            // Move focus to the next input if a digit is entered
            if (text && index < CODE_LENGTH - 1) {
                inputs.current[index + 1]?.focus();
            }

            // Validate when full PIN is entered
            if (newPin.every((digit) => digit !== "")) {
                validatePin(newPin.join(""));
            }
        }
    };

    const validatePin = async (enteredPin: string) => {
        const correctPin = booking.serviceEndCode; // Replace with actual validation logic
        if (enteredPin === correctPin) {
            await updateBooking(booking.id || 'undefined', { status: status! + 1 });
            setStatus(status! + 1);
            setCollectionCode(Array(CODE_LENGTH).fill("")); // Reset input
            inputs.current[0]?.focus(); // Focus back to first input
            setValidationMessage("Success. PIN is correct!");
        } else {
            Alert.alert("Error", "Invalid PIN. Try again.");
            setCollectionCode(Array(CODE_LENGTH).fill("")); // Reset input
            inputs.current[0]?.focus(); // Focus back to first input
            setValidationMessage("Invalid PIN. Try again.");
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === "Backspace" && returnCode[index] === "" && index > 0) {
            inputs.current[index - 1]?.focus();
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

                    // const fetchedOwner = await fetchSelectedUser(selectedBooking.settlerId || 'undefined');
                    // if (fetchedOwner) {
                    //     setOwner(fetchedOwner);
                    // }

                    const fetchedReview = await getReviewByBorrowingId(selectedBooking.productId || 'undefined', selectedBooking.id || 'unefined');
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
        const fetchData = async () => {
            if (booking) {
                // Alert.alert('2 Borrowing found');
                setImages(booking.imageUrls);
                setSelectedImage(booking.imageUrls[0]);
                setBooking(booking);

                const selectedBooking = await fetchSelectedBooking(booking.id || 'undefined');
                if (selectedBooking) {
                    // const fetchedOwner = await fetchSelectedUser(selectedBorrowing.product.ownerID);
                    // if (fetchedOwner) {
                    //     setOwner(fetchedOwner);
                    // }

                    const fetchedReview = await getReviewByBorrowingId(selectedBooking.productId || 'undefined', selectedBooking.productId || 'undefined');
                    if (fetchedReview && fetchedReview.id) {
                        setReview(fetchedReview);
                    }
                }
            } else {
                // Alert.alert('B Borrowing not found');
            }
        };
        setStatus(booking.status);
        fetchData();
    }, [booking]);

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
        { label: "Booking\nCreated", date: `${formatDate(booking.selectedDate)}`, completed: (status ?? 0) >= 0 },
        { label: "Service\nInitiated", date: "Show start\ncode", completed: (status ?? 0) > 2 },
        { label: "Active\nService", date: "\n", completed: (status ?? 0) > 2 },
        { label: "Service\nCompletion", date: "Enter complete\ncode", completed: (status ?? 0) > 3 },
        { label: "Booking\nCompleted", date: `${formatDate(booking?.selectedDate)}`, completed: (status ?? 0) > 5 },
    ];

    const actions = [
        { buttonTitle: 'Extend Borrowing', onPressAction: () => Alert.alert('Extend Borrowing Pressed') },
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
                            onPress={() => navigation.goBack()}
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
                        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", height: 50 }}>
                            {steps.map((step, index) => (
                                <View key={index} style={{ flexDirection: "row", alignItems: "center" }}>
                                    {/* Line Connector */}
                                    {index > 0 && <View style={{ width: 45, height: 2, backgroundColor: step.completed ? COLORS.primary : "#f3f3f3" }} />}
                                    {/* Circle or X */}
                                    <View style={{ alignItems: "center", justifyContent: "center" }}>
                                        {step.completed ? (
                                            <View style={{ height: 32, width: 32, backgroundColor: COLORS.primary, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
                                                <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>✓</Text>
                                            </View>
                                        ) : (
                                            <View style={{ backgroundColor: "#f3f3f3", height: 32, width: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
                                                <Text style={{ color: "gray", fontSize: 18 }}>X</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                        {/* Progress Section */}
                        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", height: 60 }}>
                            {steps.map((step, index) => (
                                <View key={index} style={{ alignItems: "center", paddingHorizontal: 10 }}>
                                    {/* Label */}
                                    <Text style={{ textAlign: "center", fontSize: 12, fontWeight: "600", marginTop: 8 }}>{step.label}</Text>
                                    {step.date && <Text style={{ textAlign: "center", fontSize: 10, color: "gray" }}>{step.date}</Text>}
                                </View>
                            ))}
                        </View>
                        {/* Collection Code Card */}
                        <View style={{ backgroundColor: "#f3f3f3", padding: 16, borderRadius: 12, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginVertical: 20, marginHorizontal: 10 }}>
                            {status === 0 ? (
                                <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                    <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 4 }}>Broadcasting your service job</Text>
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: COLORS.primary,
                                            padding: 10,
                                            borderRadius: 10,
                                            marginVertical: 10,
                                            width: '80%',
                                            alignItems: 'center',
                                        }}
                                        onPress={async () => {
                                            await updateBooking(booking.id || 'undefined', { status: status! + 1, serviceStartCode: Math.floor(1000000 + Math.random() * 9000000).toString() });
                                            setStatus(status! + 1);
                                            onRefresh();
                                        }}
                                    >
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>[Demo] Manual Accept</Text>
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 10, color: COLORS.black, textAlign: 'center' }}>This usually takes about 1-2 hours waiting</Text>
                                </View>
                            ) : status === 1 ? (
                                <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Please provide this code to our settler</Text>
                                    <Text style={{ fontSize: 24, fontWeight: "bold", color: "indigo" }}>{booking.serviceStartCode}</Text>
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: COLORS.primary,
                                            padding: 10,
                                            borderRadius: 10,
                                            marginVertical: 10,
                                            width: '80%',
                                            alignItems: 'center',
                                        }}
                                        onPress={async () => {
                                            await updateBooking(booking.id || 'undefined', { status: status! + 1 });
                                            setStatus(status! + 1);
                                            onRefresh();
                                        }}
                                    >
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>[Demo] Settler Enter Given Code</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : status === 2 ? (
                                <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                    <Text style={{ fontWeight: 'bold' }}>Please confirm the starting of this service</Text>
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
                                                // const result = await handleReleasePayment();

                                                // if (result.success) {
                                                //     // console.log('Transfer ID:', result.data.transferId);
                                                //     await updateBorrowing(booking.id || 'undefined', { status: status! + 1 });
                                                //     setStatus(status! + 1);
                                                // } else {
                                                //     // console.log('Release failed:', result.error);
                                                // }
                                                await updateBooking(booking.id || 'undefined', { status: status! + 1 });
                                                setStatus(status! + 1);
                                            }}
                                        >
                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Yes {booking.total}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : status === 3 ? (
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
                                        onPress={async () => {
                                            await updateBooking(booking.id || 'undefined', { status: status! + 1, serviceEndCode: Math.floor(1000000 + Math.random() * 9000000).toString() });
                                            setStatus(status! + 1);
                                            onRefresh();
                                        }}
                                    >
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>[Demo] End Task By Settler</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : status === 4 ? (
                                <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                    <Text style={{ fontSize: 16, fontWeight: "500" }}>Enter Completion Code</Text>
                                    <Text style={{ fontSize: 13, marginBottom: 10, color: COLORS.blackLight2 }}>Kindly ask our settler for the completion code</Text>
                                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                                        {returnCode.map((digit, index) => (
                                            <TextInput
                                                key={index}
                                                ref={(el) => { inputs.current[index] = el; }}
                                                style={{ width: 35, height: 50, borderWidth: 2, borderColor: COLORS.blackLight, textAlign: "center", fontSize: 20, borderRadius: 10 }}
                                                keyboardType="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChangeText={(text) => handleChange(text, index)}
                                                onKeyPress={(e) => handleKeyPress(e, index)}
                                                returnKeyType="done"
                                            />
                                        ))}
                                    </View>
                                    <Text style={{ fontSize: 12, marginBottom: 4, marginTop: 10, color: COLORS.danger }}>{validationMessage}</Text>
                                    <Text style={{ fontSize: 13, marginBottom: 10, color: COLORS.blackLight2 }}>{booking.serviceEndCode}</Text>
                                </View>
                            ) : status === 5 ? (
                                <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                    <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 4 }}>Awaiting settler completion confirmation</Text>
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: COLORS.primary,
                                            padding: 10,
                                            borderRadius: 10,
                                            marginVertical: 10,
                                            width: '80%',
                                            alignItems: 'center',
                                        }}
                                        onPress={async () => {
                                            await updateBorrowing(booking.id || 'undefined', { status: status! + 1 });
                                            setStatus(status! + 1);
                                        }}
                                    >
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Message settler</Text>
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 10, color: COLORS.black, textAlign: 'center' }}>The settler needs to confirm the completion.</Text>
                                </View>
                            ) : (
                                <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                    {review ? (
                                        review.borrowerStatus === 0 ? (
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
                                                    navigation.navigate('BookingAddReview', { reviewId: review.id || 'newReview', booking: booking });
                                                }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Edit Review</Text>
                                            </TouchableOpacity>
                                        ) : review.borrowerStatus ? (
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: COLORS.primary,
                                                    padding: 10,
                                                    borderRadius: 10,
                                                    marginVertical: 10,
                                                    width: '80%',
                                                    alignItems: 'center',
                                                }}
                                                onPress={() => { }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Review Completed</Text>
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
                                                    navigation.navigate('BookingAddReview', { reviewId: review.id || 'newReview', booking: booking });
                                                }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Review</Text>
                                            </TouchableOpacity>
                                        )
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
                                            onPress={async () => {
                                                const newReview = await createReview({
                                                    borrowingId: booking.id || '',
                                                    borrowerReviewerId: user?.uid || '',
                                                    borrowerOverallRating: 0,
                                                    productId: booking.productId || '',

                                                    borrowerCollectionRating: 0,
                                                    borrowerCollectionFeedback: [''],
                                                    borrowerOtherCollectionReview: '',
                                                    borrowerReturnRating: 0,
                                                    borrowerReturnFeedback: [''],
                                                    borrowerOtherReturnReview: '',
                                                    borrowerListingMatch: '',
                                                    borrowerListingMatchFeedback: [''],
                                                    borrowerOtherListingMatchReview: '',
                                                    borrowerCommunicationRating: 0,
                                                    borrowerCommunicationFeedback: [''],
                                                    borrowerOtherCommunicationReview: '',
                                                    borrowerProductConditionRating: 0,
                                                    borrowerProductConditionFeedback: [''],
                                                    borrowerOtherProductConditionReview: '',
                                                    borrowerPriceWorthyRating: 0,
                                                    borrowerPublicReview: '',
                                                    borrowerPrivateNotesforLender: '',
                                                    borrowerUpdatedAt: new Date(),
                                                    borrowerCreateAt: new Date(),
                                                    borrowerStatus: 0,
                                                }, booking.productId || 'undefined');
                                                console.log('Review not found');
                                                navigation.navigate('BookingAddReview', { reviewId: newReview, booking: booking });
                                            }}
                                        >
                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Review</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )
                            }
                        </View>
                        {/* Borrowing Details */}
                        <View style={{ alignItems:"center"}}><Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.danger, textAlign:'center' }}>A proper handshake between settler & customer in the making. :) {'\n'}</Text></View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {buttons.map((btn: any, i: number) => (
                                <View
                                    key={i}
                                    style={{
                                        flexDirection: 'row',
                                        width: SIZES.width * 0.5,
                                        paddingHorizontal: 10,
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <TouchableOpacity
                                        style={{
                                            width: '100%',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
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
                                >
                                    <View style={{}}>
                                        {index === 0 && (
                                            <ScrollView
                                                showsVerticalScrollIndicator={false}
                                                contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, alignItems: 'flex-start' }}
                                            >
                                                <View style={{ width: '90%', paddingTop: 20, gap: 10 }}>
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
                                                            <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5, color: COLORS.title }}>Cleaning Service</Text>
                                                            <Text style={{ fontSize: 14, color: COLORS.black }}>Payment Method: {booking.paymentMethod}</Text>
                                                        </View>
                                                    </View>
                                                    <View style={GlobalStyleSheet.line} />
                                                    {/* Borrowing Period and Delivery Method */}
                                                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                                                        <View style={{ paddingVertical: 10 }}>
                                                            <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.title }}>Service Start at</Text>
                                                            <Text style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>{new Date(booking.selectedDate).toLocaleDateString('en-GB')}</Text>
                                                            <Text style={{ fontSize: 14, fontWeight: "bold" }}>From:</Text>
                                                            <Text style={{ fontSize: 14, color: COLORS.title }}>09:00 AM OR Now</Text>
                                                        </View>
                                                        <View style={{ marginHorizontal: 40, paddingTop: 60 }}>
                                                            <Ionicons name="arrow-forward" size={30} color={COLORS.title} />
                                                        </View>
                                                        <View style={{ paddingVertical: 10 }}>
                                                            <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.title }}>Location</Text>
                                                            <Text style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
                                                                {booking.selectedAddress ? booking.selectedAddress.addressName : ''}
                                                            </Text>
                                                            <Text style={{ fontSize: 14, fontWeight: "bold" }}>Estimated Duration:</Text>
                                                            <Text style={{ fontSize: 14, color: COLORS.title }}>3 Hours</Text>
                                                        </View>
                                                    </View>
                                                    <Text style={{ fontSize: 12, color: "#666", textAlign: "center", marginBottom: 5 }}>
                                                        The service duration may vary based on the actual cleaning requirements.
                                                    </Text>
                                                    <View style={GlobalStyleSheet.line} />
                                                    {/* Borrowing Rate Breakdown */}
                                                    <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5, color: COLORS.title, marginTop: 10 }}>Service Pricing Breakdown</Text>
                                                    <View style={{ marginBottom: 20 }}>
                                                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                                            <Text style={{ fontSize: 14, color: "#333" }}>Service Price</Text>
                                                            <Text style={{ fontSize: 14, color: "#333" }}>1 x session</Text>
                                                            <Text style={{ fontSize: 14, fontWeight: "bold" }}>£{booking.total.toFixed(2)}</Text>
                                                        </View>
                                                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                                            <Text style={{ fontSize: 14, color: "#333" }}>Platform Fee</Text>
                                                            <Text style={{ fontSize: 14, color: "#333" }}></Text>
                                                            <Text style={{ fontSize: 14, fontWeight: "bold" }}>£2.00</Text>
                                                        </View>
                                                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                                            <Text style={{ fontSize: 14, color: "#333" }}>Delivery Charge</Text>
                                                            <Text style={{ fontSize: 14, color: "#333" }}> N/A</Text>
                                                            <Text style={{ fontSize: 14, fontWeight: "bold" }}>£0.00</Text>
                                                        </View>
                                                        <View style={[{ backgroundColor: COLORS.black, height: 1, margin: 10, width: '90%', alignSelf: 'center' },]} />
                                                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                                            <Text style={{ fontSize: 14, fontWeight: "bold" }}>Total</Text>
                                                            <Text style={{ fontSize: 14, color: "#333", fontWeight: "bold" }}>£{booking.total}</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </ScrollView>
                                        )}
                                        {index === 1 && (
                                            <View style={{ paddingRight: 40 }}>
                                            </View>
                                        )}
                                    </View>
                                </ScrollView>
                            ))}
                        </ScrollView>
                        <View style={GlobalStyleSheet.line} />
                        <View style={{ width: '100%', }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>Additional Information</Text>
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
                                    <Text style={{ fontSize: 14, color: COLORS.danger, lineHeight: 21, fontWeight: 'bold', textDecorationLine: 'underline' }}>Cancel Borrowing</Text>
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
    )
}

export default MyBorrowingDetails