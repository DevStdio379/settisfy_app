import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, ActivityIndicator, Button, Alert, FlatList } from 'react-native'
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

type AddListingScreenProps = StackScreenProps<RootStackParamList, 'AddListing'>;

const AddListing = ({ navigation, route }: AddListingScreenProps) => {

    const { user } = useUser();
    const [listing] = useState(route.params.listing);
    const [index, setIndex] = useState(listing === null ? 0 : 1);

    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [isFocused1, setisFocused1] = useState(false);
    const [isFocused2, setisFocused2] = useState(false);
    const [isFocused3, setisFocused3] = useState(false);
    const [isFocused4, setisFocused4] = useState(false);
    const [isFocused5, setisFocused5] = useState(false);
    const [isFocused6, setisFocused6] = useState(false);
    const [collectionTime, setCollectionTime] = useState<string>('');
    const [isFocused9, setisFocused9] = useState(false);
    const [isFocused10, setisFocused10] = useState(false);
    const [searchAddress, setSearchAddress] = useState<string>('');
    const [isFocused11, setisFocused11] = useState(false);
    const [isFocused12, setisFocused12] = useState(false);

    const [addressID, setAddressID] = useState<string>('');
    const [latitude, setLatitude] = useState<number>(0);
    const [longitude, setLongitude] = useState<number>(0);
    const [addressName, setAddressName] = useState<string>('');
    const [address, setAddress] = useState<string>('');
    const [addressAdditionalDetails, setAddressAdditionalDetails] = useState<string>('');
    const [postcode, setPostcode] = useState<string>('');


    const [isFocused7, setisFocused7] = useState(false);
    const [isFocused8, setisFocused8] = useState(false);
    const [pickupInstructions, setPickupInstructions] = useState<string>('');
    const [returnInstructions, setReturnInstructions] = useState<string>('');
    const [returnTime, setReturnTime] = useState<string>('');
    const [borrowingNotes, setBorrowingNotes] = useState<string>('');

    const mapRef = useRef<MapView | null>(null);
    const bottomSheetRef = useRef<BottomSheet>(null);

    const [availableDays, setAvailableDays] = useState<string[]>([]);
    const [lendingRate, setLendingRate] = useState<number>(0);
    const [isCollectDeposit, setIsCollectDeposit] = useState<boolean>(false);
    const [isActive, setIsActive] = useState<boolean>(false);
    const [category, setCategory] = useState<string[]>([]);
    const [depositAmount, setDepositAmount] = useState<number>(0);
    const [depositReleaseThreshold, setDepositReleaseThreshold] = useState<string>('');
    const [buildingType, setBuildingType] = useState('Select a building type');
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [images, setImages] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [includedItems, setIncludedItems] = useState<string[]>([]);
    const [newItem, setNewItem] = useState<string>('');

    const snapPoints = useMemo(() => ['1%', '35%'], []);

    const toggleDaySelection = (day: string) => {
        setAvailableDays((prevSelectedDays) =>
            prevSelectedDays.includes(day)
                ? prevSelectedDays.filter((d) => d !== day)
                : [...prevSelectedDays, day]
        );
    };

    useEffect(() => {
        if (listing !== null) {
            const fetchListing = async () => {
                try {
                    const selectedProduct = await fetchSelectedProduct(listing.id || 'undefined');
                    if (selectedProduct) {
                        // Set the state with the fetched listing details
                        setImages(selectedProduct.imageUrls);
                        setSelectedImage(selectedProduct.imageUrls[0]);
                        setTitle(selectedProduct.title);
                        setDescription(selectedProduct.description);
                        setCategory([selectedProduct.category]);
                        setLendingRate(selectedProduct.lendingRate);
                        setCollectionTime(selectedProduct.collectionTime);
                        setReturnTime(selectedProduct.returnTime);
                        setAvailableDays(selectedProduct.availableDays);
                        setBorrowingNotes(selectedProduct.borrowingNotes);
                        setPickupInstructions(selectedProduct.pickupInstructions);
                        setReturnInstructions(selectedProduct.returnInstructions);
                        setAddressID(selectedProduct.addressID);
                        setLatitude(selectedProduct.latitude);
                        setLongitude(selectedProduct.longitude);
                        setAddressName(selectedProduct.addressName);
                        setAddress(selectedProduct.address);
                        setAddressAdditionalDetails(selectedProduct.addressAdditionalDetails);
                        setPostcode(selectedProduct.postcode);
                        setIsCollectDeposit(selectedProduct.isCollectDeposit);
                        setDepositAmount(selectedProduct.depositAmount);
                        setIsActive(selectedProduct.isActive);
                    }
                } catch (error) {
                    console.error('Failed to fetch listing details:', error);
                }
            };

            fetchListing();
            setIndex(1);
        }
        bottomSheetRef.current?.snapToIndex(-1);
    }, [listing]);

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
            selectionLimit: 5 - images.length, // Limit the selection to the remaining slots
        };

        launchImageLibrary(options, async (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.errorMessage) {
                console.log('Image picker error: ', response.errorMessage);
            } else {
                const selectedImages = response.assets?.map(asset => asset.uri).filter(uri => uri !== undefined) as string[] || [];
                setImages((prevImages) => {
                    const updatedImages = [...prevImages, ...selectedImages];
                    setSelectedImage(updatedImages[0]);
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

        if (images.length >= 5) {
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
                    setImages((prevImages) => {
                        const updatedImages = [...prevImages, newImageUri];
                        setSelectedImage(updatedImages[0]);
                        return updatedImages;
                    });
                }
            }
        });
    };

    // Function to delete the selected image
    const deleteImage = () => {
        if (!selectedImage) return;

        const updatedImages = images.filter((img) => img !== selectedImage);
        setImages(updatedImages);
        setSelectedImage(updatedImages.length > 0 ? updatedImages[0] : null);
    };
    const categories = [
        { name: 'Electronic Gadgets', image: IMAGES.electronics },
        { name: 'DIY & Hand Tools', image: IMAGES.handTools },
        { name: 'Household Maintenance', image: IMAGES.houseHoldMaintenance },
        { name: 'Sport Equipments', image: IMAGES.sportEquipments },
        { name: 'Party & Celebrations', image: IMAGES.eventDecorations },
        { name: 'Cooking', image: IMAGES.cookingEquipments },
        { name: 'Outdoors', image: IMAGES.outdoorEquipments },
        { name: 'Others', image: IMAGES.otherItem },
    ];

    const screens = 10;

    const nextScreen = async () => {
        if (index === 1 && !selectedImage) {
            Alert.alert('Please select at least one image.');
            return;
        }
        if (index === 2 && (!title || !description)) {
            Alert.alert('Please provide both title and description.');
            return;
        }
        if (index === 3 && category.length === 0) {
            Alert.alert('Please select at least one category.');
            return;
        }
        if (index === 4 && (!lendingRate || !collectionTime || !returnTime || !availableDays)) {
            Alert.alert('Please fill in all the fields.');
            return;
        }
        if (index === 5 && (!borrowingNotes)) {
            Alert.alert('Please fill in all the fields.');
            return;
        }
        if (index === 6 && (!pickupInstructions || !returnInstructions)) {
            Alert.alert('Please provide both pickup and return instructions.');
            return;
        }
        if (index === 7 && (!addressID)) {
            Alert.alert('Please provide both search and pickup addresses.');
            return;
        }
        if (index === 8 && isCollectDeposit && !depositAmount) {
            Alert.alert('Please provide deposit amount');
            return;
        }
        if (index === 9 && (!depositAmount || !depositReleaseThreshold)) {
            Alert.alert('Please provide both deposit amount and release threshold.');
            return;
        }
        setIndex((prev) => (prev + 1) % screens);
    };

    const prevScreen = () =>
        setIndex((prev) => (prev - 1 + screens) % screens);

    const handleListing = async () => {

        try {
            if (user?.uid) {
                if (listing === null) {
                    await createProduct({
                        ownerID: user.uid,
                        imageUrls: images ? images : [''],
                        title: title || '',
                        description: description || '',
                        includedItems: includedItems ? includedItems : [''],
                        category: category[0] || '',
                        lendingRate: lendingRate || 0,
                        collectionTime: collectionTime || '',
                        returnTime: returnTime || '',
                        availableDays: availableDays ? availableDays : [''],
                        borrowingNotes: borrowingNotes || '',
                        pickupInstructions: pickupInstructions || '',
                        returnInstructions: returnInstructions || '',
                        addressID: addressID || '',
                        latitude: latitude || 0,
                        longitude: longitude || 0,
                        addressName: addressName || '',
                        address: address || '',
                        addressAdditionalDetails: addressAdditionalDetails || '',
                        postcode: postcode || '',
                        isCollectDeposit: isCollectDeposit || false,
                        depositAmount: depositAmount || 0,
                        isActive: isActive || false,
                        updatedAt: new Date(),
                        createAt: new Date(),
                    });
                    Alert.alert('Listing created successfully.');
                } else {
                    await updateProduct(listing.id || 'undefined', {
                        ownerID: user.uid,
                        imageUrls: images ? images : [''],
                        title: title || '',
                        description: description || '',
                        includedItems: includedItems ? includedItems : [''],
                        category: category[0] || '',
                        lendingRate: lendingRate || 0,
                        collectionTime: collectionTime || '',
                        returnTime: returnTime || '',
                        availableDays: availableDays ? availableDays : [''],
                        borrowingNotes: borrowingNotes || '',
                        pickupInstructions: pickupInstructions || '',
                        returnInstructions: returnInstructions || '',
                        addressID: addressID || '',
                        latitude: latitude || 0,
                        longitude: longitude || 0,
                        addressName: addressName || '',
                        address: address || '',
                        addressAdditionalDetails: addressAdditionalDetails || '',
                        postcode: postcode || '',
                        isCollectDeposit: isCollectDeposit || false,
                        depositAmount: depositAmount || 0,
                        isActive: isActive || false,
                        updatedAt: new Date(),
                    });
                    Alert.alert('Listing updated successfully.');
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
                                        'Add New Listing',
                                        'Select Photos',
                                        'Add Item Details',
                                        'Select Category',
                                        'Set Borrowing Rate',
                                        'Add Borrowing Conditions',
                                        'Add Pickup & Return Instructions',
                                        'Select Pickup Address',
                                        'Add Deposit Details',
                                        'Publish Listing',
                                    ][index] || ''}
                                </Text>
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
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black, paddingTop: 30, paddingBottom: 50 }}>Let's Share Your Idle Items</Text>
                            <View style={{ flexDirection: 'row', width: '100%', paddingBottom: 20 }}>
                                <View style={{ width: '10%', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>1.</Text>
                                </View>
                                <View style={{ width: '90%', flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View style={{ width: '70%' }}>
                                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>Tell us about your item </Text>
                                        <Text style={{ fontSize: 14, color: COLORS.blackLight }}>Share some info of your item such as the name, brand and your location for item pick up.</Text>
                                    </View>
                                    <View style={{ width: '30%', alignItems: 'center' }}>
                                        <Image source={IMAGES.itemPlaceholder1} style={{ width: '100%', height: 100, resizeMode: 'contain' }} />
                                    </View>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', width: '100%', paddingBottom: 20 }}>
                                <View style={{ width: '10%', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>2.</Text>
                                </View>
                                <View style={{ width: '90%', flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View style={{ width: '70%' }}>
                                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>Upload photos of your item </Text>
                                        <Text style={{ fontSize: 14, color: COLORS.blackLight }}>Add 5 or more photos plus a description of your item (condition, how to use, etc.)</Text>
                                    </View>
                                    <View style={{ width: '30%', alignItems: 'center' }}>
                                        <Image source={IMAGES.itemPlaceholder2} style={{ width: '100%', height: 100, resizeMode: 'contain' }} />
                                    </View>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', width: '100%', paddingBottom: 20 }}>
                                <View style={{ width: '10%', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>3.</Text>
                                </View>
                                <View style={{ width: '90%', flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View style={{ width: '70%' }}>
                                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black }}>Set a price and ready to publish!</Text>
                                        <Text style={{ fontSize: 14, color: COLORS.blackLight }}>Put a price to your item, verify a few details and your item is ready to be listed!</Text>
                                    </View>
                                    <View style={{ width: '30%', alignItems: 'center' }}>
                                        <Image source={IMAGES.itemPlaceholder3} style={{ width: '100%', height: 100, resizeMode: 'contain' }} />
                                    </View>
                                </View>
                            </View>
                        </View>
                    }
                    {index === 1 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 30, paddingBottom: 20 }}>Provide photos of your lendable item</Text>
                            <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                                {/* Large Preview Image */}
                                {selectedImage ? (
                                    <View style={{ flex: 1, width: '100%', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                                        <Image
                                            source={{ uri: selectedImage }}
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
                                            {images.map((imageUri, index) => (
                                                <TouchableOpacity key={index} onPress={() => setSelectedImage(imageUri)}>
                                                    <Image
                                                        source={{ uri: imageUri }}
                                                        style={{
                                                            width: 80,
                                                            height: 80,
                                                            marginRight: 10,
                                                            borderRadius: 10,
                                                            borderWidth: selectedImage === imageUri ? 3 : 0,
                                                            borderColor: selectedImage === imageUri ? '#007bff' : 'transparent',
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
                        </View>
                    }
                    {index === 2 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15, paddingBottom: 100 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 30, paddingBottom: 10 }}>Provide photos of your lendable item</Text>
                            {/* <Text style={{ fontSize: 16, color: COLORS.black, paddingTop: 10, paddingBottom: 10 }}>Try our AI assisted data entries to fill those entries for you or manually enter yours.</Text> */}
                            {/* <View style={{ width: '100%', justifyContent: 'flex-end', alignItems: 'flex-end', paddingBottom: 10 }}>
                                <TouchableOpacity
                                    style={{
                                        padding: 10,
                                        width: 140,
                                        borderRadius: 10,
                                        backgroundColor: COLORS.primaryLight,
                                    }}
                                    onPress={() => { }}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                                        <Ionicons name="flash" size={24} color={COLORS.black} style={{ marginRight: 10 }} />
                                        <Text style={{ color: COLORS.black, fontSize: 14, fontWeight: 'bold' }}>AI Autofill</Text>
                                    </View>
                                </TouchableOpacity>
                            </View> */}
                            <View style={{ width: "100%", justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                                {selectedImage ? (
                                    <Image
                                        source={{ uri: selectedImage }}
                                        style={{
                                            width: '100%',
                                            height: SIZES.height * 0.3,
                                            borderRadius: 10,
                                            marginBottom: 10,
                                        }}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <TouchableOpacity
                                        style={{
                                            width: '100%',
                                            height: SIZES.height * 0.3,
                                            borderRadius: 10,
                                            backgroundColor: COLORS.card,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                        onPress={prevScreen}
                                    >
                                        <Ionicons name="image-outline" size={50} color={COLORS.black} style={{ marginRight: 10 }} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Title</Text>
                            <Input
                                onFocus={() => setisFocused1(true)}
                                onBlur={() => setisFocused1(false)}
                                isFocused={isFocused1}
                                onChangeText={setTitle}
                                value={title ? title : ''}
                                backround={COLORS.card}
                                style={{ fontSize: 12, borderRadius: 10, backgroundColor: COLORS.input }}
                                placeholder='Add title here'
                                keyboardType='default'
                            />
                            <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Description</Text>
                            <Input
                                onFocus={() => setisFocused2(true)}
                                onBlur={() => setisFocused2(false)}
                                isFocused={isFocused2}
                                value={description ? description : ''}
                                onChangeText={setDescription}
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
                                placeholder='e.g. Sample description'
                                multiline={true}  // Enable multi-line input
                                numberOfLines={4} // Suggest the input area size
                            />
                            <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Included Items:</Text>
                            <View>
                                <FlatList
                                    scrollEnabled={false}
                                    data={includedItems}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={({ item, index }) => (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                            <Text style={{ flex: 1, fontSize: 14, color: COLORS.black }}>{item}</Text>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    const updatedItems = includedItems.filter((_, i) => i !== index);
                                                    setIncludedItems(updatedItems);
                                                }}
                                                style={{
                                                    padding: 5,
                                                    backgroundColor: COLORS.blackLight2,
                                                    borderRadius: 5,
                                                }}
                                            >
                                                <Ionicons name="trash-outline" size={20} color={COLORS.white} />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                    ListEmptyComponent={
                                        <Text style={{ fontSize: 14, color: COLORS.blackLight }}>No items added yet.</Text>
                                    }
                                />
                                <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                    <Input
                                        onFocus={() => setisFocused12(true)}
                                        onBlur={() => setisFocused12(false)}
                                        isFocused={isFocused12}
                                        value={newItem}
                                        onChangeText={setNewItem}
                                        backround={COLORS.card}
                                        style={{
                                            flex: 1,
                                            fontSize: 12,
                                            width: SIZES.width * 0.8,
                                            borderRadius: 10,
                                            backgroundColor: COLORS.input,
                                            borderColor: COLORS.inputBorder,
                                            borderWidth: 1,
                                        }}
                                        placeholder="Add an item"
                                    />
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (newItem.trim()) {
                                                setIncludedItems([...includedItems, newItem.trim()]);
                                                setNewItem('');
                                            }
                                        }}
                                        style={{
                                            marginLeft: 10,
                                            padding: 10,
                                            backgroundColor: COLORS.primary,
                                            borderRadius: 10,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Ionicons name="add" size={20} color={COLORS.white} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    }
                    {index === 3 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15, flexDirection: 'row', flexWrap: 'wrap' }]}>
                            {categories.map((categoryData, index) => (
                                <TouchableOpacity
                                    key={index} style={{ width: '50%', padding: 10 }}
                                    onPress={() => setCategory([categoryData.name])}
                                >
                                    <View style={{
                                        height: 150,
                                        borderColor: category.includes(categoryData.name) ? COLORS.primary : COLORS.blackLight,
                                        borderWidth: 1,
                                        borderRadius: 10,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        padding: 10,
                                        backgroundColor: category.includes(categoryData.name) ? COLORS.primaryLight : COLORS.background
                                    }}>
                                        <Image source={categoryData.image} style={{ width: '100%', height: 70, resizeMode: 'contain' }} />
                                        <Text style={{ fontSize: 14, color: COLORS.blackLight, textAlign: 'center', marginTop: 10 }}>{categoryData.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    }
                    {index === 4 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 30 }}>How much do you want to ask for this rental?</Text>
                            <Text style={{ fontSize: 14, color: COLORS.black, paddingTop: 10, paddingBottom: 20 }}>You can set a price or make it free by selecting 'No'.</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 20, gap: 10 }}>
                                <TouchableOpacity
                                    style={{
                                        padding: 15,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '45%',
                                        borderRadius: 10,
                                        borderWidth: 1,
                                        borderColor: lendingRate > 0 ? COLORS.primary : COLORS.black,
                                        backgroundColor: lendingRate > 0 ? COLORS.primaryLight : COLORS.background,
                                    }}
                                    onPress={() => setLendingRate(5)} // Default to £5.00 if "Yes" is selected
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
                                        borderColor: lendingRate === 0 ? COLORS.primary : COLORS.black,
                                        backgroundColor: lendingRate === 0 ? COLORS.primaryLight : COLORS.background,
                                    }}
                                    onPress={() => setLendingRate(0)} // Set to free if "No" is selected
                                >
                                    <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: 'bold' }}>No</Text>
                                </TouchableOpacity>
                            </View>
                            {lendingRate > 0 && (
                                <View>
                                    <Text style={{ fontSize: 16, color: COLORS.title, marginTop: 15, marginBottom: 5 }}>Set your borrowing rate</Text>
                                    <View style={{ flexDirection: 'row', width: '100%', paddingVertical: 20 }}>
                                        <Input
                                            onFocus={() => setisFocused3(true)}
                                            onBlur={() => setisFocused3(false)}
                                            isFocused={isFocused3}
                                            onChangeText={setLendingRate}
                                            backround={COLORS.card}
                                            style={{ width: 100, height: 55, borderRadius: 10, backgroundColor: COLORS.input, fontSize: 12 }}
                                            inputicon
                                            placeholder='£5.00'
                                            value={lendingRate ? lendingRate.toString() : ''}
                                            keyboardType='numeric'
                                        />
                                        <Text style={{ fontSize: 12, color: COLORS.title, marginTop: 15, marginBottom: 5, paddingLeft: 5 }}> Rate per day.</Text>
                                    </View>
                                </View>
                            )}
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.black, paddingTop: 20, paddingBottom: 10 }}>Set your preferred borrowing time.</Text>
                            <View style={{ flexDirection: 'row', width: SIZES.width * 0.9, paddingBottom: 20, flexWrap: 'wrap' }}>
                                <Text style={{ fontSize: 12, color: COLORS.title, marginTop: 15, marginBottom: 5, paddingRight: 5 }}>
                                    Start borrowing at
                                </Text>
                                <View style={{ alignItems: 'center', flex: 1 }}>
                                    <Input
                                        onFocus={() => setisFocused4(true)}
                                        onBlur={() => setisFocused4(false)}
                                        isFocused={isFocused4}
                                        onChangeText={setCollectionTime}
                                        backround={COLORS.card}
                                        style={{ width: 90, borderRadius: 10, backgroundColor: COLORS.input, fontSize: 12 }}
                                        inputicon
                                        placeholder='09:00'
                                        value={collectionTime}
                                        keyboardType={'numeric'}
                                    />
                                    <Text style={{ fontSize: 10, color: COLORS.title, marginTop: 5 }}>collection time</Text>
                                </View>
                                <Text style={{ fontSize: 12, color: COLORS.title, marginTop: 15, marginBottom: 5, paddingLeft: 5, paddingRight: 5 }}>until</Text>
                                <View style={{ alignItems: 'center', flex: 1 }}>
                                    <Input
                                        onFocus={() => setisFocused5(true)}
                                        onBlur={() => setisFocused5(false)}
                                        isFocused={isFocused5}
                                        onChangeText={setReturnTime}
                                        backround={COLORS.card}
                                        style={{ width: 90, borderRadius: 10, backgroundColor: COLORS.input, fontSize: 12 }}
                                        inputicon
                                        placeholder='09:00'
                                        value={returnTime}
                                        keyboardType={'numeric'}
                                    />
                                    <Text style={{ fontSize: 10, color: COLORS.title, marginTop: 5 }}>return time</Text>
                                </View>
                                <Text style={{ fontSize: 12, color: COLORS.title, marginTop: 15, marginBottom: 5, paddingLeft: 5, paddingRight: 5 }}>.</Text>
                            </View>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.black, paddingTop: 20, paddingBottom: 10 }}>Are you going to be available throughout the week?</Text>
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
                                    <Text style={{ fontSize: 14, color: COLORS.black, paddingTop: 5, paddingBottom: 20 }}>Select your available slots throughout the week.</Text>
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
                        </View>
                    }
                    {index === 5 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 30 }}>Rental Conditions</Text>
                            <Text style={{ fontSize: 14, color: COLORS.black, paddingTop: 10, paddingBottom: 30 }}>Do let the renters know about how to use your rental products, especially the do's & don't, conditions and proper handling.</Text>
                            <Input
                                onFocus={() => setisFocused6(true)}
                                onBlur={() => setisFocused6(false)}
                                isFocused={isFocused6}
                                onChangeText={setBorrowingNotes}
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
                                placeholder='e.g. Please knock instead of using the doorbell'
                                multiline={true}  // Enable multi-line input
                                numberOfLines={10} // Suggest the input area size
                                value={borrowingNotes ? borrowingNotes : ''}
                            />
                        </View>
                    }
                    {index === 6 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 30, paddingBottom: 10 }}>Pickup Instruction</Text>
                            <Input
                                onFocus={() => setisFocused7(true)}
                                onBlur={() => setisFocused7(false)}
                                isFocused={isFocused7}
                                onChangeText={setPickupInstructions}
                                backround={COLORS.card}
                                style={{
                                    fontSize: 12,
                                    borderRadius: 12,
                                    backgroundColor: COLORS.input,
                                    borderColor: COLORS.inputBorder,
                                    borderWidth: 1,
                                    height: 250,
                                }}
                                inputicon
                                placeholder='e.g. Please knock instead of using the doorbell'
                                multiline={true}  // Enable multi-line input
                                numberOfLines={10} // Suggest the input area size
                                value={pickupInstructions ? pickupInstructions : ''}
                            />
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 30, paddingBottom: 10 }}>Return Instruction</Text>
                            <Input
                                onFocus={() => setisFocused8(true)}
                                onBlur={() => setisFocused8(false)}
                                isFocused={isFocused8}
                                onChangeText={setReturnInstructions}
                                backround={COLORS.card}
                                style={{
                                    fontSize: 12,
                                    borderRadius: 12,
                                    backgroundColor: COLORS.input,
                                    borderColor: COLORS.inputBorder,
                                    borderWidth: 1,
                                    height: 250,
                                }}
                                inputicon
                                placeholder='e.g. Please knock instead of using the doorbell'
                                multiline={true}  // Enable multi-line input
                                numberOfLines={10} // Suggest the input area size
                                value={returnInstructions ? returnInstructions : ''}
                            />
                        </View>
                    }
                    {index === 7 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 30, paddingBottom: 10 }}>Address</Text>
                            <Text style={{ fontSize: 14, color: COLORS.black, paddingTop: 10, paddingBottom: 30 }}>No worries the address will be disclosed to renters when the rental is created. The location will be generic to an area (in the catalogue) and an exact pinpoint will be revealed upon rental creation by renter.</Text>
                            <View style={{ marginBottom: 15 }}>
                                {
                                    addresses.map((item) => (
                                        <TouchableOpacity
                                            key={item.id}
                                            activeOpacity={0.8}
                                            style={{
                                                marginVertical: 5,
                                                backgroundColor: addressID === item.id ? COLORS.primaryLight : COLORS.card,
                                                borderRadius: 10,
                                                padding: 5,
                                                borderWidth: 1,
                                                borderColor: addressID === item.id ? COLORS.primary : COLORS.blackLight,
                                            }}
                                            onPress={() => {
                                                console.log(item);
                                                setAddressID(item.id ?? '');
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
                        index === 8 &&
                        <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15 }]}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 30, paddingBottom: 10 }}>Will you collect deposits for your lending? </Text>
                            <Text style={{ fontSize: 16, color: COLORS.black, paddingTop: 10, paddingBottom: 50 }}>Deposits grant owners the right to cover damage costs and promote responsible use by renters, and must be returned to renters if the product is in good condition. </Text>
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
                                                borderColor: isCollectDeposit ? COLORS.primary : COLORS.black,
                                                backgroundColor: isCollectDeposit ? COLORS.primaryLight : COLORS.background,
                                            }}
                                            onPress={() => setIsCollectDeposit(true)}
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
                                                borderColor: !isCollectDeposit ? COLORS.primary : COLORS.black,
                                                backgroundColor: !isCollectDeposit ? COLORS.primaryLight : COLORS.background,
                                            }}
                                            onPress={() => {
                                                setIsCollectDeposit(false)
                                                setDepositAmount(0)
                                            }}
                                        >
                                            <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: 'bold' }}>No</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                            {isCollectDeposit && (
                                <View style={GlobalStyleSheet.line}>
                                    <View style={{ paddingTop: 30 }}>
                                        <View style={{ flexDirection: 'row', width: SIZES.width * 0.9, paddingBottom: 20, flexWrap: 'wrap' }}>
                                            <Text style={{ fontSize: 12, color: COLORS.title, marginTop: 15, marginBottom: 5, paddingRight: 10 }}>Deposit Amount</Text>
                                            <Input
                                                onFocus={() => setisFocused11(true)}
                                                onBlur={() => setisFocused11(false)}
                                                isFocused={isFocused11}
                                                onChangeText={setDepositAmount}
                                                backround={COLORS.card}
                                                style={{ width: 100, height: 55, borderRadius: 10, backgroundColor: COLORS.input, fontSize: 12 }}
                                                inputicon
                                                placeholder='£5.00'
                                                value={depositAmount ? depositAmount.toString() : ''.toString()}
                                                keyboardType='numeric'
                                            />

                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    }
                    {
                        index === 9 &&
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
                    index === 9 ? (
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
                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{[
                                    'Start',
                                    'Add Item Details',
                                    'Select Category',
                                    'Set Borrowing Rate',
                                    'Add Borrowing Conditions',
                                    'Add Pickup & Return Instructions',
                                    'Select Pickup Address',
                                    'Add Deposit Details',
                                    'Confirm Deposit',
                                ][index] || ''}</Text>
                            </TouchableOpacity>
                        </View>
                    )
                }
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
            </BottomSheet>
        </View >
    )
}

export default AddListing