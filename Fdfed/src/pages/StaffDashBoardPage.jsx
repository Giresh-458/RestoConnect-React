
import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";
export function StaffDashBoardPage(){


return (

<>
this is StaffDashBoardPage

</>


);



}


export async function loader(){
    
 let role =await isLogin();
if(role!='staff'){
   return redirect('/login');
}


}