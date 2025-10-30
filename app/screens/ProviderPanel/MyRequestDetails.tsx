import React, { useState, useEffect, useRef, useCallback, act } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, Alert, Animated, Easing, FlatList, Dimensions, ScrollView, RefreshControl, ActivityIndicator, TextInput, Linking, ActionSheetIOS } from 'react-native'
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
import { Booking, BookingActivityType, BookingActorType, fetchSelectedBooking, updateBooking, uploadImageIncompletionResolveEvidence, uploadImagesCompletionEvidence, uploadImagesCooldownReportEvidence } from '../../services/BookingServices';
import { arrayUnion, deleteField } from 'firebase/firestore';
import { getOrCreateChat } from '../../services/ChatServices';
import Input from '../../components/Input/Input';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Calendar } from 'react-native-calendars';
import { format, set } from 'date-fns';
import { DynamicOption, SubOption } from '../../services/CatalogueServices';
import { formatAnyTimestamp, generateId } from '../../helper/HelperFunctions';
import AttachmentForm from '../../components/Forms/AttachmentForm';
import BookingSummaryCard from '../../components/BookingSummaryCard';
import BookingTimeline from '../../components/BookingTimeline';
import WarningCard from '../../components/Card/WarningCard';
import InfoBar from '../../components/InfoBar';
import AddressCard from '../../components/Card/AddressCard';

type MyRequestDetailsScreenProps = StackScreenProps<RootStackParamList, 'MyRequestDetails'>;


