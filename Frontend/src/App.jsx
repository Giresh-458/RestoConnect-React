import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { Provider } from "react-redux";

import store from "./store/store";

import { HomePage, loader as homeLoader } from "./pages/HomePage";

import { CustomerNav } from "./components/CustomerNav";
import { MenuPage,loader as menuLoader } from "./pages/MenuPage";
import { OrderPage } from "./pages/OrderPage";
import { PaymentPage } from "./pages/PaymentPage";
import { FeedBackPage } from "./pages/FeedBackPage";
import { DashBoardPage,loader as DashboardLoader } from "./pages/DashBoardPage";
import { CustomerHomepage,loader as customerHomepageLoader } from "./pages/CustomerHompage";

import { OwnerNav } from "./components/OwnerNav";
import { OwnerDashBoard,loader as OwnerDashBoardLoader } from "./pages/OwnerDashBoard";
import { OwnerManagement,loader as OwnerManagementLoader } from "./pages/OwnerManagement";
import { OwnerHomePage ,loader as OwnerHomePageLoader} from "./pages/OwnerHomePage";

import { StaffNav } from "./components/StaffNav";
import { StaffHomePage ,loader as StaffHomePageLoader} from "./pages/StaffHomePage";
import { StaffDashBoardPage,loader as StaffDashboardLoader } from "./pages/StaffDashBoardPage";


import { AdminPage } from "./pages/AdminPage";
import {loader as adminLoader} from "./pages/AdminPage";

import { Login } from "./pages/Login";
import {action as loginaction} from './pages/Login';

import { logout } from "./util/auth";
import { isLogin } from "./util/auth";


const router = createBrowserRouter([
  { index: true, element: <HomePage></HomePage> ,loader:homeLoader},
  {
    path: "/customer",
    element: <CustomerNav></CustomerNav>,
    children: [
      { index: true, element: <CustomerHomepage></CustomerHomepage> ,loader:customerHomepageLoader},
      { path: "restaurant/:id", element: <MenuPage></MenuPage>,loader:menuLoader },
      { path: "order", element: <OrderPage></OrderPage> },
      { path: "payment", element: <PaymentPage></PaymentPage> },
      { path: "feedback", element: <FeedBackPage></FeedBackPage> },
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
      { path: "menumanagement", element: <OwnerManagement></OwnerManagement>,loader:OwnerManagementLoader }
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
    element: <Login></Login>,
    action:loginaction
  },
  {
    path:"logout",
    element:<Login></Login>,
    loader:logout
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
