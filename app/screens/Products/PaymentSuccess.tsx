import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { RootStackParamList } from "../../navigation/RootStackParamList";
import { StackScreenProps } from "@react-navigation/stack";
import { COLORS, SIZES } from "../../constants/theme";
import { IMAGES } from "../../constants/Images";

type PaymentSuccessScreenProps = StackScreenProps<RootStackParamList, 'PaymentSuccess'>;

const PaymentSuccessScreen = ({ navigation, route }: PaymentSuccessScreenProps) => {

    const [index, setIndex] = useState(1);
    const { borrowingId, collectionCode, latitude, longitude, addressName, address, postcode } = route.params;

    return (
        <View style={styles.container}>
            {index === 0 ? (
                < View style={{ justifyContent: 'center', alignItems:'center' }}>
                    <View style={styles.iconContainer}>
                        <View style={styles.successCircle}>
                            <Ionicons name="checkmark" style={styles.successIcon} />
                        </View>
                    </View>
                    <Text style={styles.title}>Payment Successful!</Text>
                    <Text style={styles.subtitle}>You made a smart choice</Text>
                    <TouchableOpacity
                        onPress={() => setIndex(index + 1) }
                        style={{ width: SIZES.width * 0.8, backgroundColor: COLORS.primary, borderRadius: 12, padding: 15 }}>
                        <Text style={{ color: COLORS.white, textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>Okay</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                < View style={{ justifyContent: 'center', alignItems:'center' }}>
                    {/* Success Icon */}
                    <Text style={styles.title}>You’ll collect your item at</Text>
                    <Text style={styles.subtitle}>{addressName}, {address}, {postcode}</Text>
                    <Image
                        style={{
                            height: 250,
                            width: SIZES.width,
                            resizeMode: 'contain'
                        }}
                        source={IMAGES.pickupLocation}
                    />
                    <Text style={styles.subtitle}>Open in Google Maps</Text>
                    <View style={{ backgroundColor: COLORS.blackLight, height: 1, margin: 10, width: '90%', alignSelf: 'center', }} />
                    <Text style={styles.subtitle}>Remember to treat people kindly upon meetup</Text>

                    {/* Button */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('BottomNavigation', { screen: 'MyBorrowingsStack' })}
                        style={{ width: SIZES.width * 0.8, backgroundColor: COLORS.primary, borderRadius: 12, padding: 15 }}>
                        <Text style={{ color: COLORS.white, textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>Go to My Borrowing</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 16,
    },
    iconContainer: {
        marginBottom: 30,
    },
    successCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#4CAF50",
        justifyContent: "center",
        alignItems: "center",
    },
    successIcon: {
        fontSize: 60,
        color: "#fff",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 10,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 30,
    },
    button: {
        width: "80%",
        backgroundColor: "#4CAF50",
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default PaymentSuccessScreen;
