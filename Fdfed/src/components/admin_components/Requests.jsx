import { useEffect, useReducer, useRef } from "react";



const initialState = {

requests_list:[],
lastaction:'load',
lastpayload:'requests'
}


function reducer(state,action){

if(action.type=='load'){
return {requests_list:[...action.payload],lastaction:'load',lastpayload:'requests'};
}
else if(action.type=='accept' || action.type=='reject'){
  
return {requests_list:[...state.requests_list.filter((_id)=>{
     return _id!=action.payload
})],lastaction:action.type,lastpayload:action.payload};
}


}




export default function Requests(){

const firstRender = useRef(true);
const [state,Dispatch] = useReducer(reducer,initialState);


useEffect(()=>{
    let xhr = new XMLHttpRequest();
    xhr.open("get","http://localhost:3000/admin/requests",true);
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

if(state.lastaction=='accept'){

  let xhr = new XMLHttpRequest();
    xhr.open("get",`http://localhost:3000/admin/delete_restaurant/${state.lastpayload}`,true);
    xhr.withCredentials = true;
    xhr.send();

}
else if(state.lastaction=='reject'){

    let xhr = new XMLHttpRequest();
    xhr.open("get",`http://localhost:3000/admin/delete_restaurant/${state.lastpayload}`,true);
    xhr.withCredentials = true;
    xhr.send();



}
},[state.lastaction]);



return (

<>

{JSON.stringify(state,null,2)}


</>
);
}