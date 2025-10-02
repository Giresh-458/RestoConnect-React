import { redirect } from "react-router-dom";



export async function logout(){
sessionStorage.clear();
localStorage.clear();
 await fetch("http://localhost:3000/logout", {
        method: "get",
        credentials: "include"
    });
    // Clear the session cookie to ensure it's removed client-side
    document.cookie = "connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      return redirect("/login");
}


export async function  isLogin(){

   /* let user = localStorage.getItem("username");
    if(user==null){
        throw redirect('/login?meassge=login first');
    }

    return user;*/

    let res = await fetch("http://localhost:3000/check-session",{

        method:"get",
        credentials:"include"
    });

   


    let result = await res.json();
    console.log(result)
    if(!result.valid){
         throw redirect('/login?message=login first');
    }
    return result.role;
}

