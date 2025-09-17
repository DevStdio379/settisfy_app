import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { SIZES } from '../../constants/theme';
import MapView, { Region } from "react-native-maps";
import { RootStackParamList } from '../../navigation/RootStackParamList';
import { StackScreenProps } from '@react-navigation/stack';


type EditLocationPinPointScreenProps = StackScreenProps<RootStackParamList, 'EditLocationPinPoint'>;
const EditLocationPinPoint = ({ navigation, route }: EditLocationPinPointScreenProps) => {
  const mapRef = useRef<MapView>(null);
  const { location } = route.params;

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
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
      />

      {/* Fixed Pin */}
      <View style={styles.centralPin}>
        <View style={styles.pinIcon} />
      </View>

      {/* Coordinates Display */}
      <View style={styles.coordinatesContainer}>
        <Text style={styles.coordinatesText}>
          Latitude: {region.latitude.toFixed(6)}
        </Text>
        <Text style={styles.coordinatesText}>
          Longitude: {region.longitude.toFixed(6)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  centralPin: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -12,
    marginTop: -24,
  },
  pinIcon: {
    width: 15,
    height: 15,
    backgroundColor: "red",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "white",
  },
  coordinatesContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    borderRadius: 8,
  },
  coordinatesText: {
    color: "white",
  },
});


export default EditLocationPinPoint