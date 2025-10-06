
import { isLogin } from "../util/auth";
 import { redirect } from "react-router-dom";
export function OwnerDashBoard(){

return (
<>
this is owner dashboard
</>
);



}

export async function loader(){


 let role =await isLogin();
if(role!='owner'){
   return redirect('/login');
}

    
}