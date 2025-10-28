import { View, Text, ScrollView, TouchableOpacity, Image, Linking, Alert, ActivityIndicator, TextInput, RefreshControl } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { COLORS } from '../constants/theme';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootStackParamList';
import axios from 'axios';
import { useStripe } from '@stripe/stripe-react-native';
import Input from '../components/Input/Input';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { GlobalStyleSheet } from '../constants/StyleSheet';
import { CategoryDropdown } from '../components/CategoryDropdown';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { createCatalogue, deleteCatalogue, DynamicOption, fetchSelectedCatalogue, updateCatalogue } from '../services/CatalogueServices';
import { set } from 'date-fns';
import { categories } from '../constants/ServiceCategory';

type ServiceCatalogueFormScreenProps = StackScreenProps<RootStackParamList, 'ServiceCatalogueForm'>

export const ServiceCatalogueForm = ({ navigation, route }: ServiceCatalogueFormScreenProps) => {

  const [catalogue, setCatalogue] = useState(route.params.catalogue);
  const [isFocused, setIsFocused] = useState<string | null>(null);
  const [selectedServiceCardImageUrls, setSelectedServiceCardImageUrls] = useState<string | null>(null);
  const [serviceCardImageUrls, setServiceCardImageUrls] = useState<string[]>([]);
  const [serviceTitle, setServiceTitle] = useState<string>('');
  const [serviceCardBrief, setServiceCardBrief] = useState<string>('');
  const [includedServices, setIncludedServices] = useState<string>('');
  const [excludedServices, setExcludedServices] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [basePrice, setBasePrice] = useState<number>(0);
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [dynamicOptions, setDynamicOptions] = useState<DynamicOption[]>([]);

  // options addon
  const addMainOption = () => {
    setDynamicOptions((prev) => [
      ...prev,
      { id: Date.now(), name: "", subOptions: [], multipleSelect: false },
    ]);
  };

  const updateMainOptionName = (id: number, text: string) => {
    setDynamicOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, name: text } : opt))
    );
  };

  const removeMainOption = (id: number) => {
    setDynamicOptions((prev) => prev.filter((opt) => opt.id !== id));
  };

  const addSubOption = (mainId: number) => {
    setDynamicOptions((prev) =>
      prev.map((opt) =>
        opt.id === mainId
          ? {
            ...opt,
            subOptions: [
              ...opt.subOptions,
              { id: Date.now(), label: "", additionalPrice: 0, notes: "" },
            ],
          }
          : opt
      )
    );
  };

  const updateSubOption = (mainId: number, subId: number, key: string, text: string) => {
    setDynamicOptions((prev) =>
      prev.map((opt) =>
        opt.id === mainId
          ? {
            ...opt,
            subOptions: opt.subOptions.map((sub) =>
              sub.id === subId ? { ...sub, [key]: text } : sub
            ),
          }
          : opt
      )
    );
  };

  const removeSubOption = (mainId: number, subId: number) => {
    setDynamicOptions((prev) =>
      prev.map((opt) =>
        opt.id === mainId
          ? { ...opt, subOptions: opt.subOptions.filter((sub) => sub.id !== subId) }
          : opt
      )
    );
  };

  const handleListing = async () => {
    if (catalogue) {
      await updateCatalogue(catalogue.id || '', {
        imageUrls: serviceCardImageUrls,
        title: serviceTitle,
        description: serviceCardBrief,
        includedServices: includedServices,
        excludedServices: excludedServices,
        category: selectedCategory,
        basePrice: basePrice,
        dynamicOptions: dynamicOptions.map(opt => ({
          id: opt.id,
          name: opt.name,
          subOptions: opt.subOptions,
          multipleSelect: opt.multipleSelect // or true, depending on your logic
        })),
        isActive: selectedStatus === 'active' ? true : false,
        updateAt: new Date()
      })
      fetchSelectedCatalogueData(catalogue.id || '');
    } else {
      await createCatalogue({
        imageUrls: serviceCardImageUrls,
        title: serviceTitle,
        description: serviceCardBrief,
        includedServices: includedServices,
        excludedServices: excludedServices,
        category: selectedCategory,
        basePrice: basePrice,
        dynamicOptions: dynamicOptions.map(opt => ({
          id: opt.id,
          name: opt.name,
          subOptions: opt.subOptions,
          multipleSelect: opt.multipleSelect // or true, depending on your logic
        })),
        bookingsCount: 0,
        averageRatings: 0,
        isActive: selectedStatus === 'active' ? true : false,
        createAt: new Date(),
        updateAt: new Date()
      })
    }
  }



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

  useEffect(() => {
    if (catalogue) {
      setServiceCardImageUrls(catalogue.imageUrls || []);
      setSelectedServiceCardImageUrls(catalogue.imageUrls && catalogue.imageUrls.length > 0 ? catalogue.imageUrls[0] : null);
      setServiceTitle(catalogue.title || '');
      setServiceCardBrief(catalogue.description || '');
      setIncludedServices(catalogue.includedServices || '');
      setExcludedServices(catalogue.excludedServices || '');
      setSelectedCategory(catalogue.category || '');
      setBasePrice(catalogue.basePrice || 0);
      setSelectedStatus(catalogue.isActive ? 'active' : 'inactive');
      setDynamicOptions(
        (catalogue?.dynamicOptions || []).map((opt, idx) => ({
          id: opt.id ?? idx,
          name: opt.name ?? "",
          multipleSelect: opt.multipleSelect ?? false,
          subOptions: (opt.subOptions || []).map((sub, subIdx) => ({
            id: sub.id ?? subIdx,
            label: sub.label ?? "",
            additionalPrice: sub.additionalPrice ?? 0,
            notes: sub.notes ?? ""
          }))
        }))
      );
    }
  }, [catalogue]);

  // Function to delete the selected image
  const deleteImage = () => {
    if (!selectedServiceCardImageUrls) return;

    const updatedImages = serviceCardImageUrls.filter((img) => img !== selectedServiceCardImageUrls);
    setServiceCardImageUrls(updatedImages);
    setSelectedServiceCardImageUrls(updatedImages.length > 0 ? updatedImages[0] : null);
  };

  const fetchSelectedCatalogueData = async (catalogueId: string) => {
    try {
      const fetchedCatalogue = await fetchSelectedCatalogue(catalogueId);
      if (fetchedCatalogue) {
        setCatalogue(fetchedCatalogue);
        setServiceCardImageUrls(fetchedCatalogue.imageUrls || []);
        setSelectedServiceCardImageUrls(fetchedCatalogue.imageUrls && fetchedCatalogue.imageUrls.length > 0 ? fetchedCatalogue.imageUrls[0] : null);
        setServiceTitle(fetchedCatalogue.title || '');
        setServiceCardBrief(fetchedCatalogue.description || '');
        setIncludedServices(fetchedCatalogue.includedServices || '');
        setExcludedServices(fetchedCatalogue.excludedServices || '');
        setSelectedCategory(fetchedCatalogue.category || '');
        setBasePrice(fetchedCatalogue.basePrice || 0);
        setSelectedStatus(fetchedCatalogue.isActive ? 'active' : 'inactive');
        setDynamicOptions(
          (catalogue && catalogue.dynamicOptions ? catalogue.dynamicOptions : []).map((opt, idx) => ({
            id: opt.id ?? idx,
            name: opt.name ?? "",
            multipleSelect: opt.multipleSelect ?? false,
            subOptions: (opt.subOptions || []).map((sub, subIdx) => ({
              id: sub.id ?? subIdx,
              label: sub.label ?? "",
              additionalPrice: sub.additionalPrice ?? 0,
              notes: sub.notes ?? ""
            }))
          }))
        );
      } else {
        console.log('No catalogue data found');
      }
    } catch (error) {
      console.error('Error fetching catalogue data:', error);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSelectedCatalogueData(catalogue?.id || '').then(() => setRefreshing(false));
  }, [catalogue]);

  return (
      <View style={{ backgroundColor: COLORS.background, flex: 1, }}>
        <View style={{ height: 60, borderBottomColor: COLORS.card, borderBottomWidth: 1 }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 5 }}>
            <View style={{ flex: 1, alignItems: 'flex-start' }}>
              {/* left header element */}
            </View>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.title, textAlign: 'center', marginVertical: 10 }}>{catalogue === null ? 'Add Service' : 'Manage Service'}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <TouchableOpacity
                style={{
                  borderRadius: 50,
                  padding: 10,
                }}
                onPress={() =>
                  deleteCatalogue(catalogue?.id || '').then(() => navigation.goBack())
                }
              >
                <Ionicons name="trash-outline" size={25} color={COLORS.title} />
              </TouchableOpacity>
            </View>

          </View>
        </View>
        <ScrollView
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 250 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <View style={{ paddingTop: 20, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: '90%' }}>
              {
                (catalogue) && (
                  <View style={{ flex: 1, flexDirection: 'row', marginTop: 15, marginBottom: 5 }}>
                    <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginRight: 10 }}>Catalogue Id:</Text>
                    <Text>{catalogue.id}</Text>
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
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Title</Text>
              <Input
                onFocus={() => setIsFocused('title')}
                onBlur={() => setIsFocused(null)}
                isFocused={isFocused === 'title'}
                onChangeText={setServiceTitle}
                backround={COLORS.card}
                value={serviceTitle}
                style={{ borderRadius: 12, backgroundColor: COLORS.input, borderColor: COLORS.inputBorder, borderWidth: 1, height: 50 }}
                placeholder='e.g. Cleaning service'
              />
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Description</Text>
              <Input
                onFocus={() => setIsFocused('description')}
                onBlur={() => setIsFocused(null)}
                isFocused={isFocused === 'description'}
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
                placeholder='e.g. General cleaning is a light cleaning job etc'
                multiline={true}
                numberOfLines={4}
              />
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>What's included</Text>
              <Input
                onFocus={() => setIsFocused('includedServices')}
                onBlur={() => setIsFocused(null)}
                isFocused={isFocused === 'includedServices'}
                value={includedServices}
                onChangeText={setIncludedServices}
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
                placeholder='e.g. Cleaning includes house cleaning, gutter cleaning, garbage disposal, etc'
                multiline={true}
                numberOfLines={4}
              />
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>What's excluded</Text>
              <Input
                onFocus={() => setIsFocused('excludedServices')}
                onBlur={() => setIsFocused(null)}
                isFocused={isFocused === 'excludedServices'}
                value={excludedServices}
                onChangeText={setExcludedServices}
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
                placeholder='e.g. Cleaning excludes deep cleaning, window cleaning, carpet cleaning, etc'
                multiline={true}
                numberOfLines={4}
              />
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Category</Text>
              <CategoryDropdown
                options={categories}
                selectedOption={selectedCategory}
                setSelectedOption={setSelectedCategory}
              />
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Base Price</Text>
              <Input
                onFocus={() => setIsFocused('basePrice')}
                onBlur={() => setIsFocused(null)}
                isFocused={isFocused === 'basePrice'}
                onChangeText={setBasePrice}
                value={basePrice ? basePrice.toString() : ''}
                backround={COLORS.card}
                style={{ borderRadius: 12, backgroundColor: COLORS.input, borderColor: COLORS.inputBorder, borderWidth: 1, height: 50 }}
                placeholder='e.g. 20'
                keyboardType={'numeric'}
              />
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Status</Text>
              <CategoryDropdown
                options={[{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]}
                selectedOption={selectedStatus}
                setSelectedOption={setSelectedStatus}
              />
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Service Options</Text>
              {dynamicOptions.map((opt) => (
                <View key={opt.id} style={{ marginBottom: 20, padding: 10, borderWidth: 1, borderRadius: 10, borderColor: COLORS.inputBorder }}>
                  {/* Main Option Name */}
                  <Input
                    value={opt.name}
                    onChangeText={(text) => updateMainOptionName(opt.id!, text)}
                    placeholder="Main option (e.g. sqft, extras)"
                    style={{ marginBottom: 10 }}
                  />
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <TouchableOpacity
                      onPress={() =>
                        setDynamicOptions(prev =>
                          prev.map(o =>
                            o.id === opt.id ? { ...o, multipleSelect: !o.multipleSelect } : o
                          )
                        )
                      }
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        borderWidth: 2,
                        borderColor: COLORS.inputBorder,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 8,
                        backgroundColor: !opt.multipleSelect ? COLORS.primary : COLORS.input,
                      }}
                    >
                      {!opt.multipleSelect && (
                        <Ionicons name="checkmark" size={18} color={COLORS.white} />
                      )}
                    </TouchableOpacity>
                    <Text>Allow multiple selection</Text>
                  </View>

                  {/* Sub Options */}
                  {opt.subOptions.map((sub) => (
                    <View key={sub.id} style={{ marginBottom: 10, borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: 8, padding: 8 }}>
                      <Input
                        value={sub.label}
                        onChangeText={(text) => updateSubOption(opt.id!, sub.id!, "label", text)}
                        placeholder="Value (e.g. 10 sqft)"
                        style={{ marginBottom: 5 }}
                      />
                      <Input
                        value={String(sub.additionalPrice)}
                        onChangeText={(text) => updateSubOption(opt.id!, sub.id!, "additionalPrice", text)}
                        placeholder="Price (e.g. +$15)"
                        style={{ marginBottom: 5 }}
                        keyboardType={'numeric'}
                      />
                      <Input
                        value={sub.notes}
                        onChangeText={(text) => updateSubOption(opt.id!, sub.id!, "notes", text)}
                        placeholder="Notes (e.g. measure carefully)"
                      />
                      <TouchableOpacity onPress={() => removeSubOption(opt.id!, sub.id!)} style={{ marginTop: 5 }}>
                        <Ionicons name="trash-outline" size={20} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Add Sub-Option Button */}
                  <TouchableOpacity onPress={() => addSubOption(opt.id!)} style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>
                    <Ionicons name="add" size={20} color={COLORS.black} style={{ marginRight: 5 }} />
                    <Text>Add Variety</Text>
                  </TouchableOpacity>

                  {/* Remove Main Option */}
                  <TouchableOpacity onPress={() => removeMainOption(opt.id!)} style={{ marginTop: 8 }}>
                    <Ionicons name="trash-outline" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
              {/* Add Main Option Button */}
              <TouchableOpacity
                onPress={addMainOption}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: COLORS.black,
                }}
              >
                <Ionicons name="add" size={20} color={COLORS.black} style={{ marginRight: 5 }} />
                <Text>Add Option</Text>
              </TouchableOpacity>
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
                  Alert.alert('Listing Completed');
                  navigation.goBack();
                }}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                  {catalogue ? 'Update' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
  );
};

export default ServiceCatalogueForm