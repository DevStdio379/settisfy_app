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
import { createReview, getReviewByBorrowingId, updateReview } from '../../services/ReviewServices';

type LenderAddReviewScreenProps = StackScreenProps<RootStackParamList, 'LenderAddReview'>;

const LenderAddReview = ({ navigation, route }: LenderAddReviewScreenProps) => {

    const { user } = useUser();
    const { reviewId, lending } = route.params;
    const [index, setIndex] = useState(reviewId === 'newReview' ? 0 : 1);

    const [overallRating, setOverallRating] = useState<number>(0);
    const [collectionRating, setCollectionRating] = useState<number>(0);
    const [collectionFeedback, setCollectionFeedback] = useState<string[]>([]);
    const [otherCollectionReview, setOtherCollectionReview] = useState<string>('');
    const [returnRating, setReturnRating] = useState<number>(0);
    const [returnFeedback, setReturnFeedback] = useState<string[]>([]);
    const [otherReturnReview, setOtherReturnReview] = useState<string>('');
    const [givenInstructionFollowed, setGivenInstructionFollowed] = useState<string>('');
    const [givenInstructionFollowedFeedback, setGivenInstructionFollowedFeedback] = useState<string[]>([]);
    const [otherGivenInstructionFollowedReview, setOtherGivenInstructionFollowedReview] = useState<string>('');
    const [communicationRating, setCommunicationRating] = useState<number>(0);
    const [communicationFeedback, setCommunicationFeedback] = useState<string[]>([]);
    const [otherCommunicationReview, setOtherCommunicationReview] = useState<string>('');
    const [productConditionRating, setReturnedProductConditionRating] = useState<number>(0);
    const [productConditionFeedback, setReturnedProductConditionFeedback] = useState<string[]>([]);
    const [otherProductConditionReview, setOtherReturnedProductConditionReview] = useState<string>('');
    const [priceWorthyRating, setPriceWorthyRating] = useState<number>(0);
    const [publicReview, setPublicReview] = useState<string>('');
    const [privateNotesforLender, setPrivateNotesforLender] = useState<string>('');

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

    const toggleCollectionFeedback = (collectionFeedback: string) => {
        setCollectionFeedback((prevCollectionFeedback) =>
            prevCollectionFeedback.includes(collectionFeedback)
                ? prevCollectionFeedback.filter((f) => f !== collectionFeedback)
                : [...prevCollectionFeedback, collectionFeedback]
        );
    };

    const toggleReturnFeedback = (returnFeedback: string) => {
        setReturnFeedback((prevReturnFeedback) =>
            prevReturnFeedback.includes(returnFeedback)
                ? prevReturnFeedback.filter((f) => f !== returnFeedback)
                : [...prevReturnFeedback, returnFeedback]
        );
    };

    const toggleListingMatchFeedback = (givenInstructionFollowedFeedback: string) => {
        setGivenInstructionFollowedFeedback((prevListingMatchFeedback) =>
            prevListingMatchFeedback.includes(givenInstructionFollowedFeedback)
                ? prevListingMatchFeedback.filter((f) => f !== givenInstructionFollowedFeedback)
                : [...prevListingMatchFeedback, givenInstructionFollowedFeedback]
        );
    };

    const toggleCommunicationFeedback = (communicationFeedback: string) => {
        setCommunicationFeedback((prevCommunicationFeedback) =>
            prevCommunicationFeedback.includes(communicationFeedback)
                ? prevCommunicationFeedback.filter((f) => f !== communicationFeedback)
                : [...prevCommunicationFeedback, communicationFeedback]
        );
    };

    const toggleProductConditionFeedback = (productConditionFeedback: string) => {
        setReturnedProductConditionFeedback((prevProductConditionFeedback) =>
            prevProductConditionFeedback.includes(productConditionFeedback)
                ? prevProductConditionFeedback.filter((f) => f !== productConditionFeedback)
                : [...prevProductConditionFeedback, productConditionFeedback]
        );
    };

    const fetchBorrower = async () => {
        const fetchedBorrower = await fetchSelectedUser(lending.userId);
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
                    if (lending.product.id && lending.id) {
                        const selectedProduct = await getReviewByBorrowingId(lending.product.id, lending.id);
                        if (selectedProduct) {
                            setOverallRating(selectedProduct.lenderOverallRating || 0);
                            setCollectionRating(selectedProduct.lenderCollectionRating || 0);
                            setCollectionFeedback(selectedProduct.lenderCollectionFeedback || []);
                            setOtherCollectionReview(selectedProduct.lenderOtherCollectionReview || '');
                            setReturnRating(selectedProduct.lenderReturnRating || 0);
                            setReturnFeedback(selectedProduct.lenderReturnFeedback || []);
                            setOtherReturnReview(selectedProduct.lenderOtherReturnReview || '');
                            setGivenInstructionFollowed(selectedProduct.lenderGivenInstructionFollowed || '');
                            setGivenInstructionFollowedFeedback(selectedProduct.lenderGivenInstructionFollowedFeedback || []);
                            setOtherGivenInstructionFollowedReview(selectedProduct.lenderOtherGivenInstructionFollowedReview || '');
                            setCommunicationRating(selectedProduct.lenderCommunicationRating || 0);
                            setCommunicationFeedback(selectedProduct.lenderCommunicationFeedback || []);
                            setOtherCommunicationReview(selectedProduct.lenderOtherCommunicationReview || '');
                            setReturnedProductConditionRating(selectedProduct.lenderReturnedProductConditionRating || 0);
                            setReturnedProductConditionFeedback(selectedProduct.lenderReturnedProductConditionFeedback || []);
                            setOtherReturnedProductConditionReview(selectedProduct.lenderOtherReturnedProductConditionReview || '');
                            setPublicReview(selectedProduct.lenderPublicReview || '');
                            setPrivateNotesforLender(selectedProduct.lenderPrivateNotesforLender || '');
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

    const screens = 9;

    const nextScreen = async () => {
        if (index === 1 && overallRating === 0) {
            Alert.alert('Please give an overall rating.');
            return;
        }
        if (index === 2 && (!collectionRating || collectionFeedback.length === 0)) {
            Alert.alert('Please provide both a collection rating and at least one feedback.');
            return;
        }
        if (index === 3 && (!returnRating || returnFeedback.length === 0)) {
            Alert.alert('Please provide both a return rating and at least one feedback.');
            return;
        }
        if (index === 4 && (!givenInstructionFollowed || givenInstructionFollowedFeedback.length === 0)) {
            Alert.alert('Please select a listing match condition and at least one feedback.');
            return;
        }
        if (index === 5 && (!communicationRating || communicationFeedback.length === 0)) {
            Alert.alert('Please provide both a communication rating and at least one feedback.');
            return;
        }
        if (index === 6 && (!productConditionRating || productConditionFeedback.length === 0)) {
            Alert.alert('Please provide both a product condition rating and at least one feedback.');
            return;
        }
        if (index === 7 && !publicReview) {
            Alert.alert('Please provide a public review.');
            return;
        }
        if (index === 8 && !privateNotesforLender) {
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
                        borrowingId: lending.id || '',
                        lenderReviewerId: user.uid,
                        lenderOverallRating: overallRating || 0,
                        productId: lending.product.id || '',

                        lenderCollectionRating: collectionRating || 0,
                        lenderCollectionFeedback: collectionFeedback || [''],
                        lenderOtherCollectionReview: otherCollectionReview,
                        lenderReturnRating: returnRating || 0,
                        lenderReturnFeedback: returnFeedback || [''],
                        lenderOtherReturnReview: otherReturnReview || '',
                        lenderGivenInstructionFollowed: givenInstructionFollowed || '',
                        lenderGivenInstructionFollowedFeedback: givenInstructionFollowedFeedback || [''],
                        lenderOtherGivenInstructionFollowedReview: otherGivenInstructionFollowedReview || '',
                        lenderCommunicationRating: communicationRating || 0,
                        lenderCommunicationFeedback: communicationFeedback || [''],
                        lenderOtherCommunicationReview: otherCommunicationReview || '',
                        lenderReturnedProductConditionRating: productConditionRating || 0,
                        lenderReturnedProductConditionFeedback: productConditionFeedback || [''],
                        lenderOtherReturnedProductConditionReview: otherProductConditionReview || '',
                        lenderPublicReview: publicReview || '',
                        lenderPrivateNotesforLender: privateNotesforLender || '',
                        lenderUpdatedAt: new Date(),
                        lenderCreateAt: new Date(),
                        lenderStatus: status,
                    }, lending.product.id || 'undefined');
                    Alert.alert('Review created successfully.');
                } else {
                    await updateReview(lending.product.id || 'undefined', reviewId, {
                        borrowingId: lending.id || '',
                        lenderReviewerId: user.uid,
                        lenderOverallRating: overallRating || 0,
                        lenderCollectionRating: collectionRating || 0,
                        lenderCollectionFeedback: collectionFeedback || [''],
                        lenderOtherCollectionReview: otherCollectionReview,
                        lenderReturnRating: returnRating || 0,
                        lenderReturnFeedback: returnFeedback || [''],
                        lenderOtherReturnReview: otherReturnReview || '',
                        lenderGivenInstructionFollowed: givenInstructionFollowed || '',
                        lenderGivenInstructionFollowedFeedback: givenInstructionFollowedFeedback || [''],
                        lenderOtherGivenInstructionFollowedReview: otherGivenInstructionFollowedReview || '',
                        lenderCommunicationRating: communicationRating || 0,
                        lenderCommunicationFeedback: communicationFeedback || [''],
                        lenderOtherCommunicationReview: otherCommunicationReview || '',
                        lenderReturnedProductConditionRating: productConditionRating || 0,
                        lenderReturnedProductConditionFeedback: productConditionFeedback || [''],
                        lenderOtherReturnedProductConditionReview: otherProductConditionReview || '',
                        lenderPublicReview: publicReview || '',
                        lenderPrivateNotesforLender: privateNotesforLender || '',
                        lenderUpdatedAt: new Date(),
                        lenderStatus: status,
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
                                <Text style={{ fontSize: 15, color: COLORS.black }}>Your review will make this app a good community lending &lending platform.</Text>
                                <Text style={{ fontSize: 15, color: COLORS.black }}>{'\n'}Your review also will increse your profile rating unlocking, lesser deposit, and trust</Text>
                            </View>
                        </View>

                    }
                    {index === 1 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50 }}>Rate your lending experience</Text>
                            <Text style={{ fontSize: 16, color: COLORS.black, paddingTop: 10, paddingBottom: 20 }}>Let us know your overall lending experience</Text>
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
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50, paddingBottom: 40 }}>How was the pickup experience?</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 40 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setCollectionRating(star)}>
                                        <Ionicons
                                            name={star <= collectionRating ? 'star' : 'star-outline'}
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
                                {['Arrived On Time', 'Clear and Respectful', 'Friendly and Polite', 'Late Without Notice', 'No Communication Beforehand', 'Seemed Rushed'].map((feedback, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={{
                                            borderRadius: 60,
                                            backgroundColor: collectionFeedback ? (collectionFeedback.includes(feedback) ? COLORS.primary : COLORS.input) : COLORS.input,
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
                                Other Collection Experience Review
                                <Text style={{ fontSize: 12, color: COLORS.blackLight2 }}> (optional)</Text>
                                </Text>
                            <Input
                                onFocus={() => setisFocused1(true)}
                                onBlur={() => setisFocused1(false)}
                                isFocused={isFocused1}
                                onChangeText={setOtherCollectionReview}
                                backround={COLORS.card}
                                style={{ fontSize: 12, borderRadius: 10, backgroundColor: COLORS.input }}
                                placeholder='Add your other collection review here'
                                keyboardType='default'
                                value={otherCollectionReview}
                            />
                        </View>
                    }
                    {index === 3 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50, paddingBottom: 40 }}>How was the return experience?</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 40 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setReturnRating(star)}>
                                        <Ionicons
                                            name={star <= returnRating ? 'star' : 'star-outline'}
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
                                {['Returned On Time', 'Notified About Delay', 'Quick and Smooth Handover', 'Easy to Coordinate Return', 'Late Without Communication'].map((feedback, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={{
                                            borderRadius: 60,
                                            backgroundColor: returnFeedback ? (returnFeedback.includes(feedback) ? COLORS.primary : COLORS.input) : COLORS.input,
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
                                Other Return Experience Review
                                <Text style={{ fontSize: 12, color: COLORS.blackLight2 }}> (optional)</Text>
                                </Text>
                            <Input
                                onFocus={() => setisFocused2(true)}
                                onBlur={() => setisFocused2(false)}
                                isFocused={isFocused2}
                                onChangeText={setOtherReturnReview}
                                backround={COLORS.card}
                                style={{ fontSize: 12, borderRadius: 10, backgroundColor: COLORS.input }}
                                placeholder='Add your other return review here'
                                keyboardType='default'
                                value={otherReturnReview}
                            />
                        </View>
                    }
                    {index === 4 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50 }}>Did the borrower followed your defined instruction?</Text>
                            <Text style={{ fontSize: 16, color: COLORS.black, paddingTop: 10, paddingBottom: 20 }}>Tell us about borrower followed guidelines or not.</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 20, }}>
                                {['Did Not Follow', 'Mostly Followed'].map((condition, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={{
                                            backgroundColor: givenInstructionFollowed === condition ? COLORS.primary : COLORS.input,
                                            borderRadius: 50,
                                            paddingVertical: 10,
                                            paddingHorizontal: 20,
                                            margin: 5,
                                        }}
                                        onPress={() => setGivenInstructionFollowed(condition)}
                                    >
                                        <Text style={{ fontSize: 14, color: givenInstructionFollowed === condition ? COLORS.white : COLORS.title }}>
                                            {condition}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50, paddingBottom: 20 }}>Tell us more</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 20, gap: 10 }}>
                                    {['Used as Intended', 'Read Instructions Properly', 'Did not Read Instructions Properly', 'Mishandled or Abused Item', 'Ignored Usage Guidelines'].map((feedback, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={{
                                                borderRadius: 60,
                                                backgroundColor: givenInstructionFollowedFeedback ? (givenInstructionFollowedFeedback.includes(feedback) ? COLORS.primary : COLORS.input) : COLORS.input,
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
                                Other Review
                                <Text style={{ fontSize: 12, color: COLORS.blackLight2 }}> (optional)</Text>
                                </Text>
                            <Input
                                onFocus={() => setisFocused3(true)}
                                onBlur={() => setisFocused3(false)}
                                isFocused={isFocused3}
                                onChangeText={setOtherGivenInstructionFollowedReview}
                                backround={COLORS.card}
                                style={{ fontSize: 12, borderRadius: 10, backgroundColor: COLORS.input }}
                                placeholder='Add your other listing match review here'
                                keyboardType='default'
                                value={otherGivenInstructionFollowedReview}
                            />
                        </View>
                    }
                    {index === 5 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50 }}>How's the communication with {lending.firstName}?</Text>
                            <Text style={{ fontSize: 16, color: COLORS.black, paddingTop: 10, paddingBottom: 20 }}>From collection to return, how well did {lending.firstName} communicate with you?</Text>
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
                                {['Very Responsive', 'Asked Relevant Questions', 'Respectful Tone Throughout', 'Took Time to Respond', 'Misunderstood Key Info', 'Disrespectful or Rude'].map((feedback, index) => (
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
                                Other Review
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
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50 }}>What do you think about condition of the returned product?</Text>
                            <Text style={{ fontSize: 16, color: COLORS.black, paddingTop: 10, paddingBottom: 20 }}>Your opinion about the lending product when you start lending.</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 40 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setReturnedProductConditionRating(star)}>
                                        <Ionicons
                                            name={star <= productConditionRating ? 'star' : 'star-outline'}
                                            size={40}
                                            color={COLORS.primary}
                                            style={{ marginHorizontal: 5 }}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50, paddingBottom: 20 }}>Tell us about the product condition</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 20, gap: 10 }}>
                                {['Excellent condition', 'Light Wear', 'Very Clean', 'Works as Before', 'Minor Functional Issues', 'Returned Dirty', 'Some Parts Worn Out', 'Item Not Usable Anymore'].map((feedback, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={{
                                            borderRadius: 60,
                                            backgroundColor: productConditionFeedback ? (productConditionFeedback.includes(feedback) ? COLORS.primary : COLORS.input) : COLORS.input,
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
                                Other Review
                                <Text style={{ fontSize: 12, color: COLORS.blackLight2 }}> (optional)</Text>
                                </Text>
                            <Input
                                onFocus={() => setisFocused5(true)}
                                onBlur={() => setisFocused5(false)}
                                isFocused={isFocused5}
                                onChangeText={setOtherReturnedProductConditionReview}
                                backround={COLORS.card}
                                style={{ fontSize: 12, borderRadius: 10, backgroundColor: COLORS.input }}
                                placeholder='Add your other product condition review here'
                                keyboardType='default'
                                value={otherProductConditionReview}
                            />
                        </View>
                    }
                    {index === 7 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 30 }}>Write a public review</Text>
                            <Text style={{ fontSize: 14, color: COLORS.black, paddingTop: 10, paddingBottom: 30 }}>We'll show this feedback to other borrower in {lending.firstName}'s profile.</Text>
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
                                placeholder={`e.g. Great experience! ${lending.firstName} was very helpful and friendly.`}
                                multiline={true}  // Enable multi-line input
                                numberOfLines={10} // Suggest the input area size
                                value={publicReview ? publicReview : ''}
                            />
                        </View>
                    }
                    {index === 8 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 30 }}>Write a private note</Text>
                            <Text style={{ fontSize: 14, color: COLORS.black, paddingTop: 10, paddingBottom: 30 }}>This feedback just for {lending.firstName} - share what they can improve when borrowing.</Text>
                            <Input
                                onFocus={() => setisFocused7(true)}
                                onBlur={() => setisFocused7(false)}
                                isFocused={isFocused7}
                                onChangeText={setPrivateNotesforLender}
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
                                placeholder={`e.g. Hey ${lending.firstName}, I think you can improve your borrowing instruction a bit.`}
                                multiline={true}  // Enable multi-line input
                                numberOfLines={10} // Suggest the input area size
                                value={privateNotesforLender ? privateNotesforLender : ''}
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
                ) : index === 8 ? (
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
            </View >
            <BottomSheet
                ref={bottomSheetRef}
                snapPoints={snapPoints}
                enablePanDownToClose={true} // Allow swipe-down to close
                index={-1} // Initial snap point
                handleComponent={() => (
                    <View
                        style={{
                            padding: 10,
                            backgroundColor: COLORS.background,
                            borderTopLeftRadius: 22,
                            borderTopRightRadius: 22,
                        }}
                    >
                        <Text style={{ textAlign: 'center', fontSize: 14, paddingVertical: 10 }}>Save this review as draft?</Text>
                        <View style={[GlobalStyleSheet.line, { marginTop: 10 }]}></View>
                    </View>
                )}
                backdropComponent={(backdropProps) => (
                    <BottomSheetBackdrop {...backdropProps} enableTouchThrough={true} />
                )}
            >
                <BottomSheetScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start' }}>
                    <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15, }]}>
                        <TouchableOpacity
                            style={{
                                backgroundColor: COLORS.card,
                                padding: 15,
                                borderRadius: 10,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 10,
                            }}
                            onPress={() => {
                                // Save draft logic here
                                handleReview(0);
                                Alert.alert('Draft Saved', 'Your listing has been saved as a draft.');
                                bottomSheetRef.current?.close();
                                navigation.goBack();
                            }}
                        >
                            <Text style={{ fontSize: 16 }}>Save Draft</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                backgroundColor: COLORS.card,
                                padding: 15,
                                borderRadius: 10,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 10,
                            }}
                            onPress={() => {
                                // Discard logic here
                                Alert.alert('Draft Discarded', 'Your draft has been discarded.');
                                bottomSheetRef.current?.close();
                                navigation.goBack();
                            }}
                        >
                            <Text style={{ fontSize: 16, }}>Discard</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                backgroundColor: COLORS.card,
                                padding: 15,
                                borderRadius: 10,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            onPress={() => {
                                // Cancel logic here
                                bottomSheetRef.current?.close();
                            }}
                        >
                            <Text style={{ fontSize: 16,  }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </BottomSheetScrollView>
            </BottomSheet>
        </View>
    )
}

export default LenderAddReview