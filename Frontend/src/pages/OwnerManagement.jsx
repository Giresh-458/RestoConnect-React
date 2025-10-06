
import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";

export function OwnerManagement(){


return (

<>

this is owner management
</>


);


}


export async function loader(){
    
    let role =await isLogin();
if(role!='owner'){
   return redirect('/login');
}


}