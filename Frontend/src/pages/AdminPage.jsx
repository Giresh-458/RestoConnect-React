import { redirect, useLoaderData } from "react-router-dom";
import { isLogin } from "../util/auth";
import User from '../components/admin_components/User'
import Restaurant from "../components/admin_components/Restaurant";
import Requests from "../components/admin_components/Requests";
import { AdminDashBoard } from "../components/admin_components/AdminDashBoard";
import { Settings } from "../components/admin_components/Settings";
import { RestaurantSubPage } from "../components/admin_components/RestaurentSubPage";
import { useState } from "react";

export function AdminPage(){


    let data = useLoaderData();

    const [subPage,setSubPage] = useState("dashboard");



return (
    

    
    <>

        <h5 onClick={()=>{setSubPage("dashboard")}}>dashboard</h5>
        <h5 onClick={()=>{setSubPage("user")}}>user management</h5>
        <h5 onClick={()=>{setSubPage("restaurant")}}>restaurant management</h5>
        <h5 onClick={()=>{setSubPage("settings")}}>setting</h5>

        {subPage=="dashboard" && <AdminDashBoard></AdminDashBoard>}
        {subPage=="user" && <User></User>}
        {subPage=="restaurant" && <RestaurantSubPage></RestaurantSubPage>}
        {subPage=="settings" && <Settings></Settings>}
     

    
    </>

);


}


export async function loader(){

 let role =await isLogin();
if(role!='admin'){
   return redirect('/login');
}


return new Promise((resolve,reject)=>{

    let xhr = new XMLHttpRequest();
xhr.open("GET", "http://localhost:3000/admin/dashboard", true);

xhr.withCredentials = true;
xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
    }
};

xhr.send();

})

}