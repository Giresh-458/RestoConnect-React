import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store/store";
import { ToastProvider } from "./components/common/Toast";
import { ConfirmProvider } from "./components/common/ConfirmDialog";
import "./components/common/Toast.css";

import { HomePage, loader as homeLoader } from "./pages/HomePage";
import { logout, isLogin, customerLoader, ownerLoader, staffLoader } from "./util/auth";

const router = createBrowserRouter([
  { index: true, element: <HomePage />, loader: homeLoader },
  {
    path: "/customer",
    lazy: () => import("./components/CustomerNav").then(m => ({ Component: m.CustomerNav })),
    loader: customerLoader,
    children: [
      { index: true, lazy: () => import("./pages/CustomerHompage").then(m => ({ Component: m.CustomerHomepage, loader: m.loader })) },
      { path: "restaurants", lazy: () => import("./pages/RestaurantListPage").then(m => ({ Component: m.default })) },
      { path: "restaurant/:id", lazy: () => import("./pages/MenuPage").then(m => ({ Component: m.MenuPage, loader: m.loader })) },
      { path: "order", lazy: () => import("./pages/OrderPage").then(m => ({ Component: m.OrderPage })) },
      { path: "payment", lazy: () => import("./pages/PaymentPage").then(m => ({ Component: m.PaymentPage })) },
      { path: "order-placed", lazy: () => import("./pages/OrderPlacedPage").then(m => ({ Component: m.OrderPlacedPage })) },
      { path: "feedback", lazy: () => import("./pages/FeedBackPage").then(m => ({ Component: () => { const C = m.FeedBackPage; return <C mode="customer" />; } })) },
      { path: "support", lazy: () => import("./pages/SupportChatPage").then(m => ({ Component: () => { const C = m.SupportChatPage; return <C mode="customer" />; } })) },
      { path: "dashboard", lazy: () => import("./pages/DashBoardPage").then(m => ({ Component: m.DashBoardPage, loader: m.loader })) }
    ]
  },
  {
    path: "/owner",
    lazy: () => import("./components/OwnerNav").then(m => ({ Component: m.OwnerNav })),
    loader: ownerLoader,
    children: [
      { index: true, lazy: () => import("./pages/OwnerHomePage").then(m => ({ Component: m.OwnerHomePage, loader: m.loader })) },
      { path: "dashboard", lazy: () => import("./pages/OwnerDashBoard").then(m => ({ Component: m.OwnerDashBoard, loader: m.loader })) },
      { path: "menumanagement", lazy: () => import("./pages/OwnerManagement").then(m => ({ Component: m.OwnerManagement, loader: m.loader })) },
      { path: "orders", lazy: () => import("./pages/OwnerOrders").then(m => ({ Component: m.OwnerOrders, loader: m.loader })) },
      { path: "reservations", lazy: () => import("./pages/OwnerReservations").then(m => ({ Component: m.OwnerReservations, loader: m.loader })) },
      { path: "inventory", lazy: () => import("./pages/InventoryManagement").then(m => ({ Component: m.InventoryManagement, loader: m.loader })) },
      { path: "floor", lazy: () => import("./pages/LiveFloor").then(m => ({ Component: m.LiveFloor, loader: m.loader })) },
      { path: "promotions", loader: isLogin, lazy: () => import("./pages/Promotions").then(m => ({ Component: m.default })) },
      { path: "settings", loader: isLogin, lazy: () => import("./pages/OwnerSettings").then(m => ({ Component: m.default })) },
      { path: "feedback", loader: isLogin, lazy: () => import("./pages/FeedBackPage").then(m => ({ Component: () => { const C = m.FeedBackPage; return <C mode="owner" />; } })) },
      { path: "support", loader: isLogin, lazy: () => import("./pages/SupportChatPage").then(m => ({ Component: () => { const C = m.SupportChatPage; return <C mode="owner" />; } })) },
      { path: "staffmanagement", loader: isLogin, lazy: () => import("./pages/StaffManagement").then(m => ({ Component: m.default })) },
    ]
  },
  {
    path: "/staff",
    lazy: () => import("./components/StaffNav").then(m => ({ Component: m.StaffNav })),
    loader: staffLoader,
    children: [
      { index: true, lazy: () => import("./pages/StaffHomePage").then(m => ({ Component: m.StaffHomePage, loader: m.loader })) },
      { path: "dashboard", lazy: () => import("./pages/StaffDashBoardPage").then(m => ({ Component: m.StaffDashBoardPage, loader: m.loader })) },
      { path: "leftovers", lazy: () => import("./pages/StaffLeftoversPage").then(m => ({ Component: m.default })) }
    ]
  },
  {
    path: "/admin",
    lazy: () => import("./pages/AdminPage").then(m => ({ Component: m.AdminPage, loader: m.loader }))
  },
  {
    path: "/employee",
    lazy: () => import("./pages/EmployeePage").then(m => ({ Component: m.EmployeePage, loader: m.loader }))
  },
  {
    path: "/superadmin",
    lazy: () => import("./pages/SuperAdminPage").then(m => ({ Component: m.SuperAdminPage, loader: m.loader }))
  },
  {
    path: "/login",
    lazy: () => import("./pages/AuthPage").then(m => ({ Component: m.AuthPage, action: m.action }))
  },
  {
    path: "/signup",
    lazy: () => import("./pages/AuthPage").then(m => ({ Component: m.AuthPage, action: m.action }))
  },
  {
    path: "logout",
    lazy: () => import("./pages/AuthPage").then(m => ({ Component: m.AuthPage })),
    loader: logout
  },
  {
    path: "/restaurant-application",
    lazy: () => import("./pages/RestaurantApplication").then(m => ({ Component: m.RestaurantApplication, action: m.action }))
  },
  {
    path: "*",
    lazy: () => import("./pages/ErrorPage").then(m => ({ Component: m.default }))
  }
]);

function App() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <ConfirmProvider>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </ConfirmProvider>
      </ToastProvider>
    </Provider>
  );
}

export default App;
