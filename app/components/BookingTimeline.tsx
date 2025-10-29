import React from 'react';
import {

View,
ScrollView,
RefreshControl,
Text,
TouchableOpacity,
StyleSheet,
} from 'react-native';

type TimelineItem = {
id?: string | number;
timestamp?: string | number;
actor?: string;
type?: string;
firstName?: string;
lastName?: string;
evidenceCount?: number;
oldTotal?: number;
newTotal?: number;
newAddons?: any[];
addons?: any[];
newManualQuotePrice?: number | null;
manualQuotePrice?: number | null;
isQuoteUpdateSuccessful?: '' | 'false' | 'true' | string;
message?: string;
[key: string]: any;
};

type Booking = {
timeline?: TimelineItem[];
newAddons?: any[];
addons?: any[];
newManualQuotePrice?: number | null;
manualQuotePrice?: number | null;
[key: string]: any;
};

type BookingTimelineProps = {
booking: Booking;
refreshing?: boolean;
onRefresh?: () => void;
onPressUser?: (item: TimelineItem) => void;
// optional formatter in case your app has a custom date formatter
formatAnyTimestamp?: (ts?: string | number) => string;
// optional color overrides
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
onPressUser,
formatAnyTimestamp = defaultFormat,
COLORS = defaultColors,
}: BookingTimelineProps) {
return (
    <View>
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={styles.inner}>
                <Text style={styles.title}>Activity Timeline</Text>

                {booking?.timeline?.length ? (
                    <View>
                        {booking.timeline
                            .slice()
                            .reverse()
                            .map((item, idx) => (
                                <View
                                    key={item.timestamp ?? item.id ?? idx}
                                    style={styles.row}
                                >
                                    {/* dot column */}
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

                                    {/* content */}
                                    <View style={styles.content}>
                                        {item.type === 'QUOTE_CREATED' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>Booking created.</Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type === 'NOTES_TO_SETTLER_CREATED' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>
                                                    Customer added notes to settler.
                                                </Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type === 'SETTLER_ACCEPT' && (
                                            <View style={styles.block}>
                                                <View style={styles.rowWrap}>
                                                    <Text style={styles.text}>Job accepted by </Text>
                                                    <TouchableOpacity
                                                        activeOpacity={0.7}
                                                        onPress={() => onPressUser?.(item)}
                                                    >
                                                        <Text style={styles.userLink}>
                                                            {item.firstName} {item.lastName}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type === 'SETTLER_SELECTED' && (
                                            <View style={styles.block}>
                                                <View style={styles.rowWrap}>
                                                    <Text style={styles.text}>Customer selected </Text>
                                                    <TouchableOpacity
                                                        activeOpacity={0.7}
                                                        onPress={() => onPressUser?.(item)}
                                                    >
                                                        <Text style={styles.userLink}>
                                                            {item.firstName} {item.lastName}
                                                        </Text>
                                                    </TouchableOpacity>
                                                    <Text style={styles.text}> as settler.</Text>
                                                </View>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type === 'SETTLER_SERVICE_START' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>Settler started service.</Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type === 'SETTLER_SERVICE_END' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>Settler ended service.</Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type === 'SETTLER_EVIDENCE_SUBMITTED' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>
                                                    Settler submitted {item.evidenceCount} evidence for job
                                                    completion.
                                                </Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type === 'JOB_INCOMPLETE' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>
                                                    Customer reported job as incomplete.
                                                </Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type === 'CUSTOMER_JOB_INCOMPLETE_UPDATED' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>
                                                    Customer updated the incompletion reason.
                                                </Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type === 'SETTLER_EVIDENCE_UPDATED' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>
                                                    Settler updated {item.evidenceCount} evidence for job
                                                    completion.
                                                </Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type === 'SETTLER_RESOLVE_INCOMPLETION' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>
                                                    Settler incoming to resolve the incompletion report.
                                                </Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type == 'SETTLER_REJECT_INCOMPLETION' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>
                                                    Settler has rejected the incompletion flag.
                                                </Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type == 'SETTLER_UPDATE_INCOMPLETION_EVIDENCE' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>
                                                    Settler has updated evidence to resolve the incompletion
                                                    flag.
                                                </Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}  

                                        {item.type === 'COOLDOWN_REPORT_SUBMITTED' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>
                                                    Customer submitted the cooldown report.
                                                </Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type === 'CUSTOMER_COOLDOWN_REPORT_UPDATED' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>
                                                    Customer updated the cooldown report.
                                                </Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type === 'SETTLER_RESOLVE_COOLDOWN_REPORT' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>
                                                    Settler incoming to resolve the cooldown report.
                                                </Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type === 'SETTLER_UPDATE_COOLDOWN_REPORT_EVIDENCE' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>
                                                    Settler has updated evidence to resolve the cooldown
                                                    report.
                                                </Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type === 'CUSTOMER_COOLDOWN_REPORT_NOT_RESOLVED' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>
                                                    Customer indicated that the cooldown report is not
                                                    resolved.
                                                </Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type === 'COOLDOWN_REPORT_COMPLETED' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>
                                                    Cooldown report has been resolved.
                                                </Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type === 'SETTLER_COOLDOWN_REPORT_REJECTED' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>
                                                    Settler has rejected the cooldown report.
                                                </Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}  



                                        {item.type === 'SETTLER_QUOTE_UPDATED' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>
                                                    Settler updated the quote from{' '}
                                                    <Text style={styles.bold}>RM{item.oldTotal}</Text> to{' '}
                                                    <Text style={styles.bold}>RM{item.newTotal}</Text>.
                                                </Text>

                                                {(() => {
                                                    const addons =
                                                        (item as any).newAddons ??
                                                        (item as any).addons ??
                                                        booking.newAddons ??
                                                        booking.addons ??
                                                        [];
                                                    const count = Array.isArray(addons)
                                                        ? addons.reduce(
                                                                (acc: number, addon: any) =>
                                                                    acc +
                                                                    (Array.isArray(addon.subOptions)
                                                                        ? addon.subOptions.length
                                                                        : 0),
                                                                0,
                                                            )
                                                        : 0;
                                                    const manualPrice =
                                                        (item as any).newManualQuotePrice ??
                                                        (item as any).manualQuotePrice ??
                                                        booking.newManualQuotePrice ??
                                                        booking.manualQuotePrice;
                                                    return (
                                                        <Text style={styles.text}>
                                                            Consists of{' '}
                                                            <Text style={styles.bold}>{count}</Text> selected
                                                            suboption{count === 1 ? '' : 's'}
                                                            {manualPrice != null && (
                                                                <>
                                                                    {' with a manual quote of '}
                                                                    <Text style={styles.bold}>RM{manualPrice}. </Text>
                                                                    {((item as any).isQuoteUpdateSuccessful ?? '') ===
                                                                    '' ? (
                                                                        <Text
                                                                            style={[
                                                                                styles.badge,
                                                                                { color: COLORS.secondary },
                                                                            ]}
                                                                        >
                                                                            [Awaiting Customer Response]
                                                                        </Text>
                                                                    ) : ((item as any).isQuoteUpdateSuccessful ?? '') ===
                                                                        'false' ? (
                                                                        <Text
                                                                            style={[
                                                                                styles.badge,
                                                                                { color: COLORS.danger },
                                                                            ]}
                                                                        >
                                                                            [Customer Rejected]
                                                                        </Text>
                                                                    ) : (
                                                                        <Text
                                                                            style={[
                                                                                styles.badge,
                                                                                { color: COLORS.primary },
                                                                            ]}
                                                                        >
                                                                            [Customer Accepted]
                                                                        </Text>
                                                                    )}
                                                                </>
                                                            )}
                                                        </Text>
                                                    );
                                                })()}

                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type === 'CUSTOMER_CONFIRM_COMPLETION' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>
                                                    Customer confirmed job completion.
                                                </Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type === 'JOB_COMPLETED' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>{item.message}</Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {item.type === 'BOOKING_COMPLETED' && (
                                            <View style={styles.block}>
                                                <Text style={styles.text}>
                                                    Booking has been marked as completed.
                                                </Text>
                                                <Text style={styles.timestamp}>
                                                    {formatAnyTimestamp(item.timestamp)}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}
                    </View>
                ) : (
                    <Text style={styles.empty}>No activity recorded yet.</Text>
                )}
            </View>
        </ScrollView>
    </View>
);
}

const styles = StyleSheet.create({
scrollContainer: { paddingBottom: 70, alignItems: 'center' },
inner: { marginVertical: 10, width: '100%', paddingHorizontal: 15 },
title: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
row: { marginBottom: 16, flexDirection: 'row' },
dotColumn: { width: 24, alignItems: 'center' },
dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    zIndex: 2,
},
content: { flex: 1, paddingLeft: 6 },
block: { marginBottom: 6 },
text: { color: '#333', fontSize: 14 },
timestamp: { color: '#999', fontSize: 12 },
rowWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
userLink: {
    textDecorationLine: 'underline',
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
},
bold: { fontWeight: 'bold' },
empty: { color: '#999' },
badge: { fontWeight: 'bold' },
});