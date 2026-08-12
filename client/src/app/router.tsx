import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './AppShell'
import { RequireIdentity } from './RequireIdentity'
import { HomePage } from '@/features/catalog/HomePage'
import { CatalogPage } from '@/features/catalog/CatalogPage'
import { ProductDetailPage } from '@/features/catalog/ProductDetailPage'
import { CartPage } from '@/features/cart/CartPage'
import { CheckoutPage } from '@/features/checkout/CheckoutPage'
import { PaymentPage } from '@/features/checkout/PaymentPage'
import { MatchingWaitPage } from '@/features/matching/MatchingWaitPage'
import { OrderListPage } from '@/features/orders/OrderListPage'
import { OrderDetailPage } from '@/features/orders/OrderDetailPage'
import { SellerDashboardPage } from '@/features/seller/SellerDashboardPage'
import { SellerOfferQueuePage } from '@/features/seller/SellerOfferQueuePage'
import { SellerOrderWorkspacePage } from '@/features/seller/SellerOrderWorkspacePage'
import { SellerSettingsPage } from '@/features/seller/SellerSettingsPage'
import { AdminOverviewPage } from '@/features/admin/AdminOverviewPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage'
import { MyPage } from '@/features/my/MyPage'
import { EmptyView } from '@/components/StateViews'

const consumerOnly = (element: React.ReactNode) => (
  <RequireIdentity roles={['CONSUMER', 'ADMIN']}>{element}</RequireIdentity>
)

const sellerOnly = (element: React.ReactNode) => (
  <RequireIdentity roles={['SELLER', 'ADMIN']}>{element}</RequireIdentity>
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
      { path: 'my', element: <MyPage /> },
      { path: 'catalog', element: <CatalogPage /> },
      { path: 'product/:productId', element: <ProductDetailPage /> },
      // 기존 공유 링크 호환용 alias. 신규 상품 링크는 Kordeal식 /product/:id를 사용한다.
      { path: 'catalog/:productId', element: <ProductDetailPage /> },
      { path: 'cart', element: consumerOnly(<CartPage />) },
      { path: 'checkout', element: consumerOnly(<CheckoutPage />) },
      { path: 'orders', element: consumerOnly(<OrderListPage />) },
      { path: 'orders/:orderId', element: consumerOnly(<OrderDetailPage />) },
      { path: 'orders/:orderId/matching', element: consumerOnly(<MatchingWaitPage />) },
      { path: 'orders/:orderId/payment', element: consumerOnly(<PaymentPage />) },
      { path: 'seller', element: sellerOnly(<SellerDashboardPage />) },
      { path: 'seller/offers', element: sellerOnly(<SellerOfferQueuePage />) },
      { path: 'seller/orders', element: sellerOnly(<SellerOrderWorkspacePage />) },
      { path: 'seller/settings', element: sellerOnly(<SellerSettingsPage />) },
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
            <EmptyView title="페이지를 찾을 수 없습니다" description="주소를 확인하거나 홈으로 이동해 주세요." />
          </div>
        ),
      },
    ],
  },
])
