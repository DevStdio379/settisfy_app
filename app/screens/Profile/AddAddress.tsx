import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native'
import { useTheme } from '@react-navigation/native';
import Header from '../../layout/Header';
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import Input from '../../components/Input/Input';
import { COLORS, SIZES } from '../../constants/theme';
import { useUser } from '../../context/UserContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MapView, { Marker } from 'react-native-maps';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import { StackScreenProps } from '@react-navigation/stack';
import { saveUserAddress } from '../../services/AddressServices';

type AddAddressScreenProps = StackScreenProps<RootStackParamList, 'AddAddress'>;
const AddAddress = ({ navigation, route }: AddAddressScreenProps) => {
  const { latitude: lat, longitude: lng, addressName: addrName, address: addr, postcode: post } = route.params;
  const mapRef = useRef<MapView | null>(null);
  const { user } = useUser();

  const [selectedOption, setSelectedOption] = useState<string | null>('house');
  const [isFocused1, setisFocused1] = useState(false)
  const [isFocused2, setisFocused2] = useState(false)
  const [isFocused3, setisFocused3] = useState(false)
  const [isFocused4, setisFocused4] = useState(false)

  const options = [
    { name: 'House', icon: 'home' },
    { name: 'Apartment', icon: 'business' },
    { name: 'Office', icon: 'briefcase' },
    { name: 'Hotel', icon: 'bed' },
  ];
  const snapPoints = useMemo(() => ['25%', '50%', '100%'], []);
  const [buildingType, setBuildingType] = useState('house');
  const [additionalDetails, setAdditionalDetails] = useState<string | undefined>();
  const [postcode, setPostcode] = useState<string | undefined>(post);
  const [addressLabel, setAddressLabel] = useState<string | undefined>();
  const [deliveryInstruction, setDeliveryInstruction] = useState<string | undefined>();

  useEffect(() => {
    // Lock camera to maximum zoom level
    mapRef.current?.animateCamera({
      center: { latitude: lat, longitude: lng },
      zoom: 18, // Max zoom level for react-native-maps
      heading: 0,
      pitch: 0,
    });
  }, []);

  const handleSaveAddress = async () => {
    const userId = user?.uid;
    const addressData = {
      latitude: lat,
      longitude: lng,
      addressName: addrName,
      address: addr,
      buildingType: buildingType || '',
      additionalDetails: additionalDetails || '',
      postcode: postcode || '',
      addressLabel: addressLabel || '',
      instruction: deliveryInstruction || '',
      createAt: new Date(),
      updatedAt: new Date(),
    };

    if (userId && Object.values(addressData).every(val => val !== '')) {
      await saveUserAddress(userId, addressData); // Save address to Firestore
      Alert.alert('Success', 'Address saved successfully!');
      navigation.reset({
        index: 0,
        routes: [{ name: 'BottomNavigation', params: { screen: 'AddressBook' } }],
      });
    } else {
      Alert.alert('Error', 'Please fill in all fields');
    }
  };

  return (
    <View style={{ backgroundColor: COLORS.backgroundColor, flex: 1 }}>
      <View style={{ height: 60, borderBottomColor: COLORS.card, borderBottomWidth: 1 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 5 }}>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                height: 45, width: 45, alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons size={30} color={COLORS.black} name='chevron-back-outline' />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.title, textAlign: 'center', marginVertical: 10 }}>Add Address</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            {/* right header element */}
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, marginBottom: 50 }}>
        <View style={styles.mapContainer}>
          <View style={styles.mapWrapper}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.0005,
                longitudeDelta: 0.0005,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              toolbarEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: lat,
                  longitude: lng,
                }}
                title="house"
              />

            </MapView>
          </View>
          <TouchableOpacity
            style={{ position: 'absolute', borderRadius: 12, backgroundColor: COLORS.primary, padding: 10, elevation: 3, alignItems: 'center', right: SIZES.width * 0.4, top: SIZES.height * 0.15 }}
            // onPress={() => navigation.navigate('EditLocationPinPoint', { location: address })}
            onPress={() => { }}
          >
            <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>Edit Pin</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 14, color: COLORS.title, marginBottom: 10 }}><Text style={{ fontSize: 14, color: COLORS.title, fontWeight: 'bold' }}>{addrName}, </Text>{addr}, {post}</Text>
        <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Building Type</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
          {options.map(option => (
            <TouchableOpacity
              key={option.name}
              onPress={() => {
                setSelectedOption(option.name.toLowerCase());
                setBuildingType(option.name.toLowerCase());
              }}
              style={{
                backgroundColor: selectedOption === option.name.toLowerCase() ? COLORS.primary : COLORS.card,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 15,
                marginRight: 10,
                marginBottom: 10,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons
                name={option.icon}
                size={20}
                color={selectedOption === option.name.toLowerCase() ? COLORS.white : COLORS.title}
                style={{ marginRight: 5 }}
              />
              <Text
                style={{
                  color: selectedOption === option.name.toLowerCase() ? COLORS.white : COLORS.title,
                  fontWeight: 'bold',
                }}
              >
                {option.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Additional Details</Text>
        <Input
          onFocus={() => setisFocused1(true)}
          onBlur={() => setisFocused1(false)}
          isFocused={isFocused1}
          onChangeText={setAdditionalDetails}
          backround={COLORS.card}
          style={styles.inputBox}
          placeholder='e.g. House number or name'
        />
        <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Postcode</Text>
        <Input
          onFocus={() => setisFocused2(true)}
          onBlur={() => setisFocused2(false)}
          isFocused={isFocused2}
          onChangeText={setPostcode}
          backround={COLORS.card}
          style={styles.inputBox}
          placeholder='e.g. SW1 2AB'
          value={postcode}
        />
        <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Address Label</Text>
        <Input
          onFocus={() => setisFocused3(true)}
          onBlur={() => setisFocused3(false)}
          isFocused={isFocused3}
          onChangeText={setAddressLabel}
          backround={COLORS.card}
          style={styles.inputBox}
          placeholder='e.g. Home, Work'
        />
        <View style={[GlobalStyleSheet.line, { marginTop: 15, marginBottom: 5 }]} />
        <Text style={{ fontSize: 16, color: COLORS.title, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Instruction for delivery person</Text>
        <Input
          onFocus={() => setisFocused4(true)}
          onBlur={() => setisFocused4(false)}
          isFocused={isFocused4}
          onChangeText={setDeliveryInstruction}
          backround={COLORS.card}
          style={styles.longInputBox}
          placeholder='e.g. Please knock instead of using the doorbell'
          multiline={true}  // Enable multi-line input
          numberOfLines={4} // Suggest the input area size
        />
        <View style={{ paddingVertical: 10, paddingHorizontal: 10 }}>
          <TouchableOpacity
            onPress={() => handleSaveAddress()}
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 12,
              paddingVertical: 15,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: COLORS.card, fontWeight: 'bold' }}>Save and Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  icon: {
    height: 28,
    width: 28,
    resizeMode: 'contain',
  },
  inputBox: {
    borderRadius: 12,
    backgroundColor: COLORS.input,
    borderColor: COLORS.inputBorder,
    borderWidth: 1,
    height: 50,
  },
  longInputBox: {
    borderRadius: 12,
    backgroundColor: COLORS.input,
    borderColor: COLORS.inputBorder,
    borderWidth: 1,
    height: 150,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black', // Dim color
    zIndex: 999, // Ensure it's above other content
  },
  cardBackground: {
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
    marginHorizontal: -15,
    paddingHorizontal: 15,
    paddingBottom: 15,
    marginBottom: 10
  },
  imageborder: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    height: 90,
    width: 90,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center'
  },
  WriteIconBackground: {
    height: 42,
    width: 42,
    borderRadius: 40,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    left: 60
  },
  WriteIcon: {
    height: 36,
    width: 36,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary
  },
  InputTitle: {

    fontSize: 13,
    color: COLORS.title,
    marginBottom: 5
  },
  bottomBtn: {
    height: 75,
    width: '100%',
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: .1,
    shadowRadius: 5,
  },
  checkboxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    backgroundColor: 'transparent',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginRight: 10,
    marginTop: 5,
  },
  mapContainer: {
    marginTop: 20,
    borderRadius: 50,
    backgroundColor: '#8ABE12',
  },
  mapWrapper: { // Wrapping View with borderRadius and overflow
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    borderColor: COLORS.blackLight,
    borderWidth: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
})


export default AddAddress