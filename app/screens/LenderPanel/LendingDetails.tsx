import React, { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, Alert, Animated, Easing, FlatList, Dimensions, ScrollView, RefreshControl, ActivityIndicator, TextInput, Linking } from 'react-native'
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

type LendingDetailsScreenProps = StackScreenProps<RootStackParamList, 'LendingDetails'>;


const LendingDetails = ({ navigation, route }: LendingDetailsScreenProps) => {

    const { user } = useUser();
    const mapRef = useRef<MapView | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const scrollViewHome = useRef<any>(null);
    const buttons = ['Transaction Summary', 'Instructions'];
    const scrollX = useRef(new Animated.Value(0)).current;
    const onCLick = (i: any) => scrollViewHome.current.scrollTo({ x: i * SIZES.width });
    const [activeIndex, setActiveIndex] = useState(0);

    const [lending, setLending] = useState<Borrowing>(route.params.lending);
    const [accordionOpen, setAccordionOpen] = useState<{ [key: string]: boolean }>({});
    const [owner, setOwner] = useState<User>();
    const [images, setImages] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [status, setStatus] = useState<number>(lending.status);
    const [review, setReview] = useState<Review>();

    const CODE_LENGTH = 7;
    const [collectionCode, setCollectionCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const inputs = useRef<Array<TextInput | null>>(Array(CODE_LENGTH).fill(null));

    const handleChange = (text: string, index: number) => {
        if (/^\d?$/.test(text)) {
            const newPin = [...collectionCode];
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
        const correctPin = lending?.collectionCode; // Replace with actual validation logic
        if (enteredPin === correctPin) {
            if (lending.id) {
                await updateBorrowing(lending.id, { status: status! + 1 });
            }
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
        if (e.nativeEvent.key === "Backspace" && collectionCode[index] === "" && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const fetchSelectedBorrowingData = async () => {
        if (lending) {
            try {
                const selectedBorrowing = await fetchSelectedBorrowing(lending.id || 'undefined');
                if (selectedBorrowing) {
                    setLending(selectedBorrowing);
                    setStatus(selectedBorrowing.status);

                    const fetchedOwner = await fetchSelectedUser(selectedBorrowing.userId);
                    if (fetchedOwner) {
                        setOwner(fetchedOwner);
                    }

                    const fetchedReview = await getReviewByBorrowingId(selectedBorrowing.product.id || '', lending.id || '');
                    if (fetchedReview) {
                        // Alert.alert('L Review found');
                        setReview(fetchedReview);
                    } else {
                        // Alert.alert('L Review not found');
                    }
                } else {
                    // Alert.alert('B Borrowing not found');
                }
            } catch (error) {
                console.error('Failed to fetch selected lending details:', error);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        const fetchData = async () => {
            if (lending) {
                setImages(lending.product.imageUrls);
                setSelectedImage(lending.product.imageUrls[0]);
                setLending(lending);

                const selectedBorrowing = await fetchSelectedBorrowing(lending.id || 'undefined');
                if (selectedBorrowing) {
                    const fetchedOwner = await fetchSelectedUser(selectedBorrowing.userId);
                    if (fetchedOwner) {
                        setOwner(fetchedOwner);
                    }

                    const fetchedReview = await getReviewByBorrowingId(selectedBorrowing.product.id || 'undefined', selectedBorrowing.id || 'undefined');
                    if (fetchedReview && fetchedReview.id) {
                        setReview(fetchedReview);
                    }
                }
            }
        }
        fetchData();
        setStatus(lending.status);
    }, [lending]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSelectedBorrowingData().then(() => setRefreshing(false));
    }, []);

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', weekday: 'short' };
        return date.toLocaleDateString('en-GB', options);
    };

    const steps = [
        { label: "Borrowing\nCreated", date: `${formatDate(lending?.startDate)}`, completed: (status ?? 0) >= 0 },
        { label: "Pickup\n", date: "Enter pickup\ncode", completed: (status ?? 0) > 2 },
        { label: "Active\nBorrowing", date: "\n", completed: (status ?? 0) > 2 },
        { label: "Return\n", date: "Show return\ncode", completed: (status ?? 0) > 3 },
        { label: "Borrowing\nCompleted", date: `${formatDate(lending?.endDate)}`, completed: (status ?? 0) > 6 },
    ];

    const actions = [
        { buttonTitle: 'Extend Borrowing', onPressAction: () => Alert.alert('Extend Borrowing Pressed') },
        { buttonTitle: 'Report Issue', onPressAction: () => Alert.alert('Report Issue Pressed') },
        { buttonTitle: 'Contact Support', onPressAction: () => Alert.alert('Contact Support Pressed') },
    ];

    const greetings = 'Hi there, thank you for your rent. We hope that you can take the advantage of this item during your borrowing period Beforehand, here’s the information that you might need during your borrowing terms.';

    // Stripe functions

    const handleRefund = async () => {
        const paymentIntentId = lending.paymentIntentId || '';
        const refundAmount = lending.product.depositAmount?.toString() || '';
        if (!paymentIntentId || !refundAmount) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        try {
            const amountInPence = Math.round(parseFloat(refundAmount) * 100);

            const response = await axios.post(
                'https://us-central1-tags-1489a.cloudfunctions.net/api/refund-deposit',
                {
                    paymentIntentId,
                    amountToRefundInPence: amountInPence,
                }
            );

            if (response.data.success) {
                // Alert.alert('Success', `Refund of £${refundAmount} processed.`);
                return { success: true, data: response.data }; // ✅ success
            } else {
                // Alert.alert('Failed', 'Could not process the refund.');
                return { success: false, error: 'Refund failed' }; // ❌ failure
            }
        } catch (error: any) {
            console.error('Refund error:', error);
            // Alert.alert('Error', error.response?.data?.error || 'Something went wrong.');
            return { success: false, error: error.message || 'Something went wrong.' }; // ❌ failure
        }
    };

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
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.title, textAlign: 'center', marginVertical: 10 }}>Lending Details</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        {/* right header element */}
                    </View>
                </View>
            </View>
            {lending ? (
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
                        {/* Action Card */}
                        <View style={{ backgroundColor: "#f3f3f3", padding: 16, borderRadius: 12, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginVertical: 20, marginHorizontal: 10 }}>
                            {status === 0 ? (
                                <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                    <Text style={{ fontWeight: 'bold' }}>Please confirm this borrowing</Text>
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
                                                if (lending.id) {
                                                    await updateBorrowing(lending.id, { status: status! + 1, collectionCode: Math.floor(1000000 + Math.random() * 9000000).toString() });
                                                    onRefresh();
                                                }
                                                setStatus(status! + 1);
                                            }}
                                        >
                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Yes</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : status === 1 ? (
                                <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                    <Text style={{ fontSize: 16, fontWeight: "500" }}>Enter Pickup Code</Text>
                                    <Text style={{ fontSize: 13, marginBottom: 10, color: COLORS.blackLight2 }}>Kindly ask the borrower for the pickup code</Text>
                                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                                        {collectionCode.map((digit, index) => (
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
                                </View>
                            ) : status === 2 ? (
                                <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                    <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 4, textAlign: 'center' }}>Awaiting for borrower's pickup confirmation</Text>
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
                                            if (lending.id) {
                                                await updateBorrowing(lending.id, { status: status! + 1 });
                                            }
                                            setStatus(status! + 1);
                                        }}
                                    >
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Message borrower</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : status === 3 ? (
                                <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                    <Text>Active Borrowing</Text>
                                    <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 4 }}>
                                        {lending?.endDate ? `${Math.ceil((new Date(lending.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left` : "N/A"}
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
                                            if (lending.id) {
                                                await updateBorrowing(lending.id, { status: status! + 1, returnCode: Math.floor(1000000 + Math.random() * 9000000).toString() });
                                            }
                                            setStatus(status! + 1);
                                        }}
                                    >
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Message Borrower</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : status === 4 ? (
                                <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Your return code is</Text>
                                    <Text style={{ fontSize: 24, fontWeight: "bold", color: "indigo" }}>{lending.returnCode}</Text>
                                </View>
                            ) : status === 5 ? (
                                <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                    <Text style={{ fontWeight: 'bold' }}>Please confirm this return?</Text>
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
                                                if (lending.id) {
                                                    await updateBorrowing(lending.id, { status: status! + 1 });
                                                }
                                                setStatus(status! + 1);
                                            }}
                                        >
                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Yes</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : status === 6 ? (
                                <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                    <Text style={{ fontWeight: 'bold' }}>Is your item in good condition?</Text>
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
                                                const result = await handleRefund();

                                                if (result && result.success) {
                                                    console.log('Refund processed:', result.data);
                                                    if (lending.id) {
                                                        await updateBorrowing(lending.id, { status: status! + 1 });
                                                    }
                                                    setStatus(status! + 1);
                                                } else if (result) {
                                                    console.error('Refund failed:', result.error);
                                                }
                                            }}
                                        >
                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Yes</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                    {review ? (
                                        review.lenderStatus === 0 ? (
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
                                                    navigation.navigate('LenderAddReview', { reviewId: review.id || 'newReview', lending: lending });
                                                }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Edit Review</Text>
                                            </TouchableOpacity>
                                        ) : review.lenderStatus ? (
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
                                                    navigation.navigate('LenderAddReview', { reviewId: review.id || 'newReview', lending: lending });
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
                                                    borrowingId: lending.id || '',
                                                    lenderReviewerId: user?.uid || '',
                                                    lenderOverallRating: 0,
                                                    productId: lending.product.id || '',

                                                    lenderCollectionRating: 0,
                                                    lenderCollectionFeedback: [''],
                                                    lenderOtherCollectionReview: '',
                                                    lenderReturnRating: 0,
                                                    lenderReturnFeedback: [''],
                                                    lenderOtherReturnReview: '',
                                                    lenderGivenInstructionFollowed: '',
                                                    lenderGivenInstructionFollowedFeedback: [''],
                                                    lenderOtherGivenInstructionFollowedReview: '',
                                                    lenderCommunicationRating: 0,
                                                    lenderCommunicationFeedback: [''],
                                                    lenderOtherCommunicationReview: '',
                                                    lenderReturnedProductConditionRating: 0,
                                                    lenderReturnedProductConditionFeedback: [''],
                                                    lenderOtherReturnedProductConditionReview: '',
                                                    lenderPublicReview: '',
                                                    lenderPrivateNotesforLender: '',
                                                    lenderUpdatedAt: new Date(),
                                                    lenderCreateAt: new Date(),
                                                    lenderStatus: 0,
                                                }, lending.product.id || 'undefined');
                                                console.log('Review not found');
                                                navigation.navigate('LenderAddReview', { reviewId: newReview, lending: lending });
                                            }}
                                        >
                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Review</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )
                            }
                        </View>
                        {/* Images View */}
                        {/* <View style={{ height: 250 }}>
                            <Swiper
                                dotColor={COLORS.primaryLight}
                                activeDotColor={COLORS.primary}
                                autoplay={false}
                                autoplayTimeout={2}
                                showsPagination={Platform.OS === "android" ? true : false}
                                loop={false}
                            >
                                {images.map((data, index) => (
                                    <View key={index}>
                                        <Image
                                            style={{
                                                backgroundColor: COLORS.placeholder,
                                                height: 250,
                                                width: '100%',
                                                resizeMode: 'cover',
                                                borderRadius: 20,
                                            }}
                                            source={{ uri: data }}
                                        />
                                    </View>
                                ))}
                            </Swiper>
                        </View> */}
                        {/* Borrowing Details */}
                        <View style={{ width: '100%', paddingHorizontal: 15, borderRadius: 20, borderColor: COLORS.blackLight, borderWidth: 1, marginBottom: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginVertical: 10 }}>
                                <View style={{ flex: 1, alignItems: 'center' }}>
                                    {
                                        owner ? (
                                            <Image
                                                source={{ uri: owner.profileImageUrl }}
                                                style={{
                                                    width: 60,
                                                    height: 60,
                                                    borderRadius: 40,
                                                }}
                                            />
                                        ) : (
                                            <View
                                                style={{
                                                    width: 60,
                                                    height: 60,
                                                    borderRadius: 40,
                                                    marginBottom: 10,
                                                    backgroundColor: COLORS.card,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Text style={{ color: COLORS.blackLight }}>No image selected</Text>
                                            </View>
                                        )
                                    }
                                </View>
                                <View style={{ flex: 7, paddingLeft: 20 }}>
                                    <TouchableOpacity onPress={() => navigation.navigate('ProductDetails', { product: lending.product })}>
                                        <View style={{ width: SIZES.width * 0.63 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Text style={{ fontSize: 17, fontWeight: 'bold', color: COLORS.black, textDecorationLine: 'underline' }} numberOfLines={1} ellipsizeMode="tail">{lending.product.title}</Text>
                                                <Ionicons name="link" size={20} color={COLORS.blackLight} style={{ marginLeft: 5 }} />
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 14, color: COLORS.blackLight }}>borrowed by {owner?.firstName} {owner?.lastName} </Text>
                                </View>
                            </View>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {buttons.map((btn: any, i: number) => (
                                <View key={i} style={{ flexDirection: 'row', width: SIZES.width * 0.5, paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                                    <TouchableOpacity
                                        key={btn}
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
                                                <View style={{ width: SIZES.width * 0.93, paddingTop: 20, paddingHorizontal: 15, gap: 10 }}>
                                                    {/* Product Info */}
                                                    <View style={{ flexDirection: 'row' }}>
                                                        <Text style={{ fontSize: 14, fontWeight: "bold", color: COLORS.title }}>Borrowing ID: </Text>
                                                        <Text style={{ fontSize: 14, color: COLORS.blackLight }}>{lending.id}</Text>
                                                    </View>
                                                    <View style={{ flexDirection: "row", marginBottom: 20 }}>
                                                        <Image
                                                            source={{ uri: lending.product.imageUrls[0] }}
                                                            style={{ width: 100, height: 100, borderRadius: 8, marginRight: 16 }}
                                                        />
                                                        <View style={{ flex: 1, marginTop: 5 }}>
                                                            <Text style={{ fontSize: 16, marginBottom: 5 }}>
                                                                <Text style={{ color: "#E63946", fontWeight: "bold" }}>£{Number(lending.product.lendingRate).toFixed(2)}</Text>/day{" "}
                                                                {/* <Text style={styles.originalPrice}>£40.20</Text> */}
                                                            </Text>
                                                            <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5, color: COLORS.title }} numberOfLines={1} ellipsizeMode="tail">{lending.product.title}</Text>
                                                            <Text style={{ fontSize: 14, color: COLORS.blackLight }}>{lending.product.category}</Text>
                                                        </View>
                                                    </View>
                                                    <View style={GlobalStyleSheet.line} />
                                                    {/* Borrowing Period and Delivery Method */}
                                                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                                                        <View style={{ paddingVertical: 10 }}>
                                                            <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.title }}>Borrowing Period</Text>
                                                            <Text style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>Day Borrowing</Text>
                                                            <Text style={{ fontSize: 14, fontWeight: "bold" }}>From:</Text>
                                                            <Text style={{ fontSize: 14, color: COLORS.title }}>{new Date(lending.startDate).toLocaleDateString('en-GB')}</Text>
                                                            <Text style={{ fontSize: 14, color: COLORS.title }}>09:00 AM</Text>
                                                        </View>
                                                        <View style={{ marginHorizontal: 40, paddingTop: 60 }}>
                                                            <Ionicons name="arrow-forward" size={30} color={COLORS.title} />
                                                        </View>
                                                        <View style={{ paddingVertical: 10 }}>
                                                            <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.title }}>Delivery Method</Text>
                                                            <Text style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>{lending.deliveryMethod}</Text>
                                                            <Text style={{ fontSize: 14, fontWeight: "bold" }}>Until:</Text>
                                                            <Text style={{ fontSize: 14, color: COLORS.title }}>{new Date(lending.endDate).toLocaleDateString('en-GB')}</Text>
                                                            <Text style={{ fontSize: 14, color: COLORS.title }}>09:00 AM</Text>
                                                        </View>
                                                    </View>
                                                    <View style={GlobalStyleSheet.line} />
                                                    {/* Borrowing Rate Breakdown */}
                                                    <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5, color: COLORS.title, marginTop: 10 }}>Borrowing Rate Breakdown</Text>
                                                    <Text style={{ fontSize: 14, color: COLORS.blackLight, marginBottom: 10 }}>Cash on Pickup</Text>
                                                    <View style={{ marginBottom: 20 }}>
                                                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                                            <Text style={{ fontSize: 14, color: "#333" }}>Borrowing rate</Text>
                                                            <Text style={{ fontSize: 14, color: "#333" }}>£{lending.product.lendingRate} x {(Number(lending.total) - Number(lending.product.depositAmount)) / Number(lending.product.lendingRate)} day</Text>
                                                            <Text style={{ fontSize: 14, fontWeight: "bold" }}>£{lending.total - Number(lending.product.depositAmount)}</Text>
                                                        </View>
                                                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                                            <Text style={{ fontSize: 14, color: "#333" }}>Service Charge</Text>
                                                            <Text style={{ fontSize: 14, color: "#333" }}>FREE</Text>
                                                            <Text style={{ fontSize: 14, fontWeight: "bold" }}>£0.00</Text>
                                                        </View>
                                                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                                            <Text style={{ fontSize: 14, color: "#333" }}>Delivery Charge</Text>
                                                            <Text style={{ fontSize: 14, color: "#333" }}>FREE (PICKUP)</Text>
                                                            <Text style={{ fontSize: 14, fontWeight: "bold" }}>£0.00</Text>
                                                        </View>
                                                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                                            <Text style={{ fontSize: 14, color: "#333" }}>Deposit</Text>
                                                            <Text style={{ fontSize: 14, color: "#333" }}></Text>
                                                            <Text style={{ fontSize: 14, fontWeight: "bold" }}>{lending.product.depositAmount}</Text>
                                                        </View>
                                                        <View style={[{ backgroundColor: COLORS.black, height: 1, margin: 10, width: '90%', alignSelf: 'center' },]} />
                                                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                                            <Text style={{ fontSize: 14, fontWeight: "bold" }}>Total</Text>
                                                            <Text style={{ fontSize: 14, color: "#333", fontWeight: "bold" }}>£{lending.total}</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </ScrollView>
                                        )}
                                        {index === 1 && (
                                            <View style={{ paddingRight: 40 }}>
                                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>Meetup Location</Text>
                                                <View style={{ marginTop: 10, borderRadius: 50, backgroundColor: '#8ABE12', }}>
                                                    <View style={{ height: 200, borderRadius: 20, overflow: 'hidden', borderColor: COLORS.blackLight, borderWidth: 1 }}>
                                                        <MapView
                                                            ref={mapRef}
                                                            style={{ ...StyleSheet.absoluteFillObject, }}
                                                            initialRegion={{
                                                                latitude: lending.product.latitude,
                                                                longitude: lending.product.longitude,
                                                                latitudeDelta: 0.0005,
                                                                longitudeDelta: 0.0005,
                                                            }}
                                                            scrollEnabled={false}
                                                            zoomEnabled={false}
                                                            rotateEnabled={false}
                                                            pitchEnabled={false}
                                                            toolbarEnabled={false}
                                                        >
                                                            <Marker
                                                                coordinate={{
                                                                    latitude: lending.product.latitude,
                                                                    longitude: lending.product.longitude,
                                                                }}
                                                                title="house"
                                                            />

                                                        </MapView>
                                                    </View>
                                                </View>
                                                <Text style={{ fontSize: 14, color: COLORS.title, marginBottom: 0 }}><Text style={{ fontSize: 14, color: COLORS.title, fontWeight: 'bold' }}>{lending.product.addressName}, </Text>{lending.product.address}</Text>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        const url = `https://www.google.com/maps?q=${lending.product.latitude},${lending.product.longitude}`;
                                                        Linking.openURL(url);
                                                    }}
                                                >
                                                    <Text
                                                        style={{ fontSize: 14, color: COLORS.primary, textDecorationLine: 'underline', marginBottom: 10 }}
                                                    >
                                                        Open in Google Maps
                                                    </Text>
                                                </TouchableOpacity>
                                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>Borrowing Notes</Text>
                                                <Text style={{ fontSize: 15, color: COLORS.black, paddingBottom: 20 }}>{lending.product.borrowingNotes}</Text>
                                                <View style={GlobalStyleSheet.line} />
                                                <View style={{ paddingHorizontal: 10 }}>
                                                    <TouchableOpacity
                                                        onPress={() => setAccordionOpen((prev) => ({ ...prev, insurance: !prev.insurance }))}
                                                        style={{
                                                            flexDirection: 'row',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            paddingVertical: 10,
                                                        }}
                                                    >
                                                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>
                                                            Your Pickup Instructions
                                                        </Text>
                                                        <Ionicons
                                                            name={accordionOpen.insurance ? 'chevron-up-outline' : 'chevron-down-outline'}
                                                            size={24}
                                                            color={COLORS.blackLight}
                                                        />
                                                    </TouchableOpacity>
                                                    {accordionOpen.insurance && (
                                                        <View style={{ paddingLeft: 10 }}>
                                                            <Text style={{ fontSize: 15, color: COLORS.black, paddingBottom: 20 }}>
                                                                {lending.product.pickupInstructions}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <View style={{ paddingHorizontal: 10 }}>
                                                    <TouchableOpacity
                                                        onPress={() => setAccordionOpen((prev) => ({ ...prev, handover: !prev.handover }))}
                                                        style={{
                                                            flexDirection: 'row',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            paddingVertical: 10,
                                                        }}
                                                    >
                                                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>
                                                            Your Return Instructions
                                                        </Text>
                                                        <Ionicons
                                                            name={accordionOpen.handover ? 'chevron-up-outline' : 'chevron-down-outline'}
                                                            size={24}
                                                            color={COLORS.blackLight}
                                                        />
                                                    </TouchableOpacity>
                                                    {accordionOpen.handover && (
                                                        <View style={{ paddingLeft: 10 }}>
                                                            <Text style={{ fontSize: 15, color: COLORS.black, paddingBottom: 20 }}>
                                                                {lending.product.returnInstructions}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>

                                                <View style={{ paddingHorizontal: 10 }}>
                                                    <TouchableOpacity
                                                        onPress={() => setAccordionOpen((prev) => ({ ...prev, faqs: !prev.faqs }))}
                                                        style={{
                                                            flexDirection: 'row',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            paddingVertical: 10,
                                                        }}
                                                    >
                                                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>
                                                            Deposit Release
                                                        </Text>
                                                        <Ionicons
                                                            name={accordionOpen.faqs ? 'chevron-up-outline' : 'chevron-down-outline'}
                                                            size={24}
                                                            color={COLORS.blackLight}
                                                        />
                                                    </TouchableOpacity>
                                                    {accordionOpen.faqs && (
                                                        <View style={{ paddingLeft: 10 }}>
                                                            <Text style={{ fontSize: 15, color: COLORS.black, paddingBottom: 20 }}>
                                                                £{Number(lending.product.depositAmount).toFixed(2)} will be released within 3-5 working days after the product is returned and checked.
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
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
                                    <Text style={{ fontSize: 14, color: COLORS.danger, lineHeight: 21, fontWeight: 'bold', textDecorationLine: 'underline' }}>Cancel Lending</Text>
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

export default LendingDetails