import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './pages/Layout'
import Home from './pages/Home'
import CreateStore from './pages/CreateStore'
import Storefront from './pages/Storefront'
import Product from './pages/Product'
import Checkout from './pages/Checkout'  
import Download from './pages/Download'
import SellerDashboard from './pages/SellerDashboard'
import Products from './pages/Products'
import Orders from './pages/Orders'
import Order from './pages/Order'
import AdminDisputes from './pages/AdminDisputes'
import CardPage from './pages/CardPage'
import CardPurchasePage from './pages/CardPurchase';
import WithdrawFunds from './pages/WithdrawFunds'

function App() {
  return (
    <div className="min-h-screen bg-dark">
      <Toaster position="top-right" />
      
      <Routes>
        <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/create-store" element={<CreateStore />} />
        <Route path="/store/:storeId" element={<Storefront />} />
        <Route path="/product/:productId" element={<Product />} />
        <Route path="/checkout/:productId" element={<Checkout />} />
        <Route path="/download/:orderId/:token" element={<Download />} />
        <Route path="/products" element={<Products />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/order/:orderId" element={<Order />} />
        <Route path="/admin/disputes" element={<AdminDisputes />} />
        <Route path="/dashboard" element={<SellerDashboard />} />
        <Route path="/card/new" element={<CardPurchasePage />} />
        <Route path="card" element={<CardPage />} />
        <Route path="/withdraw" element={<WithdrawFunds totalRevenue={0} />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App