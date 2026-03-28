import { useEffect, useState } from "react";
import api from "./api";

export default function App(){
  const [products,setProducts]=useState([]);
  const [cart,setCart]=useState([]);
  const [orders,setOrders]=useState([]);

  useEffect(()=>{
    api.get("/products").then(r=>setProducts(r.data));
    api.get("/orders").then(r=>setOrders(r.data));
  },[]);

  const add = (p)=>{
    const exist = cart.find(i=>i.id===p.id);
    if(exist){
      setCart(cart.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i));
    }else{
      setCart([...cart,{...p,qty:1}]);
    }
  };

  const total = cart.reduce((a,c)=>a+(c.price*c.qty),0);

  const saveTable = ()=>{
    api.post("/orders",{table:"Table 1",total}).then(()=>{
      setCart([]);
      alert("Saved!");
    });
  };

  return (
    <div style={{display:"flex",height:"100vh"}}>
      
      <div style={{flex:2,padding:10}}>
        <h2>🛒 Products</h2>
        {products.map(p=>(
          <div key={p.id} onClick={()=>add(p)} style={{
            border:"1px solid #ccc",
            margin:5,
            padding:10,
            cursor:"pointer"
          }}>
            {p.name} - KSh {p.price}
          </div>
        ))}
      </div>

      <div style={{flex:1,padding:10,background:"#111",color:"#fff"}}>
        <h2>Cart</h2>
        {cart.map(c=>(
          <div key={c.id}>{c.name} x{c.qty}</div>
        ))}
        <h3>Total: {total}</h3>
        <button onClick={saveTable}>💾 Save Table</button>
      </div>

      <div style={{flex:1,padding:10}}>
        <h2>📋 Orders</h2>
        {orders.map(o=>(
          <div key={o.id}>
            {o.table} - {o.status}
          </div>
        ))}
      </div>

    </div>
  );
}
