import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../constants/theme';
import Input from '../../components/Input/Input';
import { useEvidenceForm } from '../../helper/useEvidenceForm';

interface EvidenceFormProps {
  title: string;
  description: string;
  initialImages?: string[];
  initialRemark?: string;
  onSubmit: (data: { images: string[]; remark: string }) => Promise<void> | void;
}

const EvidenceForm: React.FC<EvidenceFormProps> = ({
  title,
  description,
  initialImages = [],
  initialRemark = '',
  onSubmit,
}) => {
  const {
    imageUrls,
    selectedImageUrl,
    remark,
    isFocused,
    setRemark,
    setIsFocused,
    setSelectedImageUrl,
    handleImageSelect,
    deleteImage,
  } = useEvidenceForm(initialImages, initialRemark);

  const handleSubmit = async () => {
    if (imageUrls.length === 0 || !remark.trim()) {
      Alert.alert('Evidence & Remarks are required.');
      return;
    }
    await onSubmit({ images: imageUrls, remark });
  };

  return (
    <View style={{ width: '100%', paddingTop: 20, gap: 10 }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.title, marginTop: 10 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 13, color: COLORS.blackLight2 }}>{description}</Text>

      <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
        {selectedImageUrl ? (
          <View style={{ width: '100%', position: 'relative' }}>
            <Image
              source={{ uri: selectedImageUrl }}
              style={{
                width: '100%',
                height: 300,
                borderRadius: 10,
                marginBottom: 10,
              }}
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={deleteImage}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: 8,
                borderRadius: 20,
              }}
            >
              <Ionicons name="trash-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {imageUrls.map((uri, idx) => (
                <TouchableOpacity key={idx} onPress={() => setSelectedImageUrl(uri)}>
                  <Image
                    source={{ uri }}
                    style={{
                      width: 80,
                      height: 80,
                      marginRight: 10,
                      borderRadius: 10,
                      borderWidth: selectedImageUrl === uri ? 3 : 0,
                      borderColor: selectedImageUrl === uri ? COLORS.primary : 'transparent',
                    }}
                  />
                </TouchableOpacity>
              ))}

              {imageUrls.length < 5 && (
                <TouchableOpacity
                  onPress={handleImageSelect}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: COLORS.blackLight,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: COLORS.card,
                  }}
                >
                  <Ionicons name="add-outline" size={28} color={COLORS.blackLight} />
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleImageSelect}
            style={{
              width: '100%',
              height: 100,
              borderRadius: 10,
              marginBottom: 10,
              backgroundColor: COLORS.card,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: COLORS.blackLight,
            }}
          >
            <Ionicons name="add-outline" size={30} color={COLORS.blackLight} />
            <Text style={{ color: COLORS.blackLight, fontSize: 14 }}>Add photos here</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={{ fontSize: 15, fontWeight: 'bold', color: COLORS.title, marginVertical: 10 }}>
        Remarks
      </Text>
      <Input
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        isFocused={isFocused}
        onChangeText={setRemark}
        value={remark}
        backround={COLORS.card}
        placeholder="e.g. All in good conditions."
        multiline
        numberOfLines={10}
        style={{
          fontSize: 12,
          borderRadius: 12,
          backgroundColor: COLORS.input,
          borderColor: COLORS.inputBorder,
          borderWidth: 1,
          height: 150,
        }}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        style={{
          backgroundColor: COLORS.primary,
          padding: 15,
          borderRadius: 10,
          marginVertical: 10,
          width: '100%',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Submit Evidence</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EvidenceForm;
