import { useEffect, useReducer, useRef } from "react";



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
  
return {users_list:[...state.users_list.filter((_id)=>{
     return _id!=action.payload
})],lastaction:'delete',lastpayload:action.payload};
}
else if(action.type=='edit'){
   
   return {users_list:[...state.users_list.filter((_id)=>{
     return _id!=action.payload._id
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
    xhr.open("get",`http://localhost:3000/admin/delete_user/${state.lastpayload}`,true);
    xhr.withCredentials = true;
    xhr.send();


}
else if(state.lastaction=='edit'){

  let xhr = new XMLHttpRequest();
    xhr.open("get",`http://localhost:3000/admin/edit_user/${state.lastpayload._id}`,true);
    xhr.withCredentials = true;
    xhr.send(state.lastpayload);
}
},[state.lastaction]);



return (

<>

{JSON.stringify(state,null,2)}


</>
);
}