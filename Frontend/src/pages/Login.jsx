import {Form,useActionData,redirect} from 'react-router-dom';


export function Login() {
    let data = useActionData();
    
    return (
        <Form method="post">
            {data?.error && <p style={{color: 'red'}}>{data.error}</p>}
            <h2>Login</h2>
            <div>
                <label htmlFor="username">Username:</label>
                <input type="text" id="username" name="username" required />
            </div>
            <div>
                <label htmlFor="password">Password:</label>
                <input type="password" id="password" name="password" required />
            </div>
            <button type="submit">Login</button>
        </Form>
    );
}

export async function action({request}){
    /*let users = [
        {username:'john', password:'123'},
        {username:'roy', password:'123'},
        {username:'amy', password:'123'}
    ];

    const formData = await request.formData();
    const user = formData.get("username");
    const pass = formData.get("password");

    const userFound = users.find((user_) => user_.username === user && user_.password === pass);

    if(!userFound){
        return { error: 'Invalid username or password' };
    }

    localStorage.setItem("username", user);*/
    const formData = await request.formData();
    const username = formData.get("username");
    const password = formData.get("password");
   let res =   await fetch("http://localhost:3000/", {
    method: "POST",
    credentials: "include", 
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password }) 
  })

  res = await res.json();
  if(res.valid==false){
    return redirect('/login');
  }
 
    return redirect(`/${res.role}/`);
}
