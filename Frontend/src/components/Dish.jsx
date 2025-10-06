import { useSelector,useDispatch } from "react-redux";
import { addItem,removeItem } from "../store/CartSlice";


export function Dish(props){


   const quantity = useSelector((state) => {
  const dish = state.cartSlice.dishes.find(
    (element) => element.id == props.data.id
  );
  return dish ? dish.quantity : 0;
});
console.log(quantity)

const dispatch = useDispatch();


function additem(){

    console.log("tbr");
dispatch(addItem(props.data))

}


function removeitem(){

dispatch(removeItem(props.data))

}



return(

<>


<h1>{props.data.name}</h1>

<h1>{props.data.amount}</h1>

<h1>{props.data.desc}</h1>

<img src={props.data.pic} alt="" />


{

quantity==0 ? <button onClick={additem}>add</button>:

<>
<button onClick={additem}>+</button>
{quantity}
<button onClick={removeitem}>-</button>
</>
 


}



 

</>

);


}