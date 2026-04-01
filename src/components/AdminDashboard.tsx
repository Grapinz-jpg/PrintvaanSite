import React, { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { Order, User, OrderStatus } from '../types';
import { 
  Package, 
  Users, 
  CreditCard, 
  Search, 
  ChevronRight, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle, 
  AlertCircle,
  ArrowLeft,
  FileText,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

type Tab = 'orders' | 'payments' | 'users';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  
  const { subscribeToAllOrders, getAllUsers, updateOrderStatus } = useFirestore();

  useEffect(() => {
    const unsubscribeOrders = subscribeToAllOrders((data) => {
      setOrders(data);
      setLoading(false);
    });

    getAllUsers().then(setUsers);

    return () => unsubscribeOrders();
  }, [subscribeToAllOrders, getAllUsers]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const success = await updateOrderStatus(orderId, newStatus);
    if (success) {
      toast.success(`Order status updated to ${newStatus}`);
    } else {
      toast.error('Failed to update order status');
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerInfo.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [orders, searchQuery]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const userOrders = useMemo(() => {
    if (!selectedUser) return [];
    return orders.filter(o => o.userId === selectedUser.uid || o.customerInfo.email === selectedUser.email);
  }, [orders, selectedUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream/30">
        <Loader2 className="h-12 w-12 animate-spin text-brand-navy" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream/20 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black text-brand-navy tracking-tighter">Admin Dashboard</h1>
            <p className="text-gray-400 font-bold text-sm mt-2 uppercase tracking-widest">Management Console</p>
          </div>

          <div className="flex items-center bg-white rounded-2xl p-1 shadow-sm border border-brand-navy/5">
            <button
              onClick={() => setActiveTab('orders')}
              className={cn(
                "px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center space-x-2",
                activeTab === 'orders' ? "bg-brand-navy text-white shadow-lg shadow-brand-navy/20" : "text-gray-400 hover:text-brand-navy"
              )}
            >
              <Package className="h-4 w-4" />
              <span>Orders</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={cn(
                "px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center space-x-2",
                activeTab === 'payments' ? "bg-brand-navy text-white shadow-lg shadow-brand-navy/20" : "text-gray-400 hover:text-brand-navy"
              )}
            >
              <CreditCard className="h-4 w-4" />
              <span>Payments</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={cn(
                "px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center space-x-2",
                activeTab === 'users' ? "bg-brand-navy text-white shadow-lg shadow-brand-navy/20" : "text-gray-400 hover:text-brand-navy"
              )}
            >
              <Users className="h-4 w-4" />
              <span>Users</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-brand-navy/5 rounded-[2rem] pl-14 pr-8 py-5 font-bold text-brand-navy focus:outline-none focus:ring-4 focus:ring-brand-orange/10 transition-all shadow-sm"
          />
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[2.5rem] shadow-sm border border-brand-navy/5 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-navy text-white">
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Order ID</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Item</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Size</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Ink Type</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Status</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-navy/5">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-brand-cream/20 transition-colors">
                        <td className="px-8 py-6 font-black text-brand-navy">#{order.id.slice(-6).toUpperCase()}</td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-brand-navy">{order.items[0]?.productName || 'N/A'}</span>
                            {order.items.length > 1 && (
                              <span className="text-[10px] text-gray-400 font-bold uppercase">+{order.items.length - 1} more items</span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-xs font-bold text-gray-500">
                          {order.items[0] ? `${order.items[0].width}x${order.items[0].height} ft` : 'N/A'}
                        </td>
                        <td className="px-8 py-6 text-xs font-bold text-gray-500">
                          {order.items[0]?.inkType || 'N/A'}
                        </td>
                        <td className="px-8 py-6">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setViewingOrder(order)}
                              className="p-2 bg-brand-orange/10 text-brand-orange rounded-lg hover:bg-brand-orange hover:text-white transition-all"
                              title="View Full Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                              className="bg-brand-cream/50 border border-brand-navy/10 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Printing">Printing</option>
                              <option value="Preparing">Preparing</option>
                              <option value="Out for Delivery">Dispatched</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                              <option value="Out of Stock">Out of Stock</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[2.5rem] shadow-sm border border-brand-navy/5 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-navy text-white">
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Customer</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Method</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Amount</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Status</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-navy/5">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-brand-cream/20 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-brand-navy">{order.customerInfo.name}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Order #{order.id.slice(-6).toUpperCase()}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-brand-cream rounded-lg text-[10px] font-black uppercase tracking-widest text-brand-navy/60">
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="px-8 py-6 font-black text-brand-orange">₹{order.grandTotal.toFixed(2)}</td>
                        <td className="px-8 py-6">
                          <span className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center space-x-2 w-fit",
                            order.paymentStatus === 'Paid' ? "bg-green-100 text-green-700 border-green-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"
                          )}>
                            {order.paymentStatus === 'Paid' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            <span>{order.paymentStatus}</span>
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="p-3 bg-brand-navy/5 text-brand-navy rounded-xl hover:bg-brand-navy hover:text-white transition-all"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Users List */}
              <motion.div
                key="users-list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-1 bg-white rounded-[2.5rem] shadow-sm border border-brand-navy/5 overflow-hidden"
              >
                <div className="p-6 border-bottom border-brand-navy/5 bg-brand-navy/5">
                  <h3 className="text-sm font-black uppercase tracking-widest text-brand-navy">All Users</h3>
                </div>
                <div className="divide-y divide-brand-navy/5 max-h-[600px] overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.uid}
                      onClick={() => setSelectedUser(user)}
                      className={cn(
                        "w-full text-left px-6 py-6 transition-all flex items-center justify-between group",
                        selectedUser?.uid === user.uid ? "bg-brand-navy text-white" : "hover:bg-brand-cream/30"
                      )}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "h-12 w-12 rounded-full flex items-center justify-center font-black text-lg",
                          selectedUser?.uid === user.uid ? "bg-brand-orange text-white" : "bg-brand-navy/5 text-brand-navy"
                        )}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold tracking-tight">{user.name}</p>
                          <p className={cn(
                            "text-[10px] font-bold uppercase tracking-widest",
                            selectedUser?.uid === user.uid ? "text-white/60" : "text-gray-400"
                          )}>{user.email}</p>
                        </div>
                      </div>
                      <ChevronRight className={cn(
                        "h-5 w-5 transition-transform",
                        selectedUser?.uid === user.uid ? "translate-x-1" : "text-gray-300 group-hover:translate-x-1"
                      )} />
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* User Details & History */}
              <motion.div
                key="user-details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-brand-navy/5 overflow-hidden"
              >
                {selectedUser ? (
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-12">
                      <div className="flex items-center space-x-6">
                        <div className="h-20 w-20 rounded-full bg-brand-orange flex items-center justify-center text-3xl font-black text-white">
                          {selectedUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h2 className="text-3xl font-black text-brand-navy tracking-tighter">{selectedUser.name}</h2>
                          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{selectedUser.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Orders</p>
                        <p className="text-3xl font-black text-brand-navy">{userOrders.length}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                      <div className="p-6 rounded-3xl bg-brand-cream/30 border border-brand-navy/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-navy/40 mb-2">Phone</p>
                        <p className="font-bold text-brand-navy">{selectedUser.phone || 'N/A'}</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-brand-cream/30 border border-brand-navy/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-navy/40 mb-2">Address</p>
                        <p className="font-bold text-brand-navy line-clamp-2">{selectedUser.address || 'N/A'}</p>
                      </div>
                    </div>

                    <h3 className="text-sm font-black uppercase tracking-widest text-brand-navy mb-6">Order History</h3>
                    <div className="space-y-4">
                      {userOrders.length > 0 ? (
                        userOrders.map((order) => (
                          <div key={order.id} className="p-6 rounded-3xl border border-brand-navy/5 hover:border-brand-orange/30 transition-all flex items-center justify-between group">
                            <div className="flex items-center space-x-4">
                              <div className="p-3 bg-brand-navy/5 rounded-2xl group-hover:bg-brand-orange/10 transition-colors">
                                <Package className="h-5 w-5 text-brand-navy group-hover:text-brand-orange" />
                              </div>
                              <div>
                                <p className="font-black text-brand-navy">#{order.id.slice(-6).toUpperCase()}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">{order.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-8">
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Amount</p>
                                <p className="font-black text-brand-navy">₹{order.grandTotal.toFixed(2)}</p>
                              </div>
                              <StatusBadge status={order.status} />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-brand-cream/20 rounded-3xl border border-dashed border-brand-navy/10">
                          <p className="text-gray-400 font-bold">No orders found for this user.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                    <div className="h-24 w-24 bg-brand-navy/5 rounded-full flex items-center justify-center mb-6">
                      <Users className="h-10 w-10 text-brand-navy/20" />
                    </div>
                    <h3 className="text-xl font-black text-brand-navy tracking-tight mb-2">Select a User</h3>
                    <p className="text-gray-400 font-bold text-sm max-w-xs">Choose a user from the list to view their profile details and order history.</p>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 sm:p-12">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <h2 className="text-3xl font-black text-brand-navy tracking-tighter">Invoice</h2>
                    <p className="text-brand-orange font-black text-sm uppercase tracking-widest mt-1">Order #{selectedOrder.id.slice(-6).toUpperCase()}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="p-3 bg-brand-navy/5 rounded-2xl hover:bg-brand-navy/10 transition-colors"
                  >
                    <XCircle className="h-6 w-6 text-brand-navy" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-12 mb-12">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Customer</p>
                    <p className="font-black text-brand-navy">{selectedOrder.customerInfo.name}</p>
                    <p className="text-xs font-bold text-gray-500">{selectedOrder.customerInfo.email}</p>
                    <p className="text-xs font-bold text-gray-500">{selectedOrder.customerInfo.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Date</p>
                    <p className="font-black text-brand-navy">{selectedOrder.date}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-navy/40 mt-4 mb-1">Payment Method</p>
                    <p className="text-xs font-bold text-brand-navy">{selectedOrder.paymentMethod}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-12">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Items</p>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-4 border-b border-brand-navy/5">
                      <div>
                        <p className="font-bold text-brand-navy">{item.productName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{item.width}x{item.height} ft • Qty: {item.quantity}</p>
                      </div>
                      <p className="font-black text-brand-navy">₹{item.totalPrice.toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-brand-cream/30 rounded-3xl p-8 space-y-3">
                  <div className="flex justify-between text-sm font-bold text-gray-500">
                    <span>Subtotal</span>
                    <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-gray-500">
                    <span>GST (18%)</span>
                    <span>₹{selectedOrder.gst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-black text-brand-navy pt-3 border-t border-brand-navy/10">
                    <span>Total Amount</span>
                    <span className="text-brand-orange">₹{selectedOrder.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Details Modal */}
      <AnimatePresence>
        {viewingOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingOrder(null)}
              className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8 sm:p-12">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-brand-navy tracking-tighter">Order Details</h2>
                    <p className="text-brand-orange font-black text-sm uppercase tracking-widest mt-1">Order #{viewingOrder.id.slice(-6).toUpperCase()}</p>
                  </div>
                  <button 
                    onClick={() => setViewingOrder(null)}
                    className="p-3 bg-brand-navy/5 rounded-2xl hover:bg-brand-navy/10 transition-colors"
                  >
                    <XCircle className="h-6 w-6 text-brand-navy" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-12 mb-8">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Customer</p>
                    <p className="font-black text-brand-navy">{viewingOrder.customerInfo.name}</p>
                    <p className="text-xs font-bold text-gray-500">{viewingOrder.customerInfo.email}</p>
                    <p className="text-xs font-bold text-gray-500">{viewingOrder.customerInfo.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Date</p>
                    <p className="font-black text-brand-navy">{viewingOrder.date}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-navy/40 mt-4 mb-1">Payment Method</p>
                    <p className="text-xs font-bold text-brand-navy">{viewingOrder.paymentMethod}</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {viewingOrder.items.map((item, idx) => (
                    <div key={idx} className="bg-brand-cream/20 rounded-[2rem] p-8 border border-brand-navy/5">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-brand-navy">{item.productName}</h3>
                        <span className="px-4 py-1 bg-brand-orange text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                          Item {idx + 1}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Quantity</p>
                          <p className="font-bold text-brand-navy">{item.quantity}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Size</p>
                          <p className="font-bold text-brand-navy">{item.width} x {item.height} ft</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Orientation</p>
                          <p className="font-bold text-brand-navy">{item.orientation}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Ink Type</p>
                          <p className="font-bold text-brand-navy">{item.inkType}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Highlight Required</p>
                          <p className="font-bold text-brand-navy">{item.highlightRequired}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Design URL</p>
                          {item.designUrl ? (
                            <a 
                              href={item.designUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-brand-orange font-bold hover:underline flex items-center gap-1"
                            >
                              View Design <Eye className="h-3 w-3" />
                            </a>
                          ) : (
                            <p className="font-bold text-gray-400 italic">No design uploaded</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-brand-navy/5">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Customer User ID</p>
                      <p className="text-xs font-mono text-brand-navy bg-gray-100 px-3 py-1 rounded-lg">{viewingOrder.userId || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Current Status</p>
                      <StatusBadge status={viewingOrder.status} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const config: Record<OrderStatus, { color: string; icon: any }> = {
    'Pending': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertCircle },
    'Processing': { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
    'Printing': { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Package },
    'Preparing': { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Clock },
    'Out for Delivery': { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Truck },
    'Ready for Pickup': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Truck },
    'Delivered': { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
    'Cancelled': { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    'Out of Stock': { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: AlertCircle },
  };

  const { color, icon: Icon } = config[status] || config['Pending'];

  return (
    <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center space-x-2 w-fit", color)}>
      <Icon className="h-3 w-3" />
      <span>{status}</span>
    </span>
  );
};
