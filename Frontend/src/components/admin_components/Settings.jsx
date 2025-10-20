import {useState} from "react";



export function Settings(props){


let [formData,SetFormData] = useState({
username:props.data.username,
email:props.data.email,
password:"",
newpassword:""
});



function changeUsernameOrEmail(e){

e.preventDefault();

const {username,email} = formData;

let xhr = new XMLHttpRequest();
xhr.open("POST", "http://localhost:3000/admin/edit_profile", true);
xhr.withCredentials=true;
xhr.setRequestHeader("Content-Type", "application/json");
xhr.send(JSON.stringify({username,email}))

}


function onUsernameChange(e){
SetFormData({...formData,username:e.target.value})
}


function onEmailChange(e){
    SetFormData({...formData,email:e.target.value})
}




function changePassword(e){

e.preventDefault();
const form = e.target;


const currentpassword = form.elements.currentpassword.value;
const retypepassword = form.elements.retypepassword.value;
const newpassword = form.elements.newpassword.value;

if(currentpassword!=retypepassword){
form.reset();
return;
}


let xhr = new XMLHttpRequest();
xhr.open("POST", "http://localhost:3000/admin/edit_profile", true);
xhr.withCredentials=true;
xhr.setRequestHeader("Content-Type", "application/json");
const {username,email} = formData;
xhr.send(JSON.stringify({username,email,password:currentpassword,newpassword}))

form.reset();

}



return (
    <>
    

    <form onSubmit={changeUsernameOrEmail}>

        <label htmlFor="username">username</label>
        <input type="text" id="username" name="username" onChange={onUsernameChange} value={formData.username}/>

         <label htmlFor="email">email</label>
        <input type="email" id="email" name="email" onChange={onEmailChange} value={formData.email}/>        

        <button>submit</button>
    </form>


    
    <form onSubmit={changePassword}>

        <label htmlFor="currentpassword">currentpassword</label>
        <input type="password" id="currentpassword" name="currentpassword"/>

          <label htmlFor="retypepassword">retypepassword</label>
        <input type="password" id="retypepassword" name="retypepassword"/>


         <label htmlFor="newpassword">newpassword</label>
        <input type="password" id="newpassword" name="newpassword"/>  

        <button>update</button>      

    </form>
    
    
    
    </>
);


}