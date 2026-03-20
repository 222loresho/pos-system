const PRINTER_NAME = 'POS-80C';

function connectQZ() {
  return new Promise((resolve, reject) => {
    if (window.qz && window.qz.websocket.isActive()) {
      resolve();
      return;
    }
    window.qz.websocket.connect()
      .then(resolve)
      .catch(reject);
  });
}

async function sendToPrinter(lines) {
  try {
    await connectQZ();
    const config = window.qz.configs.create(PRINTER_NAME);
    const data = lines.map(l => ({ type: 'raw', format: 'plain', data: l + '\n' }));
    await window.qz.print(config, data);
  } catch (e) {
    console.error('QZ print failed, falling back to browser print', e);
    return false;
  }
  return true;
}

function esc(cmd) {
  return '\x1b' + cmd;
}

const INIT = esc('@');
const CENTER = esc('a\x01');
const LEFT = esc('a\x00');
const BOLD_ON = esc('E\x01');
const BOLD_OFF = esc('E\x00');
const CUT = '\x1d\x56\x41\x03';
const LINE = '-'.repeat(42);
const FEED = '\n\n\n';

function pad(left, right, width = 42) {
  const space = width - left.length - right.length;
  return left + ' '.repeat(Math.max(1, space)) + right;
}

export const printBill = async (order) => {
  const openedAt = new Date(order.created_at);
  const lines = [
    INIT,
    CENTER + BOLD_ON + 'Javari' + BOLD_OFF,
    CENTER + 'Loresho, Nairobi',
    LEFT + LINE,
    pad('Order: ' + order.order_number, 'Table: ' + order.table_name),
    pad('Waiter: ' + order.waiter_name, openedAt.toLocaleDateString()),
    pad('', openedAt.toLocaleTimeString()),
    LINE,
    pad('Item', 'Amount'),
    LINE,
    ...order.items.map(i => pad(i.product_name + ' x' + i.quantity, 'KSh ' + i.subtotal)),
    LINE,
    BOLD_ON + pad('TOTAL', 'KSh ' + order.total) + BOLD_OFF,
    LINE,
    CENTER + 'Please present this bill to the cashier',
    FEED,
    CUT
  ];

  const sent = await sendToPrinter(lines.join('\n'));
  if (!sent) fallbackPrintBill(order);
};

export const printReceipt = async (receipt) => {
  const pmLabel = receipt.paymentMethod === 'mpesa' ? 'Mpesa' : receipt.paymentMethod === 'card' ? 'Card' : 'Cash';
  const lines = [
    INIT,
    CENTER + BOLD_ON + 'Javari' + BOLD_OFF,
    CENTER + 'Loresho, Nairobi',
    LEFT + LINE,
    receipt.orderNumber ? pad('Order: ' + receipt.orderNumber, 'Table: ' + (receipt.tableName || '-')) : '',
    pad('Cashier: ' + receipt.cashier, receipt.date.split(',')[0]),
    pad('Waiter: ' + receipt.waiterName, receipt.date.split(',')[1]?.trim() || ''),
    LINE,
    pad('Item', 'Amount'),
    LINE,
    ...receipt.items.map(i => pad(i.product_name + ' x' + i.quantity, 'KSh ' + i.subtotal)),
    LINE,
    BOLD_ON + pad('TOTAL', 'KSh ' + receipt.total) + BOLD_OFF,
    LINE,
    pad('Payment:', pmLabel),
    ...(receipt.paymentMethod === 'cash' ? [
      pad('Amount Paid:', 'KSh ' + receipt.amountPaid),
      pad('Change:', 'KSh ' + receipt.change),
    ] : []),
    ...(receipt.paymentMethod === 'mpesa' ? [pad('Mpesa Code:', receipt.mpesaCode)] : []),
    ...(receipt.paymentMethod === 'card' ? [pad('Auth No:', receipt.cardAuth)] : []),
    LINE,
    CENTER + 'Thank you for your visit!',
    CENTER + 'Please come again',
    LINE,
    CENTER + 'Note to Waiter: Submit this receipt',
    CENTER + 'attached with the bill to the cashier.',
    FEED,
    CUT
  ];

  const sent = await sendToPrinter(lines.join('\n'));
  if (!sent) fallbackPrintReceipt(receipt);
};

