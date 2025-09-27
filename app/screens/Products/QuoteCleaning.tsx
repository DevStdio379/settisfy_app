import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, FlatList, Animated, StyleSheet, Platform, Image, ScrollView,
  Alert,
} from "react-native";
import { COLORS, SIZES } from "../../constants/theme";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/RootStackParamList";
import Swiper from "react-native-swiper";
import { Calendar } from "react-native-calendars";
import { format } from "date-fns";
import { GlobalStyleSheet } from "../../constants/StyleSheet";
import { useUser } from "../../context/UserContext";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Address, fetchUserAddresses } from "../../services/AddressServices";
import Input from "../../components/Input/Input";
import TabButtonStyleHome from "../../components/Tabs/TabButtonStyleHome";
import { createBooking } from "../../services/BookingServices";

interface AddonOption {
  label: string;
  additionalPrice: number;
  notes?: string;
}

interface AddonCategory {
  name: string;
  subOptions: AddonOption[];
  multipleSelect: boolean;
}


type QuoteCleaningScreenProps = StackScreenProps<RootStackParamList, "QuoteCleaning">;

const QuoteCleaning = ({ navigation, route }: QuoteCleaningScreenProps) => {
  const [service, setService] = useState(route.params.service)

  const extrasOptions = [
    { id: 1, label: "Fridge Cleaning", price: 15, time: 0.5 },
    { id: 2, label: "Oven Cleaning", price: 20, time: 0.5 },
    { id: 3, label: "Window Cleaning", price: 25, time: 1 },
  ];

  const reviews = [
    {
      borrowerProfilePicture: "https://randomuser.me/api/portraits/men/32.jpg",
      borrowerFirstName: "John",
      borrowerLastName: "Doe",
      borrowerUpdatedAt: "2024-06-01T10:00:00Z",
      borrowerPublicReview: "Great service! The team was punctual and did an excellent job.",
      borrowerOverallRating: 5,
    },
    {
      borrowerProfilePicture: "https://randomuser.me/api/portraits/women/44.jpg",
      borrowerFirstName: "Jane",
      borrowerLastName: "Smith",
      borrowerUpdatedAt: "2024-05-20T14:30:00Z",
      borrowerPublicReview: "Very thorough cleaning, friendly staff. Will book again.",
      borrowerOverallRating: 4,
    },
    {
      borrowerProfilePicture: "https://randomuser.me/api/portraits/men/65.jpg",
      borrowerFirstName: "Alex",
      borrowerLastName: "Johnson",
      borrowerUpdatedAt: "2024-05-10T09:15:00Z",
      borrowerPublicReview: "Satisfied with the service. Quick and efficient.",
      borrowerOverallRating: 4,
    },
  ]

  // Payment Methods
  const paymentMethods = [
    {
      image: "cash",
      title: "Cash upon Completion",
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

  // States for selections
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [selectedTidiness, setSelectedTidiness] = useState<number | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [index, setIndex] = useState(0);
  const { user } = useUser();
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [accordionOpen, setAccordionOpen] = useState<{ [key: string]: boolean }>({});
  const [isFocused, setisFocused] = useState(false);
  const [notesForSettler, setnotesForSettler] = useState<string>('');
  const [grandTotal, setGrandTotal] = useState<number>(0);
  const [selectedAddons, setSelectedAddons] = useState<{ [key: string]: AddonOption[] }>({});
  const basePrice = service ? service.basePrice : 0;
  const [totalQuote, setTotalQuote] = useState(basePrice);
  const platformFee = 2; // Fixed platform fee


  // tabview
  const scrollViewHome = useRef<any>(null);
  const buttons = ['Options', 'Service Details', 'Before You Book', 'Reviews'];

  const scrollX = useRef(new Animated.Value(0)).current;
  const onCLick = (i: any) => scrollViewHome.current.scrollTo({ x: i * SIZES.width });

  // changing state screen
  const screens = 6;
  const nextScreen = async () => {
    if (index === 1 && !selectedDate) {
      Alert.alert('Please select a date to proceed.');
      return;
    }
    if (index === 2 && !selectedAddress) {
      Alert.alert('Please select a service address to proceed.');
      return;
    }
    if (index === 3 && !paymentMethod) {
      Alert.alert('Please select a payment method to proceed.');
      return;
    }
    if (index === 4) {
      let grandTotal = totalQuote + 2; // Adding platform fee of $2
      setGrandTotal(grandTotal);
    }
    if (index === 5) {
      handleCheckout('borrowingRef1', 'paymentIntentId1');
    }
    setIndex((prev) => (prev + 1) % screens);
  }

  // previous screen
  const prevScreen = () =>
    setIndex((prev) => (prev - 1 + screens) % screens);

  function toggleAddon(category: AddonCategory, option: AddonOption) {
  setSelectedAddons((prev) => {
    const prevOptions = prev[category.name] || [];

    let newOptions: AddonOption[];

    if (category.multipleSelect) {
      // ✅ Single selection: replace entire list
      newOptions = prevOptions[0]?.label === option.label ? [] : [option];
    } else {
      // ✅ Multiple selection: toggle
      const exists = prevOptions.some((o) => o.label === option.label);
      newOptions = exists
        ? prevOptions.filter((o) => o.label !== option.label)
        : [...prevOptions, option];
    }

    const newSelections = { ...prev, [category.name]: newOptions };

    // Recalculate total
    const addonsTotal = Object.values(newSelections)
      .flat()
      .reduce((sum, o) => sum + Number(o.additionalPrice), 0);

    setTotalQuote(Number(basePrice) + Number(addonsTotal));
    return newSelections;
  });
}



  // checkout
  const handleCheckout = async (borrowingRef: any, paymentIntentId: string) => {
    if (totalPrice === undefined) {
      Alert.alert('Error', 'Total amount is not calculated.');
      return;
    }

    if (!selectedAddress || !paymentMethod) {
      Alert.alert('Error', 'Please select delivery and payment methods.');
      return;
    }

    // Convert selectedAddons object to DynamicOption[] array
    const addonsArray = Object.entries(selectedAddons).map(([category, options]) => ({
      name: category,
      subOptions: options,
      multipleSelect: false, // Set appropriately if you have this info
    }));

    const bookingData = {
      userId: user?.uid || '',
      status: 0,
      selectedDate: selectedDate,
      selectedAddress: selectedAddress,

      // user copy
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',

      // products copy
      catalogueService: service,

      // booking details
      addons: addonsArray,
      total: grandTotal || 0,
      paymentMethod: paymentMethod,
      paymentIntentId: paymentIntentId,

      // after broadcast
      settlerId: '',
      settlerFirstName: '',
      settlerLastName: '',

      //generate random collection and return codes
      serviceStartCode: '',
      serviceEndCode: '',
      updatedAt: new Date(),
      createAt: new Date(),

      // Required Booking fields
      notes: notesForSettler,
    };

    const bookingId = await createBooking(bookingData);
    if (bookingId) {
      Alert.alert('Success', `Borrowings created successfully with ID: ${bookingId}`);
      navigation.navigate('PaymentSuccess', {
        bookingId: bookingId,
      });
    }
  };

  // Calculate total price and time dynamically
  const { totalPrice, totalTime } = useMemo(() => {
    let price = 0;
    let time = 0;


    return { totalPrice: price, totalTime: time };
  }, [selectedArea, selectedTidiness, selectedExtras]);

  // Get user addresses when component mounts
  const getAddresses = async () => {
    if (user?.uid) {
      const fetchedAddresses = await fetchUserAddresses(user.uid);
      setAddresses(fetchedAddresses);
    }
  };

  // load
  useEffect(() => {
    getAddresses();
  }, []);

  // Card Component
  const Card = ({
    item,
    isSelected,
    onPress,
  }: {
    item: any;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { borderColor: isSelected ? COLORS.primary : COLORS.black },
      ]}
      onPress={onPress}
    >
      <Text style={{ fontSize: 16, color: COLORS.text }}>{item.label}</Text>
      <Text style={{ fontSize: 14, color: COLORS.black }}>
        +${item.price} | {item.time}h
      </Text>
    </TouchableOpacity>
  );

  // Toggle extras selection
  const toggleExtra = (id: number) => {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
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
                  `${service.title}`,
                  'Select Dates',
                  'Service Address',
                  'Payment Method',
                  'Notes to Settler',
                  'Quote Summary',
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
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {index === 0 && (
          <View>
            <View style={{ height: 250, paddingHorizontal: 10 }}>
              <Swiper
                dotColor={COLORS.primaryLight}
                activeDotColor={COLORS.primary}
                autoplay={false}
                autoplayTimeout={2}
                showsPagination={Platform.OS === "android" ? true : false}
                loop={false}
              >
                {service.imageUrls.map((data, index) => (
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
            <View style={{ paddingTop: 20, paddingHorizontal: 20 }}>
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
                  style={{ width: SIZES.width, paddingTop: 10, paddingHorizontal: 10 }}
                  key={index}
                >
                  <View style={{}}>
                    {index === 0 && (
                      <View>
                        {service.dynamicOptions.map((cat) => (
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


                      </View>
                    )}
                    {index === 1 && (
                      <View style={{ paddingTop: 10, paddingRight: 40 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>Description</Text>
                        <Text style={{ fontSize: 15, color: COLORS.black, paddingBottom: 20 }}>{service.description}</Text>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>What's Included</Text>
                        <Text style={{ fontSize: 15, color: COLORS.black, paddingBottom: 20 }}>{service.includedServices}</Text>
                      </View>
                    )}
                    {index === 2 && (
                      <View style={{ paddingRight: 40 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>Deposit Policy</Text>
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
                        {/* Static reviews */}
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
        )}
        {index === 1 && (
          <View style={{ flex: 1, padding: 16, backgroundColor: COLORS.background }}>
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
          </View>
        )}
        {index === 2 && (
          <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.title, marginBottom: 20 }}>Select where to do the service</Text>
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
                          By selecting "Cash upon Completion", you are responsible for handling the payment directly with the owner during the pickup.
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
        {index === 4 && (
          <View style={{ width: '100%', paddingTop: 60, paddingHorizontal: 15, gap: 10 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 30 }}>Let the settler knows what to expect. </Text>
            <Text style={{ fontSize: 14, color: COLORS.black, paddingTop: 10, paddingBottom: 30 }}>This is optional but very helpful to our settler.</Text>
            <Input
              onFocus={() => setisFocused(true)}
              onBlur={() => setisFocused(false)}
              isFocused={isFocused}
              onChangeText={setnotesForSettler}
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
              placeholder={`e.g. Got a grassy platform.`}
              multiline={true}  // Enable multi-line input
              numberOfLines={10} // Suggest the input area size
              value={notesForSettler ? notesForSettler : ''}
            />
          </View>
        )}
        {index === 5 && (
          <View style={{ width: '100%', paddingTop: 20, paddingHorizontal: 15, gap: 10 }}>
            {/* Product Info */}
            <View style={{ flexDirection: "row", marginBottom: 20 }}>
              <Image
                source={{ uri: service.imageUrls[0] }}
                style={{ width: 100, height: 100, borderRadius: 8, marginRight: 16 }}
              />
              <View style={{ flex: 1, marginTop: 5 }}>
                <Text style={{ fontSize: 16, marginBottom: 5 }}>
                  <Text style={{ color: "#E63946", fontWeight: "bold" }}>£{basePrice}</Text> / Session {" "}
                  {/* <Text style={styles.originalPrice}>£40.20</Text> */}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5, color: COLORS.title }}>Cleaning Service</Text>
                <Text style={{ fontSize: 14, color: COLORS.black }}>Payment Method: {paymentMethod}</Text>
              </View>
            </View>
            <View style={GlobalStyleSheet.line} />
            {/* Borrowing Period and Delivery Method */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <View style={{ paddingVertical: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.title }}>Service Start at</Text>
                <Text style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>{new Date(selectedDate).toLocaleDateString('en-GB')}</Text>
                <Text style={{ fontSize: 14, fontWeight: "bold" }}>From:</Text>
                <Text style={{ fontSize: 14, color: COLORS.title }}>09:00 AM OR Now</Text>
              </View>
              <View style={{ marginHorizontal: 40, paddingTop: 60 }}>
                <Ionicons name="arrow-forward" size={30} color={COLORS.title} />
              </View>
              <View style={{ paddingVertical: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.title }}>Location</Text>
                <Text style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
                  {selectedAddress ? selectedAddress.addressName : ''}
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
                <Text style={{ fontSize: 14, fontWeight: "bold" }}>£{service.basePrice}</Text>
              </View>
              {
                Object.entries(selectedAddons).map(([category, options]) => (
                  options.map((option, idx) => (
                    <View key={`${category}-${idx}`} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                      <Text style={{ fontSize: 14, color: "#333" }}>{category}: {option.label}</Text>
                      <Text style={{ fontSize: 14, fontWeight: "bold" }}>£{option.additionalPrice}</Text>
                    </View>
                  ))
                ))
              }
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
                <Text style={{ fontSize: 14, color: "#333", fontWeight: "bold" }}>£{grandTotal}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Quote Panel */}
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
                  Starting at £{totalQuote}
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
            onPress={nextScreen}
          >
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: 'bold' }}>{[
              `Pick Dates`,
              'Select Address',
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
                {index === 5
                  ? paymentMethod === 'card'
                    ? `Pay £${grandTotal}`
                    : `Borrow Now`
                  : [
                    `Pick Dates`,
                    'Delivery Method',
                    'Payment Method',
                    'Notes to Settler',
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
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 10,
    color: COLORS.text,
    paddingHorizontal: 10,
  },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginRight: 15,
    marginLeft: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  quoteContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quoteText: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: "bold",
  },
  confirmButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});

export default QuoteCleaning;
