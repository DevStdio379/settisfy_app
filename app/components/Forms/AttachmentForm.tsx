import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../constants/theme';
import Input from '../Input/Input';
import { useAttachmentForm } from '../../helper/useAttachmentForm';

interface AttachmentFormProps {
  title: string;
  description: string;
  remarkPlaceholder?: string;
  initialImages?: string[];
  initialRemark?: string;
  showSubmitButton?: boolean;
  isEditable?: boolean;
  buttonText?: string;
  onChange?: (data: { images: string[]; remark: string }) => void;
  onSubmit?: (data: { images: string[]; remark: string }) => Promise<void> | void;
}

const AttachmentForm: React.FC<AttachmentFormProps> = ({
  title,
  description,
  remarkPlaceholder = '',
  initialImages = [],
  initialRemark = '',
  showSubmitButton = true,
  isEditable = false,
  buttonText = '',
  onChange, // ✅ include this prop
  onSubmit,

}) => {
  const {
    imageUrls,
    selectedImageUrl,
    remark,
    isFocused,
    setIsFocused,
    setSelectedImageUrl,
    handleImageSelect,
    deleteImage,
    handleRemarkChange, // ✅ use this instead of setRemark
  } = useAttachmentForm(initialImages, initialRemark, onChange); // ✅ pass onChange to hook

  const handleSubmit = async () => {
    if (imageUrls.length === 0 || !remark.trim()) {
      Alert.alert('Evidence & Remarks are required.');
      return;
    }
    await onSubmit!({ images: imageUrls, remark });
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
            {isEditable && (
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
            )}

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

              {isEditable && imageUrls.length < 5 && (
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
        readOnly={!isEditable}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        isFocused={isFocused}
        onChangeText={handleRemarkChange} // ✅ use handleRemarkChange instead of setRemark
        value={remark}
        backround={COLORS.card}
        placeholder={remarkPlaceholder}
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

      {showSubmitButton && onSubmit && (
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
          <Text style={{ color: 'white', fontWeight: 'bold' }}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default AttachmentForm;
