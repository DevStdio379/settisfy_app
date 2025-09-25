import { NavigatorScreenParams } from "@react-navigation/native";
import { BottomTabParamList } from "./BottomTabParamList";
import { Borrowing } from "../services/BorrowingServices";
import { Product } from "../services/ProductServices";
import { Booking } from "../services/BookingServices";
import { SettlerService } from "../services/SettlerServiceServices";
import { Catalogue } from "../services/CatalogueServices";

export type RootStackParamList = {
    BottomNavigation: NavigatorScreenParams<BottomTabParamList>;
    OnBoarding: undefined;
    SignUp: undefined;
    SignIn: undefined;
    AccountVerification: undefined;

    Home: undefined;
    Products: undefined;
    ProductDetails: { product: Product };
    PaymentSuccess: { bookingId: string };
    MyBookings: undefined;
    MyBookingDetails: { booking: Booking };
    BookingAddReview: { reviewId: string, booking: Booking };

    ChatList: undefined;
    NewChat: undefined;
    Chat: { chatId: string };
    Profile: undefined;
    PersonalDetails: undefined;
    EditAttributes: { profileAttribute: { attributeName: string } };
    AddressBook: undefined;
    SearchAddress: undefined;
    AddressMapView: { latitude: number, longitude: number, addressName: string, address: string, postcode: string };
    AddAddress: { latitude: any, longitude: any, addressName: string, address: string, postcode: string };
    EditLocationPinPoint: { location: { latitude: any, longitude: any, addressName: string, address: string } }
    PaymentInformation: undefined;

    Search: undefined;
    SearchResults: { query: string, allSearchResults: any };

    // Lender Profile
    MyRequests: undefined;
    MyRequestDetails: { lending: Borrowing };
    LenderAddReview: { reviewId: string, lending: Borrowing };
    MyServices: undefined;
    SettlerAddService: {settlerService: SettlerService | null};
    ProviderDashboard: undefined;
    Messages: undefined;

    Temp: undefined;
    ServiceCatalogue: undefined;

    FavouriteCollection: undefined;

    // Services Quotatation Screens
    QuoteCleaning: {service: Catalogue};

};