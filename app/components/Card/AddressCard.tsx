import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCwDLlujzSjj0sCU0eeVLms6ppZ6iqlFPc'

interface Address {
  addressName?: string;
  address?: string;
  additionalDetails?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
}

interface AddressCardProps {
  selectedAddress?: Address;
}

const AddressCard: React.FC<AddressCardProps> = ({ selectedAddress }) => {
  if (!selectedAddress) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No address selected</Text>
      </View>
    );
  }

  const openInMaps = () => {
    const lat = selectedAddress.latitude;
    const lng = selectedAddress.longitude;
    const addressString = selectedAddress.address || selectedAddress.addressName || '';
    const url =
      lat && lng
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressString)}`;
    Linking.openURL(url).catch(err => console.warn('Failed to open maps', err));
  };

  const mapImageUri =
    selectedAddress.latitude && selectedAddress.longitude
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${selectedAddress.latitude},${selectedAddress.longitude}&zoom=15&size=600x300&markers=color:red%7C${selectedAddress.latitude},${selectedAddress.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      : `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(
          selectedAddress.address || '',
        )}&zoom=14&size=600x300&key=${GOOGLE_MAPS_API_KEY}`;

  const formattedAddress = [
    selectedAddress.additionalDetails,
    selectedAddress.addressName,
    selectedAddress.address,
    selectedAddress.postcode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.container}>
      {/* Map Preview */}
      <View style={styles.mapContainer}>
        <TouchableOpacity activeOpacity={0.9} onPress={openInMaps}>
          <Image source={{ uri: mapImageUri }} style={styles.mapImage} resizeMode="cover" />
        </TouchableOpacity>
      </View>

      {/* Address Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.addressText}>{formattedAddress}</Text>

        <TouchableOpacity activeOpacity={0.8} onPress={openInMaps} style={styles.mapButton}>
          <Text style={styles.mapButtonText}>Open in Maps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddressCard;

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: COLORS.card,
    marginVertical: 12,
    overflow: 'hidden',
  },
  mapContainer: {
    height: 120,
    backgroundColor: '#eee',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 16,
  },
  addressText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  mapButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  emptyContainer: {
    borderRadius: 16,
    backgroundColor: COLORS.card,
    marginVertical: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.blackLight,
    fontSize: 15,
  },
});
