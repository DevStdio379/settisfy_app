import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, BackHandler } from 'react-native'
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import { COLORS } from '../../constants/theme';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchSelectedUser, User, useUser } from '../../context/UserContext';
import Input from '../../components/Input/Input';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { createReview, getReviewAverageRatingByProductId, getReviewByBookingId, updateReview } from '../../services/ReviewServices';
import { updateProduct } from '../../services/ProductServices';

type BookingAddReviewScreenProps = StackScreenProps<RootStackParamList, 'BookingAddReview'>;

const BookingAddReview = ({ navigation, route }: BookingAddReviewScreenProps) => {

    const { user } = useUser();
    const { reviewId, booking } = route.params;
    const [index, setIndex] = useState(reviewId === 'newReview' ? 0 : 1);

    const [overallRating, setOverallRating] = useState<number>(0);
    const [timelinessRating, setTimelinessRating] = useState<number>(0);
    const [timelinessFeedback, setTimelinessFeedback] = useState<string[]>([]);
    const [otherTimelinessReview, setOtherTimelinessReview] = useState<string>('');
    const [professionalismRating, setProfessionalismRating] = useState<number>(0);
    const [professionalismFeedback, setProfessionalismFeedback] = useState<string[]>([]);
    const [otherProfessionalismReview, setOtherProfessionalismReview] = useState<string>('');
    const [safetyRating, setSafetyRating] = useState<number>(0);
    const [safetyFeedback, setSafetyFeedback] = useState<string[]>([]);
    const [otherSafetyReview, setOtherSafetyReview] = useState<string>('');
    const [communicationRating, setCommunicationRating] = useState<number>(0);
    const [communicationFeedback, setCommunicationFeedback] = useState<string[]>([]);
    const [otherCommunicationReview, setOtherCommunicationReview] = useState<string>('');
    const [serviceResultRating, setServiceResultRating] = useState<number>(0);
    const [serviceResultFeedback, setProductConditionFeedback] = useState<string[]>([]);
    const [otherServiceResultReview, setOtherServiceResultReview] = useState<string>('');
    const [priceWorthyRating, setPriceWorthyRating] = useState<number>(0);
    const [publicReview, setPublicReview] = useState<string>('');
    const [privateNotesforSettler, setPrivateNotesforSettler] = useState<string>('');

    const [isFocused1, setisFocused1] = useState(false);
    const [isFocused2, setisFocused2] = useState(false);
    const [isFocused3, setisFocused3] = useState(false);
    const [isFocused4, setisFocused4] = useState(false);
    const [isFocused5, setisFocused5] = useState(false);
    const [isFocused6, setisFocused6] = useState(false);
    const [isFocused7, setisFocused7] = useState(false);

    // const bottomSheetRef = useRef<BottomSheet>(null);

    const [owner, setOwner] = useState<User>();
    const [loading, setLoading] = useState(true);

    const snapPoints = useMemo(() => ['1%', '35%'], []);

    const toggleCollectionFeedback = (timelinessFeedback: string) => {
        setTimelinessFeedback((prevCollectionFeedback) =>
            prevCollectionFeedback.includes(timelinessFeedback)
                ? prevCollectionFeedback.filter((f) => f !== timelinessFeedback)
                : [...prevCollectionFeedback, timelinessFeedback]
        );
    };

    const toggleReturnFeedback = (professionalismFeedback: string) => {
        setProfessionalismFeedback((prevReturnFeedback) =>
            prevReturnFeedback.includes(professionalismFeedback)
                ? prevReturnFeedback.filter((f) => f !== professionalismFeedback)
                : [...prevReturnFeedback, professionalismFeedback]
        );
    };

    const toggleListingMatchFeedback = (safetyFeedback: string) => {
        setSafetyFeedback((prevListingMatchFeedback) =>
            prevListingMatchFeedback.includes(safetyFeedback)
                ? prevListingMatchFeedback.filter((f) => f !== safetyFeedback)
                : [...prevListingMatchFeedback, safetyFeedback]
        );
    };

    const toggleCommunicationFeedback = (communicationFeedback: string) => {
        setCommunicationFeedback((prevCommunicationFeedback) =>
            prevCommunicationFeedback.includes(communicationFeedback)
                ? prevCommunicationFeedback.filter((f) => f !== communicationFeedback)
                : [...prevCommunicationFeedback, communicationFeedback]
        );
    };

    const toggleProductConditionFeedback = (serviceResultFeedback: string) => {
        setProductConditionFeedback((prevProductConditionFeedback) =>
            prevProductConditionFeedback.includes(serviceResultFeedback)
                ? prevProductConditionFeedback.filter((f) => f !== serviceResultFeedback)
                : [...prevProductConditionFeedback, serviceResultFeedback]
        );
    };

    const fetchOwner = async () => {
        const fetchedOwner = await fetchSelectedUser(booking.settlerId || '');
        if (fetchedOwner) {
            setOwner(fetchedOwner);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOwner();
    }, []);

    useEffect(() => {
        if (reviewId !== 'newReview') {
            const fetchReview = async () => {
                try {
                    if (booking.catalogueService.id && booking.id) {
                        const selectedBooking = await getReviewByBookingId(booking.catalogueService.id, booking.id);
                        if (selectedBooking) {
                            setOverallRating(selectedBooking.customerOverallRating ?? 0);
                            setTimelinessRating(selectedBooking.customerTimelinessRating ?? 0);
                            setTimelinessFeedback(selectedBooking.customerTimelinessFeedback ?? []);
                            setOtherTimelinessReview(selectedBooking.customerOtherTimelinessReview || '');
                            setProfessionalismRating(selectedBooking.customerProfessionalismRating ?? 0);
                            setProfessionalismFeedback(selectedBooking.customerProfessionalismFeedback ?? []);
                            setOtherProfessionalismReview(selectedBooking.customerOtherProfessionalismReview || '');
                            setSafetyRating(selectedBooking.customerSafetyRating || 0);
                            setSafetyFeedback(selectedBooking.customerSafetyFeedback ?? []);
                            setOtherSafetyReview(selectedBooking.customerOtherSafetyReview || '');
                            setCommunicationRating(selectedBooking.customerCommunicationRating ?? 0);
                            setCommunicationFeedback(selectedBooking.customerCommunicationFeedback ?? []);
                            setOtherCommunicationReview(selectedBooking.customerOtherCommunicationReview || '');
                            setServiceResultRating(selectedBooking.customerServiceResultRating ?? 0);
                            setProductConditionFeedback(selectedBooking.customerServiceResultFeedback ?? []);
                            setOtherServiceResultReview(selectedBooking.customerOtherServiceResultReview || '');
                            setPriceWorthyRating(selectedBooking.customerPriceWorthyRating ?? 0);
                            setPublicReview(selectedBooking.customerPublicReview || '');
                            setPrivateNotesforSettler(selectedBooking.customerPrivateNotesforSettler || '');
                        }
                    } else {
                        console.error('Product ID or Borrowing ID is missing.');
                    }
                } catch (error) {
                    console.error('Failed to fetch listing details:', error);
                }
            };

            fetchReview();
            setIndex(1);
        }
        // bottomSheetRef.current?.snapToIndex(-1);
    }, [reviewId]);

    // const handlePress = useCallback(() => {
    //     bottomSheetRef.current?.snapToIndex(1);
    // }, []);

    const screens = 10;

    const nextScreen = async () => {
        if (index === 1 && overallRating === 0) {
            Alert.alert('Please give an overall rating.');
            return;
        }
        if (index === 2 && (!timelinessRating || timelinessFeedback.length === 0)) {
            Alert.alert('Please provide both a collection rating and at least one feedback.');
            return;
        }
        if (index === 3 && (!professionalismRating || professionalismFeedback.length === 0)) {
            Alert.alert('Please provide both a return rating and at least one feedback.');
            return;
        }
        if (index === 4 && (!safetyRating || safetyFeedback.length === 0)) {
            Alert.alert('Please select a listing match condition and at least one feedback.');
            return;
        }
        if (index === 5 && (!communicationRating || communicationFeedback.length === 0)) {
            Alert.alert('Please provide both a communication rating and at least one feedback.');
            return;
        }
        if (index === 6 && (!serviceResultRating || serviceResultFeedback.length === 0)) {
            Alert.alert('Please provide both a product condition rating and at least one feedback.');
            return;
        }
        if (index === 7 && !priceWorthyRating) {
            Alert.alert('Please give a price worthy rating');
            return;
        }
        if (index === 8 && !publicReview) {
            Alert.alert('Please provide a public review.');
            return;
        }
        if (index === 9 && !privateNotesforSettler) {
            Alert.alert('Please provide a private note for the lender.');
            return;
        }
        setIndex((prev) => (prev + 1) % screens);
    };

    const prevScreen = () =>
        setIndex((prev) => (prev - 1 + screens) % screens);

    useEffect(() => {
        const backAction = () => {
            // Handle the back press with an alert, or simply do nothing
            Alert.alert("Hold on!", "Are you sure you want to go back?", [
                {
                    text: "Cancel",
                    onPress: () => null,
                    style: "cancel"
                },
                { text: "YES", onPress: () => navigation.goBack() }
            ]);
            return true; // This prevents the default back button behavior
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, []);

    const handleReview = async (status: number) => {
        try {
            if (user?.uid) {
                if (reviewId === 'newReview') {
                    await createReview({
                        bookingId: booking.id || '',
                        customerReviewerId: user.uid,
                        customerOverallRating: overallRating || 0,
                        catalogueServiceId: booking.catalogueService.id || '',

                        customerTimelinessRating: timelinessRating || 0,
                        customerTimelinessFeedback: timelinessFeedback || [''],
                        customerOtherTimelinessReview: otherTimelinessReview,
                        customerProfessionalismRating: professionalismRating || 0,
                        customerProfessionalismFeedback: professionalismFeedback || [''],
                        customerOtherProfessionalismReview: otherProfessionalismReview || '',
                        customerSafetyRating: safetyRating || 0,
                        customerSafetyFeedback: safetyFeedback || [''],
                        customerOtherSafetyReview: otherSafetyReview || '',
                        customerCommunicationRating: communicationRating || 0,
                        customerCommunicationFeedback: communicationFeedback || [''],
                        customerOtherCommunicationReview: otherCommunicationReview || '',
                        customerServiceResultRating: serviceResultRating || 0,
                        customerServiceResultFeedback: serviceResultFeedback || [''],
                        customerOtherServiceResultReview: otherServiceResultReview || '',
                        customerPriceWorthyRating: priceWorthyRating || 0,
                        customerPublicReview: publicReview || '',
                        customerPrivateNotesforSettler: privateNotesforSettler || '',
                        customerUpdatedAt: new Date(),
                        customerCreateAt: new Date(),
                        customerStatus: status,
                    }, booking.catalogueService.id || 'undefined');
                    Alert.alert('Review created successfully.');
                } else {
                    await updateReview(booking.catalogueService.id || 'undefined', reviewId, {
                        bookingId: booking.id || '',
                        customerReviewerId: user.uid,
                        customerOverallRating: overallRating || 0,
                        customerTimelinessRating: timelinessRating || 0,
                        customerTimelinessFeedback: timelinessFeedback || [''],
                        customerOtherTimelinessReview: otherTimelinessReview,
                        customerProfessionalismRating: professionalismRating || 0,
                        customerProfessionalismFeedback: professionalismFeedback || [''],
                        customerOtherProfessionalismReview: otherProfessionalismReview || '',
                        customerSafetyRating: safetyRating || 0,
                        customerSafetyFeedback: safetyFeedback || [''],
                        customerOtherSafetyReview: otherSafetyReview || '',
                        customerCommunicationRating: communicationRating || 0,
                        customerCommunicationFeedback: communicationFeedback || [''],
                        customerOtherCommunicationReview: otherCommunicationReview || '',
                        customerServiceResultRating: serviceResultRating || 0,
                        customerServiceResultFeedback: serviceResultFeedback || [''],
                        customerOtherServiceResultReview: otherServiceResultReview || '',
                        customerPriceWorthyRating: priceWorthyRating || 0,
                        customerPublicReview: publicReview || '',
                        customerPrivateNotesforSettler: privateNotesforSettler || '',
                        customerUpdatedAt: new Date(),
                        customerStatus: status,
                    });
                    Alert.alert(`Review updated successfully.`);
                    const latestRating = await getReviewAverageRatingByProductId(booking.catalogueService.id || 'undefined');
                    // await updateProduct(booking.catalogueService.id || 'undefined', { averageRating: latestRating.averageRating, ratingCount: latestRating.ratingCount });
                }
            } else {
                Alert.alert('User ID is missing.');
            }
        } catch (error) {
            Alert.alert('Failed to create or update listing.');
            console.error(error);
            return;
        }
    }

    return (
        <View style={{ flex: 1 }}>
            <View style={{ backgroundColor: COLORS.background, flex: 1 }}>
                <View
                    style={{ height: 60, borderBottomColor: COLORS.card, borderBottomWidth: 1 }}>
                    <View
                        style={[GlobalStyleSheet.container, {
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: 8,
                            paddingHorizontal: 10,
                        }]}>
                        <View style={{ flex: 1, alignItems: 'flex-start' }}>
                            {index === 0 ? (
                                <TouchableOpacity
                                    onPress={() => navigation.goBack()}
                                    style={{
                                        height: 45,
                                        width: 45,
                                        borderColor: COLORS.blackLight,
                                        borderWidth: 1,
                                        borderRadius: 10,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Ionicons size={30} color={COLORS.blackLight} name='close' />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={prevScreen}
                                    style={{
                                        height: 45,
                                        width: 45,
                                        borderColor: COLORS.blackLight2,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Ionicons size={30} color={COLORS.blackLight2} name='chevron-back-outline' />
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.title, textAlign: 'center' }}>Add Review</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            {index === 0 ? (
                                <View style={{ flex: 1, alignItems: 'flex-end' }} />
                            ) : (
                                <TouchableOpacity
                                    // onPress={handlePress}
                                    onPress={() => { }}
                                    style={{
                                        height: 45,
                                        width: 45,
                                        borderColor: COLORS.blackLight2,

                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Ionicons size={30} color={COLORS.blackLight2} name='close' />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 70, alignItems: 'flex-start' }}>
                    {index === 0 &&
                        <View style={[GlobalStyleSheet.container, { height: '100%', paddingHorizontal: 15, justifyContent: 'center', alignItems: 'center' }]}>
                            <View>
                                <View>
                                    {
                                        owner ? (
                                            <Image
                                                source={{ uri: owner.profileImageUrl }}
                                                style={{
                                                    width: 100,
                                                    height: 100,
                                                    borderRadius: 60,
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
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black, paddingTop: 20, }}>Your review is important</Text>
                                <Text style={{ fontSize: 15, color: COLORS.black }}>Your review will make this app a good community lending &borrowing platform.</Text>
                                <Text style={{ fontSize: 15, color: COLORS.black }}>{'\n'}Your review also will increse your profile rating unlocking, lesser deposit, and trust</Text>
                            </View>
                        </View>

                    }
                    {index === 1 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50 }}>Rate your service experience</Text>
                            <Text style={{ fontSize: 16, color: COLORS.black, paddingTop: 10, paddingBottom: 20 }}>Let us know your overall service experience</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 20 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setOverallRating(star)}>
                                        <Ionicons
                                            name={star <= overallRating ? 'star' : 'star-outline'}
                                            size={40}
                                            color={COLORS.primary}
                                            style={{ marginHorizontal: 5 }}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    }
                    {index === 2 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50, paddingBottom: 30 }}>How would you rate the timeliness of the service?</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 40 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setTimelinessRating(star)}>
                                        <Ionicons
                                            name={star <= timelinessRating ? 'star' : 'star-outline'}
                                            size={40}
                                            color={COLORS.primary}
                                            style={{ marginHorizontal: 5 }}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={GlobalStyleSheet.line}></View>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50, paddingBottom: 20 }}>Tell us more</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 20, gap: 10 }}>
                                {['Arrived On Time', 'Clear Directions Provided', 'Safe & Convenient Location', 'Easy to Find Location', 'Late Without Notice', 'Rushed the Meetup', 'Did not Communicate Clearly'].map((feedback, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={{
                                            borderRadius: 60,
                                            backgroundColor: timelinessFeedback ? (timelinessFeedback.includes(feedback) ? COLORS.primary : COLORS.input) : COLORS.input,
                                            padding: 15,
                                            alignItems: 'center',
                                            marginBottom: 10
                                        }}
                                        onPress={() => toggleCollectionFeedback(feedback)}
                                    >
                                        <Text style={{ fontSize: 14, color: COLORS.title }}>{feedback}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>
                                Other Timeliness Experience Review <Text style={{ fontSize: 12, color: COLORS.blackLight2 }}> (optional)</Text>
                            </Text>
                            <Input
                                onFocus={() => setisFocused1(true)}
                                onBlur={() => setisFocused1(false)}
                                isFocused={isFocused1}
                                onChangeText={setOtherTimelinessReview}
                                backround={COLORS.card}
                                style={{ fontSize: 12, borderRadius: 10, backgroundColor: COLORS.input }}
                                placeholder='Add timeliness & punctuality comment here.'
                                keyboardType='default'
                                value={otherTimelinessReview}
                            />
                        </View>
                    }
                    {index === 3 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50, paddingBottom: 30 }}>Was the provider professional and easy to talk to?</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 40 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setProfessionalismRating(star)}>
                                        <Ionicons
                                            name={star <= professionalismRating ? 'star' : 'star-outline'}
                                            size={40}
                                            color={COLORS.primary}
                                            style={{ marginHorizontal: 5 }}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={GlobalStyleSheet.line}></View>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50, paddingBottom: 20 }}>Tell us more</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 20, gap: 10 }}>
                                {['Friendly & Polite', 'Clear & Responsive', 'Kept Me Updated', 'Good Professional Manner', 'Poor Communication'].map((feedback, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={{
                                            borderRadius: 60,
                                            backgroundColor: professionalismFeedback ? (professionalismFeedback.includes(feedback) ? COLORS.primary : COLORS.input) : COLORS.input,
                                            padding: 15,
                                            alignItems: 'center',
                                            marginBottom: 10
                                        }}
                                        onPress={() => toggleReturnFeedback(feedback)}
                                    >
                                        <Text style={{ fontSize: 14, color: COLORS.title }}>{feedback}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>
                                Other Professionalism Experience Review <Text style={{ fontSize: 12, color: COLORS.blackLight2 }}> (optional)</Text>
                            </Text>
                            <Input
                                onFocus={() => setisFocused2(true)}
                                onBlur={() => setisFocused2(false)}
                                isFocused={isFocused2}
                                onChangeText={setOtherProfessionalismReview}
                                backround={COLORS.card}
                                style={{ fontSize: 12, borderRadius: 10, backgroundColor: COLORS.input }}
                                placeholder='Add your other professionalism review here'
                                keyboardType='default'
                                value={otherProfessionalismReview}
                            />
                        </View>
                    }
                    {index === 4 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50 }}>Rate the provider safety standards</Text>
                            <Text style={{ fontSize: 16, color: COLORS.black, paddingTop: 10, paddingBottom: 20 }}>Tell us about how the provider handle your property and the service.</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 20, }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 20 }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <TouchableOpacity key={star} onPress={() => setSafetyRating(star)}>
                                            <Ionicons
                                                name={star <= safetyRating ? 'star' : 'star-outline'}
                                                size={40}
                                                color={COLORS.primary}
                                                style={{ marginHorizontal: 5 }}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <View style={GlobalStyleSheet.line}></View>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 20, paddingBottom: 20 }}>Tell us more</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 20, gap: 10 }}>
                                    {['Handled Everything Carefully', 'Some Carelessness', 'Do Service as Described', 'Negligent/Unsafe', 'Follow the Safety Standards'].map((feedback, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={{
                                                borderRadius: 60,
                                                backgroundColor: safetyFeedback ? (safetyFeedback.includes(feedback) ? COLORS.primary : COLORS.input) : COLORS.input,
                                                padding: 15,
                                                alignItems: 'center',
                                                marginBottom: 10
                                            }}
                                            onPress={() => toggleListingMatchFeedback(feedback)}
                                        >
                                            <Text style={{ fontSize: 14, color: COLORS.title }}>{feedback}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                            <Text style={{ width: '100%', fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>
                                Other Safety Review
                                <Text style={{ fontSize: 12, color: COLORS.blackLight2 }}> (optional)</Text>
                            </Text>
                            <Input
                                onFocus={() => setisFocused3(true)}
                                onBlur={() => setisFocused3(false)}
                                isFocused={isFocused3}
                                onChangeText={setOtherSafetyReview}
                                backround={COLORS.card}
                                style={{ fontSize: 12, borderRadius: 10, backgroundColor: COLORS.input }}
                                placeholder='Add your other listing match review here'
                                keyboardType='default'
                                value={otherSafetyReview}
                            />
                        </View>
                    }
                    {index === 5 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50 }}>How's the communication with {owner?.firstName}?</Text>
                            <Text style={{ fontSize: 16, color: COLORS.black, paddingTop: 10, paddingBottom: 20 }}>From collection to return, how well did {owner?.firstName} communicate with you?</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 40 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setCommunicationRating(star)}>
                                        <Ionicons
                                            name={star <= communicationRating ? 'star' : 'star-outline'}
                                            size={40}
                                            color={COLORS.primary}
                                            style={{ marginHorizontal: 5 }}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50, paddingBottom: 20 }}>Tell us more</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 20, gap: 10 }}>
                                {['Very Responsive', 'Helpful and Informative', 'Friendly and Polite', 'Delayed Responses', 'Lacked Important Info', 'Rushed or Impersonal'].map((feedback, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={{
                                            borderRadius: 60,
                                            backgroundColor: communicationFeedback ? (communicationFeedback.includes(feedback) ? COLORS.primary : COLORS.input) : COLORS.input,
                                            padding: 15,
                                            alignItems: 'center',
                                            marginBottom: 10
                                        }}
                                        onPress={() => toggleCommunicationFeedback(feedback)}
                                    >
                                        <Text style={{ fontSize: 14, color: COLORS.title }}>{feedback}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={{ width: '100%', fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>
                                Other Communication Review
                                <Text style={{ fontSize: 12, color: COLORS.blackLight2 }}> (optional)</Text>
                            </Text>
                            <Input
                                onFocus={() => setisFocused4(true)}
                                onBlur={() => setisFocused4(false)}
                                isFocused={isFocused4}
                                onChangeText={setOtherCommunicationReview}
                                backround={COLORS.card}
                                style={{ fontSize: 12, borderRadius: 10, backgroundColor: COLORS.input }}
                                placeholder='Add your other communication review here'
                                keyboardType='default'
                                value={otherCommunicationReview}
                            />
                        </View>
                    }
                    {index === 6 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50 }}>What do you think about result of the service</Text>
                            <Text style={{ fontSize: 16, color: COLORS.black, paddingTop: 10, paddingBottom: 20 }}>Did it meet your expectation.</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 40 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setServiceResultRating(star)}>
                                        <Ionicons
                                            name={star <= serviceResultRating ? 'star' : 'star-outline'}
                                            size={40}
                                            color={COLORS.primary}
                                            style={{ marginHorizontal: 5 }}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 30, paddingBottom: 20 }}>Tell us about the product condition</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 20, gap: 10 }}>
                                {['Excellent Condition', 'Worked Perfectly', 'Just Like the Photos', 'Minor Wear & Tear', 'Slightly Dirty', 'Had Some Functional Problems', 'Much Worse Than Expected'].map((feedback, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={{
                                            borderRadius: 60,
                                            backgroundColor: serviceResultFeedback ? (serviceResultFeedback.includes(feedback) ? COLORS.primary : COLORS.input) : COLORS.input,
                                            padding: 15,
                                            alignItems: 'center',
                                            marginBottom: 10
                                        }}
                                        onPress={() => toggleProductConditionFeedback(feedback)}
                                    >
                                        <Text style={{ fontSize: 14, color: COLORS.title }}>{feedback}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={{ width: '100%', fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>
                                Other Service Result Review
                                <Text style={{ fontSize: 12, color: COLORS.blackLight2 }}> (optional)</Text>
                            </Text>
                            <Input
                                onFocus={() => setisFocused5(true)}
                                onBlur={() => setisFocused5(false)}
                                isFocused={isFocused5}
                                onChangeText={setOtherServiceResultReview}
                                backround={COLORS.card}
                                style={{ fontSize: 12, borderRadius: 10, backgroundColor: COLORS.input }}
                                placeholder='Add your other product condition review here'
                                keyboardType='default'
                                value={otherServiceResultReview}
                            />
                        </View>
                    }
                    {index === 7 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50 }}>Price worthy the service?</Text>
                            <Text style={{ fontSize: 16, color: COLORS.black, paddingTop: 10, paddingBottom: 20 }}>How was the value of the platform service for the price?</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 20 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setPriceWorthyRating(star)}>
                                        <Ionicons
                                            name={star <= priceWorthyRating ? 'star' : 'star-outline'}
                                            size={40}
                                            color={COLORS.primary}
                                            style={{ marginHorizontal: 5 }}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    }
                    {index === 8 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 30 }}>Write a public review</Text>
                            <Text style={{ fontSize: 14, color: COLORS.black, paddingTop: 10, paddingBottom: 30 }}>We'll show this feedback to other customer in {owner?.firstName}'s profile. Say a few word about the service.</Text>
                            <Input
                                onFocus={() => setisFocused6(true)}
                                onBlur={() => setisFocused6(false)}
                                isFocused={isFocused6}
                                onChangeText={setPublicReview}
                                backround={COLORS.card}
                                style={{
                                    fontSize: 12,
                                    borderRadius: 12,
                                    backgroundColor: COLORS.input,
                                    borderColor: COLORS.inputBorder,
                                    borderWidth: 1,
                                    height: 450,
                                }}
                                inputicon
                                placeholder={`e.g. Great experience! ${owner?.firstName} was very helpful and the product was in excellent condition.`}
                                multiline={true}  // Enable multi-line input
                                numberOfLines={10} // Suggest the input area size
                                value={publicReview ? publicReview : ''}
                            />
                        </View>
                    }
                    {index === 9 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 30 }}>Write a private note</Text>
                            <Text style={{ fontSize: 14, color: COLORS.black, paddingTop: 10, paddingBottom: 30 }}>This feedback just for {owner?.firstName} - share what they can improve about their service.</Text>
                            <Input
                                onFocus={() => setisFocused7(true)}
                                onBlur={() => setisFocused7(false)}
                                isFocused={isFocused7}
                                onChangeText={setPrivateNotesforSettler}
                                backround={COLORS.card}
                                style={{
                                    fontSize: 12,
                                    borderRadius: 12,
                                    backgroundColor: COLORS.input,
                                    borderColor: COLORS.inputBorder,
                                    borderWidth: 1,
                                    height: 450,
                                }}
                                inputicon
                                placeholder={`e.g. I think the product could be improved by...`}
                                multiline={true}  // Enable multi-line input
                                numberOfLines={10} // Suggest the input area size
                                value={privateNotesforSettler ? privateNotesforSettler : ''}
                            />
                        </View>
                    }
                </ScrollView >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1, gap: 5 }}>
                    <View style={{ flex: 1, backgroundColor: index > 2 ? COLORS.primary : COLORS.placeholder, height: 5 }} />
                    <View style={{ flex: 1, backgroundColor: index > 5 ? COLORS.primary : COLORS.placeholder, height: 5 }} />
                    <View style={{ flex: 1, backgroundColor: index > 8 ? COLORS.primary : COLORS.placeholder, height: 5 }} />
                </View>
                {index === 0 ? (
                    <View style={[GlobalStyleSheet.container, { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10, backgroundColor: COLORS.card }]}>
                        <TouchableOpacity
                            style={{
                                backgroundColor: COLORS.primary,
                                padding: 15,
                                borderRadius: 10,
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: "100%"
                            }}
                            onPress={nextScreen}
                        >
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Start</Text>
                        </TouchableOpacity>
                    </View>
                ) : index === 9 ? (
                    <View style={[GlobalStyleSheet.container, { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10 }]}>
                        <TouchableOpacity
                            style={{
                                backgroundColor: COLORS.primary,
                                padding: 15,
                                borderRadius: 10,
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%'
                            }}
                            onPress={() => {

                                handleReview(1);
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'BottomNavigation', params: { screen: 'MyBorrowings' } }],
                                });
                            }}
                        >
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={[GlobalStyleSheet.container, { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10 }]}>
                        <TouchableOpacity
                            style={{
                                backgroundColor: COLORS.primary,
                                padding: 15,
                                borderRadius: 10,
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: "100%"
                            }}
                            onPress={nextScreen}
                        >
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Next</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View >
        </View>
    )
}

export default BookingAddReview