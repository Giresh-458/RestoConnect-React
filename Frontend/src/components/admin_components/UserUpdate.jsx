import { useRef } from "react";


export function UserUpdate(props){


    const diagref= useRef(null);

    const openDialog = () => {
    diagref.current.showModal();
  };

    const closeDialog = (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    console.log(data)

        props.Dispatch({ type: "edit", payload: { ...props.element, ...data } });


    e.target.closest('dialog').close();

  };




return (
    <>
        <button onClick={openDialog}>edit</button>
    <dialog ref={diagref}>

        
     <form onSubmit={closeDialog}>
             <input type="hidden" name="_id" value={props.element._id} />

          <input
            type="text"
            name="username"
            defaultValue={props.element.username}
            placeholder="Username"
            required
          />
          <input
            type="text"
            name="fullname"
            defaultValue={props.element.fullname || ""}
            placeholder="Full Name"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
          />
          <input
            type="email"
            name="email"
            defaultValue={props.element.email}
            placeholder="Email"
          />
          <input
            type="text"
            name="role"
            defaultValue={props.element.role}
            placeholder="Role"
            required
          />

          <button type="submit">save</button>
        </form>


    </dialog>
    

    </>
);



}