function fallbackPrintBill(order) {
  const win = window.open('', '_blank', 'width=400,height=600');
  const openedAt = new Date(order.created_at);
  const rows = order.items.map(i =>
    `<tr><td>${i.product_name}</td><td>x${i.quantity}</td><td class="right">KSh ${i.subtotal}</td></tr>`
  ).join('');
  win.document.write(`<html><head><title>Bill</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}@page{margin:0;size:80mm auto}body{font-family:'Courier New',monospace;font-size:12px;width:76mm;padding:4mm}h2{text-align:center;font-size:15px;margin-bottom:2px}.center{text-align:center}.right{text-align:right}.sub{text-align:center;font-size:11px;margin-bottom:4px}.divider{border-top:1px dashed #000;margin:5px 0}.meta-row{display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px}table{width:100%;border-collapse:collapse;margin:4px 0}td{padding:2px 0;font-size:11px;vertical-align:top}.right{width:60px;white-space:nowrap}.total-row{display:flex;justify-content:space-between;font-weight:bold;font-size:13px;margin:4px 0}@media print{button{display:none}}</style>
  </head><body>
  <h2>Javari</h2><p class="sub">Loresho, Nairobi</p>
  <div class="divider"></div>
  <div class="meta-row"><span>Order: ${order.order_number}</span><span>Table: ${order.table_name}</span></div>
  <div class="meta-row"><span>Waiter: ${order.waiter_name}</span><span>${openedAt.toLocaleDateString()}</span></div>
  <div class="meta-row"><span></span><span>${openedAt.toLocaleTimeString()}</span></div>
  <div class="divider"></div>
  <table>${rows}</table>
  <div class="divider"></div>
  <div class="total-row"><span>TOTAL</span><span>KSh ${order.total}</span></div>
  <div class="divider"></div>
  <p class="center" style="font-size:11px">Please present this bill to the cashier</p>
  <button onclick="window.print();window.close();" style="width:100%;padding:8px;margin-top:10px;font-size:13px;cursor:pointer;background:#333;color:white;border:none;border-radius:4px">Print Bill</button>
  </body></html>`);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 500);
}

function fallbackPrintReceipt(receipt) {
  const win = window.open('', '_blank', 'width=400,height=600');
  const rows = receipt.items.map(i =>
    `<tr><td>${i.product_name}</td><td>x${i.quantity}</td><td class="right">KSh ${i.subtotal}</td></tr>`
  ).join('');
  win.document.write(`<html><head><title>Receipt</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}@page{margin:0;size:80mm auto}body{font-family:'Courier New',monospace;font-size:12px;width:76mm;padding:4mm}h2{text-align:center;font-size:15px;margin-bottom:2px}.center{text-align:center}.right{text-align:right}.sub{text-align:center;font-size:11px;margin-bottom:4px}.divider{border-top:1px dashed #000;margin:5px 0}.meta-row{display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px}table{width:100%;border-collapse:collapse;margin:4px 0}td{padding:2px 0;font-size:11px}.right{width:60px;white-space:nowrap}.total-row{display:flex;justify-content:space-between;font-weight:bold;font-size:13px;margin:4px 0}.summary-row{display:flex;justify-content:space-between;font-size:11px;margin:2px 0}.note{text-align:center;font-size:10px;margin-top:6px;border:1px dashed #999;padding:4px;font-style:italic}@media print{button{display:none}}</style>
  </head><body>
  <h2>Javari</h2><p class="sub">Loresho, Nairobi</p>
  <div class="divider"></div>
  ${receipt.orderNumber ? `<div class="meta-row"><span>Order: ${receipt.orderNumber}</span><span>Table: ${receipt.tableName || '-'}</span></div>` : ''}
  <div class="meta-row"><span>Cashier: ${receipt.cashier}</span><span>${receipt.date.split(',')[0]}</span></div>
  <div class="meta-row"><span>Waiter: ${receipt.waiterName}</span><span>${receipt.date.split(',')[1]?.trim()}</span></div>
  <div class="divider"></div>
  <table>${rows}</table>
  <div class="divider"></div>
  <div class="total-row"><span>TOTAL</span><span>KSh ${receipt.total}</span></div>
  <div class="summary-row"><span>Payment:</span><span>${receipt.paymentMethod === 'mpesa' ? 'Mpesa' : receipt.paymentMethod === 'card' ? 'Card' : 'Cash'}</span></div>
  ${receipt.paymentMethod === 'cash' ? `<div class="summary-row"><span>Paid:</span><span>KSh ${receipt.amountPaid}</span></div><div class="summary-row"><span>Change:</span><span>KSh ${receipt.change}</span></div>` : ''}
  ${receipt.paymentMethod === 'mpesa' ? `<div class="summary-row"><span>Mpesa Code:</span><span>${receipt.mpesaCode}</span></div>` : ''}
  ${receipt.paymentMethod === 'card' ? `<div class="summary-row"><span>Auth No:</span><span>${receipt.cardAuth}</span></div>` : ''}
  <div class="divider"></div>
  <p class="center" style="font-size:12px">Thank you for your visit!</p>
  <div class="note">Note to Waiter: Submit this receipt attached with the bill to the cashier.</div>
  <button onclick="window.print();window.close();" style="width:100%;padding:8px;margin-top:10px;font-size:13px;cursor:pointer;background:#333;color:white;border:none;border-radius:4px">Print Receipt</button>
  </body></html>`);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 500);
}
