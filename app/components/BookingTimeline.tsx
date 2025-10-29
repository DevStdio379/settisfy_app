import React, { useState, useCallback } from 'react';
import {
    View,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
} from 'react-native';
import { Booking, BookingActivityType } from '../services/BookingServices';
import BookingSummaryCard from './BookingSummaryCard';
import EvidenceCard from './Card/EvidenceCard';

type BookingTimelineProps = {
    booking: Booking;
    refreshing?: boolean;
    onRefresh?: () => void;
    formatAnyTimestamp?: (ts?: string | number) => string;
    COLORS?: {
        primary?: string;
        secondary?: string;
        danger?: string;
    };
};

const defaultColors = {
    primary: '#007AFF',
    secondary: '#FF9500',
    danger: '#FF3B30',
};

const defaultFormat = (ts?: string | number) =>
    ts ? new Date(Number(ts)).toLocaleString() : '';

export default function BookingTimeline({
    booking,
    refreshing = false,
    onRefresh,
    formatAnyTimestamp = defaultFormat,
    COLORS = defaultColors,
}: BookingTimelineProps) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const toggleExpand = useCallback(
        (index: number) => {
            setExpandedIndex(prev => (prev === index ? null : index));
        },
        []
    );

    const getReadableType = (type?: BookingActivityType, message?: string) => {
        const map: Record<string, string> = {
            // initial booking state
            [BookingActivityType.QUOTE_CREATED]: 'Quote Created',
            [BookingActivityType.NOTES_TO_SETTLER_UPDATED]: 'Notes to Settler Updated',
            [BookingActivityType.SETTLER_ACCEPT]: 'Settler Accepted',
            [BookingActivityType.SETTLER_SELECTED]: 'Settler Selected',

            // active service state
            [BookingActivityType.SETTLER_SERVICE_START]: 'Service Started',
            [BookingActivityType.SETTLER_SERVICE_END]: 'Service Completed',
            [BookingActivityType.SETTLER_EVIDENCE_SUBMITTED]: 'Completion Evidence Submitted',
            [BookingActivityType.SETTLER_EVIDENCE_UPDATED]: 'Completion Evidence Updated',

            // incompletion state
            [BookingActivityType.JOB_COMPLETED]: 'Customer marked job as completed',
            [BookingActivityType.JOB_INCOMPLETE]: 'Customer marked job as incomplete',
            [BookingActivityType.CUSTOMER_JOB_INCOMPLETE_UPDATED]: 'Customer updated incompletion report',
            [BookingActivityType.CUSTOMER_REJECT_INCOMPLETION_RESOLVE]: 'Customer rejected incompletion resolution',
            [BookingActivityType.SETTLER_RESOLVE_INCOMPLETION]: 'Settler choose to resolve incompletion',
            [BookingActivityType.SETTLER_UPDATE_INCOMPLETION_EVIDENCE]: 'Settler updated incompletion resolution evidence',
            [BookingActivityType.SETTLER_REJECT_INCOMPLETION]: 'Settler rejected incompletion report',
            [BookingActivityType.CUSTOMER_CONFIRM_COMPLETION]: 'Customer confirmed completion',

            // cooldown state
            [BookingActivityType.COOLDOWN_REPORT_SUBMITTED]: 'Cooldown report submitted',
            [BookingActivityType.CUSTOMER_COOLDOWN_REPORT_UPDATED]: 'Customer updated cooldown report',
            [BookingActivityType.SETTLER_RESOLVE_COOLDOWN_REPORT]: 'Settler choose to resolve cooldown report',
            [BookingActivityType.SETTLER_UPDATE_COOLDOWN_REPORT_EVIDENCE]: 'Settler updated cooldown evidence',
            [BookingActivityType.CUSTOMER_COOLDOWN_REPORT_NOT_RESOLVED]: 'Customer marked cooldown resolution as not resolved',
            [BookingActivityType.COOLDOWN_REPORT_COMPLETED]: 'Cooldown report completed',
            [BookingActivityType.SETTLER_REJECT_COOLDOWN_REPORT]: 'Settler rejected cooldown report',

            // final booking state
            [BookingActivityType.BOOKING_COMPLETED]: 'Booking completed',

        };
        return map[type ?? ''] || message || 'Activity';
    };

    const renderItem = ({ item, index }: any) => {
        const isExpanded = expandedIndex === index;
        const addons = Array.isArray(item.addons) ? item.addons : [];
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => toggleExpand(index)}
                style={styles.row}
            >
                <View style={styles.dotColumn}>
                    <View
                        style={[
                            styles.dot,
                            {
                                backgroundColor:
                                    item.actor === 'SETTLER'
                                        ? COLORS.primary
                                        : COLORS.secondary,
                            },
                        ]}
                    />
                </View>
                <View style={styles.content}>
                    <Text style={styles.text}>{getReadableType(item.type, item.message)}</Text>
                    <Text style={styles.timestamp}>
                        {formatAnyTimestamp(item.timestamp)}
                    </Text>

                    {isExpanded && (
                        <View style={styles.detailsContainer}>
                            {item.type === BookingActivityType.QUOTE_CREATED && (
                                <View>
                                    <Text style={styles.subtitle}>Booking Summary:</Text>
                                    <BookingSummaryCard
                                        booking={booking}
                                        selectedAddons={item.addons}
                                        isEditable={false}
                                        hideCheckboxes
                                    />
                                    <Text style={styles.subtitle}>Notes to Settler with Images:</Text>
                                    {item.notesToSettlerImageUrls?.length ? (
                                        <View style={{ flexDirection: 'row', marginVertical: 4 }}>
                                            {item.notesToSettlerImageUrls.map((uri: string, i: number) => (
                                                <Image
                                                    key={i}
                                                    source={{ uri }}
                                                    style={styles.thumb}
                                                />
                                            ))}
                                        </View>
                                    ) : (
                                        <Text style={styles.subtext}>No images</Text>
                                    )}
                                    <Text style={styles.subtext}>
                                        {item.notesToSettler || 'No notes provided.'}
                                    </Text>
                                </View>
                            )}

                            {item.type === BookingActivityType.NOTES_TO_SETTLER_UPDATED && (
                                <EvidenceCard
                                    title="Updated Notes to Settler with Images"
                                    imageUrls={item.notesToSettlerImageUrls}
                                    remark={item.notesToSettler}
                                />
                            )}

                            {item.type === BookingActivityType.SETTLER_ACCEPT && (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {item.settlerProfileImageUrl ? (
                                        <Image
                                            source={{ uri: item.settlerProfileImageUrl }}
                                            style={{ width: 48, height: 48, borderRadius: 24, marginRight: 10, backgroundColor: '#f0f0f0' }}
                                        />
                                    ) : (
                                        <View style={{ width: 48, height: 48, borderRadius: 24, marginRight: 10, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}>
                                            <Text style={{ color: '#999' }}>N/A</Text>
                                        </View>
                                    )}
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.text}>
                                            {(((item.firstName ?? '') + ' ' + (item.lastName ?? '')).trim() || 'Unknown Settler')}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {item.type === BookingActivityType.SETTLER_SELECTED && (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {item.settlerProfileImageUrl ? (
                                        <Image
                                            source={{ uri: item.settlerProfileImageUrl }}
                                            style={{ width: 48, height: 48, borderRadius: 24, marginRight: 10, backgroundColor: '#f0f0f0' }}
                                        />
                                    ) : (
                                        <View style={{ width: 48, height: 48, borderRadius: 24, marginRight: 10, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}>
                                            <Text style={{ color: '#999' }}>N/A</Text>
                                        </View>
                                    )}
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.text}>
                                            {(((item.settlerFirstName ?? '') + ' ' + (item.settlerLastName ?? '')).trim() || 'Unknown Settler')}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {item.type === BookingActivityType.SETTLER_SERVICE_START && (
                                <View>
                                    <Text style={{}}>Settler started the service.</Text>
                                </View>
                            )}

                            {item.type === BookingActivityType.SETTLER_SERVICE_END && (
                                <View>
                                    <Text style={{}}>Settler ended the service.</Text>
                                </View>
                            )}

                            {item.type === BookingActivityType.SETTLER_EVIDENCE_SUBMITTED && (
                                <EvidenceCard
                                    title="Completion Evidence with Remark"
                                    imageUrls={item.settlerEvidenceImageUrls}
                                    remark={item.settlerEvidenceRemark}
                                />
                            )}

                            {item.type === BookingActivityType.SETTLER_EVIDENCE_UPDATED && (
                                <EvidenceCard
                                    title="Updated Completion Evidence with Remark"
                                    imageUrls={item.settlerEvidenceImageUrls}
                                    remark={item.settlerEvidenceRemark}
                                />
                            )}

                            {item.type === BookingActivityType.JOB_INCOMPLETE && (
                                <EvidenceCard
                                    title="Incompletion Report Evidence"
                                    imageUrls={item.incompletionReportImageUrls}
                                    remark={item.incompletionReportRemark}
                                />
                            )}

                            {item.type === BookingActivityType.SETTLER_RESOLVE_INCOMPLETION && (
                                <View>
                                    <Text style={{}}>Settler attempts to resolve the incompletion.</Text>
                                </View>
                            )}

                            {item.type === BookingActivityType.SETTLER_UPDATE_INCOMPLETION_EVIDENCE && (
                                <EvidenceCard
                                    title="Updated Incompletion Resolution Evidence"
                                    imageUrls={item.incompletionResolvedImageUrls}
                                    remark={item.incompletionResolvedRemark}
                                />
                            )}

                            {item.type === BookingActivityType.CUSTOMER_REJECT_INCOMPLETION_RESOLVE && (
                                <EvidenceCard
                                    title="Updated Evidence to Counter Incompletion Resolution"
                                    imageUrls={item.incompletionReportImageUrls}
                                    remark={item.incompletionReportRemark}
                                />
                            )}

                            {item.type === BookingActivityType.SETTLER_REJECT_INCOMPLETION && (
                                <View>
                                    <Text style={{}}>Settler not agree to the reported incompletion.</Text>
                                </View>
                            )}

                            {item.type === BookingActivityType.CUSTOMER_CONFIRM_COMPLETION && (
                                <View>
                                    <Text style={{}}>Customer confirmed the job as completed.</Text>
                                </View>
                            )}

                            {item.type === BookingActivityType.COOLDOWN_REPORT_SUBMITTED && (
                                <EvidenceCard
                                    title="Evidence for Cooldown Report Submission"
                                    imageUrls={item.cooldownReportImageUrls}
                                    remark={item.cooldownReportRemark}
                                />
                            )}

                            {item.type === BookingActivityType.CUSTOMER_COOLDOWN_REPORT_UPDATED && (
                                <EvidenceCard
                                    title="Updated Evidence for Cooldown Report"
                                    imageUrls={item.cooldownReportImageUrls}
                                    remark={item.cooldownReportRemark}
                                />
                            )}

                            {item.type === BookingActivityType.SETTLER_RESOLVE_COOLDOWN_REPORT && (
                                <View>
                                    <Text style={{}}>Settler attempts to resolve the cooldown report.</Text>
                                </View>
                            )}

                            {item.type === BookingActivityType.SETTLER_UPDATE_COOLDOWN_REPORT_EVIDENCE && (
                                <EvidenceCard
                                    title="Updated Cooldown Resolution Evidence"
                                    imageUrls={item.cooldownResolvedImageUrls}
                                    remark={item.cooldownResolvedRemark}
                                />
                            )}

                            {item.type === BookingActivityType.CUSTOMER_COOLDOWN_REPORT_NOT_RESOLVED && (
                                <EvidenceCard
                                    title="Updated Evidence to Counter Cooldown Resolution"
                                    imageUrls={item.cooldownReportImageUrls}
                                    remark={item.cooldownReportRemark}
                                />
                            )}

                            {item.type === BookingActivityType.SETTLER_REJECT_COOLDOWN_REPORT && (
                                <View>
                                    <Text style={{}}>Settler not agree to the reported cooldown problem.</Text>
                                </View>
                            )}

                            {item.type === BookingActivityType.BOOKING_COMPLETED && (
                                <View>
                                    <Text style={{}}>Booking has been completed.</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const data = booking?.timeline?.slice().reverse() || [];

    return (
        <FlatList
            data={data}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.scrollContainer}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListHeaderComponent={<Text style={styles.title}>Activity Timeline</Text>}
            renderItem={renderItem}
            ListEmptyComponent={
                <Text style={styles.empty}>No activity recorded yet.</Text>
            }
        />
    );
}

const styles = StyleSheet.create({
    scrollContainer: { padding: 15, paddingBottom: 80 },
    title: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    row: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 14,
        padding: 10,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        elevation: 1,
    },
    dotColumn: { width: 24, alignItems: 'center' },
    dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
    content: { flex: 1, paddingLeft: 6 },
    text: { fontSize: 14, fontWeight: '600', color: '#333' },
    timestamp: { fontSize: 12, color: '#999', marginBottom: 4 },
    detailsContainer: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 6,
    },
    subtitle: { fontWeight: '600', marginTop: 4, marginBottom: 4 },
    subtext: { color: '#666', fontSize: 13 },
    thumb: {
        width: 72,
        height: 54,
        borderRadius: 6,
        marginRight: 6,
        backgroundColor: '#f0f0f0',
    },
    empty: { color: '#999', textAlign: 'center', marginTop: 40 },
});
