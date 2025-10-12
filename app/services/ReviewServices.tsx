import { db, storage } from './firebaseConfig';  // Import the Firestore instance
import { collection, getDocs, addDoc, doc, updateDoc, getDoc, query, where } from 'firebase/firestore';  // Firestore functions
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';  // Import Firebase storage functions
import { Borrowing } from './BorrowingServices';
import { Alert } from 'react-native';

// Define the Review interface
export interface Review {
  id?: string;  // Add an optional id field
  bookingId: string;
  customerId: string;
  settlerId: string;
  catalogueServiceId: string;
  settlerServiceId: string;

  // borrowerReview
  customerOverallRating?: number;
  customerFeedback?: string[];
  customerOtherComment?: string;
  customerReviewImageUrls?: string[];
  customerCreateAt?: any;
  customerUpdatedAt?: any;
}

// Function to fetch a review based on borrowingId
export const getReviewByBookingId = async (productId: string, bookingId: string) => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const querySnapshot = await getDocs(reviewsRef);
    const reviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];

    const review = reviews.find(review => review.bookingId === bookingId);
    if (review) {
      return review;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching review: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

export const uploadImages = async (imageName: string, imagesUrl: string[]) => {
  const urls: string[] = [];

  for (const uri of imagesUrl) {
    try {
      // Convert to Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate unique filename
      const filename = `reviews/${imageName}_${imagesUrl.indexOf(uri)}.jpg`;
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


// Function to save a product to Firestore
export const createReview = async (review: Review, productId: string) => {
  try {
    const productRef = collection(db, 'reviews');
    const docRef = await addDoc(productRef, review);

    if (review.customerReviewImageUrls && review.customerReviewImageUrls.length > 0) {
      const uploadedUrls = await uploadImages(docRef.id, review.customerReviewImageUrls);
      await updateDoc(doc(db, 'reviews', docRef.id), { customerReviewImageUrls: uploadedUrls });
    }

    console.log('Review saved successfully with ID:', docRef.id);
    return docRef.id;  // Return the ID of the newly created review
  } catch (error) {
    console.error('Error saving review: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

// Function to update a product in Firestore
export const updateReview = async (productId: string, reviewId: string, updatedReview: Partial<Review>) => {
  try {
    const productRef = doc(db, 'reviews', reviewId);
    await updateDoc(productRef, updatedReview);
    console.log('Review updated successfully');
  } catch (error) {
    console.error('Error updating product: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

const mapDocToReviewService = (doc: any): Review => {
  const data = doc.data();
  return {
    id: doc.id,
    bookingId: data.bookingId,
    customerId: data.customerId,
    settlerId: data.settlerId,
    catalogueServiceId: data.catalogueServiceId,
    settlerServiceId: data.settlerServiceId,

    // borrowerReview
    customerOverallRating: data.customerOverallRating,
    customerFeedback: data.customerFeedback,
    customerOtherComment: data.customerOtherComment,
    customerReviewImageUrls: data.customerReviewImageUrls,
    customerCreateAt: data.customerCreateAt,
    customerUpdatedAt: data.customerUpdatedAt,  // Convert Firestore timestamp to JavaScript Date
  };
}


// Function to fetch reviews based on productId
export const fetchReviewsByCatalogueId = async (catalogueId: string) => {
  try {
    const catalogueReviewList: Review[] = [];
    const snapshot = await getDocs(collection(db, 'reviews'));
    snapshot.forEach(doc => {
      const settlerService = mapDocToReviewService(doc);
      if (settlerService.catalogueServiceId === catalogueId) {
        catalogueReviewList.push(settlerService);
      }
    });
    return catalogueReviewList;
  } catch (error) {
    console.error('Error fetching reviews: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};


export const getReviewAverageRatingByProductId = async (productId: string): Promise<{ averageRating: number; ratingCount: number }> => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const productQuery = query(reviewsRef, where('productId', '==', productId));
    const querySnapshot = await getDocs(productQuery);

    // Calculate the average customerOverallRating
    let totalRating = 0;
    let ratingCount = 0;

    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.customerOverallRating) {
        totalRating += data.customerOverallRating;
        ratingCount++;
      }
    });
    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0; // Avoid division by zero
    return { averageRating, ratingCount };
  } catch (error) {
    console.error('Error fetching review count and average rating: ', error);
    throw error; // Throwing the error to handle it at the call site
  }
};

export const calculateBorrowingRatingByUser = async (userID: string): Promise<number | null> => {
  try {
    const reviewsRef = collection(db, 'reviews');

    // Count borrowing reviews
    const borrowingQuery = query(reviewsRef, where('customerReviewerId', '==', userID));
    const borrowingSnapshot = await getDocs(borrowingQuery);
    const borrowingSize = borrowingSnapshot.size;

    // Calculate average borrowing rating
    let totalBorrowingRating = 0;
    borrowingSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.lenderOverallRating) {
        console.log('data.lenderOverallRating', data.lenderOverallRating);
        totalBorrowingRating += data.lenderOverallRating;
      }
    });
    const averageBorrowingRating = borrowingSize > 0 ? totalBorrowingRating / borrowingSize : 0;
    console.log('averageBorrowingRating', averageBorrowingRating);

    return averageBorrowingRating;
  } catch (error) {
    console.error('Error counting reviews: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

export const calculateLendingRatingByUser = async (userID: string): Promise<number | null> => {
  try {
    const reviewsRef = collection(db, 'reviews');

    // Count borrowing reviews
    const lendingQuery = query(reviewsRef, where('lenderReviewerId', '==', userID));
    const lendingSnapshot = await getDocs(lendingQuery);
    const lendingSize = lendingSnapshot.size;

    // Calculate average borrowing rating
    let totalLendingRating = 0;
    lendingSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.customerOverallRating) {
        totalLendingRating += data.customerOverallRating;
      }
    });
    const averageLendingRating = lendingSize > 0 ? totalLendingRating / lendingSize : 0;
    console.log('averageLendingRating', averageLendingRating);

    return averageLendingRating;
  } catch (error) {
    console.error('Error counting reviews: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};