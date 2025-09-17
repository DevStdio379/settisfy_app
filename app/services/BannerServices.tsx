import { db } from './firebaseConfig';  // Import Firestore instance
import { collection, getDocs } from 'firebase/firestore';  // Firestore functions

// Define the Banner interface
export interface Banner {
  id: string;
  buttonText: string;
  createAt: any;  // Use the Firebase Timestamp object for createAt
  hyperlinkUrl: string;
  imageUrl: string;
  title: string;
}

// Function to fetch banners from Firestore
export const fetchBanners = async (): Promise<Banner[]> => {
  try {
    const bannerList: Banner[] = [];
    const snapshot = await getDocs(collection(db, 'banners'));  // Fetch banners from 'banners' collection
    snapshot.forEach(doc => {
      const bannerData = doc.data();
      const banner: Banner = {
        id: doc.id,
        buttonText: bannerData.buttonText,
        createAt: bannerData.createAt,  // Firestore timestamp
        hyperlinkUrl: bannerData.hyperlinkUrl,
        imageUrl: bannerData.imageUrl,
        title: bannerData.title,
      };
      bannerList.push(banner);  // Push formatted banner to the list
    });
    return bannerList;
  } catch (error) {
    console.error('Error fetching banners: ', error);
    throw error;  // Throw error to handle it at the call site
  }
};
