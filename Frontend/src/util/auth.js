import { redirect } from "react-router-dom";



export async function logout(){
    sessionStorage.clear();
    localStorage.clear();
    await fetch("http://localhost:3000/api/auth/logout", {
        method: "get",
        credentials: "include"
    });
    // Clear the session cookie to ensure it's removed client-side
    document.cookie = "connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    return redirect("/login");
}


export async function isLogin(){
    let res = await fetch("http://localhost:3000/api/auth/check-session", {
        method: "get",
        credentials: "include"
    });

    let result = await res.json();
    console.log(result);
    
    if (!result.valid) {
        throw redirect('/login?message=Please login first');
    }
    
    return result.role;
}

