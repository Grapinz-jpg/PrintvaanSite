import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, RefreshCw, XCircle, IndianRupee, Package, Calendar, MapPin, Phone, User, CheckCircle2, HandCoins, CreditCard, Mail, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Order, OrderStatus } from '../types';
import { getOrderById } from '../services/db';
import Breadcrumbs from './Breadcrumbs';
import { StatusBadge } from './OrdersPage';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import InvoiceTemplate from './InvoiceTemplate';
import { toast } from 'sonner';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STEPS: OrderStatus[] = ['Pending', 'Processing', 'Printing', 'Ready for Pickup', 'Delivered'];

interface OrderDetailPageProps {
  customOrders?: Order[];
}

export default function OrderDetailPage({ customOrders = [] }: OrderDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      // Check custom orders first
      const customOrder = customOrders.find(o => o.id === id);
      if (customOrder) {
        setOrder(customOrder);
        setLoading(false);
      } else {
        getOrderById(id).then((data) => {
          setOrder(data || null);
          setLoading(false);
        });
      }
    }
  }, [id, customOrders]);

  const handleDownloadInvoice = async () => {
    if (!order || !invoiceRef.current) return;
    
    setIsDownloading(true);
    const toastId = toast.loading('Generating your invoice...', {
      className: 'bg-brand-navy text-white border-none rounded-2xl font-bold',
    });

    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`PrintVaan_Invoice_${order.id}.pdf`);
      
      toast.success('Invoice downloaded successfully!', {
        id: toastId,
        className: 'bg-brand-navy text-white border-none rounded-2xl font-bold',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate invoice. Please try again.', {
        id: toastId,
        className: 'bg-red-500 text-white border-none rounded-2xl font-bold',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPrintFile = () => {
    toast.info('Preparing your print file...', {
      description: 'Your high-resolution print file is being generated.',
      className: 'bg-brand-navy text-white border-none rounded-2xl font-bold',
    });
    // Simulate download
    setTimeout(() => {
      toast.success('Print file ready for download!', {
        className: 'bg-brand-navy text-white border-none rounded-2xl font-bold',
      });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Breadcrumbs />
        <div className="h-96 bg-white rounded-[3rem] animate-pulse border border-gray-100" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Breadcrumbs />
        <h2 className="text-3xl font-black text-brand-navy mb-4 tracking-tight">Order not found</h2>
        <Link to="/orders" className="text-brand-orange font-bold hover:underline">Back to My Orders</Link>
      </div>
    );
  }

  const currentStepIndex = STEPS.indexOf(order.status);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Breadcrumbs />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          {/* Top Section */}
          <section className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl shadow-gray-200/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
              <div>
                <h1 className="text-3xl font-black text-brand-navy tracking-tighter mb-2">Order #{order.id}</h1>
                <div className="flex items-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                  <Calendar className="h-4 w-4 mr-2 text-brand-orange" />
                  <span>Placed on: {order.date}</span>
                </div>
              </div>
              <StatusBadge status={order.status} />
            </div>

            {/* Timeline Stepper */}
            <div className="relative pt-8 pb-4">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                  className="h-full bg-brand-orange"
                />
              </div>
              
              <div className="relative flex justify-between">
                {STEPS.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  
                  return (
                    <div key={step} className="flex flex-col items-center">
                      <motion.div
                        initial={false}
                        animate={{ 
                          scale: isCurrent ? 1.2 : 1,
                          backgroundColor: isCompleted ? '#E8450A' : '#F3F4F6'
                        }}
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center z-10 border-4 border-white shadow-lg transition-colors",
                          isCurrent && "ring-4 ring-brand-orange/20"
                        )}
                      >
                        {isCompleted && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </motion.div>
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest mt-4 text-center max-w-[60px]",
                        isCompleted ? "text-brand-orange" : "text-gray-300"
                      )}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Items Table */}
          <section className="bg-white rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm">
            <div className="px-10 py-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-black text-brand-navy tracking-tight">Order Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="px-10 py-6">Product</th>
                    <th className="px-6 py-6">Size</th>
                    <th className="px-6 py-6">Orientation</th>
                    <th className="px-6 py-6">Finishing</th>
                    <th className="px-6 py-6">Qty</th>
                    <th className="px-6 py-6">Rate</th>
                    <th className="px-10 py-6 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items.map((item) => (
                    <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-10 py-6">
                        <div className="flex items-center space-x-4">
                          <img src={item.thumbnail} className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
                          <div>
                            <p className="font-black text-brand-navy text-sm leading-tight">{item.productName}</p>
                            <p className="text-[10px] font-bold text-brand-orange uppercase tracking-widest mt-0.5">{item.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-sm font-bold text-brand-navy">{item.width}×{item.height} ft</td>
                      <td className="px-6 py-6 text-sm font-bold text-brand-navy">{item.orientation}</td>
                      <td className="px-6 py-6">
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", item.finishing ? "text-green-600" : "text-gray-300")}>
                          {item.finishing ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-sm font-bold text-brand-navy">×{item.quantity}</td>
                      <td className="px-6 py-6 text-sm font-bold text-brand-navy">₹{item.ratePerSqft}</td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex items-center justify-end text-brand-orange font-black">
                          <IndianRupee className="h-3 w-3 mr-0.5" />
                          <span>{item.totalPrice.toFixed(2)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Summary Box */}
          <section className="bg-brand-navy rounded-[2.5rem] p-8 text-white shadow-2xl">
            <h2 className="text-xl font-black mb-8 tracking-tight">Order Summary</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-white/60 font-bold text-xs uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="text-white">₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="h-px bg-white/10 my-6" />
              <div className="flex justify-between items-center">
                <span className="text-lg font-black tracking-tight">Grand Total</span>
                <div className="flex items-center text-2xl font-black text-brand-orange">
                  <IndianRupee className="h-5 w-5 mr-1" />
                  <span>{order.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleDownloadInvoice}
                disabled={isDownloading}
                className="w-full bg-brand-orange text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 hover:bg-white hover:text-brand-navy transition-all shadow-xl shadow-brand-orange/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span>{isDownloading ? 'Generating...' : 'Download Invoice'}</span>
              </button>
              <button 
                onClick={handleDownloadPrintFile}
                className="w-full bg-white/10 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 hover:bg-white/20 transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Download Print File</span>
              </button>
              <button className="w-full bg-white text-brand-navy py-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 hover:bg-brand-orange hover:text-white transition-all mt-4">
                <RefreshCw className="h-4 w-4" />
                <span>Reorder</span>
              </button>
              {order.status === 'Pending' && (
                <button className="w-full bg-transparent text-red-500 border-2 border-red-500/20 py-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all mt-4">
                  <XCircle className="h-4 w-4" />
                  <span>Cancel Order</span>
                </button>
              )}
            </div>
          </section>

          {/* Customer Info Card */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-black text-brand-navy mb-6 tracking-tight">Customer & Delivery</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <User className="h-5 w-5 text-brand-orange" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Customer Name</p>
                  <p className="font-black text-brand-navy">{order.customerInfo.name}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <Mail className="h-5 w-5 text-brand-orange" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                  <p className="font-black text-brand-navy">{order.customerInfo.email}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <Phone className="h-5 w-5 text-brand-orange" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                  <p className="font-black text-brand-navy">{order.customerInfo.phone}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <MapPin className="h-5 w-5 text-brand-orange" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Delivery Address</p>
                  {order.customerInfo.isPickup ? (
                    <p className="text-sm font-black text-brand-orange italic">Shop Pickup Selected</p>
                  ) : (
                    <div className="text-sm font-black text-brand-navy space-y-0.5">
                      <p>{order.customerInfo.addressLine1}</p>
                      {order.customerInfo.addressLine2 && <p>{order.customerInfo.addressLine2}</p>}
                      <p>{order.customerInfo.city}, {order.customerInfo.state} - {order.customerInfo.pinCode}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <HandCoins className="h-5 w-5 text-brand-orange" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Method</p>
                  <p className="font-black text-brand-navy">{order.paymentMethod}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Hidden Invoice Template for PDF generation */}
      <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none overflow-hidden h-0">
        <div ref={invoiceRef}>
          <InvoiceTemplate order={order} id="invoice-capture" />
        </div>
      </div>
    </div>
  );
}
