import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Alert,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import axios from "axios";
import Ionicons from "react-native-vector-icons/Ionicons";
import Geolocation from "react-native-geolocation-service";
import { COLORS } from "../../constants/theme";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/RootStackParamList";

const GOOGLE_PLACES_API_KEY = "AIzaSyBtCRz4SdAZB2B0DxXZ0gaQrMRN_1vIKBA";

type SearchAddressScreenProps = StackScreenProps<RootStackParamList, "SearchAddress">;

const SearchAddress = ({ navigation }: SearchAddressScreenProps) => {
  const [location, setLocation] = useState<any | null>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
      },
      (error) => {
        console.log(error.code, error.message);
        Alert.alert("Error", "Failed to fetch current location");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);

  const fetchPlacesAutocomplete = async (input: string) => {
    if (!location || !input.trim()) return;
    const { latitude, longitude } = location.coords;

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&location=${latitude},${longitude}&radius=5000&key=${GOOGLE_PLACES_API_KEY}`;
    setLoading(true);

    try {
      const response = await axios.get(url);
      if (response.data.status === "OK") {
        setPlaces(response.data.predictions);
      } else {
        setPlaces([]);
      }
    } catch (error) {
      console.error("Error fetching autocomplete:", error);
    } finally {
      setLoading(false);
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

        navigation.navigate("AddAddress", {
          latitude: lat,
          longitude: lng,
          addressName,
          address,
          postcode,
          isEditMode: false,
        });
      } else {
        Alert.alert("Error", "Failed to fetch place details");
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons size={24} color={COLORS.title} name="chevron-back-outline" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Address</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ padding: 12, marginBottom: 12 }}>
        <Text style={{ color: COLORS.black, fontSize: 20, fontWeight: "600", marginBottom: 6 }}>
          Set your address
        </Text>
        <Text style={{ color: COLORS.black, fontSize: 13, lineHeight: 18 }}>
          Set your address to define where the service can be provided to you. This helps service providers locate you easily.
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={20} color={COLORS.blackLight} style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search nearby places..."
          placeholderTextColor={COLORS.blackLight}
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            fetchPlacesAutocomplete(text);
          }}
        />
      </View>

      {/* Current Location Shortcut */}
      {location && (
        <TouchableOpacity
          style={styles.currentLocationCard}
          onPress={() => {
            navigation.navigate("AddAddress", {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              addressName: "Current Location",
              address: "",
              postcode: "",
              isEditMode: false,
            });
          }}
        >
          <Ionicons name="locate" size={22} color={COLORS.primary} style={{ marginRight: 12 }} />
          <Text style={{ color: COLORS.title, fontWeight: "600", fontSize: 15 }}>
            Use Current Location
          </Text>
        </TouchableOpacity>
      )}

      {/* Results */}
      <FlatList
        data={places}
        keyExtractor={(item) => item.place_id}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : searchQuery ? (
            <Text style={styles.emptyText}>No results found</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultItem}
            onPress={() => fetchPlaceDetails(item.place_id, item.description)}
          >
            <Ionicons name="location-outline" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
            <Text style={styles.resultText}>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundColor,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: 60,
    borderBottomColor: COLORS.card,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  backButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.title,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.title,
    fontSize: 15,
  },
  currentLocationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowRadius: 4,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  resultText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.title,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.blackLight,
    marginTop: 20,
  },
});

export default SearchAddress;
