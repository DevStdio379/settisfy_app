import { db, storage } from './firebaseConfig';  // Import the Firestore instance
import { collection, getDocs, addDoc, doc, updateDoc, getDoc, query, where } from 'firebase/firestore';  // Firestore functions
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';  // Import Firebase storage functions
import { Borrowing } from './BorrowingServices';
import { Alert } from 'react-native';

// Define the Review interface
export interface Review {
  id?: string;  // Add an optional id field
  borrowingId: string;
  borrowerReviewerId?: string;
  lenderReviewerId?: string;
  productId: string;

  // borrowerReview
  borrowerOverallRating?: number;
  borrowerCollectionRating?: number;
  borrowerCollectionFeedback?: string[];
  borrowerOtherCollectionReview?: string;
  borrowerReturnRating?: number;
  borrowerReturnFeedback?: string[];
  borrowerOtherReturnReview?: string;
  borrowerListingMatch?: string;
  borrowerListingMatchFeedback?: string[];
  borrowerOtherListingMatchReview?: string;
  borrowerCommunicationRating?: number;
  borrowerCommunicationFeedback?: string[];
  borrowerOtherCommunicationReview?: string;
  borrowerProductConditionRating?: number;
  borrowerProductConditionFeedback?: string[];
  borrowerOtherProductConditionReview?: string;
  borrowerPriceWorthyRating?: number;
  borrowerPublicReview?: string;
  borrowerPrivateNotesforLender?: string;
  borrowerStatus?: number;
  borrowerCreateAt?: any; 
  borrowerUpdatedAt?: any;

  // lenderReview
  lenderOverallRating?: number;
  lenderCollectionRating?: number;
  lenderCollectionFeedback?: string[];
  lenderOtherCollectionReview?: string;
  lenderReturnRating?: number;
  lenderReturnFeedback?: string[];
  lenderOtherReturnReview?: string;
  lenderGivenInstructionFollowed?: string;
  lenderGivenInstructionFollowedFeedback?: string[];
  lenderOtherGivenInstructionFollowedReview?: string;
  lenderCommunicationRating?: number;
  lenderCommunicationFeedback?: string[];
  lenderOtherCommunicationReview?: string;
  lenderReturnedProductConditionRating?: number;
  lenderReturnedProductConditionFeedback?: string[];
  lenderOtherReturnedProductConditionReview?: string;
  lenderPublicReview?: string;
  lenderPrivateNotesforLender?: string;
  lenderStatus?: number;
  lenderCreateAt?: any;
  lenderUpdatedAt?: any;
}

// Function to fetch a review based on borrowingId
export const getReviewByBorrowingId = async (productId: string ,borrowingId: string) => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const querySnapshot = await getDocs(reviewsRef);
    const reviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];

    const review = reviews.find(review => review.borrowingId === borrowingId);
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

// Function to save a product to Firestore
export const createReview = async (review: Review, productId: string) => {
  try {
    const productRef = collection(db, 'reviews');
    const docRef = await addDoc(productRef, review);

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


// Function to fetch reviews based on productId
export const getReviewsByProductId = async (productId: string) => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const querySnapshot = await getDocs(reviewsRef);
    const reviews = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          borrowerOverallRating: data.borrowerOverallRating,
          borrowerPublicReview: data.borrowerPublicReview,
          borrowerUpdatedAt: data.borrowerUpdatedAt.toDate(),  // Convert Firestore timestamp to JavaScript Date
          borrowerReviewerId: data.borrowerReviewerId,
          productId: data.productId
        };
      })
      .filter(review => review.productId === productId);  // Filter reviews by productId
    return reviews;
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

    // Calculate the average borrowerOverallRating
    let totalRating = 0;
    let ratingCount = 0;

    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.borrowerOverallRating) {
        totalRating += data.borrowerOverallRating;
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

export const calculateBorrowingRatingByUser = async (userID: string): Promise<number | null > => {
  try {
    const reviewsRef = collection(db, 'reviews');

    // Count borrowing reviews
    const borrowingQuery = query(reviewsRef, where('borrowerReviewerId', '==', userID));
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

export const calculateLendingRatingByUser = async (userID: string): Promise< number | null > => {
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
      if (data.borrowerOverallRating) {
        totalLendingRating += data.borrowerOverallRating;
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