import { db, storage } from './firebaseConfig';  // Import the Firestore instance
import { collection, addDoc, serverTimestamp, getDocs, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';  // Import Firebase storage functions
import { doc, getDoc } from 'firebase/firestore';
import { set } from 'date-fns';

export interface SettlerService {
    id?: string;
    settlerId: string;
    settlerFirstName: string;
    settlerLastName: string;

    serviceReferenceId: string;  
    serviceReferenceCategory: string;
    serviceReferenceTitle: string;
    isExperienced: boolean;
    serviceReferenceDescription: string;
    serviceCardImageUrls: string[];
    serviceCardBrief: string;
    isAvailableImmediately: boolean;
    availableDays: string[];
    serviceStartTime: string;
    serviceEndTime: string;

    addressId: string;
    latitude: number;
    longitude: number;
    addressName: string;
    address: string;
    addressAdditionalDetails: string;
    postcode: string;

    qualifications: string[];
    isActive: boolean;
    ratingCount?: number;
    averageRating?: number;
    createdAt: any;
    updatedAt: any;
    
}

// Utility function to map Firestore document data to SettlerService interface
const mapDocToSettlerService = (doc: any): SettlerService => {
  const settlerServiceData = doc.data();
  return {
    id: doc.id,
    settlerId: settlerServiceData.settlerId,
    settlerFirstName: settlerServiceData.settlerFirstName,
    settlerLastName: settlerServiceData.settlerLastName,

    serviceReferenceId: settlerServiceData.serviceReferenceId, 
    serviceReferenceCategory: settlerServiceData.serviceReferenceCategory,
    serviceReferenceTitle: settlerServiceData.serviceReferenceTitle,
    serviceReferenceDescription: settlerServiceData.serviceReferenceDescription,
    isExperienced: settlerServiceData.isExperienced,
    serviceCardImageUrls: settlerServiceData.serviceCardImageUrls,
    serviceCardBrief: settlerServiceData.serviceCardBrief,
    isAvailableImmediately: settlerServiceData.isAvailableImmediately,
    availableDays: settlerServiceData.availableDays,
    serviceStartTime: settlerServiceData.serviceStartTime,
    serviceEndTime: settlerServiceData.serviceEndTime,

    addressId: settlerServiceData.addressId,
    latitude: settlerServiceData.latitude,
    longitude: settlerServiceData.longitude,
    addressName: settlerServiceData.addressName,
    address: settlerServiceData.address,
    addressAdditionalDetails: settlerServiceData.addressAdditionalDetails,
    postcode: settlerServiceData.postcode,

    qualifications: settlerServiceData.qualifications,
    isActive: settlerServiceData.isActive,
    ratingCount: settlerServiceData.ratingCount,
    averageRating: settlerServiceData.averageRating,
    createdAt: settlerServiceData.createdAt,
    updatedAt: settlerServiceData.updatedAt
  };
};

export const uploadImages = async (imageName: string, imagesUrl: string[]) => {
  const urls: string[] = [];

  for (const uri of imagesUrl) {
    try {
      // Convert to Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate unique filename
      const filename = `settler_service_assets/${imageName}_${imagesUrl.indexOf(uri)}.jpg`;
      const storageRef = ref(storage, filename);

      // Upload file
      const uploadTask = uploadBytesResumable(storageRef, blob);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          snapshot => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload ${filename}: ${progress.toFixed(2)}% done`);
          },
          reject, // Handle error
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            urls.push(downloadURL);
            resolve();
          }
        );
      });

    } catch (error) {
      console.error("Upload failed:", error);
    }
  }

  console.log("All images uploaded:", urls);
  return urls; // Return all uploaded image URLs
};

export const createSettlerService = async (serviceData: SettlerService) => {
    try {
        const serviceRef = collection(db, 'settler_services');
        const docRef = await addDoc(serviceRef, serviceData);
    
        if (serviceData.serviceCardImageUrls && serviceData.serviceCardImageUrls.length > 0) {
          const uploadedUrls = await uploadImages(docRef.id, serviceData.serviceCardImageUrls);
          await updateDoc(doc(db, 'settler_job_assets', docRef.id), { imageUrls: uploadedUrls });
        }
        console.log('Settler job saved successfully');
      } catch (error) {
        console.error('Error saving settler job: ', error);
        throw error;  // Throwing the error to handle it at the call site
      }
}

export const fetchUserSettlerServices = async (userId: string): Promise<SettlerService[]> => {
  try {
    const settlerServiceList: SettlerService[] = [];
    const snapshot = await getDocs(collection(db, 'settler_services')); 
    snapshot.forEach(doc => {
      const settlerService = mapDocToSettlerService(doc);
      if (settlerService.settlerId === userId) { 
        settlerServiceList.push(settlerService);
      }
    });
    return settlerServiceList;
  } catch (error) {
    console.error('Error fetching settler service list: ', error);
    throw error;  
  }
};

export const fetchSelectedSettlerService = async (settlerServiceId: string): Promise<SettlerService | null> => {
  try {
    const settlerServiceRef = doc(db, 'settler_services', settlerServiceId);
    const settlerServiceDoc = await getDoc(settlerServiceRef);

    if (settlerServiceDoc.exists() && settlerServiceDoc.data()) {
      return mapDocToSettlerService(settlerServiceDoc);
    } else {
      console.log('No such selected settler service exists.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching selected settler service: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

export const updateSettlerService = async (settlerServiceId: string, updatedSettlerService: Partial<SettlerService>) => {
  try {
    const settlerServiceRef = doc(db, 'settler_services', settlerServiceId);
    await updateDoc(settlerServiceRef, updatedSettlerService);
    console.log('Settler service updated successfully');
  } catch (error) {
    console.error('Error updating settler service: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};