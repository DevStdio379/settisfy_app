import React, { useState, useEffect, useRef, useCallback } from 'react'
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
import { Booking, BookingActivityType, BookingActorType, fetchSelectedBooking, updateBooking } from '../../services/BookingServices';
import { arrayUnion, deleteField } from 'firebase/firestore';
import { getOrCreateChat } from '../../services/ChatServices';
import Input from '../../components/Input/Input';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';
import { DynamicOption, SubOption } from '../../services/CatalogueServices';
import { generateId } from '../../helper/HelperFunctions';
import AttachmentForm from '../../components/Forms/AttachmentForm';
import BookingSummaryCard from '../../components/BookingSummaryCard';

type MyRequestDetailsScreenProps = StackScreenProps<RootStackParamList, 'MyRequestDetails'>;


const MyRequestDetails = ({ navigation, route }: MyRequestDetailsScreenProps) => {

    const { user } = useUser();
    const mapRef = useRef<MapView | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const scrollViewTabHeader = useRef<any>(null);
    const scrollViewTabContent = useRef<any>(null);
    const buttons = ['Transaction Summary', 'Service Notes', 'Service Evidence'];
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

    const [incompletionImageUrls, setIncompletionImageUrls] = useState<string[]>([]);
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

    const handleImageSelect = () => {
        if (settlerEvidenceImageUrls.length >= 5) {
            Alert.alert('Limit Reached', 'You can only select up to 5 images.');
            return;
        }

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancel', 'Choose from Gallery', 'Use Camera'],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) selectImages();
                    else if (buttonIndex === 2) cameraImage();
                }
            );
        } else {
            Alert.alert('Add Photo', 'Choose an option', [
                { text: 'Choose from Gallery', onPress: selectImages },
                { text: 'Use Camera', onPress: cameraImage },
                { text: 'Cancel', style: 'cancel' },
            ]);
        }
    };



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




    // camera tools
    const selectImages = async () => {
        const options = {
            mediaType: 'photo' as const,
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
            selectionLimit: 5 - settlerEvidenceImageUrls.length, // Limit the selection to the remaining slots
        };

        launchImageLibrary(options, async (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.errorMessage) {
                console.log('Image picker error: ', response.errorMessage);
            } else {
                const selectedImages = response.assets?.map(asset => asset.uri).filter(uri => uri !== undefined) as string[] || [];
                setSettlerEvidenceImageUrls((prevImages) => {
                    const updatedImages = [...prevImages, ...selectedImages];
                    setSelectedSettlerEvidenceImageUrl(updatedImages[0]);
                    return updatedImages;
                });
            }
        });
    };

    // Function to handle image selection (Gallery & Camera)
    const cameraImage = async () => {
        const options = {
            mediaType: 'photo' as const,
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
        };

        if (settlerEvidenceImageUrls.length >= 5) {
            Alert.alert('You can only select up to 5 images.');
            return;
        }

        launchCamera(options, async (response: any) => {
            if (response.didCancel) {
                console.log('User cancelled camera');
            } else if (response.errorCode) {
                console.log('Camera Error: ', response.errorMessage);
            } else {
                let newImageUri = response.assets?.[0]?.uri;
                if (newImageUri) {
                    setSettlerEvidenceImageUrls((prevImages) => {
                        const updatedImages = [...prevImages, newImageUri];
                        setSelectedSettlerEvidenceImageUrl(updatedImages[0]);
                        return updatedImages;
                    });
                }
            }
        });
    };

    const deleteImage = () => {
        if (!selectedNotesToSettlerImageUrl) return;

        const updatedImages = settlerEvidenceImageUrls.filter((img) => img !== selectedSettlerEvidenceImageUrl);
        setSettlerEvidenceImageUrls(updatedImages);
        setSelectedSettlerEvidenceImageUrl(updatedImages.length > 0 ? updatedImages[0] : null);
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

                if (booking.incompletionImageUrls) {
                    setIncompletionImageUrls(booking.incompletionImageUrls);
                    setSelectedIncompletionImageUrl(booking.incompletionImageUrls[0])
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
    // 2: active booking
    // 3: job completed
    // 1-6 : ok flow
    // 7++ : exception handling
    // 7: update quote
    // 8: incomplete flag by customer

    const steps = [
        { label: "Booking\nCreated", date: 'Job\nbroadcast', completed: (status ?? 0) >= 0 },
        { label: "Settler\nSelected", date: "Check\nservice code", completed: (status ?? 0) >= 1 },
        { label: "Active\nService", date: "\n", completed: (status ?? 0) >= 2 },
        { label: "Service\nCompleted", date: "Evaluate\ncompletion", completed: (status ?? 0) >= 3 },
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
                        {/* right header element */}
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
                                                    <Text style={{ fontWeight: 'bold' }}>Take this job?</Text>
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
                                                                            message: "Settler accepted the booking.",
                                                                            timestamp: new Date(),
                                                                            actor: BookingActorType.SETTLER,

                                                                            // additional info
                                                                            settlerId: user?.uid,
                                                                            settlerServiceId: settlerServiceId,
                                                                            firstName: user?.firstName,
                                                                            lastName: user?.lastName,
                                                                        }),
                                                                        status: 0,
                                                                    });
                                                                    onRefresh();
                                                                }
                                                                setStatus(status! + 1);
                                                            }}
                                                        >
                                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Yes</Text>
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
                                                style={{
                                                    backgroundColor: COLORS.primary,
                                                    padding: 10,
                                                    borderRadius: 10,
                                                    marginVertical: 10,
                                                    width: '80%',
                                                    alignItems: 'center',
                                                }}
                                                onPress={async () => {
                                                    await updateBooking(booking.id!, {
                                                        status: 2,
                                                        timeline: arrayUnion({
                                                            id: generateId(),
                                                            type: BookingActivityType.SETTLER_SERVICE_START,
                                                            message: "Settler confirmed service start.",
                                                            timestamp: new Date(),
                                                            actor: BookingActorType.SETTLER,
                                                        }),
                                                    });
                                                    setStatus(status! + 1);
                                                }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Start Service</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : status === 2 && booking.settlerId === user?.uid ? (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 4, textAlign: 'center' }}>Service in progress</Text>
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

                                                    await updateBooking(booking.id!, {
                                                        status: 3,
                                                        timeline: arrayUnion({
                                                            id: generateId(),
                                                            type: BookingActivityType.SETTLER_SERVICE_END,
                                                            message: "Settler marked service as completed.",
                                                            timestamp: new Date(),
                                                            actor: BookingActorType.SETTLER,
                                                        })
                                                    });

                                                    setStatus(3);
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
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: COLORS.primary,
                                                    padding: 10,
                                                    borderRadius: 10,
                                                    marginVertical: 10,
                                                    width: '80%',
                                                    alignItems: 'center',
                                                }}
                                                onPress={() => { setSubScreenIndex(3) }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>View Flagged Job</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={{ width: "100%", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ fontWeight: 'bold' }}>Your job is now completed.</Text>
                                        </View>
                                    )
                                    }
                                </View>
                                {/* Customer Details Card */}
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
                                <View style={[GlobalStyleSheet.line]} />
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
                                                    <BookingSummaryCard
                                                        booking={booking}                  
                                                        selectedAddons={booking.addons!}
                                                        newAddons={booking.newAddons!} 
                                                              
                                                        isEditable={false}                 
                                                    />
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
                                                {index === 2 && (
                                                    <AttachmentForm
                                                        title="Service Completion Evidence"
                                                        description="Attach photos and remarks to verify your service completion."
                                                        initialImages={booking?.settlerEvidenceImageUrls ?? []}
                                                        initialRemark={booking?.settlerEvidenceRemark ?? ''}
                                                        onSubmit={async ({ images, remark }) => {
                                                            await updateBooking(booking.id!, {
                                                                status: 4,
                                                                settlerEvidenceImageUrls: images,
                                                                settlerEvidenceRemark: remark,
                                                            });
                                                            onRefresh();
                                                        }}
                                                    />


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
                                            <Text style={{ fontSize: 14, color: COLORS.danger, lineHeight: 21, fontWeight: 'bold', textDecorationLine: 'underline' }}>Cancel Job</Text>
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
                            await updateBooking(booking.id!, {
                                newAddons: addonsArray,
                                newTotal: totalQuote + 2,
                                newManualQuoteDescription: newManualQuoteDescription,
                                newManualQuotePrice: newManualQuotePrice,
                                isQuoteUpdateSuccessful: false,
                                status: 7,
                                timeline: arrayUnion({
                                    id: generateId(),
                                    actor: BookingActorType.SETTLER,
                                    type: BookingActivityType.SETTLER_QUOTE_UPDATED,
                                    message: 'Settler updated the booking quotation.',
                                    timestamp: new Date(),

                                    // additional info
                                    newAddons: addonsArray,
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
                                        <Text style={{ fontWeight: 'bold' }}>Job Partial Completion Flag</Text>
                                        <Text style={{ color: COLORS.blackLight2, textAlign: 'center' }}>Kindly discuss with your customer regarding this. You can choose any of these options:</Text>
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
                                                await updateBooking(booking.id!, {
                                                    status: 4,
                                                    timeline: arrayUnion({
                                                        id: generateId(),
                                                        actor: BookingActorType.SETTLER,
                                                        type: BookingActivityType.VISIT_AND_FIX_SCHEDULED,
                                                        message: "Visit and fix scheduled",
                                                        timestamp: Date.now(),
                                                    }),
                                                });
                                                onRefresh();
                                                setSubScreenIndex(0);
                                            }}
                                        >
                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Visit & Fix</Text>
                                        </TouchableOpacity>
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
                                                await updateBooking(booking.id!, {
                                                    status: 4,
                                                    timeline: arrayUnion({
                                                        id: generateId(),
                                                        actor: BookingActorType.SETTLER,
                                                        type: BookingActivityType.VISIT_AND_FIX_SCHEDULED,
                                                        message: "Visit and fix scheduled",
                                                        timestamp: Date.now(),
                                                    }),
                                                });
                                                onRefresh();
                                                setSubScreenIndex(0);
                                            }}
                                        >
                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Update Evidence</Text>
                                        </TouchableOpacity>
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
                                                setSubScreenIndex(2);
                                            }}
                                        >
                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Update Quotation</Text>
                                        </TouchableOpacity>
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
                                        {/* Base Service */}
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                            <Text style={{ fontSize: 14, color: "#333" }}>Service Price</Text>
                                            <Text style={{ fontSize: 14, fontWeight: "bold" }}>£{booking.catalogueService.basePrice}</Text>
                                        </View>

                                        {/* Addons */}
                                        {/* <TouchableOpacity onPress={toggleAllCompletion}>
                                                            <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>
                                                                {localAddons.every(addon => addon.subOptions.every(opt => opt.isCompleted))
                                                                    ? 'Mark All Incomplete'
                                                                    : 'Mark All Complete'}
                                                            </Text>
                                                        </TouchableOpacity> */}

                                        {booking.incompletionAddonsCheck!.map((addon, addonIndex) => (
                                            <View key={addon.name}>
                                                {addon.subOptions.map((opt, subIndex) => (
                                                    <View
                                                        key={opt.label}
                                                        style={{
                                                            flexDirection: 'row',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            marginBottom: 6,
                                                            opacity: opt.isCompleted ? 1 : 0.4, // 🔘 grey out unchecked
                                                        }}
                                                    >
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                            <TouchableOpacity
                                                                onPress={() => { }}
                                                                style={{
                                                                    width: 22,
                                                                    height: 22,
                                                                    borderRadius: 5,
                                                                    borderWidth: 2,
                                                                    borderColor: COLORS.inputBorder,
                                                                    justifyContent: 'center',
                                                                    alignItems: 'center',
                                                                    marginRight: 8,
                                                                    backgroundColor: opt.isCompleted ? COLORS.primary : COLORS.input,
                                                                }}
                                                            >
                                                                {opt.isCompleted && (
                                                                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                                                                )}
                                                            </TouchableOpacity>

                                                            <Text style={{ fontSize: 14, color: '#333' }}>
                                                                {addon.name}: {opt.label}
                                                            </Text>
                                                        </View>

                                                        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>
                                                            £{opt.additionalPrice}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        ))}



                                        {/* Platform Fee */}
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                            <Text style={{ fontSize: 14, color: "#333" }}>Platform Fee</Text>
                                            <Text style={{ fontSize: 14, fontWeight: "bold" }}>£2.00</Text>
                                        </View>

                                        {/* Additional Quote */}
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, opacity: booking.incompletionManualQuoteCheck ? 1 : 0.4 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                <TouchableOpacity
                                                    onPress={() => { }}
                                                    style={{
                                                        width: 22,
                                                        height: 22,
                                                        borderRadius: 5,
                                                        borderWidth: 2,
                                                        borderColor: COLORS.inputBorder,
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        marginRight: 8,
                                                        backgroundColor: booking && booking.incompletionManualQuoteCheck ? COLORS.primary : COLORS.input,
                                                    }}
                                                >
                                                    {booking.incompletionManualQuoteCheck && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
                                                </TouchableOpacity>

                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 14, color: "#333" }}>Additional Charge (by settler)</Text>
                                                    <Text
                                                        style={{
                                                            fontSize: 14,
                                                            width: SIZES.width * 0.75,
                                                            marginTop: 5,
                                                            color: "#333",
                                                            backgroundColor: COLORS.primaryLight,
                                                            padding: 10,
                                                            borderRadius: 10,
                                                        }}
                                                    >
                                                        {booking.manualQuoteDescription || 'N/A'}
                                                    </Text>
                                                </View>
                                            </View>

                                            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>
                                                £{booking.manualQuotePrice || 0}
                                            </Text>
                                        </View>


                                        {/* Divider */}
                                        <View style={[{ backgroundColor: COLORS.black, height: 1, margin: 10, width: '90%', alignSelf: 'center' }]} />

                                        {/* Total */}
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                            <Text style={{ fontSize: 14, fontWeight: "bold" }}>Total</Text>
                                            <Text style={{ fontSize: 14, color: "#333", fontWeight: "bold" }}>
                                                RM{booking.incompletionTotal || 0}
                                            </Text>
                                        </View>
                                        <View style={[GlobalStyleSheet.line]} />
                                        <View>
                                            <Text style={{ fontSize: 15, fontWeight: "bold", color: COLORS.title, marginTop: 10 }}>Job Incompletion Evidence</Text>
                                            <Text style={{ paddingBottom: 10 }}>Please provide evidence of the job incompletion.</Text>
                                            <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', gap: 10, paddingTop: 0 }}>
                                                {booking.incompletionImageUrls!.length > 0 ? (
                                                    <View style={{ flex: 1, width: '100%', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                                                        <Image source={{ uri: selectedIncompletionImageUrl! }} style={{ width: '100%', height: 300, borderRadius: 10, marginBottom: 10 }} resizeMode="cover" />

                                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                            {booking.incompletionImageUrls!.map((u, idx) => (
                                                                <TouchableOpacity key={idx} onPress={() => setSelectedIncompletionImageUrl(u)}>
                                                                    <Image source={{ uri: u }} style={{ width: 80, height: 80, marginRight: 10, borderRadius: 10, borderWidth: selectedIncompletionImageUrl === u ? 3 : 0, borderColor: selectedIncompletionImageUrl === u ? COLORS.primary : 'transparent' }} />
                                                                </TouchableOpacity>
                                                            ))}
                                                        </ScrollView>
                                                    </View>
                                                ) : (
                                                    <TouchableOpacity
                                                        onPress={() => { }}
                                                        activeOpacity={0.8}
                                                        style={{ width: '100%', height: 100, borderRadius: 10, marginBottom: 10, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.blackLight }}>
                                                        <Ionicons name="add-outline" size={30} color={COLORS.blackLight} />
                                                        <Text style={{ color: COLORS.blackLight, fontSize: 14 }}>No photos here</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>

                                            <View>
                                                <Text style={{ fontSize: 15, fontWeight: "bold", color: COLORS.title, marginVertical: 10 }}>Job Incompletion Remarks</Text>
                                                <Input onFocus={() => setisFocused(true)} onBlur={() => setisFocused(false)} isFocused={isFocused} backround={COLORS.card} style={{ fontSize: 12, borderRadius: 12, backgroundColor: COLORS.input, borderColor: COLORS.inputBorder, borderWidth: 1, height: 150 }} inputicon placeholder={`e.g. Parts left unfinished`} multiline numberOfLines={10} value={booking.incompletionRemark} />
                                            </View>
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

export default MyRequestDetails