import { redirect, useLoaderData } from "react-router-dom";
import { isLogin } from "../util/auth";
import User from '../components/admin_components/User'
import Restaurant from "../components/admin_components/Restaurant";
import Requests from "../components/admin_components/Requests";

export function AdminPage(){


    let data = useLoaderData();
return (
    

    <>
    
    this is admin page 
 
   
     

    
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