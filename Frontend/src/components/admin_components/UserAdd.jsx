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
    xhr.send(JSON.stringify(data));
    e.target.reset();
    e.target.closest('dialog').close();
  };




return (
    <>
        <button onClick={openDialog}>+addnew user</button>
    <dialog ref={diagref}>

            <form onSubmit={closeDialog}>
          <label htmlFor="username">username</label>
        <input type="text" name="username"/>
        <label htmlFor="fullname">fullname</label>
        <input type="text" name="fullname"/>
        <label htmlFor="password">password</label>
        <input type="password" name="password"/>
        <label htmlFor="email">email</label>
        <input type="email" name="email"/>
        <label htmlFor="role">role</label>
        <input type="text" name="role"/>

        <button type="submit">save</button>

        </form>

    </dialog>
    

    </>
);



}