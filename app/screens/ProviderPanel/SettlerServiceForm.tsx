import { View, Text, ScrollView, TouchableOpacity, Image, Linking, Alert, ActivityIndicator, TextInput, RefreshControl } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { COLORS, SIZES } from '../../constants/theme';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import axios from 'axios';
import { useStripe } from '@stripe/stripe-react-native';
import Input from '../../components/Input/Input';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import { CategoryDropdown } from '../../components/CategoryDropdown';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { set } from 'date-fns';
import { categories } from '../../constants/ServiceCategory';
import { deleteSettlerService, fetchSelectedSettlerService, updateSettlerService } from '../../services/SettlerServiceServices';
import { Address, fetchUserAddresses } from '../../services/AddressServices';
import { useUser } from '../../context/UserContext';

type SettlerServiceFormScreenProps = StackScreenProps<RootStackParamList, 'SettlerServiceForm'>

export const SettlerServiceForm = ({ navigation, route }: SettlerServiceFormScreenProps) => {
  const { user } = useUser();

  const [settlerService, setSettlerService] = useState(route.params.settlerService);
  const [selectedServiceCardImageUrls, setSelectedServiceCardImageUrls] = useState<string | null>(null);
  const [serviceCardImageUrls, setServiceCardImageUrls] = useState<string[]>([]);
  const [serviceCardBrief, setServiceCardBrief] = useState<string>('');
  const [isAvailableImmediately, setIsAvailableImmediately] = useState(false);
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

  const [refreshing, setRefreshing] = useState(false);
  const [isFocused2, setisFocused2] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);

  const handleListing = async () => {
    if (settlerService) {
      await updateSettlerService(settlerService.id || '', {
        settlerId: user?.uid || '',
        settlerFirstName: user?.firstName || '',
        settlerLastName: user?.lastName || '',
        selectedCatalogue: settlerService.selectedCatalogue,
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

        qualifications: settlerService.qualifications || [],
        isActive: isActive,
      })
      Alert.alert('Settler service updated successfully.');
    }
  }

  const toggleDaySelection = (day: string) => {
    setAvailableDays((prevSelectedDays) =>
      prevSelectedDays.includes(day)
        ? prevSelectedDays.filter((d) => d !== day)
        : [...prevSelectedDays, day]
    );
  };

  const userId = user?.uid;
  useEffect(() => {
    const getAddresses = async () => {
      if (userId) {
        const fetchedAddresses = await fetchUserAddresses(userId);
        setAddresses(fetchedAddresses);
      }
    };

    if (userId) getAddresses();
  }, [userId]);

  const fetchSelectedSettlerServiceData = async (settlerServiceId: string) => {
    try {
      const fetchSelectedService = await fetchSelectedSettlerService(settlerServiceId);
      if (fetchSelectedService) {
        setServiceCardImageUrls(fetchSelectedService.serviceCardImageUrls);
        setSelectedServiceCardImageUrls(fetchSelectedService.serviceCardImageUrls[0]);
        setServiceCardBrief(fetchSelectedService.serviceCardBrief);
        setIsAvailableImmediately(fetchSelectedService.isAvailableImmediately);
        setAvailableDays(fetchSelectedService.availableDays || []);
        setServiceStartTime(fetchSelectedService.serviceStartTime);
        setServiceEndTime(fetchSelectedService.serviceEndTime);
        setAddressId(fetchSelectedService.addressId);
        setLatitude(fetchSelectedService.latitude);
        setLongitude(fetchSelectedService.longitude);
        setAddressName(fetchSelectedService.addressName);
        setAddress(fetchSelectedService.address);
        setAddressAdditionalDetails(fetchSelectedService.addressAdditionalDetails);
        setPostcode(fetchSelectedService.postcode);
        setIsActive(fetchSelectedService.isActive);
      } else {
        console.log('No settler service data found.');
      }
    } catch (error) {
      console.error('Error fetching settler service data:', error);
    }
  }

  useEffect(() => {
    setSelectedServiceCardImageUrls(settlerService?.serviceCardImageUrls[0] || null);
    setServiceCardImageUrls(settlerService?.serviceCardImageUrls || []);
    setServiceCardBrief(settlerService?.serviceCardBrief || '');
    setIsAvailableImmediately(settlerService?.isAvailableImmediately || false);
    setAvailableDays(settlerService?.availableDays || []);
    setServiceStartTime(settlerService?.serviceStartTime || '');
    setServiceEndTime(settlerService?.serviceEndTime || '');
    setAddressId(settlerService?.addressId || '');
    setLatitude(settlerService?.latitude || 0);
    setLongitude(settlerService?.longitude || 0);
    setAddressName(settlerService?.addressName || '');
    setAddress(settlerService?.address || '');
    setAddressAdditionalDetails(settlerService?.addressAdditionalDetails || '');
    setPostcode(settlerService?.postcode || '');
    setIsActive(settlerService?.isActive || false);
  }, [settlerService])

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

  const deleteImage = () => {
    if (!selectedServiceCardImageUrls) return;

    const updatedImages = serviceCardImageUrls.filter((img) => img !== selectedServiceCardImageUrls);
    setServiceCardImageUrls(updatedImages);
    setSelectedServiceCardImageUrls(updatedImages.length > 0 ? updatedImages[0] : null);
  };


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSelectedSettlerServiceData(settlerService?.id || '').then(() => setRefreshing(false));
  }, [settlerService]);

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      extraScrollHeight={60}
    >
      <View style={{ backgroundColor: COLORS.background, flex: 1 }}>
        <View style={{ height: 60, borderBottomColor: COLORS.card, borderBottomWidth: 1 }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 5 }}>
            <View style={{ flex: 1, alignItems: 'flex-start' }}>
              {/* left header element */}
            </View>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.title, textAlign: 'center', marginVertical: 10 }}>{settlerService === null ? 'Settler Add Service' : 'Manage Service'}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <TouchableOpacity
                style={{
                  borderRadius: 50,
                  padding: 10,
                }}
                onPress={() => 
                  deleteSettlerService(settlerService?.id || '').then(() => navigation.goBack())
                }
              >
                <Ionicons name="trash-outline" size={25} color={COLORS.title} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <ScrollView
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <View style={{ paddingTop: 20, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: '90%' }}>
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Selected Catalogue</Text>
              <View style={[GlobalStyleSheet.line]} />
              {
                (settlerService) && (
                  <View style={{ flex: 1, flexDirection: 'row', marginTop: 15, marginBottom: 5 }}>
                    <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginRight: 10 }}>Catalogue Id:</Text>
                    <Text>{settlerService.selectedCatalogue.id}</Text>
                  </View>
                )
              }
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Title</Text>
              <Input
                onFocus={() => setisFocused2(true)}
                onBlur={() => setisFocused2(false)}
                isFocused={isFocused2}
                backround={COLORS.card}
                value={settlerService?.selectedCatalogue.title}
                style={{ borderRadius: 12, backgroundColor: COLORS.input, borderColor: COLORS.inputBorder, borderWidth: 1, height: 50 }}
                placeholder='e.g. Cleaning service'
                readOnly={true}
              />
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Description</Text>
              <Input
                onFocus={() => setisFocused2(true)}
                onBlur={() => setisFocused2(false)}
                isFocused={isFocused2}
                value={settlerService?.selectedCatalogue.description}
                backround={COLORS.card}
                style={{
                  fontSize: 12,
                  borderRadius: 12,
                  backgroundColor: COLORS.input,
                  borderColor: COLORS.inputBorder,
                  borderWidth: 1,
                  height: 80,
                }}
                inputicon
                placeholder='e.g. General cleaning is a light cleaning job etc'
                multiline={true}
                numberOfLines={4}
                readOnly={true}
              />
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Category</Text>
              <Input
                onFocus={() => setisFocused2(true)}
                onBlur={() => setisFocused2(false)}
                isFocused={isFocused2}
                backround={COLORS.card}
                value={settlerService?.selectedCatalogue.category}
                style={{ borderRadius: 12, backgroundColor: COLORS.input, borderColor: COLORS.inputBorder, borderWidth: 1, height: 50 }}
                placeholder='e.g. Cleaning service'
                readOnly={true}
              />
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Settler Service-Card</Text>
              <View style={[GlobalStyleSheet.line]} />
              {
                (settlerService) && (
                  <View style={{ flex: 1, flexDirection: 'row', marginTop: 15, marginBottom: 5 }}>
                    <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginRight: 10 }}>Settler Service Id:</Text>
                    <Text>{settlerService.id}</Text>
                  </View>
                )
              }
              <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', gap: 10, paddingTop: 10 }}>
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
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Card Bio. / Brief</Text>
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
                  height: 80,
                }}
                inputicon
                placeholder='e.g. General cleaning is a light cleaning job etc'
                multiline={true}
                numberOfLines={4}
              />
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Able to receive job immediately?</Text>
              <CategoryDropdown
                options={[
                  { label: 'Yes', value: 'Yes' },
                  { label: 'No', value: 'No' }
                ]}
                selectedOption={isAvailableImmediately ? 'Yes' : 'No'}
                setSelectedOption={(value: string) => setIsAvailableImmediately(value === 'Yes')}
              />
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Job availability</Text>
              {settlerService && settlerService.availableDays && (
                <View>
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
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Preferred Job Time</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={{ fontSize: 14, color: COLORS.title, fontWeight: 'bold', marginBottom: 5 }}>Start Time</Text>
                  <Input
                    onFocus={() => setisFocused2(true)}
                    onBlur={() => setisFocused2(false)}
                    isFocused={isFocused2}
                    backround={COLORS.card}
                    value={serviceStartTime}
                    onChangeText={setServiceStartTime}
                    style={{
                      borderRadius: 12,
                      backgroundColor: COLORS.input,
                      borderColor: COLORS.inputBorder,
                      borderWidth: 1,
                      height: 50,
                    }}
                    placeholder='e.g. 09:00'
                    keyboardType={'numeric'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: COLORS.title, fontWeight: 'bold', marginBottom: 5 }}>End Time</Text>
                  <Input
                    onFocus={() => setisFocused2(true)}
                    onBlur={() => setisFocused2(false)}
                    isFocused={isFocused2}
                    backround={COLORS.card}
                    value={serviceEndTime}
                    onChangeText={setServiceEndTime}
                    style={{
                      borderRadius: 12,
                      backgroundColor: COLORS.input,
                      borderColor: COLORS.inputBorder,
                      borderWidth: 1,
                      height: 50,
                    }}
                    placeholder='e.g. 18:00'
                    keyboardType={'numeric'}
                  />
                </View>
              </View>
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15 }}>Service Address</Text>
              <View style={{ marginVertical: 10 }}>
                <View style={{
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: COLORS.inputBorder,
                  backgroundColor: COLORS.input,
                  paddingHorizontal: 10,
                  paddingVertical: 15,
                }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowAddressDropdown(!showAddressDropdown)}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Text style={{ fontSize: 16, color: COLORS.title }}>
                      {addresses.find(a => a.id === addressId)?.addressName || 'Select address'}
                    </Text>
                    <Ionicons name={showAddressDropdown ? "chevron-up" : "chevron-down"} size={20} color={COLORS.title} />
                  </TouchableOpacity>
                  {showAddressDropdown && (
                    <View style={{
                      marginTop: 5,
                      backgroundColor: COLORS.card,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: COLORS.inputBorder,
                      maxHeight: 200,
                    }}>
                      <ScrollView>
                        {addresses.map((item) => (
                          <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.8}
                            style={{
                              padding: 10,
                              backgroundColor: addressId === item.id ? COLORS.primaryLight : COLORS.card,
                              borderRadius: 8,
                              borderBottomWidth: 1,
                              borderBottomColor: COLORS.inputBorder,
                            }}
                            onPress={() => {
                              setAddressId(item.id ?? '');
                              setLatitude(item.latitude);
                              setLongitude(item.longitude);
                              setAddressName(item.addressName);
                              setAddress(item.address);
                              setAddressAdditionalDetails(item.additionalDetails);
                              setPostcode(item.postcode);
                              setShowAddressDropdown(false);
                            }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                              <Ionicons name="location" size={20} color={COLORS.title} />
                              <View>
                                <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold' }}>{item.addressName}</Text>
                                <Text style={{ fontSize: 14, color: COLORS.title }}>{item.address}</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Qualification</Text>
              <Input
                onFocus={() => setisFocused2(true)}
                onBlur={() => setisFocused2(false)}
                isFocused={isFocused2}
                backround={COLORS.card}
                value={'LATER UPDATE +'}
                style={{ borderRadius: 12, backgroundColor: COLORS.input, borderColor: COLORS.inputBorder, borderWidth: 1, height: 50 }}
                placeholder='e.g. Cleaning service'
                readOnly={true}
              />
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Job still active?</Text>
              <CategoryDropdown
                options={[
                  { label: 'Yes', value: 'Yes' },
                  { label: 'No', value: 'No' }
                ]}
                selectedOption={isActive ? 'Yes' : 'No'}
                setSelectedOption={(value: string) => setIsActive(value === 'Yes')}
              />
            </View>
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
                  handleListing();
                  navigation.goBack();
                }}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                  {settlerService ? 'Update' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

    </KeyboardAwareScrollView>
  );
};

export default SettlerServiceForm