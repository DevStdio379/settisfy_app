import React, { useEffect, useState, useCallback, useRef } from 'react'
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, RefreshControl, Alert, BackHandler, Platform, Animated, FlatList } from 'react-native'
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import { COLORS, SIZES } from '../../constants/theme';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchSelectedUser, User, useUser } from '../../context/UserContext';
import { fetchBorrowingDates, fetchSelectedProduct } from '../../services/ProductServices';
import { Calendar, DateData } from 'react-native-calendars';
import { format, formatDistanceToNow, set } from 'date-fns';
import MapView, { Circle, Marker } from 'react-native-maps';
import { Address, fetchUserAddresses } from '../../services/AddressServices';
import { createBorrowing } from '../../services/BorrowingServices';
import { getReviewsByProductId } from '../../services/ReviewServices';
import { getOrCreateChat } from '../../services/ChatServices';
import Swiper from 'react-native-swiper';
import TabButtonStyleHome from '../../components/Tabs/TabButtonStyleHome';
import axios from 'axios';
import { useStripe } from '@stripe/stripe-react-native';
import { db } from '../../services/firebaseConfig';
import { collection, CollectionReference, doc } from 'firebase/firestore';

type ProductDetailsScreenProps = StackScreenProps<RootStackParamList, 'ProductDetails'>;
const ProductDetails = ({ navigation, route }: ProductDetailsScreenProps) => {
  const { user } = useUser();
  const mapRef = useRef<MapView>(null);

  const [product, setProduct] = useState(route.params.product);
  // const [productAddress, setProductAddress] = useState<Address>();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [owner, setOwner] = useState<User>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [bookedDates, setBookedDates] = useState<{ [key: string]: any }>({});
  const [selectedDates, setSelectedDates] = useState<{ [key: string]: any }>({});
  const [range, setRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  const [reviews, setReviews] = useState<any[]>([]);
  const [startDate, setStartDate] = useState(selectedDates.start || null);
  const [endDate, setEndDate] = useState(selectedDates.end || null);
  const [index, setIndex] = useState(0);
  const [accordionOpen, setAccordionOpen] = useState<{ [key: string]: boolean }>({});
  const [scrollY, setScrollY] = useState(0);
  const [deliveryMethod, setDeliveryMethod] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [numberOfDays, setNumberOfDays] = useState<number>();
  const [total, setTotal] = useState<number>();
  const [grandTotal, setGrandTotal] = useState<number>();

  // tabview
  const scrollViewHome = useRef<any>(null);
  const buttons = ['Details', 'What\'s Included', 'Before You Borrow', 'Reviews'];

  const scrollX = useRef(new Animated.Value(0)).current;
  const onCLick = (i: any) => scrollViewHome.current.scrollTo({ x: i * SIZES.width });

  const paymentMethods = [
    {
      image: "cash",
      title: "Cash on Pickup",
      tag: "cash",
      text: 'Borrower directly pays the owner upon pickup meetup',
    },
    {
      label: 'Recommended',
      image: "card-outline",
      tag: "card",
      title: "Credit / Debit Card",
      text: "Stripe handles all payments securely. Sign-in",
    },
  ]

  const getDistanceInKm = (
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number
  ): number => {
    const toRadians = (degree: number): number => degree * (Math.PI / 180);

    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(endLat - startLat);
    const dLon = toRadians(endLon - startLon);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(startLat)) * Math.cos(toRadians(endLat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  };


  const getDateRange = (start: string, end: string) => {
    const range: string[] = [];
    let currentDate = new Date(start);
    const endDate = new Date(end);

    while (currentDate <= endDate) {
      range.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return range;
  };

  const findNextAvailableDate = (dateStr: string, markedDates: any) => {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    let date = new Date(dateStr);

    for (let i = 1; i <= 365; i++) {
      const nextDate = new Date(date.getTime() + i * ONE_DAY);
      const formatted = nextDate.toISOString().split('T')[0];
      if (!markedDates[formatted]) {
        return formatted;
      }
    }

    return null; // No available date found
  };

  const fetchSelectedProductData = async () => {
    if (product) {
      try {
        const selectedProduct = await fetchSelectedProduct(product.id || 'undefined');
        if (selectedProduct) {
          setProduct(selectedProduct);
          // fetch Owner details
          try {
            const fetchedOwner = await fetchSelectedUser(selectedProduct.ownerID);
            if (fetchedOwner) {
              setOwner(fetchedOwner);
            }
          } catch (error) {
            console.error('Failed to fetch owner details:', error);
          }
          // fetch Booked Dates on Calendar
          try {
            const fetchedDates = await getBookedDates(product.id || 'undefined');
            // setBookedDates(fetchedDates);
            setSelectedDates(fetchedDates);
            const today = new Date().toISOString().split('T')[0];
            const nextAvailable = findNextAvailableDate(today, fetchedDates);
            console.log('Next available date:', nextAvailable);
            setStartDate(nextAvailable);
            setEndDate(nextAvailable);
          } catch (error) {
            Alert.alert("Error", "Failed to fetch booked dates.");
          }

          // fetch Reviews
          try {
            const fetchedReviews = await getReviewsByProductId(product.id || 'undefined');
            const reviewsWithUserDetails = await Promise.all(
              fetchedReviews.map(async (review) => {
                const reviewer = await fetchSelectedUser(review.borrowerReviewerId);
                return {
                  ...review,
                  borrowerFirstName: reviewer?.firstName || '',
                  borrowerLastName: reviewer?.lastName || '',
                  borrowerProfilePicture: reviewer?.profileImageUrl || '',
                };
              })
            );
            setReviews(reviewsWithUserDetails);
            console.log('Fetched reviews:', fetchedReviews);
          } catch (error) {
            console.error('Failed to fetch reviews', error);
          }
        }
      } catch (error) {
        console.error('Failed to fetch product details:', error);
      }
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

  const handleChat = async (user: User, otherUser: User) => {
    const chatId = await getOrCreateChat(user, otherUser, product?.id);
    if (chatId) {
      navigation.navigate("Chat", { chatId: chatId });
    }
  };

  const handleDayPress = (day: DateData) => {
    if (selectedDates[day.dateString]?.disabled) {
      Alert.alert("Unavailable", "This date is already booked.");
      return;
    }

    let newRange = { ...range };

    if (!range.start || (range.start && range.end)) {
      // First tap: Set start date
      newRange = { start: day.dateString, end: null };
    } else {
      // Second tap: Set end date
      newRange.end = day.dateString;

      if (newRange.start && newRange.end && new Date(newRange.start) > new Date(newRange.end)) {
        // Swap start and end if necessary
        newRange = { start: newRange.end, end: newRange.start };
      }


      // Check if any booked dates exist in this range
      const conflictDates = getConflictDates(newRange.start!, newRange.end!);

      if (conflictDates.length > 0) {
        Alert.alert(
          "Selected Range Includes Booked Dates",
          "Your selected range contains booked dates. Please select a different range."
        );
        return; // Stop further processing
      }
    }

    if (newRange.start && newRange.end) {
      setStartDate(newRange.start);
      setEndDate(newRange.end);
    }
    setRange(newRange);
    setSelectedDates({
      ...bookedDates, // Preserve booked dates
      ...getHighlightedDates(newRange.start, newRange.end),
    });

  };

  const getConflictDates = (start: string, end: string) => {
    let conflicts: string[] = [];
    let date = new Date(start);

    while (date <= new Date(end)) {
      const dateString = date.toISOString().split("T")[0];

      if (selectedDates[dateString]?.disabled) {
        conflicts.push(dateString);
      }

      date.setDate(date.getDate() + 1);
    }

    return conflicts;
  };



  const getHighlightedDates = (start: string | null, end: string | null) => {
    let markedDates: any = {};

    if (!start) return markedDates;

    if (!end) {
      markedDates[start] = {
        selected: true,
        startingDay: true,
        color: COLORS.primary,
        textColor: "white",
      };
      return markedDates;
    }

    let date = new Date(start);
    while (date <= new Date(end)) {
      const dateString = date.toISOString().split("T")[0];

      if (bookedDates[dateString]) {
        markedDates[dateString] = bookedDates[dateString]; // Keep booked dates red
      } else {
        markedDates[dateString] = {
          selected: true,
          color: COLORS.primary,
          textColor: "white",
        };
      }

      date.setDate(date.getDate() + 1);
    }

    markedDates[start] = { ...markedDates[start], startingDay: true };
    markedDates[end] = { ...markedDates[end], endingDay: true };

    return markedDates;
  };

  const getAddresses = async () => {
    if (user?.uid) {
      const fetchedAddresses = await fetchUserAddresses(user.uid);
      setAddresses(fetchedAddresses);
      setLoading(false);
    }
  };

  const getBookedDates = async (productId: string) => {
    let markedDates: any = {};

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const unavailableDaysCurrentMonth = getAvailableDays(currentYear, currentMonth, product.availableDays);
    const unavailableDaysNextMonth = getAvailableDays(
      currentMonth === 12 ? currentYear + 1 : currentYear,
      currentMonth === 12 ? 1 : currentMonth + 1,
      product.availableDays
    );
    const unavailableDaysMonthAfterNext = getAvailableDays(
      currentMonth >= 11 ? currentYear + 1 : currentYear,
      currentMonth >= 11 ? currentMonth - 10 : currentMonth + 2,
      product.availableDays
    );

    const unavailableDays = {
      ...unavailableDaysCurrentMonth,
      ...unavailableDaysNextMonth,
      ...unavailableDaysMonthAfterNext,
    };
    Object.keys(unavailableDays).forEach((sunday) => {
      markedDates[sunday] = { disabled: true, disableTouchEvent: true, textColor: COLORS.blackLight };
    });

    console.log('Unavailable days:', unavailableDays);

    const bookedDateRanges = await fetchBorrowingDates(productId);

    bookedDateRanges.forEach(({ startDate, endDate }) => {
      let date = new Date(startDate);
      while (date <= new Date(endDate)) {
        const dateString = date.toISOString().split("T")[0];

        markedDates[dateString] = { disabled: true, disableTouchEvent: true, textColor: COLORS.blackLight };

        date.setDate(date.getDate() + 1);
      }

      markedDates[startDate] = { ...markedDates[startDate], startingDay: true };
      markedDates[endDate] = { ...markedDates[endDate], endingDay: true };
    });
    return markedDates;
  };

  useEffect(() => {
    const fetchOwner = async () => {
      if (product) {
        const fetchedOwner = await fetchSelectedUser(product.ownerID);
        if (fetchedOwner) {
          setOwner(fetchedOwner);
        }
      }
    };

    const fetchBookedDates = async () => {
      if (product) {
        const fetchedDates = await getBookedDates(product.id || 'undefined');
        const today = new Date().toISOString().split('T')[0];
        const nextAvailable = findNextAvailableDate(today, fetchedDates);
        console.log('Next available date:', nextAvailable);
        setStartDate(nextAvailable);
        setEndDate(nextAvailable);
        if (nextAvailable) {
          const initialDateData: DateData = {
            dateString: nextAvailable,
            day: new Date(nextAvailable).getDate(),
            month: new Date(nextAvailable).getMonth() + 1,
            year: new Date(nextAvailable).getFullYear(),
            timestamp: new Date(nextAvailable).getTime(),
          };
          handleDayPress(initialDateData);
          setSelectedDates({
            ...fetchedDates,
            ...bookedDates,
            [nextAvailable]: {
              selected: true,
              startingDay: true,
              color: COLORS.primary,
              textColor: "white",
            },
          });
        }
        setBookedDates(fetchedDates);
      }
    };

    const fetchReviews = async () => {
      if (product) {
        const fetchedReviews = await getReviewsByProductId(product.id || 'undefined');
        const reviewsWithUserDetails = await Promise.all(
          fetchedReviews.map(async (review) => {
            const reviewer = await fetchSelectedUser(review.borrowerReviewerId);
            return {
              ...review,
              borrowerFirstName: reviewer?.firstName || '',
              borrowerLastName: reviewer?.lastName || '',
              borrowerProfilePicture: reviewer?.profileImageUrl || '',
            };
          })
        );
        setReviews(reviewsWithUserDetails);
      }
    };

    fetchOwner();
    fetchBookedDates();
    fetchReviews();
  }, [product]);

  useEffect(() => {
    if (startDate && endDate && product) {
      const days = getDateRange(startDate, endDate).length;
      setNumberOfDays(days);
      const totalAmount = Number(days * product.lendingRate);
      setTotal(totalAmount);
      setGrandTotal(totalAmount + Number(product.depositAmount));
    }
  }, [startDate, endDate, product]);

  useEffect(() => {
    if (product) {
      setImages(product.imageUrls);
      setSelectedImage(product.imageUrls[0]);
      getAddresses();
    }
  }, [product]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSelectedProductData().then(() => setRefreshing(false));
  }, []);

  const handleCheckout = async (borrowingRef: any, paymentIntentId: string) => {
      if (total === undefined) {
        Alert.alert('Error', 'Total amount is not calculated.');
        return;
      }

    if (!deliveryMethod || !paymentMethod) {
      Alert.alert('Error', 'Please select delivery and payment methods.');
      return;
    }

    if (!product) {
      Alert.alert('Error', 'Product not found.');
      return;
    }

    // if (!productAddress) {
    //   Alert.alert('Error', 'Product address not found.');
    //   return;
    // }

    const borrowingData = {
      userId: user?.uid || '',
      status: 0,
      startDate: startDate,
      endDate: endDate,
      // user copy
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      // owner copy
      ownerFirstName: owner?.firstName || '',
      ownerLastName: owner?.lastName || '',
      // products copy

      product: product,

      // end products copy
      total: grandTotal || 0,
      deliveryMethod: deliveryMethod,
      numberOfDays: numberOfDays || 0,
      paymentMethod: paymentMethod,
      paymentIntentId: paymentIntentId,
      //generate random collection and return codes
      collectionCode: '',
      returnCode: '',
      updatedAt: new Date(),
      createAt: new Date(),
    };

    const borrowingId = await createBorrowing(borrowingRef, borrowingData);
    if (borrowingId) {
      Alert.alert('Success', `Borrowings created successfully with ID: ${borrowingId}`);
      navigation.navigate('PaymentSuccess', {
        borrowingId: borrowingId,
        collectionCode: borrowingData.collectionCode,
        latitude: product.latitude,
        longitude: product.longitude,
        addressName: product.addressName,
        address: product.address,
        postcode: product.postcode
      });
    }
  };

  const screens = 5;

  const nextScreen = async () => {
    if (index === 1 && (!startDate || !endDate)) {
      Alert.alert('Please select start and end dates');
      return;
    }
    if (index === 2 && deliveryMethod === null) {
      Alert.alert('Please select a delivery method');
      return;
    }
    if (index === 3 && !paymentMethod) {
      Alert.alert('Please select a payment method');
      return;
    }
    if (index === 4) {
      Alert.alert('Payment processing...')
      const paymentResult = await handleHoldPayment();
      if (paymentResult.success) {
        Alert.alert('Payment successful', 'Your payment has been processed successfully.');
        if (paymentResult.data?.borrowingRef) {
          setPaymentIntentId(paymentResult.data.paymentIntentId);
          Alert.alert('Success', `Payment Intent ID: ${paymentIntentId}`);
          handleCheckout(paymentResult.data.borrowingRef, paymentResult.data.paymentIntentId);
        }
        return;
      }
      else {
        Alert.alert('Payment failed', paymentResult.error || 'An error occurred while processing your payment.');
        return;
      }
    }
    setIndex((prev) => (prev + 1) % screens);
  }

  const prevScreen = () =>
    setIndex((prev) => (prev - 1 + screens) % screens);

  // Function to get available days dynamically based on product.unavailableDays
  const getAvailableDays = (year: number, month: number, unavailableDays: string[]) => {
    console.log('Unavailable days:', unavailableDays);
    const availableDates: { [key: string]: { disabled: boolean } } = {};
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      if (!unavailableDays.includes(dayName)) {
        const formattedDate = date.toISOString().split('T')[0];
        availableDates[formattedDate] = { disabled: true };
      }
    }
    return availableDates;
  };

  // Functions to handle payment and refunds

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [connectedAccountId] = useState('acct_1RiaVN4gRYsyHwtX'); // Replace with real lender ID
  const [currency] = useState('GBP');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [paymentIntent, setPaymentIntent] = useState('');


  const handleHoldPayment = async () => {
    const borrowingRef = doc(collection(db, 'borrowings')); // generates ID now

    try {
      setLoading(true);
      const response = await axios.post(
        'https://us-central1-tags-1489a.cloudfunctions.net/api/hold-payment',
        {
          amount: (grandTotal ?? 0) * 100,
          currency,
          borrowingId: borrowingRef.id,
        }
      );

      const {
        paymentIntent,
        paymentIntentId,
        ephemeralKey,
        customer,
      } = response.data;

      const initResponse = await initPaymentSheet({
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        merchantDisplayName: `BorrowUp - ${borrowingRef.id}`,
      });

      if (initResponse.error) {
        Alert.alert('Error', initResponse.error.message);
        setLoading(false);
        return { success: false, error: initResponse.error.message };
      }

      const result = await presentPaymentSheet();

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return {
        success: true,
        data: {
          paymentIntentId: paymentIntentId,
          customerId: customer,
          borrowingRef: borrowingRef,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Hold payment failed.',
      };
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={{ backgroundColor: COLORS.background, flex: 1 }}>
      <View>
        <View style={{ zIndex: 1, height: 60, backgroundColor: COLORS.background, borderBottomColor: COLORS.card, borderBottomWidth: 1 }}>
          <View style={{ height: '100%', backgroundColor: COLORS.background, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 10 }}>
            <View style={{ flex: 1, alignItems: 'flex-start' }}>
              {index === 0 ? (
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
              ) : (
                <TouchableOpacity
                  onPress={prevScreen}
                  style={{
                    height: 45, width: 45, alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Ionicons size={30} color={COLORS.black} name='chevron-back-outline' />
                </TouchableOpacity>
              )}
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.title, textAlign: 'center' }}>
                {[
                  `${product?.category}`,
                  'Select Dates',
                  'Delivery Method',
                  'Payment Method',
                  'Checkout'
                ][index] || ''}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              {index === 0 ? (
                <TouchableOpacity
                  onPress={() => { }}
                  style={{
                    height: 40,
                    width: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View></View>
                  {/* <Ionicons size={25} color={COLORS.black} name='bookmark-outline' /> */}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={{
                    height: 45,
                    width: 45,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons size={30} color={COLORS.black} name='close' />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
      {product ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 70, }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {index === 0 && (
            <View style={{ width: '100%', paddingTop: 10 }}>
              <View style={{ paddingHorizontal: 20, backgroundColor: COLORS.background, paddingBottom: 20 }}>
                <View style={{ height: 250 }}>
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
                </View>
                <View style={{ paddingTop: 20 }}>
                  <TabButtonStyleHome
                    buttons={buttons}
                    onClick={onCLick}
                    scrollX={scrollX}
                  />
                </View>
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
                          <View style={{ paddingTop: 10, paddingRight: 40 }}>
                            <View style={{ flexDirection: 'row', marginBottom: 10, }}>
                              <View style={{ flex: 1, alignItems: 'flex-start' }}>
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
                                      <Ionicons name={'image-outline'} size={20} color={COLORS.blackLight} style={{ opacity: .5 }} />
                                    </View>
                                  )
                                }
                              </View>
                              <View style={{ flex: 7, paddingLeft: 35, justifyContent: 'center' }}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>{product.title}</Text>
                                <Text style={{ fontSize: 14, color: COLORS.blackLight }}>by {owner?.firstName} {owner?.lastName} </Text>
                              </View>
                              {/* <TouchableOpacity
                                onPress={() => { if (user && owner) handleChat(user, owner) }}
                                style={{
                                  bottom: 10,
                                  right: 10,
                                  backgroundColor: COLORS.placeholder,
                                  padding: 10,
                                  borderRadius: 10,
                                }}
                              >
                                <Ionicons name="chatbubble-ellipses-outline" size={24} color={COLORS.white} />
                              </TouchableOpacity> */}
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5, }}>
                              <Ionicons name="location-sharp" size={20} color={COLORS.black} style={{ opacity: 0.5 }} />
                              {product.addressName && product.address ? (
                                <Text>
                                  {product.addressName.replace(/^\d+\s*/, '')}, {product.address.replace(/^\d+\s*/, '')} | {getDistanceInKm(user?.currentAddress?.latitude ?? 0, user?.currentAddress?.longitude ?? 0, product.latitude, product.longitude).toFixed(2)} KM away
                                </Text>
                              ) : (
                                <Text>
                                  {product.latitude}, {product.longitude}
                                </Text>
                              )}
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingBottom: 20 }}>
                              {product.ratingCount && product.ratingCount > 0 ? (
                                <>
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <Ionicons
                                      key={i}
                                      name="star"
                                      size={16}
                                      color={i < (product.averageRating ?? 0) ? COLORS.warning : COLORS.card}
                                    />
                                  ))}
                                  <Text style={{}}> {product.averageRating?.toFixed(1)} </Text>
                                  <Text style={{}}>({product.ratingCount})</Text>
                                  <TouchableOpacity onPress={() => onCLick(3)}>
                                    <Text style={{ textDecorationLine: 'underline', color: COLORS.primary, paddingLeft: 4 }}>see all reviews</Text>
                                  </TouchableOpacity>
                                </>
                              ) : (
                                <Text style={{ color: COLORS.blackLight }}>No reviews yet</Text>
                              )}
                            </View>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>Description</Text>
                            <Text style={{ fontSize: 15, color: COLORS.black, paddingBottom: 20 }}>{product.description}</Text>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black, paddingBottom: 5 }}>Location</Text>
                            <View style={{ height: 200, borderRadius: 20, overflow: 'hidden', borderColor: COLORS.blackLight, borderWidth: 1 }}>
                              <MapView
                                ref={mapRef}
                                style={{ height: '100%' }}
                                region={{
                                  latitude: product.latitude,
                                  longitude: product.longitude,
                                  latitudeDelta: 0.05, // Adjust zoom level
                                  longitudeDelta: 0.05,
                                }}
                                scrollEnabled={false}
                                zoomEnabled={false}
                                rotateEnabled={false}
                                pitchEnabled={false}
                                toolbarEnabled={false}
                              >
                                <Circle
                                  center={{ latitude: product.latitude, longitude: product.longitude }}
                                  radius={1000} // Radius in meters (1000m = 1km)
                                  strokeWidth={2}
                                  strokeColor="rgba(0, 122, 255, 0.5)"
                                  fillColor="rgba(0, 122, 255, 0.2)" // Light blue transparent fill
                                />
                              </MapView>
                              <View style={GlobalStyleSheet.line} />
                            </View>
                            <Text style={{ fontSize: 14, color: COLORS.black, paddingBottom: 20, textAlign: 'center' }}>The exact location will be disclosed upon borrowing completion</Text>
                            <TouchableOpacity
                              style={{
                                paddingVertical: 10,
                                paddingHorizontal: 20,
                                width: '100%',
                                borderRadius: 8,
                                alignSelf: 'center',
                                borderWidth: 1,
                                borderColor: COLORS.blackLight2,
                              }}
                              onPress={() => { if (user && owner) handleChat(user, owner) }}
                            >
                              <Text style={{ color: COLORS.black, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
                                Message Owner
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        {index === 1 && (
                          <View style={{ paddingRight: 40 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>What's Included</Text>
                            <View style={{ paddingLeft: 10 }}>
                              {product.includedItems.map((item, index) => (
                                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }}>
                                  <Ionicons name="ellipse" size={10} color={COLORS.black} />
                                  <Text style={{ fontSize: 15, color: COLORS.black, paddingLeft: 10 }}>{item}</Text>
                                </View>
                              ))}
                            </View>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black, paddingVertical: 10 }}>Usage Guidelines</Text>
                            <Text style={{ fontSize: 15, color: COLORS.black, paddingBottom: 20 }}>{product.borrowingNotes}</Text>
                          </View>
                        )}
                        {index === 2 && (
                          <View style={{ paddingRight: 40 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>Deposit Policy</Text>
                            <Text style={{ fontSize: 15, color: COLORS.black, paddingBottom: 20 }}>
                              {product.depositAmount !== 0
                                ? `A deposit of £${product.depositAmount} will be required. This amount will be refunded upon return of the item in its original condition.`
                                : `This item is not taking any deposit. Please handle the item with care. Any damages may result in appropriate actions being taken.`}
                            </Text>
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
                                  Insurance/Liability
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
                                    The borrower is responsible for any damages or loss during the borrowing period. Insurance coverage is not included. Please ensure proper care of the item.
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
                                  Handover Instructions
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
                                    Please ensure to meet at the agreed location and time for the handover. Verify the condition of the product before accepting it.
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
                                  Product FAQs
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
                                    Q: Is the product fully functional?{'\n'}
                                    A: Yes, the product is tested and fully functional.{'\n\n'}
                                    Q: Are there any additional accessories included?{'\n'}
                                    A: Please refer to the "What's Included" section for details.
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        )}
                        {index === 3 && (
                          <View style={{ paddingRight: 40 }}>
                            {reviews.map((review, index) => (
                              <View
                                key={index}
                                style={{
                                  borderRadius: 10,
                                  width: '100%',
                                  marginTop: 15,
                                }}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <Image
                                    source={{ uri: review.borrowerProfilePicture }}
                                    style={{ width: 40, height: 40, borderRadius: 40, marginRight: 10 }}
                                  />
                                  <View>
                                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.title }}>
                                      {`${review.borrowerFirstName} ${review.borrowerLastName}`}
                                    </Text>
                                    <Text style={{ fontSize: 14, color: COLORS.blackLight }}>
                                      {new Date(review.borrowerUpdatedAt).toLocaleDateString()}
                                    </Text>
                                  </View>
                                </View>
                                <Text style={{ fontSize: 14, color: COLORS.black, marginVertical: 10 }}>
                                  {review.borrowerPublicReview}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <Ionicons
                                      key={i}
                                      name="star"
                                      size={16}
                                      color={i < review.borrowerOverallRating ? COLORS.primary : COLORS.blackLight}
                                    />
                                  ))}
                                  <Text style={{ fontSize: 14, color: COLORS.black, marginLeft: 5 }}>
                                    {review.borrowerOverallRating}
                                  </Text>
                                </View>
                                <View style={{ height: 1, backgroundColor: COLORS.blackLight, marginVertical: 10 }} />
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </ScrollView>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}
          {index === 1 && (
            <View style={{ width: '100%', paddingTop: 60, gap: 10 }}>
              <View style={{ alignItems: 'center', marginVertical: 10 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.title }}>
                  {startDate && endDate
                    ? `Your Borrowing Period`
                    : 'Select a Date Range'}
                </Text>
                {startDate && endDate && (
                  <Text style={{ fontSize: 16, color: COLORS.blackLight, marginTop: 5 }}>
                    {`From ${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`}
                  </Text>
                )}
              </View>
              <Calendar
                enableSwipeMonths={true}
                markedDates={selectedDates}
                markingType={'period'}
                onDayPress={handleDayPress}
                minDate={new Date().toISOString().split('T')[0]} // Disable past dates
                renderHeader={(date) => (
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: COLORS.black }}>
                    {format(new Date(date), 'MMMM yyyy')}
                  </Text>
                )}
              />
            </View>
          )}
          {index === 2 && (
            <View style={{ width: '100%', paddingTop: 60, paddingHorizontal: 15, gap: 10 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={{
                  padding: 15,
                  borderColor: deliveryMethod === 'pickup' ? COLORS.primary : COLORS.blackLight,
                  borderRadius: 10,
                  borderWidth: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => setDeliveryMethod('pickup')}
              >
                <Ionicons name="home-outline" size={30} color={COLORS.blackLight} style={{ margin: 5 }} />
                <View style={{ flex: 1, paddingLeft: 10 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.title }}>
                    Pickup
                  </Text>
                  <Text style={{ fontSize: 13, color: COLORS.black }}>
                    Address will be disclosed upon borrowing completion.
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                style={{
                  padding: 15,
                  borderColor: deliveryMethod === 'delivery' ? COLORS.primary : COLORS.blackLight,
                  borderRadius: 10,
                  borderWidth: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => {
                  setDeliveryMethod('delivery');
                }}
              >
                <Ionicons name="location-outline" size={30} color={COLORS.blackLight} style={{ margin: 5 }} />
                <View style={{ flex: 1, paddingLeft: 10 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.title }}>
                    Delivery
                  </Text>
                  <Text style={{ fontSize: 13, color: COLORS.black }}>
                    {selectedAddress?.address || 'No address available'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setAccordionOpen((prev) => ({ ...prev, [index]: !prev[index] }))}
                  style={{
                    padding: 5,
                    borderRadius: 10,
                    backgroundColor: COLORS.card,
                  }}
                >
                  <Ionicons name={accordionOpen ? "chevron-up-outline" : "chevron-down-outline"} size={24} color={COLORS.blackLight} />
                </TouchableOpacity>
              </TouchableOpacity>
              {accordionOpen && (
                <View style={{ paddingLeft: 10 }}>
                  {addresses.map((address, index) => (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.8}
                      style={{
                        padding: 15,
                        borderColor: selectedAddress?.id === address.id ? COLORS.primary : COLORS.blackLight,
                        borderRadius: 10,
                        borderWidth: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10,
                      }}
                      onPress={() => setSelectedAddress(address)}
                    >
                      <Ionicons name="location-outline" size={30} color={COLORS.blackLight} style={{ margin: 5 }} />
                      <View style={{ flex: 1, paddingLeft: 10 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.title }}>
                          {address.addressName || `Address ${index + 1}`}
                        </Text>
                        <Text style={{ fontSize: 13, color: COLORS.black }}>
                          {address.address}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
          {index === 3 && (
            <View style={{ width: '100%', paddingTop: 60, paddingHorizontal: 15, gap: 10 }}>
              {paymentMethods.map((method, index) => (
                <View key={index}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={{
                      padding: 15,
                      borderColor: paymentMethod === method.tag ? COLORS.primary : COLORS.blackLight,
                      borderRadius: 10,
                      borderWidth: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={() => setPaymentMethod(paymentMethod === method.tag ? null : method.tag)}
                  >
                    <Ionicons name={method.image} size={30} color={COLORS.black} style={{ margin: 5 }} />
                    <View style={{ flex: 1, paddingLeft: 10 }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.title }}>
                        {method.title}
                      </Text>
                      <Text style={{ fontSize: 13, color: COLORS.black }}>
                        {method.text}
                      </Text>
                    </View>
                    {method.label && (
                      <View
                        style={{
                          backgroundColor: COLORS.primary,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 5,
                          marginLeft: 10,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: COLORS.white, fontWeight: 'bold' }}>
                          {method.label}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {paymentMethod === method.tag && (
                    <View style={{ padding: 10, marginTop: 10, backgroundColor: COLORS.primaryLight, borderRadius: 10 }}>
                      {method.tag === "cash" && (
                        <>
                          <Text style={{ fontSize: 14, color: COLORS.warning, fontWeight: "bold" }}>
                            Note:
                          </Text>
                          <Text style={{ fontSize: 14, color: COLORS.black, marginTop: 5 }}>
                            By selecting "Cash on Pickup", you are responsible for handling the payment directly with the owner during the pickup.
                            Please ensure to verify the product condition before completing the transaction.
                          </Text>
                          <Text style={{ fontSize: 14, color: COLORS.black, marginTop: 5 }}>
                            We won't be able to assist with any disputes or issues arising from transactions outside the app.
                          </Text>
                          <TouchableOpacity onPress={() => { }}>
                            <Text style={{ fontSize: 14, color: COLORS.primary, marginTop: 5, textDecorationLine: 'underline' }}>
                              Read more here
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}
                      {method.tag === "card" && (
                        <>
                          <Text style={{ fontSize: 14, color: COLORS.success, fontWeight: "bold" }}>
                            Why Stripe?
                          </Text>
                          <Text style={{ fontSize: 14, color: COLORS.black, marginTop: 5 }}>
                            Stripe ensures secure and encrypted transactions, providing peace of mind for both borrowers and owners.
                            Your payment details are never shared with the owner.
                          </Text>
                          <TouchableOpacity onPress={() => { }}>
                            <Text style={{ fontSize: 14, color: COLORS.primary, marginTop: 5, textDecorationLine: 'underline' }}>
                              Learn more about Stripe
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
          {index === 4 && total && (
            <View style={{ width: '100%', paddingTop: 20, paddingHorizontal: 15, gap: 10 }}>
              {/* Product Info */}
              <View style={{ flexDirection: "row", marginBottom: 20 }}>
                <Image
                  source={{ uri: product.imageUrls[0] }}
                  style={{ width: 100, height: 100, borderRadius: 8, marginRight: 16 }}
                />
                <View style={{ flex: 1, marginTop: 5 }}>
                  <Text style={{ fontSize: 16, marginBottom: 5 }}>
                    <Text style={{ color: "#E63946", fontWeight: "bold" }}>£{product.lendingRate}</Text> / day{" "}
                    {/* <Text style={styles.originalPrice}>£40.20</Text> */}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5, color: COLORS.title }}>{product.title}</Text>
                  <Text style={{ fontSize: 14, color: COLORS.blackLight }}>{product.category}</Text>
                </View>
              </View>
              <View style={GlobalStyleSheet.line} />
              {/* Borrowing Period and Delivery Method */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <View style={{ paddingVertical: 10 }}>
                  <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.title }}>Borrowing Period</Text>
                  <Text style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>Day Borrowing</Text>
                  <Text style={{ fontSize: 14, fontWeight: "bold" }}>From:</Text>
                  <Text style={{ fontSize: 14, color: COLORS.title }}>{new Date(startDate).toLocaleDateString('en-GB')}</Text>
                  <Text style={{ fontSize: 14, color: COLORS.title }}>09:00 AM</Text>
                </View>
                <View style={{ marginHorizontal: 40, paddingTop: 60 }}>
                  <Ionicons name="arrow-forward" size={30} color={COLORS.title} />
                </View>
                <View style={{ paddingVertical: 10 }}>
                  <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.title }}>Delivery Method</Text>
                  <Text style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>{deliveryMethod}</Text>
                  <Text style={{ fontSize: 14, fontWeight: "bold" }}>Until:</Text>
                  <Text style={{ fontSize: 14, color: COLORS.title }}>{new Date(endDate).toLocaleDateString('en-GB')}</Text>
                  <Text style={{ fontSize: 14, color: COLORS.title }}>09:00 AM</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: "#666", textAlign: "center", marginBottom: 5 }}>
                The pickup location will be disclosed upon borrowing completion
              </Text>
              <View style={GlobalStyleSheet.line} />
              {/* Borrowing Rate Breakdown */}
              <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5, color: COLORS.title, marginTop: 10 }}>Borrowing Rate Breakdown</Text>
              <Text style={{ fontSize: 14, color: COLORS.blackLight, marginBottom: 10 }}>Cash on Pickup</Text>
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                  <Text style={{ fontSize: 14, color: "#333" }}>Borrowing rate</Text>
                  <Text style={{ fontSize: 14, color: "#333" }}>£{product.lendingRate} x {numberOfDays} day</Text>
                  <Text style={{ fontSize: 14, fontWeight: "bold" }}>£{total}</Text>
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
                  <Text style={{ fontSize: 14, fontWeight: "bold" }}>{product.depositAmount}</Text>
                </View>
                <View style={[{ backgroundColor: COLORS.black, height: 1, margin: 10, width: '90%', alignSelf: 'center' },]} />
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: "bold" }}>Total</Text>
                  <Text style={{ fontSize: 14, color: "#333", fontWeight: "bold" }}>£ {grandTotal}</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: COLORS.black }}>Product not found 404</Text>
        </View>
      )}
      {index <= 1 ? (
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
                <Text style={{ fontSize: 24, color: COLORS.title, fontWeight: 'bold' }}>
                  £{total} for {numberOfDays} days
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 5 }}>
                <Text style={{ fontSize: 14, color: COLORS.blackLight2 }}>£{Number(total ?? 0) + Number(product.depositAmount)} total includes deposit</Text>
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
            onPress={nextScreen}
          >
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: 'bold' }}>{[
              `Pick Dates`,
              'Delivery Method',
            ][index] || ''}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[GlobalStyleSheet.flex, { paddingVertical: 15, paddingHorizontal: 20, backgroundColor: COLORS.card, }]}>
          {user?.isActive ? (
            <TouchableOpacity
              style={{
                backgroundColor: COLORS.primary,
                width: '100%',
                padding: 15,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={nextScreen}
            >
              <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: 'bold' }}>
                {index === 4
                  ? paymentMethod === 'card'
                    ? `Pay £${grandTotal}`
                    : `Borrow Now`
                  : [
                    `Pick Dates`,
                    'Delivery Method',
                    'Payment Method',
                    'Checkout',
                  ][index] || ''}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={{
                backgroundColor: COLORS.primary,
                width: '100%',
                padding: 15,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => navigation.navigate('SignIn')}
            >
              <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: 'bold' }}>Sign In to Borrow</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

export default ProductDetails