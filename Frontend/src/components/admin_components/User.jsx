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


const styles = {
  userContainer: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  userStats: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
  },
  userStat: {
    backgroundColor: '#f5f5f5',
    padding: '15px 25px',
    borderRadius: '10px',
    textAlign: 'center',
    flex: 1,
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
  userStatStrong: {
    display: 'block',
    fontSize: '1.5rem',
    marginBottom: '5px',
    color: '#333',
  },
  filters: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  filtersInput: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '1rem',
  },
  filtersSelect: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '1rem',
  },
  userList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  userCard: {
    padding: '15px 20px',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  userCardP: {
    margin: '3px 0',
    color: '#555',
  },
  userCardButton: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    marginTop: '10px',
    width: 'fit-content',
  },
  deleteBtn: {
    backgroundColor: '#e74c3c',
    color: 'white',
    marginRight: '10px',
  },
  updateBtn: {
    backgroundColor: '#3498db',
    color: 'white',
  },
};

return (

<div style={styles.userContainer}>

  <div style={styles.userStats}>
    <div style={styles.userStat}>
      <strong style={styles.userStatStrong}>{state.users_list.length}</strong>
      Total Users
    </div>
    <div style={styles.userStat}>
      <strong style={styles.userStatStrong}>{state.users_list.filter(u=>u.role.toLowerCase()==='owner').length}</strong>
      Owners
    </div>
  </div>

  <div style={styles.filters}>
    <input style={styles.filtersInput} type="text" name="username" onChange={handleChange} placeholder="Search username" />
    <select style={styles.filtersSelect} name="role" onChange={handleChange}>
      <option value="">All Roles</option>
      <option value="customer">Customer</option>
      <option value="admin">Admin</option>
      <option value="owner">Owner</option>
      <option value="staff">Staff</option>
    </select>
  </div>

  <div style={styles.userList}>
    {state.users_list.map((element, ind) => {
      const nameFilter = filter?.username || "";
      const roleFilter = filter?.role || "";

      const shouldShow =
        (nameFilter === "" || element.username.toLowerCase().includes(nameFilter.toLowerCase())) &&
        (roleFilter === "" || element.role.toLowerCase() === roleFilter.toLowerCase());

      return (
        <div key={ind} style={{...styles.userCard, display: shouldShow ? "block" : "none"}}>
          <p style={styles.userCardP}><strong>Username:</strong> {element.username}</p>
          <p style={styles.userCardP}><strong>Email:</strong> {element.email}</p>
          <p style={styles.userCardP}><strong>Role:</strong> {element.role}</p>
          {element.restaurantName && <p style={styles.userCardP}><strong>Restaurant:</strong> {element.restaurantName}</p>}

          <div>
            <button style={{...styles.userCardButton, ...styles.deleteBtn}} onClick={() => Dispatch({ type: "delete", payload: element._id })}>Delete</button>
            <UserUpdate Dispatch={Dispatch} element={element} />
          </div>
        </div>
      );
    })}
  </div>

</div>

);
}