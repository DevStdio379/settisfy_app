import { useState, useEffect } from 'react';
import { Alert, ActionSheetIOS, Platform } from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

export const useEvidenceForm = (initialImages: string[] = [], initialRemark: string = '') => {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [remark, setRemark] = useState<string>(initialRemark);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (initialImages.length > 0) {
      setImageUrls(initialImages);
      setSelectedImageUrl(initialImages[0]);
    }
    if (initialRemark) setRemark(initialRemark);
  }, [initialImages, initialRemark]);

  const handleImageSelect = () => {
    if (imageUrls.length >= 5) {
      Alert.alert('Limit Reached', 'You can only select up to 5 images.');
      return;
    }

    const selectFromGallery = () => selectImages();
    const useCameraOption = () => cameraImage();

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Choose from Gallery', 'Use Camera'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) selectFromGallery();
          else if (buttonIndex === 2) useCameraOption();
        }
      );
    } else {
      Alert.alert('Add Photo', 'Choose an option', [
        { text: 'Choose from Gallery', onPress: selectFromGallery },
        { text: 'Use Camera', onPress: useCameraOption },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const selectImages = async () => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      selectionLimit: 5 - imageUrls.length,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel || response.errorMessage) return;

      const selected = response.assets?.map(a => a.uri).filter(Boolean) as string[];
      const updated = [...imageUrls, ...selected];
      setImageUrls(updated);
      setSelectedImageUrl(updated[0]);
    });
  };

  const cameraImage = async () => {
    if (imageUrls.length >= 5) {
      Alert.alert('You can only select up to 5 images.');
      return;
    }

    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchCamera(options, async (response) => {
      if (response.didCancel || response.errorMessage) return;

      const newUri = response.assets?.[0]?.uri;
      if (newUri) {
        const updated = [...imageUrls, newUri];
        setImageUrls(updated);
        setSelectedImageUrl(updated[0]);
      }
    });
  };

  const deleteImage = () => {
    if (!selectedImageUrl) return;
    const updated = imageUrls.filter(img => img !== selectedImageUrl);
    setImageUrls(updated);
    setSelectedImageUrl(updated.length > 0 ? updated[0] : null);
  };

  return {
    imageUrls,
    selectedImageUrl,
    setSelectedImageUrl,
    remark,
    isFocused,
    setRemark,
    setIsFocused,
    handleImageSelect,
    deleteImage,
  };
};
