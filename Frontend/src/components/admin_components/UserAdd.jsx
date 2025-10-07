import { useRef } from "react";


export function UserAdd(props){


    const diagref= useRef(null);

    const openDialog = () => {
    diagref.current.showModal();
  };

    const closeDialog = (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:3000/admin/add_user", true);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = function () {
      if (xhr.status === 200) {
         diagref.current.close();
        props.Dispatch({ type: "add" });
      } 
    };

    e.reset();
  };




return (
    <>
        <button onClick={openDialog}>+addnew user</button>
    <dialog ref={diagref}>

            <form onSubmit={closeDialog}>
        <input type="text" name="username"/>
        <input type="text" name="fullname"/>
        <input type="password" name="password"/>
        <input type="email" name="email"/>
        <input type="text" name="role"/>

        <button type="submit">save</button>

        </form>

    </dialog>
    

    </>
);



}