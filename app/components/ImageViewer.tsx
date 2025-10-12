import React, { useState } from 'react';
import { View, Image, TouchableOpacity, Modal, Text, ScrollView, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ImageViewer = ({ imageUrls }: { imageUrls: string[] }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  return (
    <View style={{ marginTop: 10 }}>
      {/* Thumbnail Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {imageUrls.map((url, index) => (
          <TouchableOpacity key={index} onPress={() => setSelectedImage(url)}>
            <Image
              source={{ uri: url }}
              style={{
                width: (screenWidth - 60) / 3,
                height: 100,
              }}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Modal for Large Image View */}
      <Modal visible={!!selectedImage} transparent={true} animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.9)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            onPress={() => setSelectedImage(null)}
            style={{
              position: 'absolute',
              top: 40,
              right: 20,
              zIndex: 10,
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: 8,
            }}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={{
              justifyContent: 'center',
              alignItems: 'center',
              flexGrow: 1,
            }}
            maximumZoomScale={3}
            minimumZoomScale={1}
          >
            <Image
              source={{ uri: selectedImage || '' }}
              style={{
                width: screenWidth * 0.9,
                height: screenHeight * 0.6,
                resizeMode: 'contain',
              }}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default ImageViewer;
