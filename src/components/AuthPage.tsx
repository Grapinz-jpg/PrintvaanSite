import React, { useState } from 'react';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { Mail, Lock, UserPlus, LogIn, ArrowRight, CheckCircle, AlertCircle, Chrome } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Google users are usually verified, but we check just in case
      if (!user.emailVerified) {
        setUnverifiedEmail(user.email || '');
        setVerificationSent(true);
        await signOut(auth);
        toast.error('Email not verified. Please check your inbox.');
      } else {
        toast.success('Logged in with Google successfully!');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Google Auth error:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
          setUnverifiedEmail(user.email || '');
          setVerificationSent(true);
          await signOut(auth);
          toast.error('Email not verified. Please check your inbox.');
        } else {
          toast.success('Logged in successfully!');
          navigate('/');
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await sendEmailVerification(user);
        setUnverifiedEmail(user.email || '');
        setVerificationSent(true);
        
        // Sign out immediately as per requirement
        await signOut(auth);
        
        toast.success('Registration successful! Verification email sent.');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl shadow-brand-navy/5 border border-gray-100 text-center"
        >
          <div className="inline-flex p-6 bg-green-50 rounded-full mb-8">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-brand-navy tracking-tighter mb-4">Verify Your Email</h2>
          <p className="text-gray-500 font-bold leading-relaxed mb-8">
            We have sent you a verification email to <span className="text-brand-orange">{unverifiedEmail}</span>. Please verify it and log in.
          </p>
          <button
            onClick={() => {
              setVerificationSent(false);
              setIsLogin(true);
            }}
            className="w-full bg-brand-navy text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-brand-orange transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            Back to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl shadow-brand-navy/5 border border-gray-100"
      >
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-brand-navy tracking-tighter mb-2">
            {isLogin ? 'Welcome Back' : 'Join PrintVaan'}
          </h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
            {isLogin ? 'Login to manage your orders' : 'Create an account to get started'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-brand-navy uppercase tracking-widest ml-4">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-brand-navy focus:bg-white focus:border-brand-orange focus:outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-brand-navy uppercase tracking-widest ml-4">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-brand-navy focus:bg-white focus:border-brand-orange focus:outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-navy text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-brand-orange transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-navy/10 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                <span>{isLogin ? 'Login' : 'Register'}</span>
              </>
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
            <span className="bg-white px-4 text-gray-400">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white border border-gray-100 text-brand-navy py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
        >
          <Chrome className="h-5 w-5 text-brand-orange" />
          <span>Google Account</span>
        </button>

        <div className="mt-10 pt-10 border-t border-gray-50 text-center">
          <p className="text-gray-400 font-bold text-xs">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="mt-2 text-brand-orange font-black uppercase tracking-widest text-xs hover:underline flex items-center justify-center gap-2 mx-auto"
          >
            <span>{isLogin ? 'Create Account' : 'Login Instead'}</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
