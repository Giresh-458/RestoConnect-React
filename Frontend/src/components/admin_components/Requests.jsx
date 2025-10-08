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
  
return {requests_list: state.requests_list.filter(req => req._id !== action.payload)
,lastaction:action.type,lastpayload:action.payload};
}


}




export  function Requests(){

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
    xhr.open("get",`http://localhost:3000/admin/accept_request/${state.lastpayload}`,true);
    xhr.withCredentials = true;
    xhr.send();

}
else if(state.lastaction=='reject'){

    let xhr = new XMLHttpRequest();
    xhr.open("get",`http://localhost:3000/admin/reject_request/${state.lastpayload}`,true);
    xhr.withCredentials = true;
    xhr.send();



}
},[state.lastaction]);



return (

<>

{state.requests_list.map((element,i)=>{

return (
    <div key={i}>



    <button onClick={()=>{Dispatch({type:"accept",payload:element.owner_username})}}>accept</button>
    <button onClick={()=>{Dispatch({type:"reject",payload:element.owner_username})}}>reject</button>
    </div>
);


})}


</>
);
}