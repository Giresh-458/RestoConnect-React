import { useEffect, useReducer, useRef, useState } from "react";


import {UserUpdate} from "./UserUpdate"
const initialState = {
users_list:[],
lastaction:'load',
lastpayload:'users'
}


function reducer(state,action){

if(action.type=='load'){
return {users_list:[...action.payload],lastaction:'load',lastpayload:'users'};
}
else if(action.type=='delete'){
  
return {users_list:[...state.users_list.filter((user)=>{
     return user._id!=action.payload
})],lastaction:'delete',lastpayload:action.payload};
}
else if(action.type=='edit'){
   
   return {users_list:[...state.users_list.filter((user)=>{
     return user._id!=action.payload._id
}),action.payload],lastaction:'edit',lastpayload:action.payload};
}




}




export default function User(){

const firstRender = useRef(true);
const [state,Dispatch] = useReducer(reducer,initialState);


useEffect(()=>{

    let xhr = new XMLHttpRequest();
    xhr.open("get","http://localhost:3000/admin/users",true);
    xhr.onload=function(){
        if(this.status==200)
        {
            console.log(xhr.response)
             const data = JSON.parse(xhr.responseText);
            Dispatch({ type: "load", payload: data });
        }
    }
    xhr.withCredentials = true;
    xhr.send();
},[])

useEffect(()=>{

if(firstRender.current){
firstRender.current=false;
return;
}

if(state.lastaction=='delete'){

  let xhr = new XMLHttpRequest();
    xhr.open("post",`http://localhost:3000/admin/delete_user/${state.lastpayload}`,true);
    xhr.withCredentials = true;
    xhr.send();


}
else if(state.lastaction=='edit'){

  let xhr = new XMLHttpRequest();
    xhr.open("post",`http://localhost:3000/admin/edit_user/${state.lastpayload._id}`,true);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function(){
      if(this.status!=200){
          let xhr = new XMLHttpRequest();
    xhr.open("get","http://localhost:3000/admin/users",true);
    xhr.onload=function(){
        if(this.status==200)
        {
            console.log(xhr.response)
             const data = JSON.parse(xhr.responseText);
            Dispatch({ type: "load", payload: data });
        }
    }
    xhr.withCredentials = true;
    xhr.send();
      }

    }
    xhr.send(JSON.stringify(state.lastpayload));
}


},[state.lastaction]);



let [filter,setFilter] = useState({username:"",role:""});

 function handleChange(e) {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  }


return (

<>


<input type="text" name="username" onChange={handleChange} placeholder="Search username" />
<select name="role" onChange={handleChange}>
  <option value="">All Roles</option>
  <option value="customer">Customer</option>
  <option value="admin">Admin</option>
  <option value="owner">Owner</option>
  <option value="staff">Staff</option>
</select>




{state.users_list.map((element, ind) => {
  const nameFilter = filter?.username || "";
  const roleFilter = filter?.role || "";

  const shouldShow =
    (nameFilter === "" || element.username.toLowerCase().includes(nameFilter.toLowerCase())) &&
    (roleFilter === "" || element.role.toLowerCase() === roleFilter.toLowerCase());


    
  return (


    <div key={ind} style={{ display: shouldShow ? "block" : "none" }}>
      <p><strong>Username:</strong> {element.username}</p>
      <p><strong>Email:</strong> {element.email}</p>
      <p><strong>Role:</strong> {element.role}</p>
      {element.restaurantName && <p><strong>Restaurant:</strong> {element.restaurantName}</p>}

    <button onClick={() => Dispatch({ type: "delete", payload: element._id })}>Delete</button>
    <UserUpdate Dispatch={Dispatch} element={element} ></UserUpdate>
 

    </div>
  );
})}


</>
);
}