const MyRequestDetails = ({ navigation, route }: MyRequestDetailsScreenProps) => {

    const { user } = useUser();
    const mapRef = useRef<MapView | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const scrollViewTabHeader = useRef<any>(null);
    const scrollViewTabContent = useRef<any>(null);
    const buttons = ['Transaction Summary', 'Service Notes', 'Service Evidence', 'Incompletion Flag', 'Cooldown Report'];
    const scrollX = useRef(new Animated.Value(0)).current;
    const onClickHeader = (i: any) => scrollViewTabHeader.current.scrollTo({ x: i * SIZES.width });
    const onClick = (i: any) => scrollViewTabContent.current.scrollTo({ x: i * SIZES.width });
    const [activeIndex, setActiveIndex] = useState(0);
    const [subScreenIndex, setSubScreenIndex] = useState(0);
    const [isFocused, setisFocused] = useState(false);
    const [completedAddons, setCompletedAddons] = useState<{ [key: string]: string[] }>({});


    const [booking, setBooking] = useState<Booking>(route.params.booking);
    const [accordionOpen, setAccordionOpen] = useState<{ [key: string]: boolean }>({});
    const [customer, setCustomer] = useState<User>();
    const [images, setImages] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [status, setStatus] = useState<number>(booking.status);
    const [review, setReview] = useState<Review>();
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [selectedAddons, setSelectedAddons] = useState<{ [key: string]: SubOption[] }>({});
    const [newManualQuoteDescription, setNewManualQuotationDescription] = useState<string>();
    const [newManualQuotePrice, setNewManualQuotationPrice] = useState<number>(0);

    const CODE_LENGTH = 7;
    const [collectionCode, setCollectionCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const inputs = useRef<Array<TextInput | null>>(Array(CODE_LENGTH).fill(null));

    const [selectedNotesToSettlerImageUrl, setSelectedNotesToSettlerImageUrl] = useState<string | null>(null);
    const [notesToSettlerImageUrls, setNotesToSettlerImageUrls] = useState<string[]>([]);

    const [incompletionReportImageUrls, setIncompletionImageUrls] = useState<string[]>([]);
    const [selectedIncompletionImageUrl, setSelectedIncompletionImageUrl] = useState<string | null>();

    const [selectedSettlerEvidenceImageUrl, setSelectedSettlerEvidenceImageUrl] = useState<string | null>(null);
    const [settlerEvidenceImageUrls, setSettlerEvidenceImageUrls] = useState<string[]>([]);
    const [settlerEvidenceRemark, setSettlerEvidenceRemark] = useState<string>('');
    const basePrice = booking.catalogueService.basePrice ? booking.catalogueService.basePrice : 0;
    const [totalQuote, setTotalQuote] = useState(booking.total - 2);
    const [subOptionCompletion, setSubOptionCompletion] = useState<SubOption[]>([]);
    const [localAddons, setLocalAddons] = useState<DynamicOption[]>([]);
    const [localTotal, setLocalTotal] = useState<number>(
        booking?.total ?? booking?.catalogueService?.basePrice ?? 0
    );

    const userAlreadyAccepted = booking.acceptors?.some(
        (acceptor) => acceptor.settlerId === user?.uid
    );

    const handleChat = async (userId: string, otherUserId: string) => {
        const chatId = await getOrCreateChat(userId, otherUserId, booking);
        if (chatId) {
            navigation.navigate("Chat", { chatId: chatId });
        }
    };

    const addonsArray = Object.entries(selectedAddons).map(([category, options]) => ({
        name: category,
        subOptions: options,
        multipleSelect: false, // Set appropriately if you have this info
    }));


    function toggleAddon(category: DynamicOption, option: SubOption) {
        setSelectedAddons((prev) => {
            const prevOptions = prev[category.name] || [];

            let newOptions: SubOption[];

            if (category.multipleSelect) {
                // ✅ Single selection
                newOptions = prevOptions[0]?.label === option.label ? [] : [option];
            } else {
                // ✅ Multiple selection
                const exists = prevOptions.some((o) => o.label === option.label);
                newOptions = exists
                    ? prevOptions.filter((o) => o.label !== option.label)
                    : [...prevOptions, option];
            }

            const newSelections = { ...prev, [category.name]: newOptions };

            // ✅ Use the shared function
            const newTotal = calculateTotalQuote(basePrice, newSelections, Number(newManualQuotePrice));
            setTotalQuote(newTotal);

            return newSelections;
        });
    }


    const calculateTotalQuote = (basePrice: number, selectedAddons: { [key: string]: SubOption[] }, newManualQuotePrice: number) => {
        const addonsTotal = Object.values(selectedAddons)
            .flat()
            .reduce((sum, o) => sum + Number(o.additionalPrice || 0), 0);

        return Number(basePrice) + Number(addonsTotal) + Number(newManualQuotePrice || 0);
    };

    const fetchSelectedBookingData = async () => {
        if (booking) {
            try {
                const selectedBooking = await fetchSelectedBooking(booking.id || 'undefined');
                if (selectedBooking) {
                    setBooking(selectedBooking);
                    setStatus(selectedBooking.status);

                    const fetchedCustomer = await fetchSelectedUser(selectedBooking.userId);
                    if (fetchedCustomer) {
                        setCustomer(fetchedCustomer);
                    }

                    const fetchedReview = await getReviewByBookingId(selectedBooking.id || '', booking.id || '');
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
            if (booking) {
                setImages(booking.catalogueService.imageUrls);
                setSelectedImage(booking.catalogueService.imageUrls[0]);
                setBooking(booking);

                const formatted: { [key: string]: SubOption[] } = {};

                if (booking.addons) {
                    booking.addons.forEach((cat: DynamicOption) => {
                        formatted[cat.name] = cat.subOptions;
                    });
                }

                setSelectedAddons(formatted);

                if (booking.settlerEvidenceImageUrls.length !== 0) {
                    setSettlerEvidenceImageUrls(booking.settlerEvidenceImageUrls);
                    setSelectedSettlerEvidenceImageUrl(booking.settlerEvidenceImageUrls[0])
                    setSettlerEvidenceRemark(booking.settlerEvidenceRemark)
                }

                if (booking.notesToSettlerImageUrls) {
                    setSelectedNotesToSettlerImageUrl(booking.notesToSettlerImageUrls[0])
                }

                if (booking.incompletionReportImageUrls) {
                    setIncompletionImageUrls(booking.incompletionReportImageUrls);
                    setSelectedIncompletionImageUrl(booking.incompletionReportImageUrls[0])
                }

                const selectedBooking = await fetchSelectedBooking(booking.id || 'undefined');
                if (selectedBooking) {
                    const fetchedCustomer = await fetchSelectedUser(selectedBooking.userId);
                    if (fetchedCustomer) {
                        setCustomer(fetchedCustomer);
                    }

                    const fetchedReview = await getReviewByBookingId(selectedBooking.catalogueService.id || 'undefined', selectedBooking.id || 'undefined');
                    if (fetchedReview && fetchedReview.id) {
                        setReview(fetchedReview);
                    }
                }

                if (booking.addons) {
                    const cloned = booking.addons.map(addon => ({
                        ...addon,
                        subOptions: addon.subOptions.map(opt => ({
                            ...opt,
                            jobCompleted: opt.isCompleted ?? true, // ✅ Default to true if undefined
                        })),
                    }));
                    setLocalAddons(cloned);
                }

                const basePrice = booking.catalogueService?.basePrice ?? 0;

                const addonsTotal =
                    booking.addons
                        ?.flatMap(a => a.subOptions)
                        .filter(opt => opt.isCompleted)
                        .reduce((sum, opt) => sum + Number(opt.additionalPrice || 0), 0) ?? 0;

                setLocalTotal(Number(basePrice) + Number(addonsTotal) + 2);
            }
        }
        fetchData();
        setStatus(booking.status);
    }, [booking]);

    useEffect(() => {
        if (booking.manualQuoteDescription && booking.manualQuotePrice) {
            setNewManualQuotationDescription(booking.manualQuoteDescription);
            setNewManualQuotationPrice(booking.manualQuotePrice);
        }
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSelectedBookingData().then(() => setRefreshing(false));
    }, []);

    // status info:
    // 0.1: reviewing booking (check payment)
    // 0: new booking
    // 2: active booking
    // 3: job completed
    // 1-6 : ok flow
    // 7++ : exception handling
    // 7: update quote
    // 8: incomplete flag by customer (8.2: resolve)
    // 9: cooldown report by customer
    // 10: review completed
    // 11: booking cancelled (11.1: by customer, 11.2: by settler)


    const steps = [
        { label: "Booking\nCreated", date: 'Job\nbroadcast', completed: (status ?? 0) >= 0 },
        { label: "Settler\nSelected", date: "Check\nservice code", completed: (status ?? 0) >= 1 },
        { label: "Active\nService", date: "\n", completed: (status ?? 0) >= 2 },
        { label: "Service\nCompleted", date: "Evaluate\ncompletion", completed: (status ?? 0) >= 4 },
        { label: "Booking\nCompleted", date: 'Release\npayment', completed: (status ?? 0) >= 5 },
    ];

    const actions = [
        { buttonTitle: 'Extend Period', onPressAction: () => { setSubScreenIndex(1) } },
        { buttonTitle: 'Adjust Quotation', onPressAction: () => { setSubScreenIndex(2) } },
        { buttonTitle: 'Contact Support', onPressAction: () => Alert.alert('Contact Support Pressed') },
    ];

    const greetings = 'Hi there, thank you for your rent. We hope that you can take the advantage of this item during your borrowing period Beforehand, here’s the information that you might need during your borrowing terms.';

    // Stripe functions

    // const handleRefund = async () => {
    //     const paymentIntentId = booking.paymentIntentId || '';
    //     const refundAmount = lending.product.depositAmount?.toString() || '';
    //     if (!paymentIntentId || !refundAmount) {
    //         Alert.alert('Error', 'Please fill in all fields.');
    //         return;
    //     }

    //     try {
    //         const amountInPence = Math.round(parseFloat(refundAmount) * 100);

    //         const response = await axios.post(
    //             'https://us-central1-tags-1489a.cloudfunctions.net/api/refund-deposit',
    //             {
    //                 paymentIntentId,
    //                 amountToRefundInPence: amountInPence,
    //             }
    //         );

    //         if (response.data.success) {
    //             // Alert.alert('Success', `Refund of £${refundAmount} processed.`);
    //             return { success: true, data: response.data }; // ✅ success
    //         } else {
    //             // Alert.alert('Failed', 'Could not process the refund.');
    //             return { success: false, error: 'Refund failed' }; // ❌ failure
    //         }
    //     } catch (error: any) {
    //         console.error('Refund error:', error);
    //         // Alert.alert('Error', error.response?.data?.error || 'Something went wrong.');
    //         return { success: false, error: error.message || 'Something went wrong.' }; // ❌ failure
    //     }
    // };

    return (
        <View style={{ backgroundColor: COLORS.background, flex: 1 }}>
            <View style={{ height: 60, borderBottomColor: COLORS.card, borderBottomWidth: 1 }}>
                <View
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 5 }}>
                    <View style={{ flex: 1, alignItems: 'flex-start' }}>
                        <TouchableOpacity
                            onPress={() => { subScreenIndex === 0 ? navigation.goBack() : setSubScreenIndex(0) }}
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
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.title, textAlign: 'center', marginVertical: 10 }}>Job Details</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <TouchableOpacity
                            onPress={() => { setSubScreenIndex(3) }}
                            style={{
                                height: 40,
                                width: 40,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Ionicons size={27} color={COLORS.black} name='notifications-outline' />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            {/* Booking Subscreen (MAIN) */}
            {subScreenIndex === 0 && (
                <View>
                    {booking ? (
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ flexGrow: 1, paddingBottom: 70, alignItems: 'flex-start' }}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                            }
                        >
                            <View style={[GlobalStyleSheet.container, { paddingHorizontal: 10, paddingBottom: 40 }]}>
                                {/* notification section */}
                                {booking.status === 1 && booking.settlerId === user?.uid && (
                                    <InfoBar
                                        title="Congratulations!"
                                        subtitle="You have been selected for this job."
                                        icon="information-circle-outline"
                                    />
                                )}

                                {/* for Cooldown Reported */}
                                {booking.cooldownStatus === 'CUSTOMER_COOLDOWN_REPORT_NOT_RESOLVED' && booking.cooldownReportImageUrls && booking.cooldownReportRemark && (
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            backgroundColor: COLORS.primaryLight || '#FFF8E1',
                                            borderRadius: 12,
                                            padding: 12,
                                            marginVertical: 10,
                                            borderWidth: 1,
                                            borderColor: COLORS.primary,
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                            <Ionicons name="alert-circle-outline" size={20} color={COLORS.primary} />
                                            <View style={{ paddingLeft: 10, flex: 1 }}>
                                                <Text style={{ fontSize: 14, color: COLORS.title, fontWeight: '600' }}>
                                                    Cooldown Report - Not Resolved
                                                </Text>
                                                <Text style={{ fontSize: 12, color: COLORS.black, marginTop: 4 }}>
                                                    The customer has indicated that the cooldown report issue has not been resolved.
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {booking.cooldownReportImageUrls && booking.cooldownReportRemark && (
                                    <WarningCard
                                        text={'Cooldown Problem Reported'}
                                        remark={'Customer has submitted the evidence to resolve the cooldown problem.'}
                                        imageUrls={booking.cooldownReportImageUrls || []}
                                        onPress={() => {
                                            onClick(4);
                                            onClickHeader(4);
                                            setActiveIndex(4);
                                        }}
                                    />
                                )}


                                {booking.isQuoteUpdateSuccess === true && (
                                    <View
                                        style={{
                                            backgroundColor: booking.isQuoteUpdateSuccess ? COLORS.success : COLORS.placeholder,
                                            borderRadius: 20,
                                            paddingVertical: 8,
                                            paddingHorizontal: 14,
                                            marginTop: 10,
                                            alignItems: 'center',
                                            width: '100%',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                justifyContent: 'center',
                                                textAlign: 'center',
                                                color: COLORS.black,
                                                fontSize: 14,
                                                fontWeight: '600',
                                            }}
                                        >
                                            {booking.isQuoteUpdateSuccess ? "Your quote has been approved" : "Your quote has been rejected"}
                                        </Text>
                                    </View>
                                )}

                                {/* for Incompletion Reported */}
                                {booking.incompletionStatus === BookingActivityType.CUSTOMER_REJECT_INCOMPLETION_RESOLVE && (
                                    <InfoBar
                                        title="Your incompletion resolving evidence report has been rejected."
                                        icon="information-circle-outline"
                                    />
                                )}
                                {booking.incompletionReportImageUrls && booking.incompletionReportRemark && (
                                    <WarningCard
                                        text={(booking.incompletionStatus === 'CUSTOMER_JOB_INCOMPLETE_UPDATED') ? 'Incompletion Report - Updated' : 'Incompletion Reported'}
                                        remark={'Customer has submitted the evidence to resolve the incompletion flag.'}
                                        imageUrls={booking.incompletionReportImageUrls || []}
                                        onPress={() => {
                                            onClick(3);
                                            onClickHeader(3);
                                            setActiveIndex(3);
                                        }}
                                    />
                                )}
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

                                {/* Action Card */}
                                <View style={{ backgroundColor: "#f3f3f3", padding: 16, borderRadius: 12, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginVertical: 10, marginHorizontal: 10 }}>
                                    {status === 0 ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            {userAlreadyAccepted ? (
                                                <Text style={{ color: "green", textAlign: 'center' }}>You already accepted this job, Wait for customer respond.</Text>
                                            ) : (
                                                <View style={{ alignItems: "center", justifyContent: "center" }}>
                                                    <Text style={{ fontWeight: 'bold' }}>Tap here to take this job</Text>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                                                        <TouchableOpacity
                                                            disabled={loading}
                                                            style={{
                                                                backgroundColor: COLORS.primary,
                                                                padding: 10,
                                                                borderRadius: 10,
                                                                marginVertical: 10,
                                                                width: '80%',
                                                                alignItems: 'center',
                                                                opacity: loading ? 0.7 : 1,
                                                            }}
                                                            onPress={async () => {
                                                                setLoading(true);
                                                                // Make sure user.activeJobs is an array
                                                                const matchedJob = user?.activeJobs?.find(
                                                                    job => job.catalogueId === booking.catalogueService.id
                                                                );

                                                                // Extract the correct settlerServiceId (if found)
                                                                const settlerServiceId = matchedJob?.settlerServiceId || null;

                                                                if (booking.id) {
                                                                    await updateBooking(booking.id, {
                                                                        acceptors: arrayUnion({
                                                                            settlerId: user?.uid,
                                                                            settlerServiceId: settlerServiceId,
                                                                            firstName: user?.firstName,
                                                                            lastName: user?.lastName,
                                                                            acceptedAt: new Date() // cleaner than Date.toISOString
                                                                        }),
                                                                        // add timeline entry for auditing / history
                                                                        timeline: arrayUnion({
                                                                            id: generateId(),
                                                                            type: BookingActivityType.SETTLER_ACCEPT,
                                                                            timestamp: new Date(),
                                                                            actor: BookingActorType.SETTLER,

                                                                            // additional info
                                                                            settlerId: user?.uid,
                                                                            settlerServiceId: settlerServiceId,
                                                                            settlerProfileImageUrl: user?.profileImageUrl,
                                                                            firstName: user?.firstName,
                                                                            lastName: user?.lastName,
                                                                        }),
                                                                        status: 0,
                                                                    });
                                                                    onRefresh();
                                                                }
                                                            }}
                                                        >
                                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>{loading ? 'Accepting Job...' : 'Accept this job'}</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    ) : status === 1 && booking.settlerId === user?.uid ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Your reference number is</Text>
                                            <Text style={{ fontSize: 24, fontWeight: "bold", color: "indigo" }}>{booking.serviceStartCode}</Text>
                                            <Text style={{ fontSize: 10, color: COLORS.blackLight2, textAlign: 'center', paddingBottom: 10 }}>Please check the code with your customer. The code must match between you and customer.</Text>
                                            <TouchableOpacity
                                                disabled={loading}
                                                style={{
                                                    backgroundColor: COLORS.primary,
                                                    padding: 10,
                                                    borderRadius: 10,
                                                    marginVertical: 10,
                                                    width: '80%',
                                                    alignItems: 'center',
                                                    opacity: loading ? 0.7 : 1,
                                                }}
                                                onPress={async () => {
                                                    setLoading(true);
                                                    await updateBooking(booking.id!, {
                                                        status: 2,
                                                        timeline: arrayUnion({
                                                            id: generateId(),
                                                            type: BookingActivityType.SETTLER_SERVICE_START,
                                                            timestamp: new Date(),
                                                            actor: BookingActorType.SETTLER,
                                                        }),
                                                    });
                                                    onRefresh();
                                                }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>{loading ? 'Starting...' : 'Start Service'}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : status === 2 && booking.settlerId === user?.uid ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 4, textAlign: 'center' }}>Service in progress</Text>
                                            <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 4 }}>
                                                {booking?.selectedDate ? `${Math.ceil((new Date(booking.selectedDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left` : "N/A"}
                                            </Text>
                                            <TouchableOpacity
                                                disabled={loading}
                                                style={{
                                                    backgroundColor: COLORS.primary,
                                                    padding: 10,
                                                    borderRadius: 10,
                                                    marginVertical: 10,
                                                    width: '80%',
                                                    alignItems: 'center',
                                                    opacity: loading ? 0.7 : 1,
                                                }}
                                                onPress={async () => {
                                                    setLoading(true);
                                                    await updateBooking(booking.id!, {
                                                        status: 3,
                                                        timeline: arrayUnion({
                                                            id: generateId(),
                                                            type: BookingActivityType.SETTLER_SERVICE_END,
                                                            timestamp: new Date(),
                                                            actor: BookingActorType.SETTLER,
                                                        })
                                                    });
                                                    onRefresh();
                                                }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Complete Job</Text>
                                            </TouchableOpacity>
                                            <Text style={{ fontSize: 13, color: COLORS.black }}>or go to the bottom of this screen for more action</Text>
                                        </View>
                                    ) : status === 3 || status === 4 ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{status === 3 ? "Submit Your Job Completion Evidence" : "Customer Review In Progress"}</Text>
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
                                                    onClick(2);
                                                    onClickHeader(2);
                                                    setActiveIndex(2);
                                                }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Go To Service Evidence Tab</Text>
                                            </TouchableOpacity>
                                            <Text style={{ textAlign: 'center' }}>You might need to update the evidence if customer not mark it as completed.</Text>
                                        </View>
                                    ) : status === 5 ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>You're in cooldown period</Text>
                                            <Text style={{ fontSize: 13, color: COLORS.blackLight2, textAlign: 'center', paddingBottom: 10 }}>Customer will review your job completion and wait for the latecoming issues if exist.</Text>
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
                                                onPress={() => { if (user && customer) handleChat(user.uid, customer.uid) }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Message Customer</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : status === 6 ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontWeight: 'bold' }}>Your job is now completed.</Text>
                                        </View>
                                    ) : status === 7 ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Quotation Update Sent</Text>
                                            <Text style={{ fontSize: 13, color: COLORS.blackLight2, textAlign: 'center', paddingBottom: 10 }}>Awaiting for customer to accept or reject the quotation updates.</Text>
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: COLORS.primary,
                                                    padding: 10,
                                                    borderRadius: 10,
                                                    marginVertical: 10,
                                                    width: '80%',
                                                    alignItems: 'center',
                                                }}
                                                onPress={() => { if (user && customer) handleChat(user.uid, customer.uid) }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Message Customer</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : status === 8 ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Incompletion Flagged By Customer</Text>
                                            <Text style={{ fontSize: 13, color: COLORS.blackLight2, textAlign: 'center', paddingBottom: 10 }}>Verify your job completion.</Text>
                                            <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 10, paddingHorizontal: 10 }}>
                                                <TouchableOpacity
                                                    disabled={loading}
                                                    style={{
                                                        backgroundColor: COLORS.primary,
                                                        padding: 10,
                                                        borderRadius: 10,
                                                        marginVertical: 10,
                                                        width: '50%',
                                                        alignItems: 'center',
                                                        opacity: loading ? 0.7 : 1,
                                                    }}
                                                    onPress={async () => {
                                                        setLoading(true);
                                                        await updateBooking(booking.id!, {
                                                            status: 8.2,
                                                            incompletionStatus: BookingActivityType.SETTLER_RESOLVE_INCOMPLETION,
                                                            timeline: arrayUnion({
                                                                id: generateId(),
                                                                type: BookingActivityType.SETTLER_RESOLVE_INCOMPLETION,
                                                                actor: BookingActorType.SETTLER,
                                                                timestamp: new Date(),

                                                                // additional info
                                                                incompletionStatus: BookingActivityType.SETTLER_RESOLVE_INCOMPLETION,
                                                            }),
                                                        });
                                                        onRefresh();
                                                    }}
                                                >
                                                    <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Resolve</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    disabled={loading}
                                                    style={{
                                                        backgroundColor: COLORS.primary,
                                                        padding: 10,
                                                        borderRadius: 10,
                                                        marginVertical: 10,
                                                        width: '50%',
                                                        alignItems: 'center',
                                                        opacity: loading ? 0.7 : 1,
                                                    }}
                                                    onPress={async () => {
                                                        setLoading(true);
                                                        await updateBooking(booking.id!, {
                                                            incompletionStatus: BookingActivityType.SETTLER_REJECT_INCOMPLETION,
                                                            status: 4,

                                                            timeline: arrayUnion({
                                                                id: generateId(),
                                                                type: BookingActivityType.SETTLER_REJECT_INCOMPLETION,
                                                                actor: BookingActorType.SETTLER,
                                                                timestamp: new Date(),
                                                            }),
                                                        })
                                                        onRefresh();
                                                    }}>
                                                    <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Reject</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <TouchableOpacity
                                                style={{
                                                    width: '80%',
                                                    alignItems: 'center',
                                                }}
                                                onPress={async () => {
                                                    // if (booking.id) {
                                                    //     await updateBooking(booking.id, { status: status! + 1, serviceEndCode: Math.floor(1000000 + Math.random() * 9000000).toString() });
                                                    // }
                                                    // setStatus(status! + 1);
                                                    onClick(3);
                                                    onClickHeader(3);
                                                    setActiveIndex(3);
                                                }}
                                            >
                                                <View style={{ flexDirection: 'row' }}>
                                                    <Text>View incompletion evidence </Text>
                                                    <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>HERE</Text>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    ) : status === 8.2 ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontWeight: 'bold' }}>You're Going to Resolve the Incompletion</Text>
                                            <Text style={{ fontSize: 13, color: COLORS.blackLight2, textAlign: 'center', paddingBottom: 10 }}>Upload the completion evidence in this section below. Click this button below.</Text>
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
                                                    onClick(3);
                                                    onClickHeader(3);
                                                    setActiveIndex(3);
                                                }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>View Incompletion Report</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : status === 9 ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Cooldown Report Uploaded by Customer</Text>
                                            <Text style={{ fontSize: 13, color: COLORS.blackLight2, textAlign: 'center', paddingBottom: 10 }}>Select your action regarding it.</Text>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '90%', gap: 10, paddingHorizontal: 10 }}>
                                                <TouchableOpacity
                                                    disabled={loading}
                                                    style={{
                                                        backgroundColor: COLORS.primary,
                                                        padding: 10,
                                                        borderRadius: 10,
                                                        marginVertical: 10,
                                                        width: '50%',
                                                        alignItems: 'center',
                                                        opacity: loading ? 0.7 : 1,
                                                    }}
                                                    onPress={async () => {
                                                        setLoading(true);
                                                        await updateBooking(booking.id!, {
                                                            status: 9.2,
                                                            cooldownStatus: BookingActivityType.SETTLER_RESOLVE_COOLDOWN_REPORT,
                                                            timeline: arrayUnion({
                                                                id: generateId(),
                                                                type: BookingActivityType.SETTLER_RESOLVE_COOLDOWN_REPORT,
                                                                actor: BookingActorType.SETTLER,
                                                                timestamp: new Date(),

                                                                // additional info
                                                                isCompleted: false,

                                                            }),
                                                        });
                                                        onRefresh();
                                                    }}
                                                >
                                                    <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Resolve</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    disabled={loading}
                                                    style={{
                                                        backgroundColor: COLORS.primary,
                                                        padding: 10,
                                                        borderRadius: 10,
                                                        marginVertical: 10,
                                                        width: '50%',
                                                        alignItems: 'center',
                                                        opacity: loading ? 0.7 : 1,
                                                    }}
                                                    onPress={async () => {
                                                        setLoading(true);
                                                        await updateBooking(booking.id!, {
                                                            cooldownStatus: BookingActivityType.SETTLER_REJECT_COOLDOWN_REPORT,
                                                            status: 5,

                                                            timeline: arrayUnion({
                                                                id: generateId(),
                                                                type: BookingActivityType.SETTLER_REJECT_COOLDOWN_REPORT,
                                                                actor: BookingActorType.SETTLER,
                                                                timestamp: new Date(),
                                                            })
                                                        })
                                                        onRefresh();
                                                    }}>
                                                    <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Reject</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <TouchableOpacity
                                                style={{
                                                    width: '80%',
                                                    alignItems: 'center',
                                                }}
                                                onPress={async () => {
                                                    // if (booking.id) {
                                                    //     await updateBooking(booking.id, { status: status! + 1, serviceEndCode: Math.floor(1000000 + Math.random() * 9000000).toString() });
                                                    // }
                                                    // setStatus(status! + 1);
                                                    onClick(4);
                                                    onClickHeader(4);
                                                    setActiveIndex(4);
                                                }}
                                            >
                                                <View style={{ flexDirection: 'row' }}>
                                                    <Text>View cooldown problem report </Text>
                                                    <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>HERE</Text>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    ) : status === 9.1 ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontWeight: 'bold' }}>You're Going to Resolve the Report</Text>
                                            <Text style={{ fontSize: 13, color: COLORS.blackLight2, textAlign: 'center', paddingBottom: 10 }}>Upload the completion evidence in this section below. Click this button below.</Text>
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
                                                    onClick(4);
                                                    onClickHeader(4);
                                                    setActiveIndex(4);
                                                }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>View Problem Report</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : status === 9.2 ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontWeight: 'bold' }}>You're Going to Resolve the Cooldown Report</Text>
                                            <Text style={{ fontSize: 13, color: COLORS.blackLight2, textAlign: 'center', paddingBottom: 10 }}>Upload the completion evidence in this section below. Click this button below.</Text>
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
                                                    onClick(4);
                                                    onClickHeader(4);
                                                    setActiveIndex(4);
                                                }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>View Problem Report</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : status === 11 || status === 11.1 || status === 11.2 ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontWeight: 'bold' }}>Booking Has been Cancelled {booking.status === 11.1 ? 'by Customer' : booking.status === 11.2 ? 'by Settler' : ''}</Text>
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
                                                    navigation.navigate('BookingCancelForm', { booking: booking });
                                                }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>View Cancellation Reason</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : booking.settlerId !== '' && booking.settlerId !== user?.uid ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontWeight: 'bold' }}>Sorry the job already taken.</Text>
                                        </View>
                                    ) : (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontWeight: 'bold' }}>Unknown status: {booking.status}</Text>
                                        </View>
                                    )
                                    }
                                </View>

                                {/* Customer Details Card */}
                                {booking.settlerId !== '' && booking.settlerId === user?.uid && (
                                    <View style={{ width: '100%', paddingHorizontal: 15, borderRadius: 20, borderColor: COLORS.blackLight, borderWidth: 1, marginBottom: 20 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginVertical: 10 }}>
                                            <View style={{ flex: 1, alignItems: 'center', paddingLeft: 10 }}>
                                                {
                                                    customer?.profileImageUrl ? (
                                                        <Image
                                                            source={{ uri: customer.profileImageUrl }}
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
                                                        <Text style={{ fontSize: 17, fontWeight: 'bold', color: COLORS.black }} numberOfLines={1} ellipsizeMode="tail">Settling for: {booking.firstName} {booking.lastName}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                                <Text style={{ fontSize: 14, color: COLORS.black }}>4.5 ratings</Text>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => { if (user && customer) handleChat(user.uid, customer.uid) }}
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
                                )}
                                <View style={[GlobalStyleSheet.line, { marginTop: 10 }]} />
                                <ScrollView
                                    ref={scrollViewTabHeader}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                >
                                    {buttons.map((btn: any, i: number) => (
                                        <View key={i} style={{ flexDirection: 'row', width: SIZES.width * 0.4, paddingHorizontal: 5, paddingTop: 20, justifyContent: 'space-between', alignItems: 'center' }}>
                                            <TouchableOpacity
                                                key={btn}
                                                style={{ width: '100%', justifyContent: 'center', alignItems: 'center', }}
                                                onPress={() => {
                                                    setActiveIndex(i);
                                                    if (onClick) {
                                                        onClick(i);
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
                                    ref={scrollViewTabContent}
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
                                            <View style={{ width: '90%', }}>
                                                {index === 0 && (
                                                    <View>
                                                        <BookingSummaryCard
                                                            booking={booking}
                                                            selectedAddons={booking.newAddons ?? booking.addons!}
                                                            newAddons={booking.newAddons ?? booking.addons!}
                                                            isEditable={false}
                                                            hideCheckboxes={true}
                                                        />
                                                    </View>
                                                )}
                                                {index === 1 && (
                                                    <View>
                                                        <View style={{ paddingTop: 15 }}>
                                                            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Service Location:</Text>
                                                            <AddressCard selectedAddress={booking?.selectedAddress} />
                                                        </View>
                                                        <AttachmentForm
                                                            title="Note to Settler"
                                                            description="Tell the settler anything important regarding the service."
                                                            remarkPlaceholder='e.g. Please be careful with the antique vase.'
                                                            initialImages={booking.notesToSettlerImageUrls || []}
                                                            initialRemark={booking.notesToSettler || ''}
                                                        />
                                                    </View>
                                                )}
                                                {index === 2 && (
                                                    <AttachmentForm
                                                        title="Service Completion Evidence"
                                                        description="Attach photos and remarks to verify your service completion."
                                                        initialImages={booking?.settlerEvidenceImageUrls ?? []}
                                                        initialRemark={booking?.settlerEvidenceRemark ?? ''}
                                                        isEditable={loading ? false : true}
                                                        buttonText={loading ? ((booking.settlerEvidenceImageUrls && booking.settlerEvidenceImageUrls.length > 0) || (booking.settlerEvidenceRemark && booking.settlerEvidenceRemark.length > 0) ? 'Updating...' : 'Submitting...') : ((booking.settlerEvidenceImageUrls && booking.settlerEvidenceImageUrls.length > 0) || (booking.settlerEvidenceRemark && booking.settlerEvidenceRemark.length > 0) ? 'Update Evidence' : 'Submit Evidence')}
                                                        onSubmit={async (data) => {
                                                            setLoading(true);
                                                            await uploadImagesCompletionEvidence(booking.id!, data.images).then((urls) => {
                                                                data.images = urls;
                                                            });

                                                            await updateBooking(booking.id!, {
                                                                status: 4,
                                                                settlerEvidenceImageUrls: data.images,
                                                                settlerEvidenceRemark: data.remark,
                                                                timeline: arrayUnion({
                                                                    id: generateId(),
                                                                    type: booking.settlerEvidenceImageUrls && booking.settlerEvidenceImageUrls.length > 0 ? BookingActivityType.SETTLER_EVIDENCE_UPDATED : BookingActivityType.SETTLER_EVIDENCE_SUBMITTED,
                                                                    actor: BookingActorType.SETTLER,
                                                                    timestamp: new Date(),

                                                                    // additional info
                                                                    settlerEvidenceImageUrls: data.images,
                                                                    settlerEvidenceRemark: data.remark,
                                                                }),

                                                            });
                                                            onRefresh();
                                                        }}
                                                    />
                                                )}
                                                {index === 3 && (
                                                    (booking.incompletionReportImageUrls && booking.incompletionReportImageUrls.length > 0 && booking.incompletionReportRemark && booking.incompletionReportRemark.length > 0) ? (
                                                        <View>
                                                            <AttachmentForm
                                                                title="Report Service Incompletion"
                                                                description="Your customer reports about the incompletion of your service. Please provide evidence and remarks to verify your job completion."
                                                                remarkPlaceholder='Water dripping from the faucet after the settler fixed it.'
                                                                initialImages={booking.incompletionReportImageUrls || []}
                                                                initialRemark={booking.incompletionReportRemark || ''}
                                                            />
                                                            {(booking.incompletionStatus === BookingActivityType.SETTLER_RESOLVE_INCOMPLETION || booking.incompletionStatus === BookingActivityType.SETTLER_UPDATE_INCOMPLETION_EVIDENCE || booking.incompletionStatus === BookingActivityType.CUSTOMER_REJECT_INCOMPLETION_RESOLVE || booking.incompletionStatus === BookingActivityType.SETTLER_REJECT_INCOMPLETION) && (
                                                                <View>
                                                                    <View style={[GlobalStyleSheet.line, { marginTop: 20 }]} />
                                                                    <AttachmentForm
                                                                        title="Provide Incompletion Resolved Evidence"
                                                                        description="Show the completion of the reported incompletion job."
                                                                        remarkPlaceholder='e.g. Problem fixed, all in good condition.'
                                                                        initialImages={booking.incompletionResolvedImageUrls || []}
                                                                        initialRemark={booking.incompletionResolvedRemark || ''}
                                                                        buttonText={loading ? ((booking.incompletionResolvedImageUrls && booking.incompletionResolvedImageUrls.length > 0) || (booking.incompletionResolvedRemark && booking.incompletionResolvedRemark.length > 0) ? 'Updating...' : 'Submitting...') : ((booking.incompletionResolvedImageUrls && booking.incompletionResolvedImageUrls.length > 0) || (booking.incompletionResolvedRemark && booking.incompletionResolvedRemark.length > 0) ? 'Update Evidence' : 'Submit Evidence')}
                                                                        isEditable={loading ? false : (booking.incompletionStatus === BookingActivityType.SETTLER_RESOLVE_INCOMPLETION ? true : false)}
                                                                        showSubmitButton={booking.incompletionStatus === BookingActivityType.SETTLER_RESOLVE_INCOMPLETION ? true : false}
                                                                        onSubmit={async (data) => {
                                                                            setLoading(true);
                                                                            await uploadImageIncompletionResolveEvidence(booking.id!, data.images ?? []).then((urls => {
                                                                                data.images = urls;
                                                                            }));
                                                                            await updateBooking(booking.id!, {
                                                                                status: 4,
                                                                                incompletionResolvedImageUrls: data.images,
                                                                                incompletionResolvedRemark: data.remark,
                                                                                incompletionStatus: BookingActivityType.SETTLER_UPDATE_INCOMPLETION_EVIDENCE,
                                                                                timeline: arrayUnion({
                                                                                    id: generateId(),
                                                                                    type: BookingActivityType.SETTLER_UPDATE_INCOMPLETION_EVIDENCE,
                                                                                    timestamp: new Date(),
                                                                                    actor: BookingActorType.SETTLER,

                                                                                    // additional info
                                                                                    incompletionResolvedImageUrls: data.images,
                                                                                    incompletionResolvedRemark: data.remark,
                                                                                    isCompleted: false,
                                                                                }),
                                                                            });
                                                                            onRefresh();
                                                                        }}
                                                                    />
                                                                </View>
                                                            )}
                                                        </View>
                                                    ) : (
                                                        <View style={{ padding: 20, alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 10, marginTop: 20 }}>
                                                            <Text style={{ color: COLORS.blackLight2 }}>No reports by customer</Text>
                                                        </View>
                                                    )
                                                )}
                                                {index === 4 && (
                                                    (booking.cooldownReportImageUrls && booking.cooldownReportImageUrls.length > 0 && booking.cooldownReportRemark && booking.cooldownReportRemark.length > 0) ? (
                                                        <View>
                                                            <AttachmentForm
                                                                title="Report Problem during Cooldown Period"
                                                                description="You can report any problem regarding the service during this cooldown period."
                                                                remarkPlaceholder='Water dripping from the faucet after the settler fixed it.'
                                                                initialImages={booking.cooldownReportImageUrls || []}
                                                                initialRemark={booking.cooldownReportRemark || ''}
                                                            />
                                                            {(booking.cooldownStatus === BookingActivityType.SETTLER_RESOLVE_COOLDOWN_REPORT || booking.cooldownStatus === BookingActivityType.SETTLER_UPDATE_COOLDOWN_REPORT_EVIDENCE || booking.cooldownStatus === BookingActivityType.CUSTOMER_COOLDOWN_REPORT_NOT_RESOLVED || booking.cooldownStatus === BookingActivityType.SETTLER_REJECT_COOLDOWN_REPORT) && (
                                                                <View>
                                                                    <View style={[GlobalStyleSheet.line, { marginTop: 20 }]} />
                                                                    <AttachmentForm
                                                                        title="Report Resolved Evidence"
                                                                        description="Show the completion of the reported problem during cooldown."
                                                                        remarkPlaceholder='e.g. Problem fixed, all in good condition.'
                                                                        initialImages={booking.cooldownResolvedImageUrls || []}
                                                                        initialRemark={booking.cooldownResolvedRemark || ''}
                                                                        buttonText={loading ? ((booking.cooldownResolvedImageUrls && booking.cooldownResolvedImageUrls.length > 0) || (booking.cooldownResolvedRemark && booking.cooldownResolvedRemark.length > 0) ? 'Updating...' : 'Submitting...') : ((booking.cooldownResolvedImageUrls && booking.cooldownResolvedImageUrls.length > 0) || (booking.cooldownResolvedRemark && booking.cooldownResolvedRemark.length > 0) ? 'Update Evidence' : 'Submit Evidence')}
                                                                        isEditable={loading ? false : (booking.cooldownStatus === BookingActivityType.SETTLER_RESOLVE_COOLDOWN_REPORT ? true : false)}
                                                                        showSubmitButton={booking.cooldownStatus === BookingActivityType.SETTLER_RESOLVE_COOLDOWN_REPORT ? true : false}
                                                                        onSubmit={async (data) => {
                                                                            setLoading(true);
                                                                            await uploadImagesCooldownReportEvidence(booking.id!, data.images ?? []).then((urls => {
                                                                                data.images = urls;
                                                                            }));
                                                                            await updateBooking(booking.id!, {
                                                                                status: 5,
                                                                                cooldownResolvedImageUrls: data.images,
                                                                                cooldownResolvedRemark: data.remark,
                                                                                cooldownStatus: BookingActivityType.SETTLER_UPDATE_COOLDOWN_REPORT_EVIDENCE,
                                                                                timeline: arrayUnion({
                                                                                    id: generateId(),
                                                                                    type: BookingActivityType.SETTLER_UPDATE_COOLDOWN_REPORT_EVIDENCE,
                                                                                    timestamp: new Date(),
                                                                                    actor: BookingActorType.SETTLER,

                                                                                    // additional info
                                                                                    cooldownResolvedImageUrls: data.images,
                                                                                    cooldownResolvedRemark: data.remark,
                                                                                    isCompleted: false,
                                                                                }),
                                                                            });
                                                                            onRefresh();
                                                                        }}
                                                                    />
                                                                </View>
                                                            )}
                                                        </View>
                                                    ) : (
                                                        <View style={{ padding: 20, alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 10, marginTop: 20 }}>
                                                            <Text style={{ color: COLORS.blackLight2 }}>No reports by customer</Text>
                                                        </View>
                                                    )
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </ScrollView>
                                <View style={[GlobalStyleSheet.line, { marginTop: 20 }]} />
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
                                                disabled={true}
                                                style={{
                                                    backgroundColor: COLORS.background,
                                                    padding: 10,
                                                    borderRadius: 10,
                                                    borderWidth: 1,
                                                    borderColor: COLORS.blackLight,
                                                    width: '48%',
                                                    alignItems: 'center',
                                                    opacity: 0.5
                                                }}
                                                onPress={item.onPressAction}
                                            >
                                                <Text style={{ color: COLORS.black, fontWeight: 'bold', opacity: 0.5 }}>{item.buttonTitle}</Text>
                                            </TouchableOpacity>
                                        )}
                                    />
                                    {(booking.status <= 11 && booking.status !== 6) && user?.uid === booking.settlerId && (
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
                                                onPress={() => {
                                                    navigation.navigate('BookingCancelForm', { booking: booking });
                                                }}
                                            >
                                                <Text style={{ fontSize: 14, color: COLORS.danger, lineHeight: 21, fontWeight: 'bold', textDecorationLine: 'underline' }}>Cancel Job</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
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
            {/* Extend Job Period Subscreen */}
            {subScreenIndex === 1 && (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 70, paddingHorizontal: 15 }}>
                    <View style={{ alignItems: 'center', marginVertical: 10 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.title }}>
                            {selectedDate
                                ? `Your Selected Date is `
                                : 'Select a Date'}
                        </Text>
                        {selectedDate && (
                            <Text style={{ fontSize: 16, color: COLORS.blackLight, marginTop: 5 }}>
                                {`${format(new Date(selectedDate), 'dd MMM yyyy')}`}
                            </Text>
                        )}
                    </View>
                    <Calendar
                        onDayPress={(day) => setSelectedDate(day.dateString)}
                        minDate={new Date().toISOString().split('T')[0]}
                        markedDates={
                            selectedDate
                                ? {
                                    [selectedDate]: {
                                        selected: true,
                                        selectedColor: COLORS.primary,
                                    },
                                }
                                : {}
                        }
                        theme={{
                            todayTextColor: COLORS.primary,
                            selectedDayBackgroundColor: COLORS.primary,
                            arrowColor: COLORS.primary,
                        }}
                        renderHeader={(date) => (
                            <Text style={{ fontSize: 17, fontWeight: 'bold', color: COLORS.black }}>
                                {format(new Date(date), 'MMMM yyyy')}
                            </Text>
                        )}
                    />
                    <View>
                        <Text style={{ fontSize: 15, fontWeight: "bold", color: COLORS.title, marginVertical: 10 }}>Extending Reason</Text>
                        <Input
                            readOnly={booking.settlerEvidenceRemark !== '' ? true : false}
                            onFocus={() => setisFocused(true)}
                            onBlur={() => setisFocused(false)}
                            isFocused={isFocused}
                            onChangeText={setSettlerEvidenceRemark}
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
                            placeholder={`e.g. All in good conditions.`}
                            multiline={true}  // Enable multi-line input
                            numberOfLines={10} // Suggest the input area size
                            value={settlerEvidenceRemark ? settlerEvidenceRemark : ''}
                        />
                    </View>
                    <TouchableOpacity
                        style={{
                            backgroundColor: COLORS.primary,
                            padding: 15,
                            borderRadius: 10,
                            marginVertical: 20,
                            width: '100%',
                            alignItems: 'center',
                        }}
                        onPress={() => {
                            setSelectedDate(selectedDate);
                            setSubScreenIndex(0);
                        }}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15, }}>Update Completion Date</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
            {/* Update Booking Quote Subscreen */}
            {subScreenIndex === 2 && (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 70, paddingHorizontal: 15 }}>
                    <View>
                        {booking.catalogueService.dynamicOptions && booking.catalogueService.dynamicOptions.map((cat) => (
                            <View key={cat.name} style={{ marginVertical: 10 }}>
                                <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                                    {cat.name} {cat.multipleSelect && "(Select one)"}
                                </Text>
                                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 5 }}>
                                    {cat.subOptions.map((option) => {
                                        const isSelected = selectedAddons[cat.name]?.some((o) => o.label === option.label);
                                        return (
                                            <TouchableOpacity
                                                key={option.label}
                                                style={{
                                                    padding: 10,
                                                    borderWidth: 1,
                                                    borderColor: isSelected ? "blue" : "#ccc",
                                                    backgroundColor: isSelected ? "#e0f0ff" : "white",
                                                    borderRadius: 8,
                                                    minWidth: 100,
                                                }}
                                                onPress={() => toggleAddon(cat, option)}
                                            >
                                                <Text>{option.label}</Text>
                                                <Text style={{ fontSize: 12, color: "#555" }}>+${option.additionalPrice}</Text>
                                                {option.notes && <Text style={{ fontSize: 10, color: "#888" }}>{option.notes}</Text>}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        ))}
                        <View style={[GlobalStyleSheet.line]} />
                        <Text style={{ fontSize: 15, fontWeight: "bold", color: COLORS.title, marginVertical: 10 }}>Write additional quotation</Text>
                        <Input
                            onFocus={() => setisFocused(true)}
                            onBlur={() => setisFocused(false)}
                            isFocused={isFocused}
                            onChangeText={setNewManualQuotationDescription}
                            value={newManualQuoteDescription ? newManualQuoteDescription : ''}
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
                        />
                        <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Additional Price</Text>
                        <Input
                            onFocus={() => setisFocused(true)}
                            onBlur={() => {
                                setisFocused(false);
                                const newTotal = calculateTotalQuote(basePrice, selectedAddons, Number(newManualQuotePrice));
                                setTotalQuote(newTotal);
                            }}
                            value={newManualQuotePrice ? `${newManualQuotePrice}` : ''}
                            isFocused={isFocused}
                            onChangeText={setNewManualQuotationPrice}
                            backround={COLORS.card}
                            style={{ borderRadius: 12, backgroundColor: COLORS.input, borderColor: COLORS.inputBorder, borderWidth: 1, height: 50 }}
                            placeholder='e.g. 20'
                            keyboardType={'numeric'}
                        />
                    </View>
                </ScrollView>
            )}
            {/* Update Booking Quote Bottom Subscreen */}
            {subScreenIndex === 2 && (
                <View style={[GlobalStyleSheet.flex, { paddingVertical: 15, paddingHorizontal: 20, backgroundColor: COLORS.card, }]}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <View style={{ flexDirection: 'column' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                <Text style={{ fontSize: 23, color: COLORS.title, fontWeight: 'bold' }}>
                                    Starting at RM{totalQuote}
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 5 }}>
                                <Text style={{ fontSize: 14, color: COLORS.blackLight2 }}>Platform fees applied.</Text>
                                {/* <Text>{startDate && endDate ? `Available from ${format(new Date(startDate), 'dd MMM.')}` : ''}</Text> */}
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={{
                            backgroundColor: COLORS.primary,
                            width: 150,
                            padding: 15,
                            borderRadius: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        onPress={async () => {
                            // ensure every subOption has isCompleted: true
                            const addonsArrayWithCompleted = addonsArray.map(cat => ({
                                ...cat,
                                subOptions: cat.subOptions.map((o: SubOption) => ({ ...o, isCompleted: true })),
                            }));

                            await updateBooking(booking.id!, {
                                newAddons: addonsArrayWithCompleted,
                                newTotal: totalQuote + 2,
                                newManualQuoteDescription: newManualQuoteDescription,
                                newManualQuotePrice: newManualQuotePrice,
                                isQuoteUpdateSuccessful: false,
                                status: 7,
                                timeline: arrayUnion({
                                    id: generateId(),
                                    actor: BookingActorType.SETTLER,
                                    type: BookingActivityType.SETTLER_QUOTE_UPDATED,
                                    timestamp: new Date(),

                                    // additional info
                                    newAddons: addonsArrayWithCompleted,
                                    oldTotal: booking.total,
                                    newTotal: totalQuote + 2,
                                    newManualQuoteDescription: newManualQuoteDescription,
                                    newManualQuotePrice: newManualQuotePrice,
                                    isQuoteUpdateSuccessful: '',
                                }),
                            });
                            setSubScreenIndex(0);
                            setTotalQuote(Number(totalQuote) - Number(newManualQuotePrice))
                        }}
                    >
                        <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: 'bold' }}>Update Pricing</Text>
                    </TouchableOpacity>
                </View>
            )}
            {/* Partial Booking Completion Flag Subscreen  */}
            {subScreenIndex === 3 && (
                <BookingTimeline
                    booking={booking}
                    onRefresh={onRefresh}
                />
            )}

        </View>
    )
}

export default MyRequestDetails