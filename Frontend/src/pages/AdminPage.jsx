import { redirect, useLoaderData } from "react-router-dom";
import { isLogin } from "../util/auth";
import User from '../components/admin_components/User'

import { AdminDashBoard } from "../components/admin_components/AdminDashBoard";
import { Settings } from "../components/admin_components/Settings";
import { RestaurantSubPage } from "../components/admin_components/RestaurentSubPage";
import { useState } from "react";

export function AdminPage(){


    let data = useLoaderData();
    console.log(data);

    const [subPage,setSubPage] = useState("dashboard");



return (
    

    
    <>

        <h5 onClick={()=>{setSubPage("dashboard")}}>dashboard</h5>
        <h5 onClick={()=>{setSubPage("user")}}>user management</h5>
        <h5 onClick={()=>{setSubPage("restaurant")}}>restaurant management</h5>
        <h5 onClick={()=>{setSubPage("settings")}}>setting</h5>

        {subPage=="dashboard" && <AdminDashBoard totalusers = {data.total_user_count} totalrestaurants = {data.restaurants_list.length} ></AdminDashBoard>}
        {subPage=="user" && <User></User>}
        {subPage=="restaurant" && <RestaurantSubPage></RestaurantSubPage>}
        {subPage=="settings" && <Settings data={data.current_admin}></Settings>}
     

    
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