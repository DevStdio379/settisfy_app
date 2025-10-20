import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../constants/theme';
import { Booking, updateBooking } from '../services/BookingServices';
import { GlobalStyleSheet } from '../constants/StyleSheet';
import Input from './Input/Input';
import EvidenceForm from './Forms/EvidenceForm';

interface Props {
    booking: Booking;
    selectedIncompletionImageUrl?: string | null;
    setSelectedIncompletionImageUrl?: (url: string) => void;
    isEditable?: boolean; // ✅ new prop
}

const BookingSummaryCard: React.FC<Props> = ({
    booking,
    selectedIncompletionImageUrl,
    setSelectedIncompletionImageUrl,
    isEditable = false, // default: not editable
}) => {
    const images = booking.catalogueService.imageUrls || [];

    // 1️⃣ Local copy of addons (for dynamic toggle)
    const [localAddons, setLocalAddons] = useState(
        booking.incompletionAddonsCheck?.length
            ? booking.incompletionAddonsCheck
            : booking.addons || []
    );

    // 2️⃣ Dynamic total
    const [calculatedTotal, setCalculatedTotal] = useState(0);

    // 3️⃣ Calculate total whenever addons change
    useEffect(() => {
        let total = Number(booking.catalogueService.basePrice) || 0;

        localAddons.forEach(addon => {
            addon.subOptions.forEach(opt => {
                if (opt.isCompleted) total += Number(opt.additionalPrice) || 0;
            });
        });

        total += 2; // Platform fee

        if (booking.manualQuotePrice) {
            total += Number(booking.manualQuotePrice);
        }

        setCalculatedTotal(total);
    }, [localAddons, booking]);

    // 4️⃣ Toggle handler (immutable)
    const handleToggleAddon = (addonIndex: number, subIndex: number) => {
        if (!isEditable) return; // ✅ prevent toggle if not editable

        setLocalAddons(prevAddons =>
            prevAddons.map((addon, i) => {
                if (i !== addonIndex) return addon;
                return {
                    ...addon,
                    subOptions: addon.subOptions.map((opt, j) =>
                        j === subIndex ? { ...opt, isCompleted: !opt.isCompleted } : opt
                    ),
                };
            })
        );
    };

    const activeAddons = localAddons;

    return (
        <View style={{ width: '100%', paddingTop: 20, gap: 10 }}>
            {/* Product Info */}
            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                <Image
                    source={{ uri: images[0] }}
                    style={{ width: 100, height: 100, borderRadius: 8, marginRight: 16 }}
                />
                <View style={{ flex: 1, marginTop: 5 }}>
                    <Text style={{ fontSize: 16, marginBottom: 5 }}>
                        <Text style={{ color: '#E63946', fontWeight: 'bold' }}>
                            RM{calculatedTotal.toFixed(2)}
                        </Text>{' '}
                        / Session
                    </Text>
                    <Text
                        style={{
                            fontSize: 16,
                            fontWeight: 'bold',
                            marginBottom: 5,
                            color: COLORS.title,
                            marginTop: 10,
                        }}
                    >
                        {booking.incompletionAddonsCheck?.length
                            ? 'Job Incompletion Pricing Breakdown'
                            : 'Service Pricing Breakdown'}
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.black }}>
                        Product ID: {booking.catalogueService.id}
                    </Text>
                </View>
            </View>

            <View style={GlobalStyleSheet.line} />

            {/* Booking Info */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.title }}>
                        Booking ID:
                    </Text>
                    <Text style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
                        {booking.id}
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.title }}>
                        Service Location:
                    </Text>
                    <Text style={{ fontSize: 14, color: '#666' }}>
                        {booking.selectedAddress?.addressName || ''}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.title }}>
                        Reference Number:
                    </Text>
                    <Text style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
                        {booking.serviceStartCode || 'N/A'}
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.title }}>
                        Service Date:
                    </Text>
                    <Text style={{ fontSize: 14, color: COLORS.title }}>
                        {booking.selectedDate}
                    </Text>
                </View>
            </View>

            <View style={GlobalStyleSheet.line} />

            {/* Service Breakdown */}
            <Text
                style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    marginBottom: 5,
                    color: COLORS.title,
                    marginTop: 10,
                }}
            >
                Service Pricing Breakdown
            </Text>

            <View style={{ marginBottom: 20 }}>
                {/* Base Price */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ fontSize: 14, color: '#333' }}>Service Price</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold' }}>
                        RM{booking.catalogueService.basePrice}
                    </Text>
                </View>

                {/* Add-ons */}
                {activeAddons.map((addon, addonIndex) => (
                    <View key={addon.name}>
                        {addon.subOptions.map((opt, subIndex) => (
                            <View
                                key={opt.label}
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 6,
                                    opacity: opt.isCompleted ? 1 : 0.4,
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <TouchableOpacity
                                        disabled={!isEditable} // ✅ disable if not editable
                                        onPress={() => handleToggleAddon(addonIndex, subIndex)}
                                        style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: 5,
                                            borderWidth: 2,
                                            borderColor: COLORS.inputBorder,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginRight: 8,
                                            backgroundColor: opt.isCompleted
                                                ? COLORS.primary
                                                : COLORS.input,
                                            opacity: isEditable ? 1 : 0.5, // visually indicate disabled
                                        }}
                                    >
                                        {opt.isCompleted && (
                                            <Ionicons name="checkmark" size={16} color={COLORS.white} />
                                        )}
                                    </TouchableOpacity>

                                    <Text style={{ fontSize: 14, color: '#333' }}>
                                        {addon.name}: {opt.label}
                                    </Text>
                                </View>

                                <Text style={{ fontSize: 14, fontWeight: 'bold' }}>
                                    RM{opt.additionalPrice}
                                </Text>
                            </View>
                        ))}
                    </View>
                ))}

                {/* Platform Fee */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ fontSize: 14, color: '#333' }}>Platform Fee</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold' }}>RM2.00</Text>
                </View>

                {/* Manual Quote */}
                {booking.manualQuoteDescription && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', flex: 1 }}>
                            <Text style={{ fontSize: 14, color: '#333' }}>Additional Charge (by settler)</Text>
                            <Text
                                style={{
                                    fontSize: 14,
                                    backgroundColor: COLORS.primaryLight,
                                    padding: 10,
                                    borderRadius: 10,
                                    marginLeft: 8,
                                }}
                            >
                                {booking.manualQuoteDescription}
                            </Text>
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>
                            RM{booking.manualQuotePrice || 0}
                        </Text>
                    </View>
                )}

                {/* Divider */}
                <View
                    style={[
                        { backgroundColor: COLORS.black, height: 1, margin: 10, width: '90%', alignSelf: 'center' },
                    ]}
                />

                {/* Total */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Total</Text>
                    <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold' }}>
                        RM{calculatedTotal.toFixed(2)}
                    </Text>
                </View>
            </View>

            {/* Job Incompletion Evidence */}
            {localAddons.some(addon => addon.subOptions.some(opt => !opt.isCompleted)) && (
                <View>
                    <EvidenceForm
                        title='Incompletion Evidence'
                        description="Attach photos and remarks to verify your service completion."
                        initialImages={booking?.settlerEvidenceImageUrls ?? []}
                        initialRemark={booking?.settlerEvidenceRemark ?? ''}
                        onSubmit={async ({ images, remark }) => { }}
                    />
                </View>
            )}
        </View>
    );
};

export default BookingSummaryCard;
