import { redirect, useLoaderData,useParams } from "react-router-dom";
import { isLogin } from "../util/auth";
import { Dish } from "../components/Dish";


export function MenuPage(){

const data = useLoaderData();

return (
<>


{

data.map((ele,ind)=>{
return <Dish data={ele} key={ind}></Dish>
})
}


<button>order</button>



</>
);

}

export async function loader({request,params}){


 let role =await isLogin();
if(role!='customer'){
   return redirect('/login');
}


  return new Promise((resolve,reject)=>{

    const xhr = new XMLHttpRequest();
    xhr.open("GET", `http://localhost:3000/api/customer/menu/${params.id}`, true);
    xhr.withCredentials = true;
    xhr.onload=function(){
      if(this.status==200){
         console.log(xhr.responseText)
        resolve(JSON.parse(xhr.responseText));
      }
    
    }
    xhr.send();
  })

}