import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Alert, FlatList, TextInput, TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps";
import axios from "axios";
import { COLORS, SIZES } from "../../constants/theme";
import { GlobalStyleSheet } from "../../constants/StyleSheet";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from "@react-navigation/native";
import Geolocation from 'react-native-geolocation-service';
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/RootStackParamList";

const GOOGLE_PLACES_API_KEY = "AIzaSyBtCRz4SdAZB2B0DxXZ0gaQrMRN_1vIKBA";

type SearchAddressScreenProps = StackScreenProps<RootStackParamList, 'SearchAddress'>;
const SearchAddress = ({ navigation, route }: SearchAddressScreenProps) => {

  const [location, setLocation] = useState<any | null>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number; address: string; addressName?: string } | null>(null);

  useEffect(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        console.log(position);
        setLocation(position);
        setSelectedLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: "Current Location",
        });
      },
      (error) => {
        console.log(error.code, error.message);
        Alert.alert("Error", "Failed to fetch current location");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);


  const fetchPlacesAutocomplete = async (input: string) => {
    if (!location) return;
    const { latitude, longitude } = location.coords;

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&location=${latitude},${longitude}&radius=5000&key=${GOOGLE_PLACES_API_KEY}`;

    try {
      const response = await axios.get(url);
      if (response.data.status === "OK") {
        setPlaces(response.data.predictions);
      } else {
        setPlaces([]);
      }
    } catch (error) {
      console.error("Error fetching autocomplete:", error);
    }
  };

  const fetchPlaceDetails = async (placeId: string, description: string) => {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_PLACES_API_KEY}`;
    try {
      const response = await axios.get(url);
      if (response.data.status === "OK") {
        const { lat, lng } = response.data.result.geometry.location;
        const parts = description.split(",");
        const addressName = parts[0];
        const address = parts.slice(1).join(",").trim();
        const postcode = response.data.result.address_components.find((component: any) =>
          component.types.includes("postal_code")
        )?.long_name;

        const newLocation = {
          latitude: lat,
          longitude: lng,
          addressName,
          address,
          postcode,
        };

        setSelectedLocation(newLocation);
        return newLocation;
      } else {
        Alert.alert("Error", "Failed to fetch place details");
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.backgroundColor, paddingVertical: 10, paddingHorizontal: 15 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, gap: 10 }}>
        <TouchableOpacity
          style={{ padding: 10, borderColor: COLORS.inputBackground, borderWidth: 1, borderRadius: 10 }}
          onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={COLORS.title} />
        </TouchableOpacity>
        <TextInput
          style={{ flex: 1, padding: 10, backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.borderColor }}
          placeholder="Search nearby places..."
          placeholderTextColor={COLORS.blackLight}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            fetchPlacesAutocomplete(text);
          }}
        />
      </View>
      <FlatList
        data={places}
        keyExtractor={(item) => item.place_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              padding: 10,
              borderBottomWidth: 1,
              borderBottomColor: "#ccc",
            }}
            onPress={() => {
              fetchPlaceDetails(item.place_id, item.description).then((location) => {
                if (location) {
                  navigation.navigate('AddAddress', {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    addressName: location.addressName || '',
                    address: location.address,
                    postcode: location.postcode,
                  });
                }
              });
            }}
          >
            <Text>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  confirmationContainer: { padding: 20, alignItems: "center" },
  locationDetails: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  addressName: { fontSize: 16, fontWeight: "bold" },
  address: { fontSize: 14 },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.placeholder,
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: { marginLeft: 10 },
  backButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 12,
    width: "90%",
    alignItems: "center",
  },
  backButtonText: { color: COLORS.white, fontWeight: "bold" },
});

export default SearchAddress