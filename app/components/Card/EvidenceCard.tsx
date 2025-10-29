// EvidenceCard.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

type EvidenceCardProps = {
    title?: string;
    imageUrls?: string[];
    remark?: string;
};

export default function EvidenceCard({
    title = 'Evidence',
    imageUrls = [],
    remark = '',
}: EvidenceCardProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            {imageUrls?.length ? (
                <View style={styles.imageRow}>
                    {imageUrls.map((uri, i) => (
                        <Image key={i} source={{ uri }} style={styles.thumb} />
                    ))}
                </View>
            ) : (
                <Text style={styles.subtext}>No images</Text>
            )}
            <Text style={styles.subtext}>
                {remark?.trim() ? remark : 'No remarks provided.'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginTop: 6 },
    title: { fontWeight: '600', marginBottom: 4 },
    imageRow: { flexDirection: 'row', marginVertical: 4 },
    thumb: {
        width: 72,
        height: 54,
        borderRadius: 6,
        marginRight: 6,
        backgroundColor: '#f0f0f0',
    },
    subtext: { color: '#666', fontSize: 13 },
});
