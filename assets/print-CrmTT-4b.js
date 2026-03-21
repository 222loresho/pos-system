const u="POS-80C";function x(){return new Promise((t,a)=>{if(window.qz&&window.qz.websocket.isActive()){t();return}window.qz.websocket.connect().then(t).catch(a)})}async function c(t){try{await x();const a=window.qz.configs.create(u),o=t.map(e=>({type:"raw",format:"plain",data:e+`
`}));await window.qz.print(a,o)}catch(a){return console.error("QZ print failed, falling back to browser print",a),!1}return!0}function d(t){return"\x1B"+t}const m=d("@"),r=d("a"),h=d("a\0"),l=d("E"),p=d("E\0"),b="VA",s="-".repeat(42),w=`


`;function i(t,a,o=42){const e=o-t.length-a.length;return t+" ".repeat(Math.max(1,e))+a}const v=async t=>{const a=new Date(t.created_at),o=[m,r+l+"Javari"+p,r+"Loresho, Nairobi",h+s,i("Order: "+t.order_number,"Table: "+t.table_name),i("Waiter: "+t.waiter_name,a.toLocaleDateString()),i("",a.toLocaleTimeString()),s,i("Item","Amount"),s,...t.items.map(n=>i(n.product_name+" x"+n.quantity,"KSh "+n.subtotal)),s,l+i("TOTAL","KSh "+t.total)+p,s,r+"Please present this bill to the cashier",w,b];await c(o.join(`
`))||g(t)},y=async t=>{const a=n=>n==="mpesa"?"Mpesa":n==="card"?"Card":n==="billout"?"Billout":"Cash",o=[m,r+l+"Javari"+p,r+"Loresho, Nairobi",h+s,t.orderNumber?i("Order: "+t.orderNumber,"Table: "+(t.tableName||"-")):"",i("Cashier: "+t.cashier,t.date.split(",")[0]),i("Waiter: "+t.waiterName,t.date.split(",")[1]?.trim()||""),s,i("Item","Amount"),s,...t.items.map(n=>i(n.product_name+" x"+n.quantity,"KSh "+n.subtotal)),s,l+i("TOTAL","KSh "+t.total)+p,s,i("Payment:",a),...t.splits&&t.splits.length>0?t.splits.map(n=>i(a(n.method)+(n.ref?" ("+n.ref+")":"")+":","KSh "+n.amount)):[i("Payment:",a(t.paymentMethod||"cash"))],s,r+"Thank you for your visit!",r+"Please come again",s,r+"Note to Waiter: Submit this receipt",r+"attached with the bill to the cashier.",w,b];await c(o.join(`
`))||f(t)};function g(t){const a=window.open("","_blank","width=400,height=600"),o=new Date(t.created_at),e=t.items.map(n=>`<tr><td>${n.product_name}</td><td>x${n.quantity}</td><td class="right">KSh ${n.subtotal}</td></tr>`).join("");a.document.write(`<html><head><title>Bill</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}@page{margin:0;size:80mm auto}body{font-family:'Courier New',monospace;font-size:12px;width:76mm;padding:4mm}h2{text-align:center;font-size:15px;margin-bottom:2px}.center{text-align:center}.right{text-align:right}.sub{text-align:center;font-size:11px;margin-bottom:4px}.divider{border-top:1px dashed #000;margin:5px 0}.meta-row{display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px}table{width:100%;border-collapse:collapse;margin:4px 0}td{padding:2px 0;font-size:11px;vertical-align:top}.right{width:60px;white-space:nowrap}.total-row{display:flex;justify-content:space-between;font-weight:bold;font-size:13px;margin:4px 0}@media print{button{display:none}}</style>
  </head><body>
  <h2>Javari</h2><p class="sub">Loresho, Nairobi</p>
  <div class="divider"></div>
  <div class="meta-row"><span>Order: ${t.order_number}</span><span>Table: ${t.table_name}</span></div>
  <div class="meta-row"><span>Waiter: ${t.waiter_name}</span><span>${o.toLocaleDateString()}</span></div>
  <div class="meta-row"><span></span><span>${o.toLocaleTimeString()}</span></div>
  <div class="divider"></div>
  <table>${e}</table>
  <div class="divider"></div>
  <div class="total-row"><span>TOTAL</span><span>KSh ${t.total}</span></div>
  <div class="divider"></div>
  <p class="center" style="font-size:11px">Please present this bill to the cashier</p>
  <button onclick="window.print();window.close();" style="width:100%;padding:8px;margin-top:10px;font-size:13px;cursor:pointer;background:#333;color:white;border:none;border-radius:4px">Print Bill</button>
  </body></html>`),a.document.close(),setTimeout(()=>{a.focus(),a.print()},500)}function f(t){const a=window.open("","_blank","width=400,height=600"),o=t.items.map(e=>`<tr><td>${e.product_name}</td><td>x${e.quantity}</td><td class="right">KSh ${e.subtotal}</td></tr>`).join("");a.document.write(`<html><head><title>Receipt</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}@page{margin:0;size:80mm auto}body{font-family:'Courier New',monospace;font-size:12px;width:76mm;padding:4mm}h2{text-align:center;font-size:15px;margin-bottom:2px}.center{text-align:center}.right{text-align:right}.sub{text-align:center;font-size:11px;margin-bottom:4px}.divider{border-top:1px dashed #000;margin:5px 0}.meta-row{display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px}table{width:100%;border-collapse:collapse;margin:4px 0}td{padding:2px 0;font-size:11px}.right{width:60px;white-space:nowrap}.total-row{display:flex;justify-content:space-between;font-weight:bold;font-size:13px;margin:4px 0}.summary-row{display:flex;justify-content:space-between;font-size:11px;margin:2px 0}.note{text-align:center;font-size:10px;margin-top:6px;border:1px dashed #999;padding:4px;font-style:italic}@media print{button{display:none}}</style>
  </head><body>
  <h2>Javari</h2><p class="sub">Loresho, Nairobi</p>
  <div class="divider"></div>
  ${t.orderNumber?`<div class="meta-row"><span>Order: ${t.orderNumber}</span><span>Table: ${t.tableName||"-"}</span></div>`:""}
  <div class="meta-row"><span>Cashier: ${t.cashier}</span><span>${t.date.split(",")[0]}</span></div>
  <div class="meta-row"><span>Waiter: ${t.waiterName}</span><span>${t.date.split(",")[1]?.trim()}</span></div>
  <div class="divider"></div>
  <table>${o}</table>
  <div class="divider"></div>
  <div class="total-row"><span>TOTAL</span><span>KSh ${t.total}</span></div>
  ${t.splits&&t.splits.length>0?t.splits.map(e=>`<div class="summary-row"><span>${e.method==="mpesa"?"Mpesa":e.method==="card"?"Card":e.method==="billout"?"Billout":"Cash"}${e.ref?" ("+e.ref+")":""}:</span><span>KSh ${e.amount}</span></div>`).join(""):`<div class="summary-row"><span>Payment:</span><span>${t.paymentMethod||"Cash"}</span></div>`}
  <div class="divider"></div>
  <p class="center" style="font-size:12px">Thank you for your visit!</p>
  <div class="note">Note to Waiter: Submit this receipt attached with the bill to the cashier.</div>
  <button onclick="window.print();window.close();" style="width:100%;padding:8px;margin-top:10px;font-size:13px;cursor:pointer;background:#333;color:white;border:none;border-radius:4px">Print Receipt</button>
  </body></html>`),a.document.close(),setTimeout(()=>{a.focus(),a.print()},500)}export{v as printBill,y as printReceipt};
