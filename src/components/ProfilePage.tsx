import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '../types';
import { useFirestore } from '../hooks/useFirestore';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, Phone, MapPin, Mail, Shield, Edit2, Save, X, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function ProfilePage() {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { saveUserProfile } = useFirestore();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      const profileRef = doc(db, 'users', user.uid);
      const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as User;
          setProfile(data);
          setEditForm({ phone: data.phone, address: data.address });
        } else {
          // Create default profile if it doesn't exist
          const newProfile: User = {
            uid: user.uid,
            name: user.displayName || 'Guest User',
            email: user.email || '',
            phone: '',
            address: '',
            role: user.email === 'learn.grapinz@gmail.com' ? 'admin' : 'user',
            createdAt: serverTimestamp(),
          };
          setDoc(profileRef, newProfile).catch(err => console.error("Error creating profile:", err));
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching profile:", error);
        setLoading(false);
      });

      return () => unsubscribeProfile();
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      await saveUserProfile({
        phone: editForm.phone,
        address: editForm.address,
      });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <Loader2 className="h-8 w-8 animate-spin text-brand-navy" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-brand-cream pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] shadow-sm border border-brand-navy/5 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-brand-navy p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="relative z-10 flex items-center space-x-6">
              <div className="h-24 w-24 rounded-full bg-brand-orange flex items-center justify-center text-3xl font-black border-4 border-white/20">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">{profile.name}</h1>
                <div className="flex items-center space-x-2 mt-1 opacity-80">
                  <Shield className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">{profile.role}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <form onSubmit={handleUpdateProfile} className="space-y-8">
              <div className="grid gap-6">
                {/* Email (Read-only) */}
                <div className="flex items-start space-x-4 p-4 rounded-2xl bg-brand-cream/30 border border-brand-navy/5">
                  <div className="mt-1 p-2 bg-brand-navy/5 rounded-xl">
                    <Mail className="h-5 w-5 text-brand-navy" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-navy/40">Email Address</label>
                    <p className="font-bold text-brand-navy">{profile.email}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start space-x-4 p-4 rounded-2xl bg-brand-cream/30 border border-brand-navy/5">
                  <div className="mt-1 p-2 bg-brand-navy/5 rounded-xl">
                    <Phone className="h-5 w-5 text-brand-navy" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-navy/40">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full mt-1 bg-white border border-brand-navy/10 rounded-xl px-4 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p className="font-bold text-brand-navy">{profile.phone || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start space-x-4 p-4 rounded-2xl bg-brand-cream/30 border border-brand-navy/5">
                  <div className="mt-1 p-2 bg-brand-navy/5 rounded-xl">
                    <MapPin className="h-5 w-5 text-brand-navy" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-navy/40">Delivery Address</label>
                    {isEditing ? (
                      <textarea
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        className="w-full mt-1 bg-white border border-brand-navy/10 rounded-xl px-4 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 min-h-[100px]"
                        placeholder="Enter your full address"
                      />
                    ) : (
                      <p className="font-bold text-brand-navy leading-relaxed">{profile.address || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-4 pt-4">
                <div className="flex items-center space-x-4">
                  {isEditing ? (
                    <>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-brand-navy text-white font-black py-4 rounded-2xl flex items-center justify-center space-x-2 hover:bg-brand-navy/90 transition-colors disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        <span>Save Changes</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setEditForm({ phone: profile.phone, address: profile.address });
                        }}
                        className="px-6 bg-brand-cream text-brand-navy font-black py-4 rounded-2xl flex items-center justify-center space-x-2 hover:bg-brand-navy/5 transition-colors"
                      >
                        <X className="h-5 w-5" />
                        <span>Cancel</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex-1 bg-brand-navy text-white font-black py-4 rounded-2xl flex items-center justify-center space-x-2 hover:bg-brand-navy/90 transition-colors"
                    >
                      <Edit2 className="h-5 w-5" />
                      <span>Edit Profile</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full bg-brand-orange/10 text-brand-orange font-black py-4 rounded-2xl flex items-center justify-center space-x-2 hover:bg-brand-orange/20 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Log Out</span>
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
