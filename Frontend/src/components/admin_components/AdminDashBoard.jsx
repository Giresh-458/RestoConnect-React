import { useEffect,useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";


export function AdminDashBoard(props){


const [data,setData] = useState([]);


  useEffect(()=>{


    let xhr = new XMLHttpRequest();
    xhr.open("get","http://localhost:3000/admin/chartstats",true);
    xhr.onload=function(){
        if(this.status==200)
        {
          
             const data = JSON.parse(xhr.responseText);
             console.log(data);
             setData(data)
        }
    }
    xhr.withCredentials = true;
    xhr.send();


  },[])



return(
<>

{props.totalusers}

{props.totalrestaurants}

 <LineChart width={400} height={250} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="totalPayments" stroke="blue" name="Total Income" />
<Line type="monotone" dataKey="restaurantFee" stroke="green" name="Restaurant Fee" />

      </LineChart>
</>
);
}


