import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, BackHandler, Platform, ActionSheetIOS } from 'react-native'
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
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { updateBooking } from '../../services/BookingServices';
import { fetchSelectedCatalogue, updateCatalogue } from '../../services/CatalogueServices';

type BookingAddReviewScreenProps = StackScreenProps<RootStackParamList, 'BookingAddReview'>;

const BookingAddReview = ({ navigation, route }: BookingAddReviewScreenProps) => {

    const { user } = useUser();
    const { booking } = route.params;

    const [overallRating, setOverallRating] = useState<number>(0);
    const [customerFeedback, setCustomerFeedback] = useState<string[]>([]);
    const [customerOtherComment, setCustomerOtherComment] = useState<string>('');
    const [selectedCustomerReviewImageUrl, setSelectedCustomerReviewImageUrl] = useState<string | null>(null);
    const [customerReviewImageUrls, setCustomerReviewImageUrls] = useState<string[]>([]);

    const [isFocused1, setisFocused1] = useState(false);

    const [loading, setLoading] = useState(true);

    const toggleCollectionFeedback = (customerFeedback: string) => {
        setCustomerFeedback((prevCollectionFeedback) =>
            prevCollectionFeedback.includes(customerFeedback)
                ? prevCollectionFeedback.filter((f) => f !== customerFeedback)
                : [...prevCollectionFeedback, customerFeedback]
        );
    };

    const handleImageSelect = () => {
        if (customerReviewImageUrls.length >= 5) {
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


    // camera tools
    const selectImages = async () => {
        const options = {
            mediaType: 'photo' as const,
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
            selectionLimit: 5 - customerReviewImageUrls.length, // Limit the selection to the remaining slots
        };

        launchImageLibrary(options, async (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.errorMessage) {
                console.log('Image picker error: ', response.errorMessage);
            } else {
                const selectedImages = response.assets?.map(asset => asset.uri).filter(uri => uri !== undefined) as string[] || [];
                setCustomerReviewImageUrls((prevImages) => {
                    const updatedImages = [...prevImages, ...selectedImages];
                    setSelectedCustomerReviewImageUrl(updatedImages[0]);
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

        if (customerReviewImageUrls.length >= 5) {
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
                    setCustomerReviewImageUrls((prevImages) => {
                        const updatedImages = [...prevImages, newImageUri];
                        setSelectedCustomerReviewImageUrl(updatedImages[0]);
                        return updatedImages;
                    });
                }
            }
        });
    };

    const deleteImage = () => {
        if (!setSelectedCustomerReviewImageUrl) return;

        const updatedImages = customerReviewImageUrls.filter((img) => img !== selectedCustomerReviewImageUrl);
        setCustomerReviewImageUrls(updatedImages);
        setSelectedCustomerReviewImageUrl(updatedImages.length > 0 ? updatedImages[0] : null);
    };

    useEffect(() => {
        const fetchReview = async () => {
            try {
                if (booking.catalogueService.id && booking.id) {
                    const selectedBooking = await getReviewByBookingId(booking.catalogueService.id, booking.id);
                    if (selectedBooking) {
                        setOverallRating(selectedBooking.customerOverallRating ?? 0);
                        setCustomerFeedback(selectedBooking.customerFeedback ?? []);
                        setCustomerOtherComment(selectedBooking.customerOtherComment || '');
                        if (selectedBooking.customerReviewImageUrls) {
                            setCustomerReviewImageUrls(selectedBooking.customerReviewImageUrls);
                            setSelectedCustomerReviewImageUrl(selectedBooking.customerReviewImageUrls[0])
                        }
                    }
                } else {
                    console.error('Product ID or Borrowing ID is missing.');
                }
            } catch (error) {
                console.error('Failed to fetch listing details:', error);
            }
        };

        fetchReview();
    });

    const handleReview = async () => {
        try {
            await createReview({
                bookingId: booking.id || '',
                customerId: user?.uid || '',
                settlerId: booking.settlerId || '',
                customerOverallRating: overallRating || 0,
                catalogueServiceId: booking.catalogueService.id || '',

                customerFeedback: customerFeedback || [''],
                customerOtherComment: customerOtherComment,
                customerReviewImageUrls: customerReviewImageUrls || [],
                customerUpdatedAt: new Date(),
                customerCreateAt: new Date(),
            }, booking.catalogueService.id || 'undefined');

            await updateBooking(booking.id || '', { status: 6 });
            // updating ratings for catalogue & settler

            const selectedCatalogue = await fetchSelectedCatalogue(booking.catalogueService.id || '');
            await updateCatalogue(booking.catalogueService.id || '', {
                averageRatings: selectedCatalogue && selectedCatalogue.averageRatings === null ? 0 : 4,
            });

            Alert.alert('Review created successfully.');
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
                        </View>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.title, textAlign: 'center' }}>{booking.status !== 6 ? 'Add Review' : 'Your Review'}</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <TouchableOpacity
                                // onPress={handlePress}
                                onPress={() => navigation.goBack()}
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
                        </View>
                    </View>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 70, alignItems: 'flex-start' }}>
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
                        <View style={[GlobalStyleSheet.line]} />
                        <View>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingBottom: 20, paddingTop: 20 }}>Tell us more</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 20, gap: 10 }}>
                                {['Arrived On Time', 'Clear Directions Provided', 'Safe & Convenient Location', 'Expensive', 'Easy to Find Location', 'Late Without Notice', 'Rushed the Meetup', 'Did not Communicate Clearly'].map((feedback, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={{
                                            borderRadius: 60,
                                            backgroundColor: customerFeedback ? (customerFeedback.includes(feedback) ? COLORS.primary : COLORS.input) : COLORS.input,
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
                        </View>
                        <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>
                            Other Comments<Text style={{ fontSize: 12, color: COLORS.blackLight2 }}> (optional)</Text>
                        </Text>
                        <Input
                            readOnly={booking.status === 6 ? true : false}
                            onFocus={() => setisFocused1(true)}
                            onBlur={() => setisFocused1(false)}
                            isFocused={isFocused1}
                            onChangeText={setCustomerOtherComment}
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
                            value={customerOtherComment ? customerOtherComment : ''}
                        />
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black, paddingBottom: 20, paddingTop: 20 }}>Service Review Image</Text>
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
                            {selectedCustomerReviewImageUrl ? (
                                <View
                                    style={{
                                        flex: 1,
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    <Image
                                        source={{ uri: selectedCustomerReviewImageUrl }}
                                        style={{
                                            width: '100%',
                                            height: 300,
                                            borderRadius: 10,
                                            marginBottom: 10,
                                        }}
                                        resizeMode="cover"
                                    />

                                    {/* Delete Button */}
                                    {booking.status !== 6 && (
                                        <TouchableOpacity
                                            onPress={() => deleteImage()}
                                            style={{
                                                position: 'absolute',
                                                top: 10,
                                                right: 10,
                                                backgroundColor: 'rgba(0,0,0,0.6)',
                                                padding: 8,
                                                borderRadius: 20,
                                            }}
                                        >
                                            <Ionicons name="trash-outline" size={24} color={COLORS.white} />
                                        </TouchableOpacity>
                                    )}

                                    {/* Thumbnail List */}
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {customerReviewImageUrls.map((imageUri, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => setSelectedCustomerReviewImageUrl(imageUri)}
                                            >
                                                <Image
                                                    source={{ uri: imageUri }}
                                                    style={{
                                                        width: 80,
                                                        height: 80,
                                                        marginRight: 10,
                                                        borderRadius: 10,
                                                        borderWidth: selectedCustomerReviewImageUrl === imageUri ? 3 : 0,
                                                        borderColor:
                                                            selectedCustomerReviewImageUrl === imageUri
                                                                ? COLORS.primary
                                                                : 'transparent',
                                                    }}
                                                />
                                            </TouchableOpacity>
                                        ))}

                                        {/* Small "+" box — only visible if less than 5 images */}
                                        {customerReviewImageUrls.length < 5 && booking.status !== 6 && (
                                            <TouchableOpacity
                                                onPress={handleImageSelect}
                                                activeOpacity={0.8}
                                                style={{
                                                    width: 80,
                                                    height: 80,
                                                    borderRadius: 10,
                                                    borderWidth: 1,
                                                    borderColor: COLORS.blackLight,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    backgroundColor: COLORS.card,
                                                }}
                                            >
                                                <Ionicons name="add-outline" size={28} color={COLORS.blackLight} />
                                            </TouchableOpacity>
                                        )}
                                    </ScrollView>

                                </View>
                            ) : (
                                // Placeholder when no image is selected
                                <TouchableOpacity
                                    onPress={() => handleImageSelect()}
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
                                        Add photos here
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {booking.status !== 6 && (
                            <View style={{ paddingTop: 20 }}>
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: COLORS.primary,
                                        padding: 15,
                                        borderRadius: 10,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '100%',
                                    }}
                                    onPress={() => {

                                        handleReview();
                                        navigation.reset({
                                            index: 0,
                                            routes: [{ name: 'BottomNavigation', params: { screen: 'MyBookings' } }],
                                        });
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Submit Review</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ScrollView >
            </View >
        </View>
    )
}

export default BookingAddReview