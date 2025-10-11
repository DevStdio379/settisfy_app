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
import { createSettlerService, deleteSettlerService, fetchSelectedSettlerService, updateSettlerService } from '../../services/SettlerServiceServices';
import { Address, fetchUserAddresses } from '../../services/AddressServices';
import { useUser } from '../../context/UserContext';
import { Catalogue, fetchAllCatalogue } from '../../services/CatalogueServices';
import { serviceLocation } from '../../constants/ServiceLocation';

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

  const [selectedLocation, setSelectedLocation] = useState<string>('');;

  const [refreshing, setRefreshing] = useState(false);
  const [isFocused2, setisFocused2] = useState(false);
  const [isActive, setIsActive] = useState<boolean>(false);

  const [index, setIndex] = useState(0);
  const [category, setCategory] = useState<string>('');
  const [catalogue, setCatalogue] = useState<Catalogue[]>();
  const [selectedCatalogue, setSelectedCatalogue] = useState<Catalogue>();

  const handleListing = async () => {
    if (settlerService !== null) {
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

        serviceLocation: selectedLocation,

        qualifications: settlerService.qualifications || [],
        isActive: isActive,
      })
      Alert.alert('Settler service updated successfully.');
    } 
    if (settlerService === null) {
      if (selectedCatalogue && selectedLocation) {
        await createSettlerService({
          settlerId: user?.uid || '',
          settlerFirstName: user?.firstName || '',
          settlerLastName: user?.lastName || '',

          selectedCatalogue: selectedCatalogue,
          serviceCardImageUrls: serviceCardImageUrls,
          serviceCardBrief: serviceCardBrief,
          isAvailableImmediately: isAvailableImmediately,
          availableDays: availableDays,
          serviceStartTime: serviceStartTime,
          serviceEndTime: serviceEndTime,

          serviceLocation: selectedLocation,

          qualifications: [],
          isActive: isActive,
          jobsCount: 0,
          averageRatings: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
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
        const catalogueData = await fetchAllCatalogue();
        setCatalogue(catalogueData);
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
        setSelectedLocation(fetchSelectedService.serviceLocation);
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
    setSelectedLocation(settlerService?.serviceLocation || '');
    setIsActive(settlerService?.isActive || false);
    setSelectedCatalogue(settlerService?.selectedCatalogue)
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
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.title, textAlign: 'center', marginVertical: 10 }}>{settlerService === null ? 'Add Service' : 'Manage Service'}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              {settlerService !== null && (
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
              )}
            </View>
          </View>
        </View>
        <ScrollView
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <View>
            {index === 0 && (
              <View style={{ paddingTop: 20, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: '90%' }}>
                  <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Selected Catalogue</Text>
                  <View style={[GlobalStyleSheet.line]} />
                  <View style={{ paddingTop: 15 }}>
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
                      onPress={() => setIndex(1)}
                    >
                      <Ionicons name="briefcase-outline" size={26} color={COLORS.blackLight} style={{ margin: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.title }}>
                          {selectedCatalogue ? selectedCatalogue.title : `Select a service`}
                        </Text>
                        <Text style={{ fontSize: 13, color: COLORS.black }}>
                          {selectedCatalogue ? selectedCatalogue.category : `You need to select available services from catalogue`}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward-outline" size={26} color={COLORS.blackLight} style={{ margin: 5 }} />
                    </TouchableOpacity>
                  </View>
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
                      onPress={() => setIndex(4)}
                    >
                      <Ionicons name="location-outline" size={26} color={COLORS.blackLight} style={{ margin: 5 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.title }}>
                          Service at {selectedLocation ? selectedLocation : `Address`}
                        </Text>
                        <Text style={{ fontSize: 13, color: COLORS.black }}>
                          {selectedLocation ? selectedLocation : `No address selected`}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward-outline" size={26} color={COLORS.blackLight} style={{ margin: 5 }} />
                    </TouchableOpacity>
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
            )}
            {index === 1 &&
              <View style={[GlobalStyleSheet.container, { paddingHorizontal: 15, flexDirection: 'row', flexWrap: 'wrap' }]}>
                {categories.map((categoryData, index) => (
                  <TouchableOpacity
                    key={index} style={{ width: '50%', padding: 10 }}
                    onPress={() => {
                      setCategory(categoryData.value)
                      setIndex(2)
                    }}
                  >
                    <View style={{
                      height: 150,
                      borderColor: category.includes(categoryData.value) ? COLORS.primary : COLORS.blackLight,
                      borderWidth: 1,
                      borderRadius: 10,
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: 10,
                      backgroundColor: category.includes(categoryData.value) ? COLORS.primaryLight : COLORS.background
                    }}>
                      <Image source={categoryData.image} style={{ width: '100%', height: 70, resizeMode: 'contain' }} />
                      <Text style={{ fontSize: 14, color: COLORS.blackLight, textAlign: 'center', marginTop: 10 }}>{categoryData.value}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            }
            {index === 2 &&
              <View style={[GlobalStyleSheet.container, { paddingHorizontal: 25, paddingBottom: 100 }]}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black, paddingTop: 30, paddingBottom: 10 }}>Select tasks that you can offer</Text>
                {catalogue && catalogue
                  .filter(option => option.category === category)
                  .map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={{ flexDirection: "row", alignItems: "center", marginVertical: 10, }}
                      onPress={() => {
                        setSelectedCatalogue(option)
                        setIndex(0)
                      }}
                    >
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 16 }}>{option.title}</Text>
                          <Ionicons name={option.isActive ? 'briefcase' : ''} size={16} />
                        </View>
                        <Text style={{ fontSize: 12, color: COLORS.blackLight }}>{option.description}</Text>
                      </View>
                      <Ionicons name={'chevron-forward'} size={24} />
                    </TouchableOpacity>
                  ))}
              </View>
            }
            {index === 4 && (
              <View style={{ flex: 1, padding: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.title, marginBottom: 20 }}>Select where to do the service</Text>
                <View style={{ paddingLeft: 10 }}>
                  {serviceLocation.map((location, index) => (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.8}
                      style={{
                        padding: 15,
                        borderColor: selectedLocation === location.location ? COLORS.primary : COLORS.blackLight,
                        borderRadius: 10,
                        borderWidth: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10,
                      }}
                      onPress={() => {
                        setSelectedLocation(location.location);
                        setIndex(0)
                      }}
                    >
                      <Ionicons name="location-outline" size={30} color={COLORS.blackLight} style={{ margin: 5 }} />
                      <View style={{ flex: 1, paddingLeft: 10 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.title }}>
                          {location.location || `Address ${index + 1}`}
                        </Text>
                        <Text style={{ fontSize: 13, color: COLORS.black }}>
                          {location.location}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

    </KeyboardAwareScrollView>
  );
};

export default SettlerServiceForm