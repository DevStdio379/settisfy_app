import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "./firebaseConfig";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";

export interface SubOption {
    id?: number;
    label: string;        // e.g. "10 sqft"
    additionalPrice: number; // e.g. 15 (store as number for calculations)
    notes?: string;       // optional: "measure carefully"
    isCompleted?: boolean;
}

export interface DynamicOption {
    id?: number;
    name: string;          // e.g. "sqft", "extras"
    subOptions: SubOption[];
    multipleSelect: boolean;
}

export interface Catalogue {
    // main attributes
    id?: string;
    imageUrls: string[];
    title: string;
    description: string;
    includedServices: string;
    excludedServices: string;
    category: string;
    basePrice: number;

    //the dynamic attributes
    dynamicOptions: DynamicOption[];

    //records
    isActive: boolean;
    bookingsCount: number;
    averageRatings: number;
    createAt: any;
    updateAt: any;
}

export const uploadImages = async (imageName: string, imagesUrl: string[]) => {
    const urls: string[] = [];

    for (const uri of imagesUrl) {
        try {
            // Convert to Blob
            const response = await fetch(uri);
            const blob = await response.blob();

            // Generate unique filename
            const filename = `catalogue_assets/${imageName}_${imagesUrl.indexOf(uri)}.jpg`;
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

export const createCatalogue = async (data: Catalogue) => {
    try {
        const serviceRef = collection(db, 'catalogue');
        const docRef = await addDoc(serviceRef, data);

        if (data.imageUrls && data.imageUrls.length > 0) {
            const uploadedUrls = await uploadImages(docRef.id, data.imageUrls);
            await updateDoc(doc(db, 'catalogue', docRef.id), { imageUrls: uploadedUrls });
        }
        console.log('Catalogue saved successfully');
    } catch (error) {
        console.error('Error saving catalogue: ', error);
        throw error;  // Throwing the error to handle it at the call site
    }
}

const mapDocToCatalogue = (doc: any): Catalogue => {
    const catalogueData = doc.data()
    return {
        id: doc.id,
        imageUrls: catalogueData.imageUrls,
        title: catalogueData.title,
        description: catalogueData.description,
        includedServices: catalogueData.includedServices,
        excludedServices: catalogueData.excludedServices,
        category: catalogueData.category,
        basePrice: catalogueData.basePrice,

        //the dynamic attributes
        dynamicOptions: catalogueData.dynamicOptions,

        //records
        isActive: catalogueData.isActive,

        bookingsCount: catalogueData.bookingsCount,
        averageRatings: catalogueData.averageRatings,
        createAt: catalogueData.createAt,
        updateAt: catalogueData.updateAt
    }
}

export const fetchCatalogue = async (): Promise<Catalogue[]> => {
  try {
    const catalogueList: Catalogue[] = [];
    const snapshot = await getDocs(collection(db, 'catalogue')); // Fetch products from 'products' collection
    for (const doc of snapshot.docs) {
      const catalogue = mapDocToCatalogue(doc);
      if (catalogue.isActive) {  // Check if the product is active
        // Add the review count to the product object
        catalogueList.push({ ...catalogue});  // Push the formatted product to the list
      }
    }
    return catalogueList;
  } catch (error) {
    console.error('Error fetching catalogue: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

export const fetchAllCatalogue = async (): Promise<Catalogue[]> => {
  try {
    const catalogueList: Catalogue[] = [];
    const snapshot = await getDocs(collection(db, 'catalogue')); // Fetch products from 'products' collection
    for (const doc of snapshot.docs) {
      const catalogue = mapDocToCatalogue(doc);
      catalogueList.push({ ...catalogue});
    }
    return catalogueList;
  } catch (error) {
    console.error('Error fetching catalogue: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

export const fetchSelectedCatalogue = async (serviceId: string): Promise<Catalogue | null> => {
  try {
    const catalogueRef = doc(db, 'catalogue', serviceId);
    const catalogueDoc = await getDoc(catalogueRef);

    if (catalogueDoc.exists() && catalogueDoc.data()) {
      return mapDocToCatalogue(catalogueDoc);
    } else {
      console.log('No such selected product exists.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching selected product: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

export const searchServices = async (queryStr: string): Promise<Catalogue[]> => {
  try {
    if (queryStr.length < 3) return []; // Prevent unnecessary queries for short strings

    const lowerCaseQuery = queryStr.toLowerCase();
    const productList: Catalogue[] = [];

    // Firestore does not support 'contains' search, so we fetch products in a paginated way
    const serviceSnapshot = await getDocs(collection(db, "catalogue"));

    // Convert Firestore snapshot to a list of products
    const allServices = serviceSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Catalogue[];

    // 🔍 Efficient filtering (case-insensitive) before returning the results
    const filteredProducts = allServices
      .filter(product => 
        product.isActive && (
          product.title.toLowerCase().includes(lowerCaseQuery) || 
          product.description.toLowerCase().includes(lowerCaseQuery) ||
          product.category.toLowerCase().includes(lowerCaseQuery)
        )
      );

    // Fetch review counts in parallel to reduce Firestore calls
    // await Promise.all(filteredProducts.map(async product => {
    //   if (product.id) {
    //     const reviewsSnapshot = await getDocs(collection(db, "products", product.id, "reviews"));
    //     productList.push({ ...product, ratingCount: reviewsSnapshot.size });
    //   }
    // }));

    return productList;
  } catch (error) {
    console.error("Error searching products:", error);
    throw error;
  }
};

export const updateCatalogue = async (catalogueId: string, updatedCatalogue: Partial<Catalogue>) => {
  try {
    const catalogueRef = doc(db, 'catalogue', catalogueId);
    await updateDoc(catalogueRef, updatedCatalogue);
    console.log('Catalogue updated successfully');
  } catch (error) {
    console.error('Error updating catalogue: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

export const deleteCatalogue = async (catalogueId: string) => {
  try {
    const catalogueRef = doc(db, 'catalogue', catalogueId);
    await deleteDoc(catalogueRef);
    console.log('Catalogue deleted successfully');
  } catch (error) {
    console.error('Error deleting catalogue: ', error);
    throw error;
  }
};