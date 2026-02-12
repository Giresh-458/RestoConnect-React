import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { Provider } from "react-redux";

import store from "./store/store";

import { HomePage, loader as homeLoader } from "./pages/HomePage";
import RestaurantListPage from "./pages/RestaurantListPage";

import { CustomerNav } from "./components/CustomerNav";
import { MenuPage,loader as menuLoader } from "./pages/MenuPage";
import { OrderPage } from "./pages/OrderPage";
import { PaymentPage } from "./pages/PaymentPage";
import { OrderPlacedPage } from "./pages/OrderPlacedPage";
import { FeedBackPage } from "./pages/FeedBackPage";
import { DashBoardPage,loader as DashboardLoader } from "./pages/DashBoardPage";
import { CustomerHomepage,loader as customerHomepageLoader } from "./pages/CustomerHompage";

import { OwnerNav } from "./components/OwnerNav";
import { OwnerDashBoard,loader as OwnerDashBoardLoader } from "./pages/OwnerDashBoard";
import { OwnerManagement,loader as OwnerManagementLoader } from "./pages/OwnerManagement";
import { OwnerHomePage ,loader as OwnerHomePageLoader} from "./pages/OwnerHomePage";
import { OwnerOrders, loader as OwnerOrdersLoader } from "./pages/OwnerOrders";
import { OwnerReservations, loader as OwnerReservationsLoader } from "./pages/OwnerReservations";
import { InventoryManagement, loader as InventoryManagementLoader } from "./pages/InventoryManagement";
import { LiveFloor, loader as LiveFloorLoader } from "./pages/LiveFloor";
import Promotions from "./pages/Promotions";
import OwnerSettings from "./pages/OwnerSettings";
import StaffManagement from "./pages/StaffManagement";
import { SupportChatPage } from "./pages/SupportChatPage";



import { StaffNav } from "./components/StaffNav";
import { StaffHomePage ,loader as StaffHomePageLoader} from "./pages/StaffHomePage";
import { StaffDashBoardPage,loader as StaffDashboardLoader } from "./pages/StaffDashBoardPage";


import { AdminPage } from "./pages/AdminPage";
import {loader as adminLoader} from "./pages/AdminPage";

import { AuthPage } from "./pages/AuthPage";
import {action as authAction} from './pages/AuthPage';

import { RestaurantApplication } from "./pages/RestaurantApplication";
import {action as restaurantApplicationAction} from './pages/RestaurantApplication';

import { logout } from "./util/auth";
import { isLogin } from "./util/auth";
import ErrorPage from "./pages/ErrorPage";


const router = createBrowserRouter([
  { index: true, element: <HomePage></HomePage> ,loader:homeLoader},
  {
    path: "/customer",
    element: <CustomerNav></CustomerNav>,
    children: [
          { index: true, element: <CustomerHomepage></CustomerHomepage> ,loader:customerHomepageLoader},
      { path: "restaurants", element: <RestaurantListPage /> },
      { path: "restaurant/:id", element: <MenuPage></MenuPage>,loader:menuLoader },
      { path: "order", element: <OrderPage></OrderPage> },
      { path: "payment", element: <PaymentPage></PaymentPage> },
      { path: "order-placed", element: <OrderPlacedPage></OrderPlacedPage> },
      { path: "feedback", element: <FeedBackPage mode="customer" /> },
      { path: "support", element: <SupportChatPage mode="customer" /> },
      { path: "dashboard", element: <DashBoardPage></DashBoardPage>,loader :DashboardLoader }
    ],
    loader:isLogin
  },
  {
    path: "/owner",
    element: <OwnerNav></OwnerNav>,
    children: [
      { index: true, element: <OwnerHomePage></OwnerHomePage>,loader:OwnerHomePageLoader },
      { path: "dashboard", element: <OwnerDashBoard></OwnerDashBoard>,loader:OwnerDashBoardLoader },
      { path: "menumanagement", element: <OwnerManagement></OwnerManagement>,loader:OwnerManagementLoader },
      { path: "orders", element: <OwnerOrders></OwnerOrders>, loader: OwnerOrdersLoader },
      { path: "reservations", element: <OwnerReservations />, loader: OwnerReservationsLoader },
      { path: "inventory", element: <InventoryManagement />, loader: InventoryManagementLoader },
      { path: "floor", element: <LiveFloor />, loader: LiveFloorLoader },
      { path: "promotions", element: <Promotions /> },
      { path: "settings", element: <OwnerSettings /> },
      { path: "feedback", element: <FeedBackPage></FeedBackPage> },
      { path: "support", element: <SupportChatPage mode="owner" /> },
      { path: "staffmanagement", element: <StaffManagement></StaffManagement> },
    ],
    loader:isLogin
  },
  {
    path: "/staff",
    element: <StaffNav></StaffNav>,
    children: [
      { index: true, element: <StaffHomePage></StaffHomePage>,loader:StaffHomePageLoader},
      { path: "dashboard", element: <StaffDashBoardPage></StaffDashBoardPage>,loader:StaffDashboardLoader}
    ],
    loader:isLogin
  },
  {
    path: "/admin",
    element: <AdminPage></AdminPage>,
    loader:adminLoader
  },
  {
    path: "/login",
    element: <AuthPage></AuthPage>,
    action: authAction
  },
  {
    path: "/signup",
    element: <AuthPage></AuthPage>,
    action: authAction
  },
  {
    path:"logout",
    element:<AuthPage></AuthPage>,
    loader:logout
  },
  {
    path: "/restaurant-application",
    element: <RestaurantApplication></RestaurantApplication>,
    action: restaurantApplicationAction
  },
  {
    path: "*",
    element: <ErrorPage></ErrorPage>
  }
]
);

function App() {
  return (
    <>
      <Provider store={store}>
      <RouterProvider router={router} />
      </Provider>

    </>
  )
}

export default App
