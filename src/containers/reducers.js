/**
 * Export reducers from ducks modules of different containers (i.e. default export)
 * We are following Ducks module proposition:
 * https://github.com/erikras/ducks-modular-redux
 */
import ArticlePage from './ArticlePage/ArticlePage.duck';
import ArticlesPage from './ArticlesPage/ArticlesPage.duck';
import CartPage from './CartPage/CartPage.duck';
import CheckoutPage from './CheckoutPage/CheckoutPage.duck';
import FavoritesPage from './FavoritesPage/FavoritesPage.duck';
import ContactDetailsPage from './ContactDetailsPage/ContactDetailsPage.duck';
import EditListingPage from './EditListingPage/EditListingPage.duck';
import InboxPage from './InboxPage/InboxPage.duck';
import LandingPage from './LandingPage/LandingPage.duck';
import ListingPage from './ListingPage/ListingPage.duck';
import MakeOfferPage from './MakeOfferPage/MakeOfferPage.duck';
import ManageListingsPage from './ManageListingsPage/ManageListingsPage.duck';
import PasswordChangePage from './PasswordChangePage/PasswordChangePage.duck';
import PasswordRecoveryPage from './PasswordRecoveryPage/PasswordRecoveryPage.duck';
import PasswordResetPage from './PasswordResetPage/PasswordResetPage.duck';
import PaymentMethodsPage from './PaymentMethodsPage/PaymentMethodsPage.duck';
import ManageAccountPage from './ManageAccountPage/ManageAccountPage.duck';
import ProfilePage from './ProfilePage/ProfilePage.duck';
import ProfileSettingsPage from './ProfileSettingsPage/ProfileSettingsPage.duck';
import RequestQuotePage from './RequestQuotePage/RequestQuotePage.duck';
import SearchPage from './SearchPage/SearchPage.duck';
import SellerLandingPage from './SellerLandingPage/SellerLandingPage.duck';
import SellerListingsPage from './SellerListingsPage/SellerListingsPage.duck';
import StripePayoutPage from './StripePayoutPage/StripePayoutPage.duck';
import TransactionPage from './TransactionPage/TransactionPage.duck';

export {
  ArticlePage,
  ArticlesPage,
  CartPage,
  CheckoutPage,
  ContactDetailsPage,
  EditListingPage,
  FavoritesPage,
  InboxPage,
  LandingPage,
  ListingPage,
  MakeOfferPage,
  ManageListingsPage,
  PasswordChangePage,
  PasswordRecoveryPage,
  PasswordResetPage,
  PaymentMethodsPage,
  ManageAccountPage,
  ProfilePage,
  ProfileSettingsPage,
  RequestQuotePage,
  SearchPage,
  SellerLandingPage,
  SellerListingsPage,
  StripePayoutPage,
  TransactionPage,
};
