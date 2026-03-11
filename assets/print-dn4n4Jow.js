const n=t=>{const a=window.open("","_blank","width=400,height=600"),s=new Date(t.created_at),e=t.items.map(i=>`<tr><td>${i.product_name}</td><td class="center">x${i.quantity}</td><td class="right">KSh ${i.subtotal}</td></tr>`).join("");a.document.write(`
    <html><head><title>Bill</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      @page { margin: 0; size: 80mm auto; }
      body { font-family: 'Courier New', monospace; font-size: 12px; width: 76mm; padding: 4mm; }
      h2 { text-align: center; font-size: 15px; margin-bottom: 2px; }
      .center { text-align: center; }
      .right { text-align: right; }
      .sub { text-align: center; font-size: 11px; margin-bottom: 4px; }
      .divider { border-top: 1px dashed #000; margin: 5px 0; }
      .meta-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; }
      table { width: 100%; border-collapse: collapse; margin: 4px 0; }
      td { padding: 2px 0; font-size: 11px; vertical-align: top; }
      td.center { width: 20px; }
      td.right { width: 60px; white-space: nowrap; }
      .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin: 4px 0; }
      .note { text-align: center; font-size: 10px; margin-top: 6px; border: 1px dashed #999; padding: 4px; }
      @media print { button { display: none; } }
    </style></head><body>
    <h2>Triple Two Loresho</h2>
    <p class="sub">📍 Loresho, Nairobi</p>
    <div class="divider"></div>
    <div class="meta-row"><span>Order: ${t.order_number}</span><span>Table: ${t.table_name}</span></div>
    <div class="meta-row"><span>Waiter: ${t.waiter_name}</span><span>${s.toLocaleDateString()}</span></div>
    <div class="meta-row"><span></span><span>${s.toLocaleTimeString()}</span></div>
    <div class="divider"></div>
    <table>
      <tr><td><b>Item</b></td><td class="center"><b>Qty</b></td><td class="right"><b>Amount</b></td></tr>
      <tr><td colspan="3"><div class="divider"></div></td></tr>
      ${e}
      <tr><td colspan="3"><div class="divider"></div></td></tr>
    </table>
    <div class="total-row"><span>TOTAL</span><span>KSh ${t.total}</span></div>
    <div class="divider"></div>
    <p class="center" style="font-size:11px">Please present this bill to the cashier</p>
    <button onclick="window.print();window.close();" style="width:100%;padding:8px;margin-top:10px;font-size:13px;cursor:pointer;background:#333;color:white;border:none;border-radius:4px">🖨️ Print Bill</button>
    </body></html>
  `),a.document.close(),setTimeout(()=>{a.focus(),a.print()},500)},d=t=>{const a=window.open("","_blank","width=400,height=600"),s=t.items.map(e=>`<tr><td>${e.product_name}</td><td class="center">x${e.quantity}</td><td class="right">KSh ${e.subtotal}</td></tr>`).join("");a.document.write(`
    <html><head><title>Receipt</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      @page { margin: 0; size: 80mm auto; }
      body { font-family: 'Courier New', monospace; font-size: 12px; width: 76mm; padding: 4mm; }
      h2 { text-align: center; font-size: 15px; margin-bottom: 2px; }
      .center { text-align: center; }
      .right { text-align: right; }
      .sub { text-align: center; font-size: 11px; margin-bottom: 4px; }
      .divider { border-top: 1px dashed #000; margin: 5px 0; }
      .meta-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; }
      table { width: 100%; border-collapse: collapse; margin: 4px 0; }
      td { padding: 2px 0; font-size: 11px; vertical-align: top; }
      td.center { width: 20px; }
      td.right { width: 60px; white-space: nowrap; }
      .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin: 4px 0; }
      .summary-row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
      .note { text-align: center; font-size: 10px; margin-top: 6px; border: 1px dashed #999; padding: 4px; font-style: italic; }
      @media print { button { display: none; } }
    </style></head><body>
    <h2>Triple Two Loresho</h2>
    <p class="sub">📍 Loresho, Nairobi</p>
    <div class="divider"></div>
    ${t.orderNumber?`<div class="meta-row"><span>Order: ${t.orderNumber}</span><span>Table: ${t.tableName||"-"}</span></div>`:""}
    <div class="meta-row"><span>Cashier: ${t.cashier}</span><span>${t.date.split(",")[0]}</span></div>
    <div class="meta-row"><span>Waiter: ${t.waiterName}</span><span>${t.date.split(",")[1]?.trim()}</span></div>
    <div class="divider"></div>
    <table>
      <tr><td><b>Item</b></td><td class="center"><b>Qty</b></td><td class="right"><b>Amount</b></td></tr>
      <tr><td colspan="3"><div class="divider"></div></td></tr>
      ${s}
      <tr><td colspan="3"><div class="divider"></div></td></tr>
    </table>
    <div class="total-row"><span>TOTAL</span><span>KSh ${t.total}</span></div>
    <div class="summary-row"><span>Payment:</span><span>${t.paymentMethod==="mpesa"?"Mpesa":t.paymentMethod==="card"?"Card":"Cash"}</span></div>
    ${t.paymentMethod==="cash"?`
      <div class="summary-row"><span>Paid:</span><span>KSh ${t.amountPaid}</span></div>
      <div class="summary-row"><span>Change:</span><span>KSh ${t.change}</span></div>
    `:""}
    ${t.paymentMethod==="mpesa"?`<div class="summary-row"><span>Mpesa Code:</span><span>${t.mpesaCode}</span></div>`:""}
    ${t.paymentMethod==="card"?`<div class="summary-row"><span>Auth No:</span><span>${t.cardAuth}</span></div>`:""}
    <div class="divider"></div>
    <p class="center" style="font-size:12px">Thank you for your visit!</p>
    <p class="center" style="font-size:11px">Please come again</p>
    <div class="note">Note to Waiter: Submit this receipt attached with the bill to the cashier.</div>
    <button onclick="window.print();window.close();" style="width:100%;padding:8px;margin-top:10px;font-size:13px;cursor:pointer;background:#333;color:white;border:none;border-radius:4px">🖨️ Print Receipt</button>
    </body></html>
  `),a.document.close(),setTimeout(()=>{a.focus(),a.print()},500)};export{n as printBill,d as printReceipt};
