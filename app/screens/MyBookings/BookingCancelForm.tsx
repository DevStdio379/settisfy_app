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
import { BookingActivityType, BookingActorType, fetchSelectedBooking, updateBooking, uploadBookingCancellationReason } from '../../services/BookingServices';
import { fetchSelectedCatalogue, updateCatalogue } from '../../services/CatalogueServices';
import { fetchSelectedSettlerService, updateSettlerService } from '../../services/SettlerServiceServices';
import AttachmentForm from '../../components/Forms/AttachmentForm';
import { arrayUnion } from 'firebase/firestore';
import { generateId } from '../../helper/HelperFunctions';
import { set } from 'date-fns';

type BookingCancelFormScreenProps = StackScreenProps<RootStackParamList, 'BookingCancelForm'>;

const BookingCancelForm = ({ navigation, route }: BookingCancelFormScreenProps) => {

    const { user } = useUser();
    const { booking } = route.params;

    const [cancelReasons, setCancelReasons] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const toggleFeedback = (cancelReasons: string) => {
        setCancelReasons((prevCollectionFeedback) =>
            prevCollectionFeedback.includes(cancelReasons)
                ? prevCollectionFeedback.filter((f) => f !== cancelReasons)
                : [...prevCollectionFeedback, cancelReasons]
        );
    };

    useEffect(() => {
        setCancelReasons(booking.cancelReasons || []);
    }, [booking]);

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
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.title, textAlign: 'center' }}>Cancel Booking</Text>
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
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 400, alignItems: 'flex-start' }}>
                    <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 50 }}>You're About to Cancel Your Booking</Text>
                        <Text style={{ fontSize: 16, color: COLORS.black, paddingTop: 10, paddingBottom: 20 }}>Provide reason for cancellation from options below or write your own. This cancellation will be reviewed before any action is taken.</Text>
                        <View>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 20, gap: 10 }}>
                                {(() => {
                                    const customerReasons = [
                                        'Change of plans',
                                        'Scheduling conflict',
                                        'Booked by mistake',
                                        'Found a cheaper alternative',
                                        'No longer needed',
                                        'Settler unavailable',
                                        'High service fee',
                                        'Safety or location concerns',
                                        'Service not as described',
                                    ];

                                    const settlerReasons = [
                                        'Unable to provide service',
                                        'Personal emergency',
                                        'Double booked',
                                        'Incorrect booking details',
                                        'Unsafe location',
                                        'Equipment unavailable',
                                        'Transportation issue',
                                        'Health reasons',
                                        'Other (explain below)',
                                    ];

                                    const reasons = booking.cancelActor ? booking.cancelActor === BookingActorType.CUSTOMER ? customerReasons : settlerReasons : user ? user.accountType! === 'customer' ? customerReasons : settlerReasons : customerReasons;

                                    return reasons.map((reason, index) => (
                                        <TouchableOpacity
                                            disabled={booking.status >= 11}
                                            key={index}
                                            style={{
                                                borderRadius: 20,
                                                backgroundColor: cancelReasons.includes(reason) ? COLORS.primary : COLORS.input,
                                                paddingVertical: 10,
                                                paddingHorizontal: 12,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: 10,
                                                marginBottom: 10,
                                                minWidth: 120,
                                            }}
                                            onPress={() => toggleFeedback(reason)}
                                        >
                                            <Text style={{ fontSize: 14, color: cancelReasons.includes(reason) ? COLORS.white : COLORS.title, textAlign: 'center' }}>
                                                {reason}
                                            </Text>
                                        </TouchableOpacity>
                                    ));
                                })()}
                            </View>
                        </View>
                        <AttachmentForm
                            title="Upload Reason Attachment (optional)"
                            description={''}
                            initialImages={booking.cancelReasonImageUrls || []}
                            initialRemark={booking.cancelReasonText || ''}
                            isEditable={loading ? false : (booking.status >= 11 ? false : true)}
                            showRemark={true}
                            buttonText={loading ? 'Cancelling...' : 'Submit Cancellation'}
                            showSubmitButton={booking.status >= 11 ? false : true}
                            onSubmit={async (data) => {
                                setLoading(true);
                                await uploadBookingCancellationReason(booking.id!, data.images).then((urls => {
                                    data.images = urls;
                                }))

                                await updateBooking(booking.id!, {
                                    status: user?user.accountType! === 'customer' ? 11.1 : 11.2 : 11,
                                    cancelReasons: cancelReasons,
                                    cancelReasonText: data.remark,
                                    cancelReasonImageUrls: data.images,
                                    cancelActor: user?user.accountType! === 'customer' ? BookingActorType.CUSTOMER : BookingActorType.SETTLER : BookingActorType.SYSTEM,

                                    timeline: arrayUnion({
                                        id: generateId(),
                                        type: user?user.accountType! === 'customer' ? BookingActivityType.BOOKING_CANCELLED_BY_CUSTOMER : BookingActivityType.BOOKING_CANCELLED_BY_SETTLER : BookingActivityType.BOOKING_CANCELLED,
                                        timestamp: new Date(),
                                        actor: user?user.accountType! === 'customer' ? BookingActorType.CUSTOMER : BookingActorType.SETTLER : BookingActorType.SYSTEM,
                                    }),
                                });

                                Alert.alert('Booking Cancelled', 'Your booking has been cancelled successfully.');
                                if (booking.cancelActor === BookingActorType.SETTLER) {
                                    navigation.navigate('MyRequests');
                                } else {
                                    navigation.navigate('MyBookings');
                                }
                            }}
                        />
                    </View>
                </ScrollView >
            </View >
        </View>
    )
}

export default BookingCancelForm