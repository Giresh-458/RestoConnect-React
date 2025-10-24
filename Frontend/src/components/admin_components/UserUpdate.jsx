import { useRef } from "react";


export function UserUpdate(props){

    // Inline style for the dialog form
    const dialogFormStyle = {
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        minWidth: '400px',
    };

    // Inline style for form inputs
    const inputStyle = {
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '16px',
    };

    // Inline style for the save button
    const saveButtonStyle = {
        backgroundColor: '#28a745', 
        color: 'white',
        padding: '10px 15px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        marginTop: '10px',
    };

    // Inline style for the close button inside the dialog
    const closeButtonStyle = {
        position: 'absolute',
        top: '15px',
        right: '10px',
        background: 'none',
        border: 'none',
        fontSize: '20px',
        cursor: 'pointer',
        color: '#888',
        lineHeight: '20px',
    };


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

  function closeWithOutSubmit(){
 diagref.current.close()
  }




return (
    <>
        
        <button onClick={openDialog} style={props.updateStyle}>Update</button>
    <dialog ref={diagref}>
 <button onClick={closeWithOutSubmit} style={closeButtonStyle}>&times;</button>
        
       

        
      <form onSubmit={closeDialog} style={dialogFormStyle}>
            <input type="hidden" name="_id" value={props.element._id} />

          <input
            type="text"
            name="username"
            defaultValue={props.element.username}
            placeholder="Username"
            required
            style={inputStyle}
          />
          <input
            type="text"
            name="fullname"
            defaultValue={props.element.fullname || ""}
            placeholder="Full Name"
            style={inputStyle}
          />
          <input
            type="password"
            name="password"
            placeholder="Password (Leave blank to keep existing)"
            style={inputStyle}
          />
          <input
            type="email"
            name="email"
            defaultValue={props.element.email}
            placeholder="Email"
            style={inputStyle}
          />
          <input
            type="text"
            name="role"
            defaultValue={props.element.role}
            placeholder="Role"
            required
            style={inputStyle}
          />
         
          <button type="submit" style={saveButtonStyle}>save</button>
        </form>


    </dialog>
    

    </>
);


}