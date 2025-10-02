import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";

export function StaffHomePage(){

return (

<>
this is staff home page

</>


);


}


export async function loader(){


 let role =await isLogin();
if(role!='staff'){
   return redirect('/login');
}

    
}
