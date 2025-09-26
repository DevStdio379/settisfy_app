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
import { createReview, getReviewByBookingId, updateReview } from '../../services/ReviewServices';

type SettlerAddReviewScreenProps = StackScreenProps<RootStackParamList, 'SettlerAddReview'>;

const SettlerAddReview = ({ navigation, route }: SettlerAddReviewScreenProps) => {

    const { user } = useUser();
    const { reviewId, booking } = route.params;
    const [index, setIndex] = useState(reviewId === 'newReview' ? 0 : 1);

    const [settlerOverallRating, setSettlerOverallRating] = useState<number>(0);
    const [settlerTimelinessRating, setSettlerTimelinessRating] = useState<number>(0);
    const [settlerTimelinessFeedback, setSettlerTimelinessFeedback] = useState<string[]>([]);
    const [settlerOtherTimelinessReview, setSettlerOtherTimelinessReview] = useState<string>('');
    const [settlerCooperationRating, setSettlerCooperationRating] = useState<number>(0);
    const [settlerCooperationFeedback, setSettlerCooperationFeedback] = useState<string[]>([]);
    const [settlerOtherCooperationReview, setSettlerOtherCooperationReview] = useState<string>('');
    const [settlerBehaviourRating, setSettlerBehaviourRating] = useState<number>(0);
    const [settlerBehaviourFeedback, setSettlerBehaviourFeedback] = useState<string[]>([]);
    const [settlerOtherBehaviourReview, setSettlerOtherBehaviorReview] = useState<string>('');
    const [settlerCommunicationRating, setSettlerCommunicationRating] = useState<number>(0);
    const [settlerCommunicationFeedback, setSettlerCommunicationFeedback] = useState<string[]>([]);
    const [settlerOtherCommunicationReview, setSettlerOtherCommunicationReview] = useState<string>('');
    const [settlerRequestAccuracyRating, setSettlerRequestAccuracyRating] = useState<number>(0);
    const [settlerRequestAccuracyFeedback, setSettlerRequestAccuracyFeedback] = useState<string[]>([]);
    const [settlerOtherRequestAccuracyReview, setSettlerOtherRequestAccuracyReview] = useState<string>('');
    const [settlerPriceWorthyRating, setSettlerPriceWorthyRating] = useState<number>(0);
    const [settlerPublicReview, setSettlerPublicReview] = useState<string>('');
    const [settlerPrivateNotesforCustomer, settlerSetPrivateNotesforCustomer] = useState<string>('');

    const [isFocused1, setisFocused1] = useState(false);
    const [isFocused2, setisFocused2] = useState(false);
    const [isFocused3, setisFocused3] = useState(false);
    const [isFocused4, setisFocused4] = useState(false);
    const [isFocused5, setisFocused5] = useState(false);
    const [isFocused6, setisFocused6] = useState(false);
    const [isFocused7, setisFocused7] = useState(false);

    const bottomSheetRef = useRef<BottomSheet>(null);

    const [borrower, setBorrower] = useState<User>();
    const [loading, setLoading] = useState(true);

    const snapPoints = useMemo(() => ['1%', '35%'], []);

    const toggleCollectionFeedback = (settlerTimelinessFeedback: string) => {
        setSettlerTimelinessFeedback((prevCollectionFeedback) =>
            prevCollectionFeedback.includes(settlerTimelinessFeedback)
                ? prevCollectionFeedback.filter((f) => f !== settlerTimelinessFeedback)
                : [...prevCollectionFeedback, settlerTimelinessFeedback]
        );
    };

    const toggleReturnFeedback = (settlerCooperationFeedback: string) => {
        setSettlerCooperationFeedback((prevReturnFeedback) =>
            prevReturnFeedback.includes(settlerCooperationFeedback)
                ? prevReturnFeedback.filter((f) => f !== settlerCooperationFeedback)
                : [...prevReturnFeedback, settlerCooperationFeedback]
        );
    };

    const toggleListingMatchFeedback = (settlerBehaviourFeedback: string) => {
        setSettlerBehaviourFeedback((prevListingMatchFeedback) =>
            prevListingMatchFeedback.includes(settlerBehaviourFeedback)
                ? prevListingMatchFeedback.filter((f) => f !== settlerBehaviourFeedback)
                : [...prevListingMatchFeedback, settlerBehaviourFeedback]
        );
    };

    const toggleCommunicationFeedback = (settlerCommunicationFeedback: string) => {
        setSettlerCommunicationFeedback((prevCommunicationFeedback) =>
            prevCommunicationFeedback.includes(settlerCommunicationFeedback)
                ? prevCommunicationFeedback.filter((f) => f !== settlerCommunicationFeedback)
                : [...prevCommunicationFeedback, settlerCommunicationFeedback]
        );
    };

    const toggleProductConditionFeedback = (settlerRequestAccuracyFeedback: string) => {
        setSettlerRequestAccuracyFeedback((prevProductConditionFeedback) =>
            prevProductConditionFeedback.includes(settlerRequestAccuracyFeedback)
                ? prevProductConditionFeedback.filter((f) => f !== settlerRequestAccuracyFeedback)
                : [...prevProductConditionFeedback, settlerRequestAccuracyFeedback]
        );
    };

    const fetchBorrower = async () => {
        const fetchedBorrower = await fetchSelectedUser(booking.userId);
        if (fetchedBorrower) {
            setBorrower(fetchedBorrower);
        }
        setLoading(false);
    };

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

    useEffect(() => {
        if (reviewId !== 'newReview') {
            const fetchReview = async () => {
                try {
                    if (booking.catalogueService.id && booking.id) {
                        const selectedBooking = await getReviewByBookingId(booking.catalogueService.id, booking.id);
                        if (selectedBooking) {
                            setSettlerOverallRating(selectedBooking.settlerOverallRating || 0);
                            setSettlerTimelinessRating(selectedBooking.settlerTimelinessRating || 0);
                            setSettlerTimelinessFeedback(selectedBooking.settlerTimelinessFeedback || []);
                            setSettlerOtherTimelinessReview(selectedBooking.settlerOtherTimelinessReview || '');
                            setSettlerCooperationRating(selectedBooking.settlerCooperationRating || 0);
                            setSettlerCooperationFeedback(selectedBooking.settlerCooperationFeedback || []);
                            setSettlerOtherCooperationReview(selectedBooking.settlerOtherCooperationReview || '');
                            setSettlerBehaviourRating(selectedBooking.settlerBehaviourRating || 0);
                            setSettlerBehaviourFeedback(selectedBooking.settlerBehaviourFeedback || []);
                            setSettlerOtherBehaviorReview(selectedBooking.settlerOtherBehaviourReview || '');
                            setSettlerCommunicationRating(selectedBooking.settlerCommunicationRating || 0);
                            setSettlerCommunicationFeedback(selectedBooking.settlerCommunicationFeedback || []);
                            setSettlerOtherCommunicationReview(selectedBooking.settlerOtherCommunicationReview || '');
                            setSettlerRequestAccuracyRating(selectedBooking.settlerRequestAccuracyRating || 0);
                            setSettlerRequestAccuracyFeedback(selectedBooking.settlerRequestAccuracyFeedback || []);
                            setSettlerOtherRequestAccuracyReview(selectedBooking.settlerOtherRequestAccuracyReview || '');
                            setSettlerPublicReview(selectedBooking.settlerPublicReview || '');
                            settlerSetPrivateNotesforCustomer(selectedBooking.settlerPrivateNotesforCustomer || '');
                        }
                    } else {
                        console.error('Product ID or Borrowing ID is missing.');
                    }
                } catch (error) {
                    console.error('Failed to fetch listing details:', error);
                }
            };
            fetchBorrower();
            fetchReview();
            setIndex(1);
        }
        bottomSheetRef.current?.snapToIndex(-1);
    }, [reviewId]);

    const handlePress = useCallback(() => {
        bottomSheetRef.current?.snapToIndex(1);
    }, []);

    const screens = 10;

    const nextScreen = async () => {
        if (index === 1 && settlerOverallRating === 0) {
            Alert.alert('Please give an overall rating.');
            return;
        }
        if (index === 2 && (!settlerTimelinessRating || settlerTimelinessFeedback.length === 0)) {
            Alert.alert('Please provide both a collection rating and at least one feedback.');
            return;
        }
        if (index === 3 && (!settlerCooperationRating || settlerCooperationFeedback.length === 0)) {
            Alert.alert('Please provide both a return rating and at least one feedback.');
            return;
        }
        if (index === 4 && (!settlerBehaviourRating || settlerBehaviourFeedback.length === 0)) {
            Alert.alert('Please select a listing match condition and at least one feedback.');
            return;
        }
        if (index === 5 && (!settlerCommunicationRating || settlerCommunicationFeedback.length === 0)) {
            Alert.alert('Please provide both a communication rating and at least one feedback.');
            return;
        }
        if (index === 6 && (!settlerRequestAccuracyRating || settlerRequestAccuracyFeedback.length === 0)) {
            Alert.alert('Please provide both a product condition rating and at least one feedback.');
            return;
        }
        if (index === 7 && !settlerPriceWorthyRating) {
            Alert.alert('Please give a price worthy rating');
            return;
        }
        if (index === 8 && !settlerPublicReview) {
            Alert.alert('Please provide a public review.');
            return;
        }

        if (index === 9 && !settlerPrivateNotesforCustomer) {
            Alert.alert('Please provide a private note for the lender.');
            return;
        }
        setIndex((prev) => (prev + 1) % screens);
    };

    const prevScreen = () =>
        setIndex((prev) => (prev - 1 + screens) % screens);

    const handleReview = async (status: number) => {
        try {
            if (user?.uid) {
                if (reviewId === 'newReview') {
                    await createReview({
                        bookingId: booking.id || '',
                        settlerReviewerId: user.uid,
                        settlerOverallRating: settlerOverallRating || 0,
                        catalogueServiceId: booking.catalogueService.id || '',

                        settlerTimelinessRating: settlerTimelinessRating || 0,
                        settlerTimelinessFeedback: settlerTimelinessFeedback || [''],
                        settlerOtherTimelinessReview: settlerOtherTimelinessReview,
                        settlerCooperationRating: settlerCooperationRating || 0,
                        settlerCooperationFeedback: settlerCooperationFeedback || [''],
                        settlerOtherCooperationReview: settlerOtherCooperationReview || '',
                        settlerBehaviourRating: settlerBehaviourRating || 0,
                        settlerBehaviourFeedback: settlerBehaviourFeedback || [''],
                        settlerOtherBehaviourReview: settlerOtherBehaviourReview || '',
                        settlerCommunicationRating: settlerCommunicationRating || 0,
                        settlerCommunicationFeedback: settlerCommunicationFeedback || [''],
                        settlerOtherCommunicationReview: settlerOtherCommunicationReview || '',
                        settlerRequestAccuracyRating: settlerRequestAccuracyRating || 0,
                        settlerRequestAccuracyFeedback: settlerRequestAccuracyFeedback || [''],
                        settlerOtherRequestAccuracyReview: settlerOtherRequestAccuracyReview || '',
                        settlerPublicReview: settlerPublicReview || '',
                        settlerPrivateNotesforCustomer: settlerPrivateNotesforCustomer || '',
                        settlerUpdatedAt: new Date(),
                        settlerCreateAt: new Date(),
                        settlerStatus: status,
                    }, booking.catalogueService.id || 'undefined');
                    Alert.alert('Review created successfully.');
                } else {
                    await updateReview(booking.catalogueService.id || 'undefined', reviewId, {
                        bookingId: booking.id || '',
                        settlerReviewerId: user.uid,
                        settlerOverallRating: settlerOverallRating || 0,
                        settlerTimelinessRating: settlerTimelinessRating || 0,
                        settlerTimelinessFeedback: settlerTimelinessFeedback || [''],
                        settlerOtherTimelinessReview: settlerOtherTimelinessReview,
                        settlerCooperationRating: settlerCooperationRating || 0,
                        settlerCooperationFeedback: settlerCooperationFeedback || [''],
                        settlerOtherCooperationReview: settlerOtherCooperationReview || '',
                        settlerBehaviourRating: settlerBehaviourRating || 0,
                        settlerBehaviourFeedback: settlerBehaviourFeedback || [''],
                        settlerOtherBehaviourReview: settlerOtherBehaviourReview || '',
                        settlerCommunicationRating: settlerCommunicationRating || 0,
                        settlerCommunicationFeedback: settlerCommunicationFeedback || [''],
                        settlerOtherCommunicationReview: settlerOtherCommunicationReview || '',
                        settlerRequestAccuracyRating: settlerRequestAccuracyRating || 0,
                        settlerRequestAccuracyFeedback: settlerRequestAccuracyFeedback || [''],
                        settlerOtherRequestAccuracyReview: settlerOtherRequestAccuracyReview || '',
                        settlerPublicReview: settlerPublicReview || '',
                        settlerPrivateNotesforCustomer: settlerPrivateNotesforCustomer || '',
                        settlerUpdatedAt: new Date(),
                        settlerStatus: status,
                    });
                    Alert.alert(`Review updated successfully`);
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
                                    onPress={handlePress}
                                    style={{
                                        height: 45,
                                        width: 45,
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
                                        borrower ? (
                                            <Image
                                                source={{ uri: borrower.profileImageUrl }}
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
                                <Text style={{ fontSize: 15, color: COLORS.black }}>Your review will make this app a good community booking &booking platform.</Text>
                                <Text style={{ fontSize: 15, color: COLORS.black }}>{'\n'}Your review also will increse your profile rating unlocking, lesser deposit, and trust</Text>
                            </View>
                        </View>

                    }
                    {index === 1 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50 }}>Rate your job experience</Text>
                            <Text style={{ fontSize: 16, color: COLORS.black, paddingTop: 10, paddingBottom: 20 }}>Let us know your overall job experience</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 20 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setSettlerOverallRating(star)}>
                                        <Ionicons
                                            name={star <= settlerOverallRating ? 'star' : 'star-outline'}
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
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50 }}>Rate the arrangement punctuality?</Text>
                            <Text style={{ fontSize: 16, color: COLORS.black, paddingTop: 10, paddingBottom: 20 }}>How punctual and available was the customer for the scheduled service.</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 40 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setSettlerTimelinessRating(star)}>
                                        <Ionicons
                                            name={star <= settlerTimelinessRating ? 'star' : 'star-outline'}
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
                                {['Arrived On Time', 'Flexible with schedule', 'Slightly late', 'No Communication Beforehand', 'Late Without Notice', 'Missed scheduled meetup'].map((feedback, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={{
                                            borderRadius: 60,
                                            backgroundColor: settlerTimelinessFeedback ? (settlerTimelinessFeedback.includes(feedback) ? COLORS.primary : COLORS.input) : COLORS.input,
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
                                Other Arrangement & Punctuality Review
                                <Text style={{ fontSize: 12, color: COLORS.blackLight2 }}> (optional)</Text>
                            </Text>
                            <Input
                                onFocus={() => setisFocused1(true)}
                                onBlur={() => setisFocused1(false)}
                                isFocused={isFocused1}
                                onChangeText={setSettlerOtherTimelinessReview}
                                backround={COLORS.card}
                                style={{ fontSize: 12, borderRadius: 10, backgroundColor: COLORS.input }}
                                placeholder='Add your other punctuality review here'
                                keyboardType='default'
                                value={settlerOtherTimelinessReview}
                            />
                        </View>
                    }
                    {index === 3 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50 }}>Rate the customer cooperation</Text>
                            <Text style={{ fontSize: 16, color: COLORS.black, paddingTop: 10, paddingBottom: 20 }}>How prepared was the customer for the service?</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 40 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setSettlerCooperationRating(star)}>
                                        <Ionicons
                                            name={star <= settlerCooperationRating ? 'star' : 'star-outline'}
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
                                {['Everything ready on arrival', 'Slightly unprepared', 'Very helpful during job', 'Difficult to work with'].map((feedback, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={{
                                            borderRadius: 60,
                                            backgroundColor: settlerCooperationFeedback ? (settlerCooperationFeedback.includes(feedback) ? COLORS.primary : COLORS.input) : COLORS.input,
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
                                Other Cooperation Review
                                <Text style={{ fontSize: 12, color: COLORS.blackLight2 }}> (optional)</Text>
                            </Text>
                            <Input
                                onFocus={() => setisFocused2(true)}
                                onBlur={() => setisFocused2(false)}
                                isFocused={isFocused2}
                                onChangeText={setSettlerOtherCooperationReview}
                                backround={COLORS.card}
                                style={{ fontSize: 12, borderRadius: 10, backgroundColor: COLORS.input }}
                                placeholder='Add your other cooperation review here'
                                keyboardType='default'
                                value={settlerOtherCooperationReview}
                            />
                        </View>
                    }
                    {index === 4 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50 }}>How was the customer during your service?</Text>
                            <Text style={{ fontSize: 16, color: COLORS.black, paddingTop: 10, paddingBottom: 20 }}>Did the customer being respectful & professional during your service.</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 20, }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 40 }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <TouchableOpacity key={star} onPress={() => setSettlerBehaviourRating(star)}>
                                            <Ionicons
                                                name={star <= settlerBehaviourRating ? 'star' : 'star-outline'}
                                                size={40}
                                                color={COLORS.primary}
                                                style={{ marginHorizontal: 5 }}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50, paddingBottom: 20 }}>Tell us more</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 20, gap: 10 }}>
                                    {['Natural behaviour', 'Friendly & easy to work with', 'Very professional', 'Sometimes demanding & impatient', 'Rude & disrecpect'].map((feedback, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={{
                                                borderRadius: 60,
                                                backgroundColor: settlerBehaviourFeedback ? (settlerBehaviourFeedback.includes(feedback) ? COLORS.primary : COLORS.input) : COLORS.input,
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
                                Other Behvaioural & Professionalism Review
                                <Text style={{ fontSize: 12, color: COLORS.blackLight2 }}> (optional)</Text>
                            </Text>
                            <Input
                                onFocus={() => setisFocused3(true)}
                                onBlur={() => setisFocused3(false)}
                                isFocused={isFocused3}
                                onChangeText={setSettlerOtherBehaviorReview}
                                backround={COLORS.card}
                                style={{ fontSize: 12, borderRadius: 10, backgroundColor: COLORS.input }}
                                placeholder='Add your other behavioural review here'
                                keyboardType='default'
                                value={settlerOtherBehaviourReview}
                            />
                        </View>
                    }
                    {index === 5 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50 }}>How's the communication with {booking.firstName}?</Text>
                            <Text style={{ fontSize: 16, color: COLORS.black, paddingTop: 10, paddingBottom: 20 }}>How well did {booking.firstName} communicate with you?</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 40 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setSettlerCommunicationRating(star)}>
                                        <Ionicons
                                            name={star <= settlerCommunicationRating ? 'star' : 'star-outline'}
                                            size={40}
                                            color={COLORS.primary}
                                            style={{ marginHorizontal: 5 }}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50, paddingBottom: 20 }}>Tell us more</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 20, gap: 10 }}>
                                {['Very Responsive', 'Asked Relevant Questions', 'Respectful Tone Throughout', 'Took Time to Respond', 'Misunderstood Key Info', 'Confusing communication'].map((feedback, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={{
                                            borderRadius: 60,
                                            backgroundColor: settlerCommunicationFeedback ? (settlerCommunicationFeedback.includes(feedback) ? COLORS.primary : COLORS.input) : COLORS.input,
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
                                onChangeText={setSettlerOtherCommunicationReview}
                                backround={COLORS.card}
                                style={{ fontSize: 12, borderRadius: 10, backgroundColor: COLORS.input }}
                                placeholder='Add your other communication review here'
                                keyboardType='default'
                                value={settlerOtherCommunicationReview}
                            />
                        </View>
                    }
                    {index === 6 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50 }}>How accurate the request to actual service?</Text>
                            <Text style={{ fontSize: 16, color: COLORS.black, paddingTop: 10, paddingBottom: 20 }}>Tell us about the booking accuracy made by this customer.</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 40 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setSettlerRequestAccuracyRating(star)}>
                                        <Ionicons
                                            name={star <= settlerRequestAccuracyRating ? 'star' : 'star-outline'}
                                            size={40}
                                            color={COLORS.primary}
                                            style={{ marginHorizontal: 5 }}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50, paddingBottom: 20 }}>Tell us about the product condition</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 20, gap: 10 }}>
                                {['Very accurate', 'Minor difference', 'Mid / Average', 'Inaccurate & Misleading', 'Completely misrepresented'].map((feedback, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={{
                                            borderRadius: 60,
                                            backgroundColor: settlerRequestAccuracyFeedback ? (settlerRequestAccuracyFeedback.includes(feedback) ? COLORS.primary : COLORS.input) : COLORS.input,
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
                                Other Customer Request Accuracy Review
                                <Text style={{ fontSize: 12, color: COLORS.blackLight2 }}> (optional)</Text>
                            </Text>
                            <Input
                                onFocus={() => setisFocused5(true)}
                                onBlur={() => setisFocused5(false)}
                                isFocused={isFocused5}
                                onChangeText={setSettlerOtherRequestAccuracyReview}
                                backround={COLORS.card}
                                style={{ fontSize: 12, borderRadius: 10, backgroundColor: COLORS.input }}
                                placeholder='Add your customer accuracy review here'
                                keyboardType='default'
                                value={settlerOtherRequestAccuracyReview}
                            />
                        </View>
                    }
                    {index === 7 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50 }}>Price worthy the service?</Text>
                            <Text style={{ fontSize: 16, color: COLORS.black, paddingTop: 10, paddingBottom: 20 }}>How was the value of the platform service for the price?</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 20 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setSettlerPriceWorthyRating(star)}>
                                        <Ionicons
                                            name={star <= settlerPriceWorthyRating ? 'star' : 'star-outline'}
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
                            <Text style={{ fontSize: 14, color: COLORS.black, paddingTop: 10, paddingBottom: 30 }}>We'll show this feedback to other borrower in {booking.firstName}'s profile.</Text>
                            <Input
                                onFocus={() => setisFocused6(true)}
                                onBlur={() => setisFocused6(false)}
                                isFocused={isFocused6}
                                onChangeText={setSettlerPublicReview}
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
                                placeholder={`e.g. Great experience! ${booking.firstName} was very helpful and friendly.`}
                                multiline={true}  // Enable multi-line input
                                numberOfLines={10} // Suggest the input area size
                                value={settlerPublicReview ? settlerPublicReview : ''}
                            />
                        </View>
                    }
                    {index === 9 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 30 }}>Write a private note</Text>
                            <Text style={{ fontSize: 14, color: COLORS.black, paddingTop: 10, paddingBottom: 30 }}>This feedback just for {booking.firstName} - share what they can improve when borrowing.</Text>
                            <Input
                                onFocus={() => setisFocused7(true)}
                                onBlur={() => setisFocused7(false)}
                                isFocused={isFocused7}
                                onChangeText={settlerSetPrivateNotesforCustomer}
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
                                placeholder={`e.g. Hey ${booking.firstName}, I think you can improve your borrowing instruction a bit.`}
                                multiline={true}  // Enable multi-line input
                                numberOfLines={10} // Suggest the input area size
                                value={settlerPrivateNotesforCustomer ? settlerPrivateNotesforCustomer : ''}
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
                                    routes: [{ name: 'BottomNavigation', params: { screen: 'MyLendings' } }],
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
            </View>
        </View>
    )
}

export default SettlerAddReview