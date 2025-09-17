import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { COLORS, SIZES } from '../../constants/theme';
import MapView, { Region } from "react-native-maps";
import { RootStackParamList } from '../../navigation/RootStackParamList';
import { StackScreenProps } from '@react-navigation/stack';

type AddressMapViewScreenProps = StackScreenProps<RootStackParamList, 'AddressMapView'>;
const AddressMapView = ({ navigation, route }: AddressMapViewScreenProps) => {
  const mapRef = useRef<MapView>(null);
  const { latitude, longitude } = route.params;
  const initialLocation = { latitude, longitude };
  const [location, setLocation] = useState(initialLocation);

  const ASPECT_RATIO = SIZES.width / SIZES.height;
  const LATITUDE_DELTA = 0.01;
  const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

  const [region, setRegion] = useState<Region>({
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
  };

  useEffect(() => {
    // Lock camera to maximum zoom level
    mapRef.current?.animateCamera({
      center: { latitude: location.latitude, longitude: location.longitude },
      zoom: 18, // Max zoom level for react-native-maps
      heading: 0,
      pitch: 0,
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.backgroundColor }}>
      <MapView
        ref={mapRef}
        style={{ width: '100%', height: '100%' }}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
      />

      {/* Fixed Pin */}
      <View style={{ position: "absolute", top: "50%", left: "50%", marginLeft: -12, marginTop: -24 }}>
        <View style={{ width: 15, height: 15, backgroundColor: "red", borderRadius: 12, borderWidth: 2, borderColor: "white" }} />
      </View>

      {/* Coordinates Display */}
      <View style={{ position: "absolute", bottom: 20, left: 20, backgroundColor: "rgba(0, 0, 0, 0.5)", padding: 10, borderRadius: 8 }}>
        <Text style={{ color: COLORS.white }}>
          Latitude: {region.latitude.toFixed(6)}
        </Text>
        <Text style={{ color: COLORS.white }}>
          Longitude: {region.longitude.toFixed(6)}
        </Text>
      </View>

      {/* Confirm Location Button */}
      <View style={{ position: "absolute", bottom: 20, right: 20 }}>
        <TouchableOpacity
          style={{ backgroundColor: COLORS.primary, padding: 10, borderRadius: 8 }}
          onPress={() => {
            // Handle confirm location action
            console.log('Location confirmed:', region);
          }}
        >
          <Text style={{ color: COLORS.white }}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddressMapView
