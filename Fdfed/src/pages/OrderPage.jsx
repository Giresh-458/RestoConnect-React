
import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";

export function OrderPage(){

return (

<>
<h1>this is order page</h1>

</>
);


}



export async function loader(){


 let role =await isLogin();
if(role!='customer'){
   return redirect('/login');
}

    
}

