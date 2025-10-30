import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MapView, { Marker } from 'react-native-maps';
import { COLORS, SIZES } from '../../constants/theme';
import Input from '../../components/Input/Input';
import { useUser } from '../../context/UserContext';
import { deleteUserAddress, getUserAddressById, saveUserAddress, updateUserAddress } from '../../services/AddressServices';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import { StackScreenProps } from '@react-navigation/stack';

type AddAddressScreenProps = StackScreenProps<RootStackParamList, 'AddAddress'>;

const AddAddress = ({ navigation, route }: AddAddressScreenProps) => {
  const { latitude: lat, longitude: lng, addressName: addrName, address: addr, postcode: post } = route.params;
  const { user } = useUser();
  const mapRef = useRef<MapView | null>(null);

  const [buildingType, setBuildingType] = useState('house');
  const [fullAddress, setFullAddress] = useState('');
  const [postcode, setPostcode] = useState(post || '');
  const [addressLabel, setAddressLabel] = useState('home');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSelectedUserAddress = async () => {
    try {
      if (!user?.uid || !route.params.addressInfo?.id) return;

      setRefreshing(true);
      const fetched = await getUserAddressById(user.uid, route.params.addressInfo.id);

      if (fetched) {
        setBuildingType(fetched.buildingType || 'house');
        setFullAddress(fetched.fullAddress || '');
        setPostcode(fetched.postcode || '');
        setAddressLabel(fetched.addressLabel || 'home');
        setPhoneNumber(fetched.phoneNumber || '');
      }
    } catch (error) {
      console.error('Error fetching selected address:', error);
      Alert.alert('Error', 'Failed to refresh address details.');
    } finally {
      setRefreshing(false);
    }
  };


  useEffect(() => {

    if (route.params.addressInfo) {
      const info = route.params.addressInfo;
      setBuildingType(info.buildingType || 'house');
      setFullAddress(info.fullAddress || '');
      setPostcode(info.postcode || '');
      setAddressLabel(info.addressLabel || 'home');
      setPhoneNumber(info.phoneNumber || '');
    }

    mapRef.current?.animateCamera({
      center: { latitude: lat, longitude: lng },
      zoom: 18,
    });
  }, []);

  const handleSaveAddress = async () => {
    setLoading(true);
    const userId = user?.uid;
    const addressData = {
      latitude: lat,
      longitude: lng,
      addressName: addrName,
      address: addr,
      buildingType,
      fullAddress,
      postcode,
      addressLabel,
      phoneNumber,
      createAt: new Date(),
      updatedAt: new Date(),
    };

    if (!userId) return Alert.alert('Error', 'User not found');
    if (!phoneNumber) return Alert.alert('Error', 'Please enter your phone number');
    if (!fullAddress) {
      setLoading(false);
      return Alert.alert('Error', 'Please enter the full address');
    }

    // If postcode is provided, ensure it appears in the full address (loose validation).
    if (postcode) {
      const normalize = (s: string) => s.replace(/[^a-z0-9]/gi, '').toLowerCase();
      const normalizedAddress = normalize(fullAddress);
      const normalizedPostcode = normalize(postcode);

      if (!normalizedAddress.includes(normalizedPostcode)) {
        setLoading(false);
        return Alert.alert(
          'Error',
          'Postcode does not match the full address. Please include the postcode in the address field or correct it.'
        );
      }
    }

    if (route.params.isEditMode && route.params.addressInfo?.id) {
      // Update existing address logic can be implemented here
      // For simplicity, we'll just alert that this feature is not implemented
      await updateUserAddress(userId, route.params.addressInfo.id, addressData);
      Alert.alert('Success', 'Address updated successfully!');
    } else {
      // Save new address
      await saveUserAddress(userId, addressData);
      Alert.alert('Success', 'Address saved successfully!');
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'BottomNavigation', params: { screen: 'AddressBook' } }],
    });
  };

  const handleDelete = () => {
    if (!route.params.addressInfo) return;

    Alert.alert(
      'Delete Address Information',
      'Are you sure you want to delete this address record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteUserAddress(user!.uid, route.params.addressInfo!.id!);
              Alert.alert('Deleted', 'Address information deleted successfully.');
              navigation.goBack();
            } catch (err) {
              console.error('Failed to delete address info', err);
              Alert.alert('Error', 'Failed to delete address information. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const buildingOptions = [
    { label: 'House', value: 'house' },
    { label: 'Apartment', value: 'apartment' },
    { label: 'Office', value: 'office' },
    { label: 'Hotel', value: 'hotel' },
  ];

  const labelOptions = [
    { label: 'Home', value: 'home' },
    { label: 'Work', value: 'work' },
    { label: 'Other', value: 'other' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.backgroundColor }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIcon}
        >
          <Ionicons size={28} color={COLORS.black} name='chevron-back-outline' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Address Details</Text>
        {route.params.addressInfo ? (
          <TouchableOpacity
            onPress={handleDelete}
            style={{ height: 40, width: 40, alignItems: 'center', justifyContent: 'center', opacity: loading ? 0.6 : 1 }}
            disabled={loading}
            accessibilityLabel="Delete company information"
            accessibilityRole="button"
          >
            <Ionicons name="trash-outline" size={30} color="#ff3b30" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 240 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchSelectedUserAddress}
            tintColor={COLORS.primary}
          />
        }
      >
        {route.params.addressInfo?.id ? (
          <Text style={{ marginTop: 15, color: COLORS.black, fontSize: 15, fontWeight: 'bold' }}>
            Address ID: {route.params.addressInfo.id}
          </Text>
        ) : null}
        {/* Map Section */}
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
            >
              <Marker coordinate={{ latitude: lat, longitude: lng }} />
            </MapView>
          </View>
          {/* <TouchableOpacity style={styles.editPinBtn}>
            <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>Edit Pin</Text>
          </TouchableOpacity> */}
        </View>

        {/* Address Info */}
        <Text style={styles.addressText}>
          <Text style={{ fontWeight: 'bold' }}>{addrName}, </Text>{addr}, {post}
        </Text>

        {/* Building Type */}
        <AddressCard title="Building Type">
          <View style={styles.optionContainer}>
            {buildingOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setBuildingType(option.value)}
                style={[
                  styles.optionButton,
                  buildingType === option.value && styles.optionButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    buildingType === option.value && styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </AddressCard>


        {/* Full Address */}
        <AddressCard title="Full Address">
          <Input
            placeholder='e.g. No. 123, Jalan Ampang, Kuala Lumpur'
            value={fullAddress}
            onChangeText={setFullAddress}
            style={{
              height: 120, paddingTop: 12, textAlignVertical: 'top', borderRadius: 12,
              backgroundColor: COLORS.backgroundColor,
              borderColor: COLORS.inputBorder,
              borderWidth: 1,
            }}
            backround={COLORS.card}
            multiline
            numberOfLines={4}
          />
        </AddressCard>

        {/* Postcode */}
        <AddressCard title="Postcode">
          <Input
            placeholder='e.g. 81700'
            value={postcode}
            onChangeText={setPostcode}
            style={styles.inputBox}
            backround={COLORS.card}
            keyboardType="numeric"
          />
        </AddressCard>

        {/* Address Label */}
        <AddressCard title="Address Label">
          <View style={styles.radioGroup}>
            {labelOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.labelOption,
                  addressLabel === option.value && styles.labelSelected,
                ]}
                onPress={() => setAddressLabel(option.value)}
              >
                <Text
                  style={{
                    color: addressLabel === option.value ? COLORS.white : COLORS.title,
                    fontWeight: 'bold',
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </AddressCard>

        {/* Phone Number */}
        <AddressCard title="Phone Number">
          <Input
            placeholder='e.g. +601 7123 456789'
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            style={styles.inputBox}
            backround={COLORS.card}
            keyboardType="numeric"
          />
        </AddressCard>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { opacity: loading ? 0.7 : 1 }]}
          onPress={handleSaveAddress}
          disabled={loading}
        >
          <Text style={styles.saveBtnText}>{loading ? (route.params.addressInfo ? 'Updating...' : 'Saving...') : (route.params.addressInfo ? 'Update Address' : 'Save Address')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const AddressCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  header: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  headerIcon: {
    height: 45,
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.title,
  },
  mapContainer: {
    marginTop: 20,
  },
  mapWrapper: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  map: { ...StyleSheet.absoluteFillObject },
  editPinBtn: {
    position: 'absolute',
    alignSelf: 'center',
    top: 80,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 3,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.title,
    marginTop: 15,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 15,
    marginTop: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.title,
    marginBottom: 10,
  },
  inputBox: {
    borderRadius: 12,
    backgroundColor: COLORS.backgroundColor,
    borderColor: COLORS.inputBorder,
    borderWidth: 1,
    height: 50,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioCircle: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.borderColor,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  radioLabel: {
    fontSize: 15,
    color: COLORS.title,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelOption: {
    flex: 1,
    backgroundColor: COLORS.backgroundColor,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  labelSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 30,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },

  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },

  optionButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    backgroundColor: COLORS.backgroundColor,
  },

  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  optionText: {
    color: COLORS.title,
    fontSize: 14,
    fontWeight: '500',
  },

  optionTextActive: {
    color: COLORS.white,
  },

});

export default AddAddress;
