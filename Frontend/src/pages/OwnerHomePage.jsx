import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom"; 


import OwnerDashboard from "../components/OwnerDashboard";
export function OwnerHomePage(){


return (

<>

this is owner home page



</>


);


}


export async function loader(){



    let role =await isLogin();
    console.log(role);
if(role!='owner'){
   
    return redirect('/login');
}

    
}