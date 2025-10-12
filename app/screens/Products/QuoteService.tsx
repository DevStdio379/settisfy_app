import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, FlatList, Animated, StyleSheet, Platform, Image, ScrollView,
  Alert,
  ActionSheetIOS,
} from "react-native";
import { COLORS, SIZES } from "../../constants/theme";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/RootStackParamList";
import Swiper from "react-native-swiper";
import { Calendar } from "react-native-calendars";
import { format, set, setMonth } from "date-fns";
import { GlobalStyleSheet } from "../../constants/StyleSheet";
import { useUser } from "../../context/UserContext";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Address, fetchUserAddresses } from "../../services/AddressServices";
import Input from "../../components/Input/Input";
import TabButtonStyleHome from "../../components/Tabs/TabButtonStyleHome";
import { createBooking } from "../../services/BookingServices";
import { CategoryDropdown } from "../../components/CategoryDropdown";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { updateCatalogue } from "../../services/CatalogueServices";
import { fetchReviewsByCatalogueId, Review } from "../../services/ReviewServices";

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


type QuoteServiceScreenProps = StackScreenProps<RootStackParamList, "QuoteService">;

const QuoteService = ({ navigation, route }: QuoteServiceScreenProps) => {
  const [service, setService] = useState(route.params.service)

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
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [index, setIndex] = useState(0);
  const { user } = useUser();
  const [paymentMethod, setPaymentMethod] = useState<string | null>('card');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | undefined>(user?.currentAddress);
  const [accordionOpen, setAccordionOpen] = useState<{ [key: string]: boolean }>({});
  const [isFocused, setisFocused] = useState(false);
  const [selectedNotesToSettlerImageUrl, setSelectedNotesToSettlerImageUrl] = useState<string | null>(null);
  const [notesToSettlerImageUrls, setNotesToSettlerImageUrls] = useState<string[]>([]);
  const [notesToSettler, setNotesToSettler] = useState<string>('');
  const [grandTotal, setGrandTotal] = useState<number>(0);
  const [selectedAddons, setSelectedAddons] = useState<{ [key: string]: AddonOption[] }>({});
  const basePrice = service ? service.basePrice : 0;
  const [totalQuote, setTotalQuote] = useState(basePrice);
  const platformFee = 2; // Fixed platform fee
  const [reviews, setReviews] = useState<Review[]>();

  const handleImageSelect = () => {
    if (notesToSettlerImageUrls.length >= 5) {
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
      selectionLimit: 5 - notesToSettlerImageUrls.length, // Limit the selection to the remaining slots
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('Image picker error: ', response.errorMessage);
      } else {
        const selectedImages = response.assets?.map(asset => asset.uri).filter(uri => uri !== undefined) as string[] || [];
        setNotesToSettlerImageUrls((prevImages) => {
          const updatedImages = [...prevImages, ...selectedImages];
          setSelectedNotesToSettlerImageUrl(updatedImages[0]);
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

    if (notesToSettlerImageUrls.length >= 5) {
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
          setNotesToSettlerImageUrls((prevImages) => {
            const updatedImages = [...prevImages, newImageUri];
            setSelectedNotesToSettlerImageUrl(updatedImages[0]);
            return updatedImages;
          });
        }
      }
    });
  };

  const deleteImage = () => {
    if (!selectedNotesToSettlerImageUrl) return;

    const updatedImages = notesToSettlerImageUrls.filter((img) => img !== selectedNotesToSettlerImageUrl);
    setNotesToSettlerImageUrls(updatedImages);
    setSelectedNotesToSettlerImageUrl(updatedImages.length > 0 ? updatedImages[0] : null);
  };


  // tabview
  const scrollViewHome = useRef<any>(null);
  const buttons = ['Options', 'Service Details', 'Before You Book', 'Reviews'];

  const scrollX = useRef(new Animated.Value(0)).current;
  const onCLick = (i: any) => scrollViewHome.current.scrollTo({ x: i * SIZES.width });

  // changing state screen
  const nextScreen = async () => {
    if (index === 0) {
      if (Object.keys(selectedAddons).length === 0) {
        Alert.alert(`Select at least 1 ${service.category} components`)
        return
      }
      let grandTotal = Number(totalQuote) + Number(platformFee); // Adding platform fee of $2
      setGrandTotal(grandTotal);
      setIndex(1);
    }
    if (index === 1) {
      if (!selectedAddress) {
        Alert.alert('Select service address')
        return
      }
      Alert.alert(notesToSettler)
      handleCheckout('borrowingRef1', 'paymentIntentId1');
    }
  }

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
      notesToSettlerImageUrls: notesToSettlerImageUrls,
      notesToSettler: notesToSettler,
      total: grandTotal || 0,
      paymentMethod: paymentMethod,
      paymentIntentId: paymentIntentId,

      // after broadcast
      settlerId: '',
      settlerServiceId: '',
      settlerFirstName: '',
      settlerLastName: '',
      settlerEvidenceImageUrls: [],
      settlerEvidenceRemark: '',

      //generate random collection and return codes
      serviceStartCode: '',
      serviceEndCode: '',
      updatedAt: new Date(),
      createAt: new Date(),
    };

    const bookingId = await createBooking(bookingData);
    if (bookingId) {
      await updateCatalogue(service.id || '', { bookingsCount: service.bookingsCount + 1 })
      Alert.alert('Success', `Booking created successfully with ID: ${bookingId}`);
      navigation.navigate('PaymentSuccess', {
        bookingId: bookingId,
        image: service.imageUrls[0],
      });
    }
  };



  // Get user addresses when component mounts
  const getAddresses = async () => {
    if (user?.uid) {
      const fetchedAddresses = await fetchUserAddresses(user.uid);
      setAddresses(fetchedAddresses);
    }
  };

  // load
  useEffect(() => {
    const fetchData = async () => {
      await getAddresses();
      const reviewsData = await fetchReviewsByCatalogueId(service.id || '');
      // do something with reviewsData, e.g.:
      setReviews(reviewsData);
    };

    fetchData();
  }, []);


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
                  onPress={() => { index === 1 ? setIndex(0) : setIndex(1) }}
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
                  `${service.category.charAt(0).toUpperCase() + service.category.slice(1)}`,
                  'Checkout',
                  'Select Service Address',
                  'Select a Date',
                  'Select Payment Method',
                ][index] || ''}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
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
            <View style={{ height: SIZES.height * 1 }}>
              <Animated.ScrollView
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
                {buttons.map((button, tabIndex) => (
                  <View
                    style={{ width: SIZES.width, paddingTop: 10, paddingHorizontal: 10 }}
                    key={tabIndex}
                  >
                    {tabIndex === 0 && (
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
                    {tabIndex === 1 && (
                      <View style={{ paddingTop: 10, paddingRight: 40 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>Description</Text>
                        <Text style={{ fontSize: 15, color: COLORS.black, paddingBottom: 20 }}>{service.description}</Text>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>What's Included</Text>
                        <Text style={{ fontSize: 15, color: COLORS.black, paddingBottom: 20 }}>{service.includedServices}</Text>
                      </View>
                    )}
                    {tabIndex === 2 && (
                      <View style={{ paddingRight: 40 }}>
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
                    {tabIndex === 3 && reviews && (
                      <View style={{ paddingRight: 40 }}>
                        {/* Static reviews */}
                        {reviews.map((review, reviewIndex) => (
                          <View
                            key={reviewIndex}
                            style={{
                              borderRadius: 10,
                              width: '100%',
                              marginTop: 15,
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              {/* <Image
                                source={{ uri: review.borrowerProfilePicture }}
                                style={{ width: 40, height: 40, borderRadius: 40, marginRight: 10 }}
                              /> */}
                              <View>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.title }}>
                                  {`${review.customerId} ${review.customerId}`}
                                </Text>
                                <Text style={{ fontSize: 14, color: COLORS.blackLight }}>
                                  {new Date(review.customerCreateAt).toLocaleDateString()}
                                </Text>
                              </View>
                            </View>
                            <Text style={{ fontSize: 14, color: COLORS.black, marginVertical: 10 }}>
                              {review.customerFeedback}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              {Array.from({ length: 5 }, (_, i) => (
                                <Ionicons
                                  key={i}
                                  name="star"
                                  size={16}
                                  color={i < review.customerOverallRating!  ? COLORS.primary : COLORS.blackLight}
                                />
                              ))}
                              <Text style={{ fontSize: 14, color: COLORS.black, marginLeft: 5 }}>
                                {review.customerOverallRating}
                              </Text>
                            </View>
                            <View style={{ height: 1, backgroundColor: COLORS.blackLight, marginVertical: 10 }} />
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </Animated.ScrollView>
            </View>
          </View>
        )}
        {index === 1 && (
          <View style={{ flex: 1, paddingHorizontal: 15, backgroundColor: COLORS.background }}>
            <View style={{ width: '100%', paddingTop: 20, gap: 10 }}>
              {/* Product Info */}
              <View style={{ flexDirection: "row", marginBottom: 10 }}>
                <Image
                  source={{ uri: service.imageUrls[0] }}
                  style={{ width: 100, height: 100, borderRadius: 8, marginRight: 16 }}
                />
                <View style={{ flex: 1, marginTop: 5 }}>
                  <Text style={{ fontSize: 16, marginBottom: 5 }}>
                    <Text style={{ color: "#E63946", fontWeight: "bold" }}>RM{basePrice}</Text> / Session
                    {/* <Text style={styles.originalPrice}>RM40.20</Text> */}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5, color: COLORS.title }}>{service.title}</Text>
                </View>
              </View>
              <View style={GlobalStyleSheet.line} />
              {/* Borrowing Period and Delivery Method */}
              <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.title, marginTop: 10 }}>Booking Information</Text>
              <View>
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.8}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    borderWidth: 0.6,
                    borderColor: COLORS.blackLight,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 5,
                  }}
                  onPress={() => setIndex(2)}
                >
                  <Ionicons name="location-outline" size={26} color={COLORS.blackLight} style={{ margin: 5 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.title }}>
                      Service at {selectedAddress ? selectedAddress.addressName : `Address`}
                    </Text>
                    <Text style={{ fontSize: 13, color: COLORS.black }}>
                      {selectedAddress ? selectedAddress.address : `No address selected`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={26} color={COLORS.blackLight} style={{ margin: 5 }} />
                </TouchableOpacity>
              </View>
              <View style={{}}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIndex(3)}>
                  <View style={[GlobalStyleSheet.flexcenter, { width: '100%', gap: 20, justifyContent: 'space-between', marginBottom: 10, alignItems: 'flex-start' }]} >
                    <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold' }}>Service Date</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ fontSize: 16, color: COLORS.blackLight, fontWeight: 'bold' }}>{selectedDate ? selectedDate : 'Add Date'}</Text>
                      <Ionicons name="chevron-forward-outline" size={24} color={COLORS.blackLight} />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={{}}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIndex(4)}>
                  <View style={[GlobalStyleSheet.flexcenter, { width: '100%', gap: 20, justifyContent: 'space-between', marginBottom: 10, alignItems: 'flex-start' }]} >
                    <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold' }}>Payment Method</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ fontSize: 16, color: COLORS.blackLight, fontWeight: 'bold' }}>{paymentMethod ? paymentMethod : 'Add card'}</Text>
                      <Ionicons name="chevron-forward-outline" size={24} color={COLORS.blackLight} />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={GlobalStyleSheet.line} />
              <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.title, marginTop: 10 }}>Notes to Settler</Text>
              <Text style={{ fontSize: 14, color: COLORS.black }}>This is optional but very helpful to our settler.</Text>
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
                {selectedNotesToSettlerImageUrl ? (
                  <View
                    style={{
                      flex: 1,
                      width: '100%',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Image
                      source={{ uri: selectedNotesToSettlerImageUrl }}
                      style={{
                        width: '100%',
                        height: 300,
                        borderRadius: 10,
                        marginBottom: 10,
                      }}
                      resizeMode="cover"
                    />

                    {/* Delete Button */}
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

                    {/* Thumbnail List */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {notesToSettlerImageUrls.map((imageUri, index) => (
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

                      {/* Small "+" box — only visible if less than 5 images */}
                      {notesToSettlerImageUrls.length < 5 && (
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
              {selectedNotesToSettlerImageUrl && (
                <View>
                  <Text style={{ fontSize: 15, fontWeight: "bold", color: COLORS.title, marginVertical: 10 }}>Add what do you want the settler to know here</Text>
                  <Input
                    onFocus={() => setisFocused(true)}
                    onBlur={() => setisFocused(false)}
                    isFocused={isFocused}
                    onChangeText={setNotesToSettler}
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
                    value={notesToSettler ? notesToSettler : ''}
                  />
                </View>
              )}
              <View style={GlobalStyleSheet.line} />
              {/* Borrowing Rate Breakdown */}
              <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5, color: COLORS.title, marginTop: 10 }}>Service Pricing Breakdown</Text>
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                  <Text style={{ fontSize: 14, color: "#333" }}>Service Price</Text>
                  <Text style={{ fontSize: 14, color: "#333" }}>1 x session</Text>
                  <Text style={{ fontSize: 14, fontWeight: "bold" }}>RM{service.basePrice}</Text>
                </View>
                {
                  Object.entries(selectedAddons).map(([category, options]) => (
                    options.map((option, idx) => (
                      <View key={`${category}-${idx}`} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                        <Text style={{ fontSize: 14, color: "#333" }}>{category}: {option.label}</Text>
                        <Text style={{ fontSize: 14, fontWeight: "bold" }}>RM{option.additionalPrice}</Text>
                      </View>
                    ))
                  ))
                }
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                  <Text style={{ fontSize: 14, color: "#333" }}>Platform Fee</Text>
                  <Text style={{ fontSize: 14, color: "#333" }}></Text>
                  <Text style={{ fontSize: 14, fontWeight: "bold" }}>RM2.00</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                  <Text style={{ fontSize: 14, color: "#333" }}>Delivery Charge</Text>
                  <Text style={{ fontSize: 14, color: "#333" }}> N/A</Text>
                  <Text style={{ fontSize: 14, fontWeight: "bold" }}>RM0.00</Text>
                </View>
                <View style={[{ backgroundColor: COLORS.black, height: 1, margin: 10, width: '90%', alignSelf: 'center' },]} />
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: "bold" }}>Total</Text>
                  <Text style={{ fontSize: 14, color: "#333", fontWeight: "bold" }}>RM{grandTotal}</Text>
                </View>
              </View>
            </View>
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
        {index === 4 && (

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
      </ScrollView>

      {/* Bottom Quote Panel */}
      {index == 0 ? (
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
            onPress={nextScreen}
          >
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: 'bold' }}>Book Now</Text>
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
                {index === 1
                  ? paymentMethod === 'card'
                    ? `Pay RM${grandTotal}`
                    : `Book Now`
                  : [
                    '',
                    'Confirm Service Address',
                    'Confirm Date',
                    'Confirm Payment Method',
                  ][index - 1] || ''}
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

export default QuoteService;
