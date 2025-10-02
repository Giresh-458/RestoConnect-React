import { isLogin } from "../util/auth";
 import { redirect } from "react-router-dom";
export function DashBoardPage(){


return (


<>

this is dashboard page
</>


);



}


export async function loader({request}){

 let role =await isLogin();
if(role!='customer'){
   return redirect('/login');
}




}