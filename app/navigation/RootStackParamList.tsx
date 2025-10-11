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
    ProductDetails: { product: Booking };
    PaymentSuccess: { bookingId: string, image: string };
    MyBookings: undefined;
    MyBookingDetails: { booking: Booking };
    BookingAddReview: { booking: Booking };

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
    MyRequestDetails: { booking: Booking };
    SettlerAddReview: { reviewId: string, booking: Booking };
    MyServices: undefined;
    SettlerServiceForm: { settlerService: SettlerService | null };
    SettlerAddService: {settlerService: SettlerService | null};
    ProviderDashboard: undefined;
    Messages: undefined;

    Temp: undefined;
    ServiceCatalogueForm: {catalogue: Catalogue | null};

    FavouriteCollection: undefined;

    // Services Quotatation Screens
    QuoteService: {service: Catalogue};
    CatalogueList: undefined;

};