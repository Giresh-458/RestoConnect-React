import { useLoaderData } from "react-router-dom";



export async function loader(){

     return new Promise((resolve,reject)=>{

    const xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:3000/api/restaurants", true);
    xhr.withCredentials = true;
    xhr.onload=function(){
      if(this.status==200){
        resolve(JSON.stringify(xhr.responseText,null,5));
      }
    
    }
    xhr.send();
  })
 
}



export function CustomerHomepage(){
let data = useLoaderData();

return (

<pre>{JSON.stringify(data, null, 2)}</pre>

);

}