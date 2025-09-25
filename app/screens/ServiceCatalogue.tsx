import { View, Text, ScrollView, TouchableOpacity, Image, Linking, Alert, ActivityIndicator, TextInput, RefreshControl } from 'react-native'
import React, { useCallback, useState } from 'react'
import { COLORS } from '../constants/theme';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootStackParamList';
import axios from 'axios';
import { useStripe } from '@stripe/stripe-react-native';
import { serviceCatalogue } from '../constants/ServiceCatalogue';
import Input from '../components/Input/Input';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { GlobalStyleSheet } from '../constants/StyleSheet';
import { CategoryDropdown } from '../components/CategoryDropdown';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { createCatalogue } from '../services/CatalogueServices';

type ServiceCatalogueScreenProps = StackScreenProps<RootStackParamList, 'ServiceCatalogue'>

export const ServiceCatalogue = ({ navigation }: ServiceCatalogueScreenProps) => {

  const [isFocused2, setisFocused2] = useState(false);
  const [selectedServiceCardImageUrls, setSelectedServiceCardImageUrls] = useState<string | null>(null);
  const [serviceCardImageUrls, setServiceCardImageUrls] = useState<string[]>([]);
  const [serviceTitle, setServiceTitle] = useState<string>('');
  const [serviceCardBrief, setServiceCardBrief] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [basePrice, setBasePrice] = useState<number>(0);
  const [dynamicOptions, setDynamicOptions] = useState<
    {
      id: number;
      name: string;
      subOptions: { id: number; label: string; additionalPrice: number; notes: string }[];
    }[]
  >([]);

  // options addon
  const addMainOption = () => {
    setDynamicOptions((prev) => [
      ...prev,
      { id: Date.now(), name: "", subOptions: [] },
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
    await createCatalogue({
      imageUrls: serviceCardImageUrls,
      title: serviceTitle,
      description: serviceCardBrief,
      category: selectedCategory,
      basePrice: basePrice,
      dynamicOptions: dynamicOptions,
      isActive: true,
      createAt: new Date(),
      updateAt: new Date()
    })
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

  // Function to delete the selected image
  const deleteImage = () => {
    if (!selectedServiceCardImageUrls) return;

    const updatedImages = serviceCardImageUrls.filter((img) => img !== selectedServiceCardImageUrls);
    setServiceCardImageUrls(updatedImages);
    setSelectedServiceCardImageUrls(updatedImages.length > 0 ? updatedImages[0] : null);
  };

  const onRefresh = useCallback(() => {
  }, []);

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
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.title, textAlign: 'center', marginVertical: 10 }}>Add Service</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <TouchableOpacity
                style={{
                  borderRadius: 50,
                  padding: 10,
                }}
                onPress={() => navigation.navigate('SettlerAddService', { settlerService: null })}
              >
                <Ionicons name="add" size={25} color={COLORS.title} />
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
            <View style={{ width: '90%', paddingTop: 20, }}>
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
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Title</Text>
              <Input
                onFocus={() => setisFocused2(true)}
                onBlur={() => setisFocused2(false)}
                isFocused={isFocused2}
                onChangeText={setServiceTitle}
                backround={COLORS.card}
                style={{ borderRadius: 12, backgroundColor: COLORS.input, borderColor: COLORS.inputBorder, borderWidth: 1, height: 50 }}
                placeholder='e.g. Cleaning service'
              />
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Description</Text>
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
                placeholder='e.g. Cleaning includes house cleaning etc'
                multiline={true}
                numberOfLines={4}
              />
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Category</Text>
              <CategoryDropdown
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Base Price</Text>
              <Input
                onFocus={() => setisFocused2(true)}
                onBlur={() => setisFocused2(false)}
                isFocused={isFocused2}
                onChangeText={setBasePrice}
                backround={COLORS.card}
                style={{ borderRadius: 12, backgroundColor: COLORS.input, borderColor: COLORS.inputBorder, borderWidth: 1, height: 50 }}
                placeholder='e.g. 20'
                keyboardType={'numeric'}
              />
              <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Service Options</Text>
              {dynamicOptions.map((opt) => (
                <View key={opt.id} style={{ marginBottom: 20, padding: 10, borderWidth: 1, borderRadius: 10, borderColor: COLORS.inputBorder }}>
                  {/* Main Option Name */}
                  <Input
                    value={opt.name}
                    onChangeText={(text) => updateMainOptionName(opt.id, text)}
                    placeholder="Main option (e.g. sqft, extras)"
                    style={{ marginBottom: 10 }}
                  />

                  {/* Sub Options */}
                  {opt.subOptions.map((sub) => (
                    <View key={sub.id} style={{ marginBottom: 10, borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: 8, padding: 8 }}>
                      <Input
                        value={sub.label}
                        onChangeText={(text) => updateSubOption(opt.id, sub.id, "label", text)}
                        placeholder="Value (e.g. 10 sqft)"
                        style={{ marginBottom: 5 }}
                      />
                      <Input
                        value={String(sub.additionalPrice)}
                        onChangeText={(text) => updateSubOption(opt.id, sub.id, "additionalPrice", text)}
                        placeholder="Price (e.g. +$15)"
                        style={{ marginBottom: 5 }}
                        keyboardType={'numeric'}
                      />
                      <Input
                        value={sub.notes}
                        onChangeText={(text) => updateSubOption(opt.id, sub.id, "notes", text)}
                        placeholder="Notes (e.g. measure carefully)"
                      />
                      <TouchableOpacity onPress={() => removeSubOption(opt.id, sub.id)} style={{ marginTop: 5 }}>
                        <Ionicons name="trash-outline" size={20} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Add Sub-Option Button */}
                  <TouchableOpacity onPress={() => addSubOption(opt.id)} style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>
                    <Ionicons name="add" size={20} color={COLORS.black} style={{ marginRight: 5 }} />
                    <Text>Add Variety</Text>
                  </TouchableOpacity>

                  {/* Remove Main Option */}
                  <TouchableOpacity onPress={() => removeMainOption(opt.id)} style={{ marginTop: 8 }}>
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
                  handleListing()
                  Alert.alert('Listing Completed');
                  navigation.goBack();
                }}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default ServiceCatalogue