import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Calendar, ArrowRight, IndianRupee, CheckCircle2, Clock, Printer, Truck, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Order, OrderStatus } from '../types';
import { getOrders } from '../services/db';
import Breadcrumbs from './Breadcrumbs';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const config: Record<OrderStatus, { color: string; icon: any }> = {
    'Pending': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertCircle },
    'Processing': { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
    'Printing': { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Printer },
    'Ready for Pickup': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Truck },
    'Delivered': { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
    'Cancelled': { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  };

  const { color, icon: Icon } = config[status];

  return (
    <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center space-x-2 w-fit", color)}>
      <Icon className="h-3 w-3" />
      <span>{status}</span>
    </span>
  );
};

interface OrdersPageProps {
  customOrders?: Order[];
}

import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';

export default function OrdersPage({ customOrders = [] }: OrdersPageProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      if (!user.emailVerified) {
        navigate('/login');
        toast.error('Please verify your email to access your orders.');
        return;
      }

      getOrders().then((data) => {
        // Merge mock orders with custom orders from state
        const merged = [...customOrders, ...data];
        setOrders(merged);
        setLoading(false);
      });
    });

    return () => unsubscribeAuth();
  }, [customOrders, navigate]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Breadcrumbs />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-white rounded-[2.5rem] animate-pulse border border-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Breadcrumbs />
      
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black text-brand-navy tracking-tighter">My Orders</h1>
          <p className="text-gray-400 font-bold text-sm mt-2 uppercase tracking-widest">Total Orders: {orders.length}</p>
        </div>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-xl font-black text-brand-navy tracking-tight">Order #{order.id}</span>
                  <StatusBadge status={order.status} />
                </div>
                
                <div className="flex items-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                  <Calendar className="h-4 w-4 mr-2 text-brand-orange" />
                  <span>{order.date}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm font-bold text-brand-navy/60">
                  <Package className="h-4 w-4 text-brand-orange" />
                  <p className="line-clamp-1">
                    {order.items.map(item => `${item.productName} × ${item.quantity}`).join(', ')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Grand Total</p>
                  <div className="flex items-center text-2xl font-black text-brand-orange">
                    <IndianRupee className="h-5 w-5 mr-0.5" />
                    <span>{order.grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Link
                  to={`/orders/${order.id}`}
                  className="bg-brand-navy text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center space-x-2 hover:bg-brand-orange transition-all shadow-xl shadow-brand-navy/20 hover:shadow-brand-orange/20"
                >
                  <span>View Details</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
