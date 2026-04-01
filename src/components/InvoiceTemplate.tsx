import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Order } from '../types';

interface InvoiceTemplateProps {
  order: Order;
  id: string;
}

export default function InvoiceTemplate({ order, id }: InvoiceTemplateProps) {
  const sellerDetails = {
    name: "PrintVaan Wholesale Printing",
    address: "123 Printing Street, Creative Complex, Andheri East, Mumbai - 400093",
    gstin: "27AAACP1234A1Z5",
    phone: "+91 98765 43210",
    email: "billing@printvaan.com"
  };

  return (
    <div id={id} className="bg-white p-12 text-slate-900 w-[800px] font-sans">
      {/* Header */}
      <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 italic">TAX INVOICE</h1>
          <div className="space-y-1 text-sm font-medium text-slate-600">
            <p className="font-black text-slate-900 text-lg">{sellerDetails.name}</p>
            <p>{sellerDetails.address}</p>
            <p>GSTIN: <span className="font-black text-slate-900">{sellerDetails.gstin}</span></p>
            <p>Phone: {sellerDetails.phone}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="mb-4 inline-block p-2 border-2 border-slate-900 rounded-xl">
            <QRCodeSVG value={`https://printvaan.com/orders/${order.id}`} size={80} />
          </div>
          <div className="space-y-1 text-sm font-medium">
            <p className="text-slate-400 uppercase tracking-widest text-[10px] font-black">Invoice Number</p>
            <p className="font-black text-slate-900 text-xl">#PV-{order.id}</p>
            <p className="text-slate-400 uppercase tracking-widest text-[10px] font-black mt-4">Date</p>
            <p className="font-black text-slate-900">{order.date}</p>
          </div>
        </div>
      </div>

      {/* Billing Details */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Bill To</h3>
          <div className="space-y-1 text-sm font-medium">
            <p className="font-black text-slate-900 text-lg">{order.customerInfo.name}</p>
            <p>{order.customerInfo.phone}</p>
            <p>{order.customerInfo.email}</p>
            {!order.customerInfo.isPickup && (
              <p className="mt-2 text-slate-600 leading-relaxed">
                {order.customerInfo.addressLine1}<br />
                {order.customerInfo.addressLine2 && <>{order.customerInfo.addressLine2}<br /></>}
                {order.customerInfo.city}, {order.customerInfo.state} - {order.customerInfo.pinCode}
              </p>
            )}
            {order.customerInfo.isPickup && (
              <p className="mt-2 text-slate-600 font-black italic">Shop Pickup</p>
            )}
          </div>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Payment Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-bold">Method:</span>
              <span className="font-black text-slate-900">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-bold">Status:</span>
              <span className="font-black text-green-600 uppercase tracking-widest text-[10px]">Paid</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full mb-12 border-collapse">
        <thead>
          <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
            <th className="p-4 text-left rounded-tl-xl">Product</th>
            <th className="p-4 text-left">Specs</th>
            <th className="p-4 text-center">Qty</th>
            <th className="p-4 text-right">Gross Amt</th>
            <th className="p-4 text-right">Taxable Val</th>
            <th className="p-4 text-right">IGST (18%)</th>
            <th className="p-4 text-right rounded-tr-xl">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 border-x border-b border-slate-100">
          {order.items.map((item) => {
            const total = item.totalPrice * item.quantity;
            const taxableValue = total / 1.18;
            const igst = total - taxableValue;
            
            return (
              <tr key={item.id} className="text-sm font-medium">
                <td className="p-4">
                  <p className="font-black text-slate-900">{item.productName}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.category}</p>
                </td>
                <td className="p-4 text-xs text-slate-600">
                  {item.width}x{item.height} ft, {item.orientation}<br />
                  Ink: {item.inkType || 'N/A'}, Highlight: {item.highlightRequired || (item.finishing ? 'Yes' : 'No')}
                </td>
                <td className="p-4 text-center font-black">{item.quantity}</td>
                <td className="p-4 text-right">₹{total.toFixed(2)}</td>
                <td className="p-4 text-right">₹{taxableValue.toFixed(2)}</td>
                <td className="p-4 text-right">₹{igst.toFixed(2)}</td>
                <td className="p-4 text-right font-black text-slate-900">₹{total.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div className="flex justify-between items-start gap-12">
        <div className="flex-1">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Terms & Conditions</h4>
          <ul className="text-[10px] text-slate-500 space-y-1 font-medium list-disc ml-4">
            <li>Goods once sold will not be taken back or exchanged.</li>
            <li>We are not responsible for any delay in delivery by courier.</li>
            <li>Subject to Mumbai Jurisdiction.</li>
            <li>This is a computer generated invoice and does not require signature.</li>
          </ul>
        </div>
        <div className="w-64 space-y-4">
          <div className="flex justify-between text-sm font-bold text-slate-500">
            <span>Total Taxable Value</span>
            <span className="text-slate-900 font-black">₹{(order.grandTotal / 1.18).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-slate-500">
            <span>Total IGST (18%)</span>
            <span className="text-slate-900 font-black">₹{(order.grandTotal - (order.grandTotal / 1.18)).toFixed(2)}</span>
          </div>
          <div className="h-px bg-slate-200 my-4" />
          <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl">
            <span className="text-xs font-black uppercase tracking-widest">Grand Total</span>
            <span className="text-xl font-black">₹{order.grandTotal.toFixed(2)}</span>
          </div>
          
          <div className="pt-12 text-center">
            <div className="h-px bg-slate-200 mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Signatory</p>
            <p className="text-xs font-black text-slate-900 mt-2">For PrintVaan Wholesale</p>
          </div>
        </div>
      </div>
    </div>
  );
}
