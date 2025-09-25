import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, ActivityIndicator, Button, Alert, FlatList, KeyboardAvoidingView, Platform } from 'react-native'
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import { IMAGES } from '../../constants/Images';
import { COLORS, SIZES } from '../../constants/theme';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useUser } from '../../context/UserContext';
import Input from '../../components/Input/Input';
import MapView from 'react-native-maps';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { createProduct, fetchSelectedProduct, Product, updateProduct } from '../../services/ProductServices';
import { Address, fetchUserAddresses } from '../../services/AddressServices';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { set } from 'date-fns';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { createSettlerService, fetchSelectedSettlerService, updateSettlerService } from '../../services/SettlerServiceServices';

type SettlerAddServiceScreenProps = StackScreenProps<RootStackParamList, 'SettlerAddService'>;

interface Option {
    id: number;
    title: string;
    description: string;
    specialtyRequired: boolean;

}

const SettlerAddService = ({ navigation, route }: SettlerAddServiceScreenProps) => {

    const { user } = useUser();
    const [settlerService] = useState(route.params.settlerService);

    // the real
    const [serviceId, setServiceId] = useState<string>('');

    const [settlerId, setSettlerId] = useState<string>(user ? user?.uid : '');
    const [settlerFirstName, setSettlerFirstName] = useState<string>(user ? user?.firstName : '');
    const [settlerLastName, setSettlerLastName] = useState<string>(user ? user?.lastName : '');

    const [serviceReferenceId, setServiceReferenceId] = useState<string>('');
    const [serviceReferenceCategory, setServiceReferenceCategory] = useState<string>('');
    const [serviceReferenceTitle, setServiceReferenceTitle] = useState<string>('');
    const [serviceReferenceDescription, setServiceReferenceDescription] = useState<string>('');
    const [isExperienced, setIsExperienced] = useState<boolean>(false);
    const [serviceCardImageUrls, setServiceCardImageUrls] = useState<string[]>([]);
    const [selectedServiceCardImageUrls, setSelectedServiceCardImageUrls] = useState<string | null>(null);
    const [serviceCardBrief, setServiceCardBrief] = useState<string>('');
    const [isAvailableImmediately, setIsAvailableImmediately] = useState<boolean>(false);
    const [availableDays, setAvailableDays] = useState<string[]>([]);
    const [serviceStartTime, setServiceStartTime] = useState<string>('');
    const [serviceEndTime, setServiceEndTime] = useState<string>('');

    const [addressId, setAddressId] = useState<string>('');
    const [latitude, setLatitude] = useState<number>(0);
    const [longitude, setLongitude] = useState<number>(0);
    const [addressName, setAddressName] = useState<string>('');
    const [address, setAddress] = useState<string>('');
    const [addressAdditionalDetails, setAddressAdditionalDetails] = useState<string>('');
    const [postcode, setPostcode] = useState<string>('');

    const [qualifications, setQualifications] = useState<string[]>();
    const [isActive, setIsActive] = useState<boolean>(false);
    const [ratingCount, setRatingCount] = useState<number>(0);
    const [averageRating, setAverageRating] = useState<number>(0);
    const [createdAt, setCreatedAt] = useState<any>();
    const [updatedAt, setUpdatedAt] = useState<any>();



    const [index, setIndex] = useState(settlerService === null ? 0 : 1);
    const [isFocused2, setisFocused2] = useState(false);
    const [isFocused4, setisFocused4] = useState(false);
    const [isFocused5, setisFocused5] = useState(false);

    const bottomSheetRef = useRef<BottomSheet>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);

    const toggleDaySelection = (day: string) => {
        setAvailableDays((prevSelectedDays) =>
            prevSelectedDays.includes(day)
                ? prevSelectedDays.filter((d) => d !== day)
                : [...prevSelectedDays, day]
        );
    };

    useEffect(() => {
        if (settlerService !== null) {
            Alert.alert(settlerService?.id ? settlerService?.id : 'sd')
            const fetchSettlerService = async () => {
                try {
                    const selectedSettlerService = await fetchSelectedSettlerService(settlerService.id || '');
                    if (selectedSettlerService) {
                        // Set the state with the fetched listing details
                        setServiceId(selectedSettlerService.id || '');
                        setSettlerId(user?.uid || '');
                        setSettlerFirstName(user?.firstName || '');
                        setSettlerLastName(user?.lastName || '');
                        setServiceReferenceCategory(selectedSettlerService.serviceReferenceCategory);
                        setServiceReferenceTitle(selectedSettlerService.serviceReferenceTitle);
                        setIsExperienced(selectedSettlerService.isExperienced)

                        setServiceReferenceDescription(selectedSettlerService.serviceReferenceDescription);
                        setServiceCardImageUrls(selectedSettlerService.serviceCardImageUrls);
                        setSelectedServiceCardImageUrls(selectedSettlerService.serviceCardImageUrls[0]);
                        setServiceCardBrief(selectedSettlerService.serviceCardBrief);
                        setIsAvailableImmediately(selectedSettlerService.isAvailableImmediately);
                        setAvailableDays(selectedSettlerService.availableDays);
                        setServiceStartTime(selectedSettlerService.serviceStartTime);
                        setServiceEndTime(selectedSettlerService.serviceEndTime);

                        setAddressId(selectedSettlerService.addressId);
                        setLatitude(selectedSettlerService.latitude);
                        setLongitude(selectedSettlerService.longitude);
                        setAddressName(selectedSettlerService.addressName);
                        setAddress(selectedSettlerService.address);
                        setAddressAdditionalDetails(selectedSettlerService.addressAdditionalDetails);
                        setPostcode(selectedSettlerService.postcode);

                        setQualifications(selectedSettlerService.qualifications);
                        setIsActive(selectedSettlerService.isActive);
                        setRatingCount(selectedSettlerService.ratingCount || 0);
                        setAverageRating(selectedSettlerService.averageRating || 0);
                        setCreatedAt(selectedSettlerService.createdAt);
                        setUpdatedAt(selectedSettlerService.updatedAt);
                    }
                } catch (error) {
                    console.error('Failed to fetch settler service details:', error);
                }
            };

            fetchSettlerService();
            setIndex(1);
        }
        bottomSheetRef.current?.snapToIndex(-1);
    }, [settlerService]);

    const userId = user?.uid;
    useEffect(() => {
        const getAddresses = async () => {
            if (userId) {
                const fetchedAddresses = await fetchUserAddresses(userId);
                setAddresses(fetchedAddresses);
                setLoading(false);
            }
        };

        if (userId) getAddresses();
    }, [userId]);

    const handlePress = useCallback(() => {
        bottomSheetRef.current?.snapToIndex(1);
    }, []);


    const selectImages = async () => {
        const options = {
            mediaType: 'photo' as const,
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
            selectionLimit: 5 - serviceCardImageUrls.length, // Limit the selection to the remaining slots
        };

        launchImageLibrary(options, async (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.errorMessage) {
                console.log('Image picker error: ', response.errorMessage);
            } else {
                const selectedImages = response.assets?.map(asset => asset.uri).filter(uri => uri !== undefined) as string[] || [];
                setServiceCardImageUrls((prevImages) => {
                    const updatedImages = [...prevImages, ...selectedImages];
                    setSelectedServiceCardImageUrls(updatedImages[0]);
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

        if (serviceCardImageUrls.length >= 5) {
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
                    setServiceCardImageUrls((prevImages) => {
                        const updatedImages = [...prevImages, newImageUri];
                        setSelectedServiceCardImageUrls(updatedImages[0]);
                        return updatedImages;
                    });
                }
            }
        });
    };

    // Function to delete the selected image
    const deleteImage = () => {
        if (!selectedServiceCardImageUrls) return;

        const updatedImages = serviceCardImageUrls.filter((img) => img !== selectedServiceCardImageUrls);
        setServiceCardImageUrls(updatedImages);
        setSelectedServiceCardImageUrls(updatedImages.length > 0 ? updatedImages[0] : null);
    };

    const pickFile = async () => {
        // try {
        //     const res = await DocumentPicker.pick({
        //         type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
        //     });
        //     if (res && res[0]) {
        //         setFileName(res[0].name);
        //     }
        // } catch (err) {
        //     if (DocumentPicker.isCancel(err)) {
        //         // User canceled the picker
        //     } else {
        //         console.error("File pick error:", err);
        //     }
        // }
    };

    const options: Option[] = [
        {
            id: 1,
            title: "General cleaning",
            description: "Includes sweeping, wiping surfaces, emptying trash bins, and maintaining overall cleanliness.",
            specialtyRequired: false
        },
        {
            id: 2,
            title: "Car washing",
            description: "Includes exterior wash, tire cleaning, interior vacuuming, and optional waxing services.",
            specialtyRequired: true
        },
        {
            id: 3,
            title: "Gutter cleaning",
            description: "Includes removal of leaves, dirt, and debris from gutters and downspouts to ensure proper drainage.",
            specialtyRequired: true
        },
        {
            id: 4,
            title: "Housekeeping",
            description: "Includes dusting, mopping, bathroom cleaning, vacuuming, and general tidying of living spaces.",
            specialtyRequired: false
        },
        {
            id: 5,
            title: "Pool cleaning",
            description: "Includes skimming debris, brushing walls, checking chemical balance, and cleaning pool filters.",
            specialtyRequired: true
        },
        {
            id: 6,
            title: "Window cleaning",
            description: "Includes interior and exterior glass cleaning, frame wiping, and streak-free finishing for all windows.",
            specialtyRequired: true
        },
    ]


    const categories = [
        { name: 'Cleaning', image: IMAGES.cleaning },
        { name: 'IT & Tech', image: IMAGES.electronics },
        { name: 'Home Maintenance', image: IMAGES.houseHoldMaintenance },
        { name: 'Wellness', image: IMAGES.healthcare },
        { name: 'Events & Celebrations', image: IMAGES.eventDecorations },
        { name: 'Delivery & Transport', image: IMAGES.delivery },
        { name: 'Extra Hands', image: IMAGES.helpingHands },
        { name: 'Others', image: IMAGES.otherItem },
    ];

    const screens = 10;

    const nextScreen = async () => {
        if (index === 3 && !selectedServiceCardImageUrls && isExperienced) {
            Alert.alert('Please select at least one image.');
            return;
        }
        if (index === 3 && !serviceCardBrief && isExperienced) {
            Alert.alert('Service brief required.');
            return
        }
        if (index === 7 && (!addressId)) {
            Alert.alert('Please provide service address.');
            return;
        }
        setIndex((prev) => (prev + 1) % screens);
    };

    const prevScreen = () =>
        setIndex((prev) => (prev - 1 + screens) % screens);

    const handleListing = async () => {

        try {
            if (user?.uid) {
                if (settlerService === null) {
                    await createSettlerService({
                        id: serviceId,

                        settlerId: settlerId,
                        settlerFirstName: settlerFirstName,
                        settlerLastName: settlerLastName,

                        serviceReferenceId: serviceReferenceId,
                        serviceReferenceCategory: serviceReferenceCategory,
                        serviceReferenceTitle: serviceReferenceTitle,
                        serviceReferenceDescription: serviceReferenceDescription,
                        isExperienced: isExperienced,
                        serviceCardImageUrls: serviceCardImageUrls,
                        serviceCardBrief: serviceCardBrief,
                        isAvailableImmediately: isAvailableImmediately,
                        availableDays: availableDays,
                        serviceStartTime: serviceStartTime,
                        serviceEndTime: serviceEndTime,

                        addressId: addressId,
                        latitude: latitude,
                        longitude: longitude,
                        addressName: addressName,
                        address: address,
                        addressAdditionalDetails: addressAdditionalDetails,
                        postcode: postcode,

                        qualifications: qualifications ?? [],
                        isActive: isActive,
                        ratingCount: ratingCount,
                        averageRating: averageRating,
                        createdAt: createdAt ?? new Date(),
                        updatedAt: updatedAt ?? new Date(),
                    });
                    Alert.alert('Listing created successfully.');
                } else {
                    await updateSettlerService(settlerService.id || 'undefined', {
                        id: serviceId,

                        settlerId: settlerId,
                        settlerFirstName: settlerFirstName,
                        settlerLastName: settlerLastName,

                        serviceReferenceId: serviceReferenceId,
                        serviceReferenceCategory: serviceReferenceCategory,
                        serviceReferenceTitle: serviceReferenceTitle,
                        serviceReferenceDescription: serviceReferenceDescription,
                        isExperienced: isExperienced,
                        serviceCardImageUrls: serviceCardImageUrls,
                        serviceCardBrief: serviceCardBrief,
                        isAvailableImmediately: isAvailableImmediately,
                        availableDays: availableDays,
                        serviceStartTime: serviceStartTime,
                        serviceEndTime: serviceEndTime,

                        addressId: addressId,
                        latitude: latitude,
                        longitude: longitude,
                        addressName: addressName,
                        address: address,
                        addressAdditionalDetails: addressAdditionalDetails,
                        postcode: postcode,

                        qualifications: qualifications ?? [],
                        isActive: isActive,
                        ratingCount: ratingCount,
                        averageRating: averageRating,
                        createdAt: createdAt ?? new Date(),
                        updatedAt: updatedAt ?? new Date(),
                    });
                    Alert.alert('Settler service updated successfully.');
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
        <KeyboardAwareScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            enableOnAndroid={true}
            extraScrollHeight={40}
        >
            <View style={{ flex: 1 }}>
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
                                            'Add New Service',
                                            'Service Category',
                                            `${serviceReferenceCategory} Service`,
                                            `${serviceReferenceTitle}`,
                                            'Service Availability',
                                            'Service Location',
                                            'Special Qualifications',
                                            'Publish Listing',
                                        ][index] || ''}
                                    </Text>
                                    <Text>{index}</Text>
                                </View>
                                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                    <TouchableOpacity
                                        onPress={handlePress}
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
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 70, alignItems: 'flex-start' }}>
                        {index === 0 &&
                            <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black, paddingTop: 30, paddingBottom: 50 }}>
                                    Start Offering Your Services
                                </Text>

                                {/* Step 1 */}
                                <View style={{ flexDirection: 'row', width: '100%', paddingBottom: 20 }}>
                                    <View style={{ width: '10%', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>1.</Text>
                                    </View>
                                    <View style={{ width: '90%', flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <View style={{ width: '70%' }}>
                                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>Describe your service</Text>
                                            <Text style={{ fontSize: 14, color: COLORS.blackLight }}>
                                                Share key details like the service name, expertise, and location where you can provide it.
                                            </Text>
                                        </View>
                                        <View style={{ width: '30%', alignItems: 'center' }}>
                                            <Image source={IMAGES.itemPlaceholder1} style={{ width: '100%', height: 100, resizeMode: 'contain' }} />
                                        </View>
                                    </View>
                                </View>

                                {/* Step 2 */}
                                <View style={{ flexDirection: 'row', width: '100%', paddingBottom: 20 }}>
                                    <View style={{ width: '10%', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>2.</Text>
                                    </View>
                                    <View style={{ width: '90%', flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <View style={{ width: '70%' }}>
                                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>Show your work</Text>
                                            <Text style={{ fontSize: 14, color: COLORS.blackLight }}>
                                                Add photos or examples of your work plus a description of your skills and experience.
                                            </Text>
                                        </View>
                                        <View style={{ width: '30%', alignItems: 'center' }}>
                                            <Image source={IMAGES.itemPlaceholder2} style={{ width: '100%', height: 100, resizeMode: 'contain' }} />
                                        </View>
                                    </View>
                                </View>

                                {/* Step 3 */}
                                <View style={{ flexDirection: 'row', width: '100%', paddingBottom: 20 }}>
                                    <View style={{ width: '10%', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>3.</Text>
                                    </View>
                                    <View style={{ width: '90%', flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <View style={{ width: '70%' }}>
                                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>Set your rate & go live!</Text>
                                            <Text style={{ fontSize: 14, color: COLORS.blackLight }}>
                                                Choose your pricing, confirm a few details, and start getting bookings from clients.
                                            </Text>
                                        </View>
                                        <View style={{ width: '30%', alignItems: 'center' }}>
                                            <Image source={IMAGES.itemPlaceholder3} style={{ width: '100%', height: 100, resizeMode: 'contain' }} />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        }
                        {index === 1 &&
                            <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15, flexDirection: 'row', flexWrap: 'wrap' }]}>
                                {categories.map((categoryData, index) => (
                                    <TouchableOpacity
                                        key={index} style={{ width: '50%', padding: 10 }}
                                        onPress={() => {
                                            setServiceReferenceCategory(categoryData.name)
                                            nextScreen()
                                        }}
                                    >
                                        <View style={{
                                            height: 150,
                                            borderColor: serviceReferenceCategory.includes(categoryData.name) ? COLORS.primary : COLORS.blackLight,
                                            borderWidth: 1,
                                            borderRadius: 10,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            padding: 10,
                                            backgroundColor: serviceReferenceCategory.includes(categoryData.name) ? COLORS.primaryLight : COLORS.background
                                        }}>
                                            <Image source={categoryData.image} style={{ width: '100%', height: 70, resizeMode: 'contain' }} />
                                            <Text style={{ fontSize: 14, color: COLORS.blackLight, textAlign: 'center', marginTop: 10 }}>{categoryData.name}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        }
                        {index === 2 &&
                            <View style={[GlobalStyleSheet.container, { paddingHorizontal: 25, paddingBottom: 100 }]}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 30, paddingBottom: 10 }}>Select tasks that you can offer</Text>
                                {options.map((option) => (
                                    <TouchableOpacity
                                        key={option.id}
                                        style={{ flexDirection: "row", alignItems: "center", marginVertical: 10, }}
                                        onPress={() => {
                                            setServiceReferenceTitle(option.title)
                                            setServiceReferenceDescription(option.description)
                                            nextScreen()
                                        }}
                                    >
                                        <View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <Text style={{ fontSize: 16 }}>{option.title}</Text>
                                                <Ionicons name={option.specialtyRequired ? 'briefcase' : ''} size={16} />
                                            </View>
                                            <Text style={{ fontSize: 12, color: COLORS.blackLight }}>{option.description}</Text>
                                        </View>
                                        <Ionicons name={'chevron-forward'} size={24} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        }
                        {index === 3 &&
                            <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 20, paddingBottom: 20 }}>Have you done any {serviceReferenceTitle.toLowerCase()} job before?</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 20, gap: 10 }}>
                                    <TouchableOpacity
                                        style={{
                                            padding: 15,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '45%',
                                            borderRadius: 10,
                                            borderWidth: 1,
                                            borderColor: isExperienced ? COLORS.primary : COLORS.black,
                                            backgroundColor: isExperienced ? COLORS.primaryLight : COLORS.background,
                                        }}
                                        onPress={() => setIsExperienced(true)}
                                    >
                                        <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: 'bold' }}>Yes</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{
                                            padding: 15,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '45%',
                                            borderRadius: 10,
                                            borderWidth: 1,
                                            borderColor: !isExperienced ? COLORS.primary : COLORS.black,
                                            backgroundColor: !isExperienced ? COLORS.primaryLight : COLORS.background,
                                        }}
                                        onPress={() => setIsExperienced(false)}
                                    >
                                        <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: 'bold' }}>No</Text>
                                    </TouchableOpacity>
                                </View>
                                {isExperienced === true &&
                                    <View>
                                        <View style={GlobalStyleSheet.line} />
                                        <Text style={{ fontSize: 18, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Let's build your service card</Text>
                                        <Text style={{ fontSize: 15, color: COLORS.title, marginBottom: 15 }}>Provide details that help customers trust you and increase your chances of being selected. This card will appear to customer when you accept the task.</Text>
                                        <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                                            {/* Large Preview Image */}
                                            {selectedServiceCardImageUrls ? (
                                                <View style={{ flex: 1, width: '100%', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                                                    <Image
                                                        source={{ uri: selectedServiceCardImageUrls }}
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
                                                        {serviceCardImageUrls.map((imageUri, index) => (
                                                            <TouchableOpacity key={index} onPress={() => setSelectedServiceCardImageUrls(imageUri)}>
                                                                <Image
                                                                    source={{ uri: imageUri }}
                                                                    style={{
                                                                        width: 80,
                                                                        height: 80,
                                                                        marginRight: 10,
                                                                        borderRadius: 10,
                                                                        borderWidth: selectedServiceCardImageUrls === imageUri ? 3 : 0,
                                                                        borderColor: selectedServiceCardImageUrls === imageUri ? '#007bff' : 'transparent',
                                                                    }}
                                                                />
                                                            </TouchableOpacity>
                                                        ))}
                                                    </ScrollView>
                                                </View>
                                            ) : (
                                                <View
                                                    style={{
                                                        width: '100%',
                                                        height: 300,
                                                        borderRadius: 10,
                                                        marginBottom: 10,
                                                        backgroundColor: COLORS.card,
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Text style={{ color: COLORS.blackLight }}>No image selected</Text>
                                                </View>
                                            )}
                                            <View style={{ width: '100%', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
                                                <TouchableOpacity
                                                    style={{
                                                        padding: 15,
                                                        width: '100%',
                                                        borderRadius: 10,
                                                        borderWidth: 1,
                                                        borderColor: COLORS.black,
                                                    }}
                                                    onPress={() => selectImages()}
                                                >
                                                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                                                        <Ionicons name="image-outline" size={24} color={COLORS.black} style={{ marginRight: 10 }} />
                                                        <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: 'bold' }}>Add photos</Text>
                                                    </View>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={{
                                                        padding: 15,
                                                        width: '100%',
                                                        borderRadius: 10,
                                                        borderWidth: 1,
                                                        borderColor: COLORS.black,
                                                    }}
                                                    onPress={() => cameraImage()}
                                                >
                                                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                                                        <Ionicons name="image-outline" size={24} color={COLORS.black} style={{ marginRight: 10 }} />
                                                        <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: 'bold' }}>Use Camera</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <View style={{ width: '100%', paddingTop: 20 }}>
                                            <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Short brief about your service</Text>
                                            <Input
                                                onFocus={() => setisFocused2(true)}
                                                onBlur={() => setisFocused2(false)}
                                                isFocused={isFocused2}
                                                value={serviceCardBrief}
                                                onChangeText={setServiceCardBrief}
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
                                                placeholder='e.g. Hi, I am a professional cleaner with 5 years of experience. Nice to meet you! Here are some of my previous works for consideration.'
                                                multiline={true}
                                                numberOfLines={4}
                                            />
                                        </View>
                                    </View>
                                }
                                {isExperienced === false &&
                                    <View>
                                        <View style={GlobalStyleSheet.line} />
                                        <Text style={{ fontSize: 15, color: COLORS.title, marginTop: 15, marginBottom: 5 }}>No worries. Any job completion in this {serviceReferenceTitle.toLocaleLowerCase()} task will be updated in your profile.</Text>
                                    </View>
                                }
                            </View>
                        }
                        {index === 4 &&
                            <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black, paddingTop: 30 }}>Are you available for immediate job?</Text>
                                <Text style={{ fontSize: 14, color: COLORS.black, paddingTop: 10, paddingBottom: 20 }}>This means that you can receive broadcast & accept jobs outside your preferred availability.</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 20, gap: 10 }}>
                                    <TouchableOpacity
                                        style={{
                                            padding: 15,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '45%',
                                            borderRadius: 10,
                                            borderWidth: 1,
                                            borderColor: isAvailableImmediately ? COLORS.primary : COLORS.black,
                                            backgroundColor: isAvailableImmediately ? COLORS.primaryLight : COLORS.background,
                                        }}
                                        onPress={() => setIsAvailableImmediately(true)}
                                    >
                                        <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: 'bold' }}>Yes</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{
                                            padding: 15,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '45%',
                                            borderRadius: 10,
                                            borderWidth: 1,
                                            borderColor: !isAvailableImmediately ? COLORS.primary : COLORS.black,
                                            backgroundColor: !isAvailableImmediately ? COLORS.primaryLight : COLORS.background,
                                        }}
                                        onPress={() => setIsAvailableImmediately(false)} // Set to free if "No" is selected
                                    >
                                        <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: 'bold' }}>No</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={GlobalStyleSheet.line} />
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.black, paddingTop: 20, paddingBottom: 5 }}>Set your weekly availability</Text>
                                <Text style={{ fontSize: 14, color: COLORS.black, paddingBottom: 20 }}>This section is for advanced service booking.</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 20, gap: 10 }}>
                                    <TouchableOpacity
                                        style={{
                                            padding: 15,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '45%',
                                            borderRadius: 10,
                                            borderWidth: 1,
                                            borderColor: availableDays.length === 7 ? COLORS.primary : COLORS.black,
                                            backgroundColor: availableDays.length === 7 ? COLORS.primaryLight : COLORS.background,
                                        }}
                                        onPress={() => setAvailableDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])}
                                    >
                                        <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: 'bold' }}>Yes</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{
                                            padding: 15,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '45%',
                                            borderRadius: 10,
                                            borderWidth: 1,
                                            borderColor: availableDays.length < 7 ? COLORS.primary : COLORS.black,
                                            backgroundColor: availableDays.length < 7 ? COLORS.primaryLight : COLORS.background,
                                        }}
                                        onPress={() => setAvailableDays([])}
                                    >
                                        <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: 'bold' }}>No</Text>
                                    </TouchableOpacity>
                                </View>

                                {availableDays.length < 7 && (
                                    <View>
                                        <Text style={{ fontSize: 14, color: COLORS.black, paddingTop: 5, paddingBottom: 20 }}>Select your preferred days throughout the week for advanced booking job.</Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 20, gap: 10 }}>
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    style={{
                                                        borderRadius: 10,
                                                        backgroundColor: availableDays.includes(day) ? COLORS.primary : COLORS.input,
                                                        padding: 10,
                                                        alignItems: 'center',
                                                        width: '30%',
                                                        marginBottom: 10
                                                    }}
                                                    onPress={() => toggleDaySelection(day)}
                                                >
                                                    <Text style={{ fontSize: 14, color: COLORS.title }}>{day}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.black, paddingTop: 20, paddingBottom: 10 }}>Set your preferred time</Text>
                                <View style={{ flexDirection: 'row', width: SIZES.width * 0.9, paddingBottom: 20, flexWrap: 'wrap' }}>
                                    <Text style={{ fontSize: 12, color: COLORS.title, marginTop: 15, marginBottom: 5, paddingRight: 5 }}>
                                        Accepting service from
                                    </Text>
                                    <View style={{ alignItems: 'center', flex: 1 }}>
                                        <Input
                                            onFocus={() => setisFocused4(true)}
                                            onBlur={() => setisFocused4(false)}
                                            isFocused={isFocused4}
                                            onChangeText={setServiceStartTime}
                                            backround={COLORS.card}
                                            style={{ width: 90, borderRadius: 10, backgroundColor: COLORS.input, fontSize: 12 }}
                                            inputicon
                                            placeholder='09:00'
                                            value={serviceStartTime}
                                            keyboardType={'numeric'}
                                        />
                                    </View>
                                    <Text style={{ fontSize: 12, color: COLORS.title, marginTop: 15, marginBottom: 5, paddingLeft: 5, paddingRight: 5 }}>to</Text>
                                    <View style={{ alignItems: 'center', flex: 1 }}>
                                        <Input
                                            onFocus={() => setisFocused5(true)}
                                            onBlur={() => setisFocused5(false)}
                                            isFocused={isFocused5}
                                            onChangeText={setServiceEndTime}
                                            backround={COLORS.card}
                                            style={{ width: 90, borderRadius: 10, backgroundColor: COLORS.input, fontSize: 12 }}
                                            inputicon
                                            placeholder='09:00'
                                            value={serviceEndTime}
                                            keyboardType={'numeric'}
                                        />
                                    </View>
                                    <Text style={{ fontSize: 12, color: COLORS.title, marginTop: 15, marginBottom: 5, paddingLeft: 5, paddingRight: 5 }}>.</Text>
                                </View>
                            </View>
                        }
                        {index === 5 &&
                            <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 30, paddingBottom: 10 }}>Define your service location.</Text>
                                <Text style={{ fontSize: 14, color: COLORS.black, paddingTop: 10, paddingBottom: 30 }}>This location will be used to provide location-based broadcasting for jobs.</Text>
                                <View style={{ marginBottom: 15 }}>
                                    {
                                        addresses.map((item) => (
                                            <TouchableOpacity
                                                key={item.id}
                                                activeOpacity={0.8}
                                                style={{
                                                    marginVertical: 5,
                                                    backgroundColor: addressId === item.id ? COLORS.primaryLight : COLORS.card,
                                                    borderRadius: 10,
                                                    padding: 5,
                                                    borderWidth: 1,
                                                    borderColor: addressId === item.id ? COLORS.primary : COLORS.blackLight,
                                                }}
                                                onPress={() => {
                                                    console.log(item);
                                                    setAddressId(item.id ?? '');
                                                    setLatitude(item.latitude);
                                                    setLongitude(item.longitude);
                                                    setAddressName(item.addressName);
                                                    setAddress(item.address);
                                                    setAddressAdditionalDetails(item.additionalDetails);
                                                    setPostcode(item.postcode);
                                                }}>
                                                <View style={[GlobalStyleSheet.flexcenter, { width: '100%', gap: 20, justifyContent: 'space-between', alignItems: 'flex-start' }]}></View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, width: SIZES.width * 0.8 }}>
                                                    <Ionicons name="location" size={24} color={COLORS.title} />
                                                    <View style={{ width: SIZES.width * 0.7 }}>
                                                        <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold' }}>{item.addressName}</Text>
                                                        <Text style={{ fontSize: 14, color: COLORS.title }}>{item.address}</Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        activeOpacity={0.8}
                                                        onPress={() => { }}>
                                                        <Ionicons name="pencil" size={20} color={COLORS.title} />
                                                    </TouchableOpacity>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                </View>
                                <View style={{ marginBottom: 15 }}>
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => { }}>
                                        <View style={[GlobalStyleSheet.flexcenter, { width: '100%', gap: 20, justifyContent: 'space-between', marginBottom: 15, alignItems: 'flex-start' }]} >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, width: SIZES.width * 0.8 }}>
                                                <Ionicons name="add" size={26} color={COLORS.title} />
                                                <View>
                                                    <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold' }}>Add a new address</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        }
                        {index === 6 &&
                            <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 30, paddingBottom: 10 }}>Define your service location.</Text>
                                <Text style={{ fontSize: 14, color: COLORS.black, paddingTop: 10, paddingBottom: 30 }}>This location will be used to provide location-based broadcasting for jobs.</Text>
                                <View style={{ marginBottom: 15 }}>
                                    {
                                        addresses.map((item) => (
                                            <TouchableOpacity
                                                key={item.id}
                                                activeOpacity={0.8}
                                                style={{
                                                    marginVertical: 5,
                                                    backgroundColor: addressId === item.id ? COLORS.primaryLight : COLORS.card,
                                                    borderRadius: 10,
                                                    padding: 5,
                                                    borderWidth: 1,
                                                    borderColor: addressId === item.id ? COLORS.primary : COLORS.blackLight,
                                                }}
                                                onPress={() => {
                                                    console.log(item);
                                                    setAddressId(item.id ?? '');
                                                    setLatitude(item.latitude);
                                                    setLongitude(item.longitude);
                                                    setAddressName(item.addressName);
                                                    setAddress(item.address);
                                                    setAddressAdditionalDetails(item.additionalDetails);
                                                    setPostcode(item.postcode);
                                                }}>
                                                <View style={[GlobalStyleSheet.flexcenter, { width: '100%', gap: 20, justifyContent: 'space-between', alignItems: 'flex-start' }]}></View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, width: SIZES.width * 0.8 }}>
                                                    <Ionicons name="location" size={24} color={COLORS.title} />
                                                    <View style={{ width: SIZES.width * 0.7 }}>
                                                        <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold' }}>{item.addressName}</Text>
                                                        <Text style={{ fontSize: 14, color: COLORS.title }}>{item.address}</Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        activeOpacity={0.8}
                                                        onPress={() => { }}>
                                                        <Ionicons name="pencil" size={20} color={COLORS.title} />
                                                    </TouchableOpacity>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                </View>
                                <View style={{ marginBottom: 15 }}>
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => { }}>
                                        <View style={[GlobalStyleSheet.flexcenter, { width: '100%', gap: 20, justifyContent: 'space-between', marginBottom: 15, alignItems: 'flex-start' }]} >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, width: SIZES.width * 0.8 }}>
                                                <Ionicons name="add" size={26} color={COLORS.title} />
                                                <View>
                                                    <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold' }}>Add a new address</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        }
                        {
                            index === 7 &&
                            <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 30, paddingBottom: 10 }}>Ready to publish? </Text>
                                <Text style={{ fontSize: 16, color: COLORS.black, paddingTop: 10, paddingBottom: 50 }}>You can complete the listing without a need to publish it and will be not visible to other users. Set the listing to active whenever you ready. Otherwise, let's publish it now. </Text>
                                <View style={{ flexDirection: 'row', width: '100%', paddingBottom: 20 }}>
                                    <View style={{ width: '95%', flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                                        <View style={{ width: '50%', justifyContent: 'center', alignItems: 'center' }}>
                                            <TouchableOpacity
                                                style={{
                                                    padding: 15,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: 150,
                                                    borderRadius: 10,
                                                    borderWidth: 1,
                                                    borderColor: isActive ? COLORS.primary : COLORS.black,
                                                    backgroundColor: isActive ? COLORS.primaryLight : COLORS.background,
                                                }}
                                                onPress={() => setIsActive(true)}
                                            >
                                                <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: 'bold' }}>Yes</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={{ width: '50%', justifyContent: 'center', alignItems: 'center' }}>
                                            <TouchableOpacity
                                                style={{
                                                    padding: 15,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: 150,
                                                    borderRadius: 10,
                                                    borderWidth: 1,
                                                    borderColor: !isActive ? COLORS.primary : COLORS.black,
                                                    backgroundColor: !isActive ? COLORS.primaryLight : COLORS.background,
                                                }}
                                                onPress={() => { setIsActive(false) }}
                                            >
                                                <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: 'bold' }}>No</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        }
                    </ScrollView >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1, gap: 5 }}>
                        <View style={{ flex: 1, backgroundColor: index > 2 ? COLORS.primary : COLORS.placeholder, height: 5 }} />
                        <View style={{ flex: 1, backgroundColor: index > 5 ? COLORS.primary : COLORS.placeholder, height: 5 }} />
                        <View style={{ flex: 1, backgroundColor: index > 8 ? COLORS.primary : COLORS.placeholder, height: 5 }} />
                    </View>
                    {
                        index === 0 &&
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
                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Start</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    {
                        index === 1 || index === 2 &&
                        <View />
                    }
                    {index === 7 &&
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
                                    handleListing()
                                    Alert.alert('Listing Completed');
                                    navigation.goBack();
                                }}
                            >
                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    {(index >= 3 && index < 7) &&
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
                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{[
                                    'Start',
                                    'Add Service Details',
                                    'Select Category',
                                    'Set Availability',
                                    'Set Service Location',
                                    'Add Qualification',
                                    'Ready to Publish',
                                ][index] || ''}</Text>
                            </TouchableOpacity>
                        </View>
                    }
                </View >
                {/* <BottomSheet
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
                        <Text style={{ textAlign: 'center', fontSize: 14, paddingVertical: 10 }}>Save this listing as draft?</Text>
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
                                handleListing();
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
                            <Text style={{ fontSize: 16 }}>Discard</Text>
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
                            <Text style={{ fontSize: 16 }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </BottomSheetScrollView>
            </BottomSheet> */}
            </View >
        </KeyboardAwareScrollView>
    )
}

export default SettlerAddService