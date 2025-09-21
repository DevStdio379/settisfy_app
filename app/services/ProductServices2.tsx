import { db, storage } from './firebaseConfig';  // Import the Firestore instance
import { collection, getDocs, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';  // Firestore functions
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';  // Import Firebase storage functions
import { COLORS } from '../constants/theme';

// Define the Product interface
export interface Product2 {
  id?: string;  // Add an optional id field
  ownerID: string;
  imageUrls: string[];  // Change to an array to accept multiple images
  title: string;
  description: string;
  includedServices: string[];  // Change to an array to accept multiple items
  category: string;
  servicePrice: number;
  availableDays: string[];
  ratingCount?: number;
  averageRating?: number;  // Add an optional overallRating field

  // address 
  addressID: string;
  latitude: number;
  longitude: number;
  addressName: string;
  address: string;
  addressAdditionalDetails: string;
  postcode: string;

  isActive: boolean;
  createAt: any;  // Use the Firebase Timestamp object for createAt
  updatedAt: any;  // Use the Firebase Timestamp object for updatedAt
}

// Utility function to map Firestore document data to Product interface
const mapDocToProduct = (doc: any): Product2 => {
  const productData = doc.data();
  return {
    id: doc.id,
    ownerID: productData.ownerID,
    imageUrls: productData.imageUrls,
    title: productData.title,
    description: productData.description,
    includedServices: productData.includedServices,
    category: productData.category,
    servicePrice: productData.lendingRate,
    availableDays: productData.availableDays,

    // added data
    averageRating: productData.averageRating,
    ratingCount: productData.ratingCount,

    // address 
    addressID: productData.addressID,
    latitude: productData.latitude,
    longitude: productData.longitude,
    addressName: productData.addressName,
    address: productData.address,
    addressAdditionalDetails: productData.addressAdditionalDetails,
    postcode: productData.postcode,

    isActive: productData.isActive,
    createAt: productData.createAt,
    updatedAt: productData.updatedAt,
  };
};

// Function to fetch products from Firestore
export const fetchProducts = async (): Promise<Product2[]> => {
  try {
    const productList: Product2[] = [];
    const snapshot = await getDocs(collection(db, 'products')); // Fetch products from 'products' collection
    for (const doc of snapshot.docs) {
      const product = mapDocToProduct(doc);
      if (product.isActive) {  // Check if the product is active
        // Add the review count to the product object
        productList.push({ ...product});  // Push the formatted product to the list
      }
    }
    return productList;
  } catch (error) {
    console.error('Error fetching products: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

// Function to upload an image to Firebase Storage
export const uploadImages = async (imageName: string, imagesUrl: string[]) => {
  const urls: string[] = [];

  for (const uri of imagesUrl) {
    try {
      // Convert to Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate unique filename
      const filename = `products/${imageName}_${imagesUrl.indexOf(uri)}.jpg`;
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

// Function to fetch products for a specific user from Firestore
export const fetchUserProductListings = async (userID: string): Promise<Product2[]> => {
  try {
    const userProductList: Product2[] = [];
    const snapshot = await getDocs(collection(db, 'products')); // Fetch products from 'products' collection
    snapshot.forEach(doc => {
      const product = mapDocToProduct(doc);
      if (product.ownerID === userID) {  // Check if the product belongs to the user
        userProductList.push(product);  // Push the formatted product to the list
      }
    });
    return userProductList;
  } catch (error) {
    console.error('Error fetching user products: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};


export const fetchSelectedProduct = async (productId: string): Promise<Product2 | null> => {
  try {
    const productRef = doc(db, 'products', productId);
    const productDoc = await getDoc(productRef);

    if (productDoc.exists() && productDoc.data()) {
      return mapDocToProduct(productDoc);
    } else {
      console.log('No such selected product exists.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching selected product: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

// Function to save a product to Firestore
export const createProduct = async (product: Product2) => {
  try {
    const productRef = collection(db, 'products');
    const docRef = await addDoc(productRef, product);

    if (product.imageUrls && product.imageUrls.length > 0) {
      const uploadedUrls = await uploadImages(docRef.id, product.imageUrls);
      await updateDoc(doc(db, 'products', docRef.id), { imageUrls: uploadedUrls });
    }
    console.log('Product saved successfully');
  } catch (error) {
    console.error('Error saving product: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

// Function to update a product in Firestore
export const updateProduct = async (productId: string, updatedProduct: Partial<Product2>) => {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, updatedProduct);
    console.log('Product updated successfully');
  } catch (error) {
    console.error('Error updating product: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

// Function to fetch borrowing dates (start and end dates) for a specific product
export const fetchBorrowingDates = async (productId: string): Promise<{ startDate: string, endDate: string }[]> => {
  try {
    const borrowingDates: { startDate: string, endDate: string }[] = [];
    const snapshot = await getDocs(collection(db, 'borrowings')); // Fetch borrowings from 'borrowings' collection
    snapshot.forEach(doc => {
      const borrowingData = doc.data();
      if (borrowingData.product.id === productId) {  // Check if the borrowing is for the specified product
        borrowingDates.push({
          startDate: new Date(borrowingData.startDate).toISOString().split('T')[0],
          endDate: new Date(borrowingData.endDate).toISOString().split('T')[0]
        });
      }
    });

    return borrowingDates;
  } catch (error) {
    console.error('Error fetching borrowing dates: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

// Function to search products based on user query
export const searchProducts = async (queryStr: string): Promise<Product2[]> => {
  try {
    if (queryStr.length < 3) return []; // Prevent unnecessary queries for short strings

    const lowerCaseQuery = queryStr.toLowerCase();
    const productList: Product2[] = [];

    // Firestore does not support 'contains' search, so we fetch products in a paginated way
    const productSnapshot = await getDocs(collection(db, "products"));

    // Convert Firestore snapshot to a list of products
    const allProducts = productSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Product2[];

    // 🔍 Efficient filtering (case-insensitive) before returning the results
    const filteredProducts = allProducts
      .filter(product => 
        product.isActive && (
          product.title.toLowerCase().includes(lowerCaseQuery) || 
          product.description.toLowerCase().includes(lowerCaseQuery) ||
          product.category.toLowerCase().includes(lowerCaseQuery)
        )
      );

    // Fetch review counts in parallel to reduce Firestore calls
    await Promise.all(filteredProducts.map(async product => {
      if (product.id) {
        const reviewsSnapshot = await getDocs(collection(db, "products", product.id, "reviews"));
        productList.push({ ...product, ratingCount: reviewsSnapshot.size });
      }
    }));

    return productList;
  } catch (error) {
    console.error("Error searching products:", error);
    throw error;
  }
};