

import { redirect, useLoaderData } from 'react-router-dom';
import { isLogin } from '../util/auth';

export async function loader() {

  const role = await isLogin();
  
  if(role!=null){
     return redirect(`/${role}/`);
  }
 



}

export function HomePage(){
  
  
  return (
    <>
      <h1>this is home page</h1>
      
      
    </>
  );
}


