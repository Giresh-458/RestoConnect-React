
import { createSlice } from "@reduxjs/toolkit";


const cartSlice = createSlice({

name:"cart",
initialState:{
dishes:[],
reservation:{},
amount:0
},
reducers:{

    addItem:(state,action)=>{
        let item = action.payload;
        let presentItem = state.dishes.find(it=>{
            return it.id===item.id;
        })

        if(presentItem==undefined){
           state.dishes.push({...item,quantity:1});
        }
        else{
        presentItem.quantity+=1;
        }
         state.amount+=item.amount;
    },

    removeItem:(state,action)=>{
        let item = action.payload;
        let presentItem = state.dishes.find(it=>{
            return it.id===item.id;
        })
        
        if(presentItem==undefined){
           return;
        }
        else if(presentItem.quantity==1){
            state.dishes = state.dishes.filter(it=>it.id!==item.id);
        }
        else{
                presentItem.quantity--;
        }
         state.amount-=item.amount;
        
    },
    addReservation:(state,action)=>{
        state.reservation={...action.payload};
        let amount_add=action.payload["seater1"]*10+action.payload["seater2"]*20+action.payload["seater4"]*40+action.payload["seater12"]*100; 
        state.amount+=(amount_add);
    },
    removeReservation:(state)=>{
        let amount_remove=state.reservation["seater1"]*10+state.reservation["seater2"]*20+state.reservation["seater4"]*40+state.reservation["seater12"]*100; 
        state.reservation=null;
        state.amount-=(amount_remove);
    },
   clearcart: (state) => {
  state.dishes = [];
  state.reservation = {};
  state.amount = 0;
}


}
})


export const {addItem,removeItem,addReservation,removeReservation,clearcart}=cartSlice.actions;
export default cartSlice.reducer;