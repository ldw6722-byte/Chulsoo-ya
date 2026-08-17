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

import { AdminOverviewPage } from '@/features/admin/AdminOverviewPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage'
import { MyPage } from '@/features/my/MyPage'
import { MemberProfilePage } from '@/features/my/MemberProfilePage'
import { DeliveryAddressPage } from '@/features/my/DeliveryAddressPage'
import { PaymentMethodsPage } from '@/features/my/PaymentMethodsPage'
import { StoreDirectoryPage } from '@/features/stores/StoreFinder'
import { StoreDetailPage } from '@/features/stores/StoreDetailPage'
import { CustomerSupportPage } from '@/features/support/CustomerSupportPage'

import { EmptyView } from '@/components/StateViews'

const consumerOnly = (element: React.ReactNode) => (
  <RequireIdentity roles={['CONSUMER', 'ADMIN']}>{element}</RequireIdentity>
)

const sellerOnly = (element: React.ReactNode) => (
  <RequireIdentity roles={['SELLER', 'ADMIN']}>{element}</RequireIdentity>
)
const authenticatedOnly = (element: React.ReactNode) => (
  <RequireIdentity roles={['CONSUMER', 'SELLER', 'ADMIN']}>{element}</RequireIdentity>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'auth/login', element: <LoginPage /> },
      { path: 'auth/signup', element: <SignupPage /> },
      { path: 'auth/callback', element: <AuthCallbackPage /> },
      { path: 'my', element: authenticatedOnly(<MyPage />) },
      { path: 'my/profile', element: authenticatedOnly(<MemberProfilePage />) },
      { path: 'my/delivery-addresses', element: authenticatedOnly(<DeliveryAddressPage />) },
      { path: 'my/payment-methods', element: authenticatedOnly(<PaymentMethodsPage />) },
      { path: 'support', element: <CustomerSupportPage /> },
      { path: 'stores', element: <StoreDirectoryPage /> },
      { path: 'stores/:storeId', element: <StoreDetailPage /> },
      { path: 'catalog', element: <CatalogPage /> },
      { path: 'events/:eventId', element: <EventCampaignPage /> },
      { path: 'product/:productId', element: <ProductDetailPage /> },
      // 湲곗〈 怨듭쑀 留곹겕 ?명솚??alias. ?좉퇋 ?곹뭹 留곹겕??Kordeal??/product/:id瑜??ъ슜?쒕떎.
      { path: 'catalog/:productId', element: <ProductDetailPage /> },
      { path: 'cart', element: consumerOnly(<CartPage />) },
      { path: 'checkout', element: consumerOnly(<CheckoutPage />) },
      { path: 'orders', element: consumerOnly(<OrderListPage />) },
      { path: 'orders/:orderId', element: consumerOnly(<OrderDetailPage />) },
      { path: 'orders/:orderId/matching', element: consumerOnly(<MatchingWaitPage />) },
            { path: 'orders/:orderId/payment', element: consumerOnly(<PaymentPage />) },
      { path: 'orders/:orderId/claim', element: consumerOnly(<ClaimRequestPage />) },

            { path: 'seller/application', element: consumerOnly(<SellerApplicationPage />) },
      { path: 'seller/deactivation', element: sellerOnly(<SellerDeactivationPage />) },
      { path: 'seller', element: sellerOnly(<SellerDashboardPage />) },

      { path: 'seller/offers', element: sellerOnly(<SellerOfferQueuePage />) },
      { path: 'seller/orders', element: sellerOnly(<SellerOrderWorkspacePage />) },
            { path: 'seller/settings', element: sellerOnly(<SellerSettingsPage />) },
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
            <EmptyView title="?섏씠吏瑜?李얠쓣 ???놁뒿?덈떎" description="二쇱냼瑜??뺤씤?섍굅???덉쑝濡??대룞??二쇱꽭??" />
          </div>
        ),
      },
    ],
  },
])

