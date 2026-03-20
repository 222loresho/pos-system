const u="POS-80C";function x(){return new Promise((t,a)=>{if(window.qz&&window.qz.websocket.isActive()){t();return}window.qz.websocket.connect().then(t).catch(a)})}async function m(t){try{await x();const a=window.qz.configs.create(u),e=t.map(i=>({type:"raw",format:"plain",data:i+`
`}));await window.qz.print(a,e)}catch(a){return console.error("QZ print failed, falling back to browser print",a),!1}return!0}function r(t){return"\x1B"+t}const c=r("@"),d=r("a"),h=r("a\0"),p=r("E"),l=r("E\0"),b="VA",s="-".repeat(42),w=`


`;function n(t,a,e=42){const i=e-t.length-a.length;return t+" ".repeat(Math.max(1,i))+a}const y=async t=>{const a=new Date(t.created_at),e=[c,d+p+"Javari"+l,d+"Loresho, Nairobi",h+s,n("Order: "+t.order_number,"Table: "+t.table_name),n("Waiter: "+t.waiter_name,a.toLocaleDateString()),n("",a.toLocaleTimeString()),s,n("Item","Amount"),s,...t.items.map(o=>n(o.product_name+" x"+o.quantity,"KSh "+o.subtotal)),s,p+n("TOTAL","KSh "+t.total)+l,s,d+"Please present this bill to the cashier",w,b];await m(e.join(`
`))||g(t)},f=async t=>{const a=t.paymentMethod==="mpesa"?"Mpesa":t.paymentMethod==="card"?"Card":"Cash",e=[c,d+p+"Javari"+l,d+"Loresho, Nairobi",h+s,t.orderNumber?n("Order: "+t.orderNumber,"Table: "+(t.tableName||"-")):"",n("Cashier: "+t.cashier,t.date.split(",")[0]),n("Waiter: "+t.waiterName,t.date.split(",")[1]?.trim()||""),s,n("Item","Amount"),s,...t.items.map(o=>n(o.product_name+" x"+o.quantity,"KSh "+o.subtotal)),s,p+n("TOTAL","KSh "+t.total)+l,s,n("Payment:",a),...t.paymentMethod==="cash"?[n("Amount Paid:","KSh "+t.amountPaid),n("Change:","KSh "+t.change)]:[],...t.paymentMethod==="mpesa"?[n("Mpesa Code:",t.mpesaCode)]:[],...t.paymentMethod==="card"?[n("Auth No:",t.cardAuth)]:[],s,d+"Thank you for your visit!",d+"Please come again",s,d+"Note to Waiter: Submit this receipt",d+"attached with the bill to the cashier.",w,b];await m(e.join(`
`))||v(t)};function g(t){const a=window.open("","_blank","width=400,height=600"),e=new Date(t.created_at),i=t.items.map(o=>`<tr><td>${o.product_name}</td><td>x${o.quantity}</td><td class="right">KSh ${o.subtotal}</td></tr>`).join("");a.document.write(`<html><head><title>Bill</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}@page{margin:0;size:80mm auto}body{font-family:'Courier New',monospace;font-size:12px;width:76mm;padding:4mm}h2{text-align:center;font-size:15px;margin-bottom:2px}.center{text-align:center}.right{text-align:right}.sub{text-align:center;font-size:11px;margin-bottom:4px}.divider{border-top:1px dashed #000;margin:5px 0}.meta-row{display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px}table{width:100%;border-collapse:collapse;margin:4px 0}td{padding:2px 0;font-size:11px;vertical-align:top}.right{width:60px;white-space:nowrap}.total-row{display:flex;justify-content:space-between;font-weight:bold;font-size:13px;margin:4px 0}@media print{button{display:none}}</style>
  </head><body>
  <h2>Javari</h2><p class="sub">Loresho, Nairobi</p>
  <div class="divider"></div>
  <div class="meta-row"><span>Order: ${t.order_number}</span><span>Table: ${t.table_name}</span></div>
  <div class="meta-row"><span>Waiter: ${t.waiter_name}</span><span>${e.toLocaleDateString()}</span></div>
  <div class="meta-row"><span></span><span>${e.toLocaleTimeString()}</span></div>
  <div class="divider"></div>
  <table>${i}</table>
  <div class="divider"></div>
  <div class="total-row"><span>TOTAL</span><span>KSh ${t.total}</span></div>
  <div class="divider"></div>
  <p class="center" style="font-size:11px">Please present this bill to the cashier</p>
  <button onclick="window.print();window.close();" style="width:100%;padding:8px;margin-top:10px;font-size:13px;cursor:pointer;background:#333;color:white;border:none;border-radius:4px">Print Bill</button>
  </body></html>`),a.document.close(),setTimeout(()=>{a.focus(),a.print()},500)}function v(t){const a=window.open("","_blank","width=400,height=600"),e=t.items.map(i=>`<tr><td>${i.product_name}</td><td>x${i.quantity}</td><td class="right">KSh ${i.subtotal}</td></tr>`).join("");a.document.write(`<html><head><title>Receipt</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}@page{margin:0;size:80mm auto}body{font-family:'Courier New',monospace;font-size:12px;width:76mm;padding:4mm}h2{text-align:center;font-size:15px;margin-bottom:2px}.center{text-align:center}.right{text-align:right}.sub{text-align:center;font-size:11px;margin-bottom:4px}.divider{border-top:1px dashed #000;margin:5px 0}.meta-row{display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px}table{width:100%;border-collapse:collapse;margin:4px 0}td{padding:2px 0;font-size:11px}.right{width:60px;white-space:nowrap}.total-row{display:flex;justify-content:space-between;font-weight:bold;font-size:13px;margin:4px 0}.summary-row{display:flex;justify-content:space-between;font-size:11px;margin:2px 0}.note{text-align:center;font-size:10px;margin-top:6px;border:1px dashed #999;padding:4px;font-style:italic}@media print{button{display:none}}</style>
  </head><body>
  <h2>Javari</h2><p class="sub">Loresho, Nairobi</p>
  <div class="divider"></div>
  ${t.orderNumber?`<div class="meta-row"><span>Order: ${t.orderNumber}</span><span>Table: ${t.tableName||"-"}</span></div>`:""}
  <div class="meta-row"><span>Cashier: ${t.cashier}</span><span>${t.date.split(",")[0]}</span></div>
  <div class="meta-row"><span>Waiter: ${t.waiterName}</span><span>${t.date.split(",")[1]?.trim()}</span></div>
  <div class="divider"></div>
  <table>${e}</table>
  <div class="divider"></div>
  <div class="total-row"><span>TOTAL</span><span>KSh ${t.total}</span></div>
  <div class="summary-row"><span>Payment:</span><span>${t.paymentMethod==="mpesa"?"Mpesa":t.paymentMethod==="card"?"Card":"Cash"}</span></div>
  ${t.paymentMethod==="cash"?`<div class="summary-row"><span>Paid:</span><span>KSh ${t.amountPaid}</span></div><div class="summary-row"><span>Change:</span><span>KSh ${t.change}</span></div>`:""}
  ${t.paymentMethod==="mpesa"?`<div class="summary-row"><span>Mpesa Code:</span><span>${t.mpesaCode}</span></div>`:""}
  ${t.paymentMethod==="card"?`<div class="summary-row"><span>Auth No:</span><span>${t.cardAuth}</span></div>`:""}
  <div class="divider"></div>
  <p class="center" style="font-size:12px">Thank you for your visit!</p>
  <div class="note">Note to Waiter: Submit this receipt attached with the bill to the cashier.</div>
  <button onclick="window.print();window.close();" style="width:100%;padding:8px;margin-top:10px;font-size:13px;cursor:pointer;background:#333;color:white;border:none;border-radius:4px">Print Receipt</button>
  </body></html>`),a.document.close(),setTimeout(()=>{a.focus(),a.print()},500)}export{y as printBill,f as printReceipt};
