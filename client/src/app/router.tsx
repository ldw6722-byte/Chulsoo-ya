import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './AppShell'
import { RequireIdentity } from './RequireIdentity'
import { HomePage } from '@/features/catalog/HomePage'
import { CatalogPage } from '@/features/catalog/CatalogPage'
import { EventCampaignPage } from '@/features/catalog/EventCampaignPage'
import { ProductDetailPage } from '@/features/catalog/ProductDetailPage'
import { CartPage } from '@/features/cart/CartPage'
import { CheckoutPage } from '@/features/checkout/CheckoutPage'
import { PaymentPage } from '@/features/checkout/PaymentPage'
import { MatchingWaitPage } from '@/features/matching/MatchingWaitPage'
import { OrderListPage } from '@/features/orders/OrderListPage'
import { OrderDetailPage } from '@/features/orders/OrderDetailPage'
import { ClaimRequestPage } from '@/features/orders/ClaimRequestPage'

import { SellerDashboardPage } from '@/features/seller/SellerDashboardPage'
import { SellerOfferQueuePage } from '@/features/seller/SellerOfferQueuePage'
import { SellerOrderWorkspacePage } from '@/features/seller/SellerOrderWorkspacePage'
import { SellerSettingsPage } from '@/features/seller/SellerSettingsPage'
import { SellerClaimsPage } from '@/features/seller/SellerClaimsPage'
import { SellerApplicationPage } from '@/features/seller/SellerApplicationPage'
import { SellerDeactivationPage } from '@/features/seller/SellerDeactivationPage'
import SellerSubscriptionPage from '@/features/seller/SellerSubscriptionPage'
import { SellerServiceGuidePage } from '@/features/seller/SellerServiceGuidePage'

import { AdminOverviewPage } from '@/features/admin/AdminOverviewPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage'
import { PasswordResetRequestPage } from '@/features/auth/PasswordResetRequestPage'
import { PasswordResetPage } from '@/features/auth/PasswordResetPage'
import { MyPage } from '@/features/my/MyPage'
import { MemberProfilePage } from '@/features/my/MemberProfilePage'
import { DeliveryAddressPage } from '@/features/my/DeliveryAddressPage'
import { PaymentMethodsPage } from '@/features/my/PaymentMethodsPage'
import { StoreDirectoryPage } from '@/features/stores/StoreFinder'
import { StoreDetailPage } from '@/features/stores/StoreDetailPage'
import { CustomerSupportPage } from '@/features/support/CustomerSupportPage'
import { ServiceInformationPage } from '@/features/support/ServiceInformationPage'
import { BuyerUsageGuidePage } from '@/features/support/BuyerUsageGuidePage'

import { EmptyView } from '@/components/StateViews'
import { MaintenanceGate } from '@/components/maintenance/MaintenanceGate'
import { RouteErrorPage } from './RouteErrorPage'

const consumerOnly = (element: React.ReactNode) => (
  <RequireIdentity roles={['CONSUMER', 'ADMIN']}>{element}</RequireIdentity>
)

const shoppingOnly = (element: React.ReactNode) => (
  <RequireIdentity roles={['CONSUMER', 'SELLER', 'ADMIN']}>{element}</RequireIdentity>
)

const sellerOnly = (element: React.ReactNode) => (
  <RequireIdentity roles={['SELLER', 'ADMIN']} fallbackPath="/seller/application">{element}</RequireIdentity>
)
const authenticatedOnly = (element: React.ReactNode) => (
  <RequireIdentity roles={['CONSUMER', 'SELLER', 'ADMIN']}>{element}</RequireIdentity>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MaintenanceGate><AppShell /></MaintenanceGate>,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'auth/login', element: <LoginPage /> },
      { path: 'auth/signup', element: <SignupPage /> },
      { path: 'auth/callback', element: <AuthCallbackPage /> },
      { path: 'auth/forgot-password', element: <PasswordResetRequestPage /> },
      { path: 'auth/reset-password', element: <PasswordResetPage /> },
      { path: 'my', element: authenticatedOnly(<MyPage />) },
      { path: 'my/profile', element: authenticatedOnly(<MemberProfilePage />) },
      { path: 'my/delivery-addresses', element: authenticatedOnly(<DeliveryAddressPage />) },
      { path: 'my/payment-methods', element: authenticatedOnly(<PaymentMethodsPage />) },
      { path: 'support', element: <CustomerSupportPage /> },
      { path: 'about', element: <ServiceInformationPage /> },
      { path: 'guide', element: <BuyerUsageGuidePage /> },
      { path: 'stores', element: <StoreDirectoryPage /> },
      { path: 'stores/:storeId', element: <StoreDetailPage /> },
      { path: 'catalog', element: <CatalogPage /> },
      { path: 'events/:eventId', element: <EventCampaignPage /> },
      { path: 'product/:productId', element: <ProductDetailPage /> },
      // 湲곗〈 怨듭쑀 留곹겕 ?명솚??alias. ?좉퇋 ?곹뭹 留곹겕??Kordeal??/product/:id瑜??ъ슜?쒕떎.
      { path: 'catalog/:productId', element: <ProductDetailPage /> },
      { path: 'cart', element: shoppingOnly(<CartPage />) },
      { path: 'checkout', element: shoppingOnly(<CheckoutPage />) },
      { path: 'orders', element: shoppingOnly(<OrderListPage />) },
      { path: 'orders/:orderId', element: shoppingOnly(<OrderDetailPage />) },
      { path: 'orders/:orderId/matching', element: shoppingOnly(<MatchingWaitPage />) },
            { path: 'orders/:orderId/payment', element: shoppingOnly(<PaymentPage />) },
      { path: 'orders/:orderId/claim', element: shoppingOnly(<ClaimRequestPage />) },

            { path: 'seller-guide', element: <SellerServiceGuidePage /> },
      { path: 'seller/application', element: consumerOnly(<SellerApplicationPage />) },
      { path: 'seller/deactivation', element: sellerOnly(<SellerDeactivationPage />) },
      { path: 'seller', element: sellerOnly(<SellerDashboardPage />) },

      { path: 'seller/offers', element: sellerOnly(<SellerOfferQueuePage />) },
      { path: 'seller/orders', element: sellerOnly(<SellerOrderWorkspacePage />) },
            { path: 'seller/settings', element: sellerOnly(<SellerSettingsPage />) },
      { path: 'seller/subscription', element: sellerOnly(<SellerSubscriptionPage />) },
      { path: 'seller/claims', element: sellerOnly(<SellerClaimsPage />) },

      {
        path: 'admin',
        element: (
          <RequireIdentity roles={['ADMIN']}>
            <AdminOverviewPage />
          </RequireIdentity>
        ),
      },
      {
        path: '*',
        element: (
          <div className="page">
            <EmptyView title="페이지를 찾을 수 없습니다" description="주소를 확인하거나 메인 화면으로 이동해 주세요." action={<a href="/" className="guide-cta-primary">메인으로 이동</a>} />
          </div>
        ),
      },
    ],
  },
])

