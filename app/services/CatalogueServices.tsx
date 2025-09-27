import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "./firebaseConfig";
import { addDoc, collection, doc, getDocs, updateDoc } from "firebase/firestore";

export interface SubOption {
    label: string;        // e.g. "10 sqft"
    additionalPrice: number; // e.g. 15 (store as number for calculations)
    notes?: string;       // optional: "measure carefully"
}

export interface DynamicOption {
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
    category: string;
    basePrice: number;

    //the dynamic attributes
    dynamicOptions: DynamicOption[];

    //records
    isActive: boolean;
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
        category: catalogueData.category,
        basePrice: catalogueData.basePrice,

        //the dynamic attributes
        dynamicOptions: catalogueData.dynamicOptions,

        //records
        isActive: catalogueData.isActive,
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