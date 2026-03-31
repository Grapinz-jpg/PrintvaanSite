import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { FileUp, Trash2, File, ExternalLink, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { UploadedFile } from '../types';

import { useNavigate } from 'react-router-dom';

export default function FilesPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
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
        toast.error('Please verify your email to access your files.');
        return;
      }

      const q = query(
        collection(db, 'files'),
        where('uid', '==', user.uid)
      );

      const unsubscribeDocs = onSnapshot(q, (snapshot) => {
        const filesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UploadedFile[];
        setFiles(filesData.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()));
        setLoading(false);
      }, (error) => {
        console.error("Firestore Error: ", error);
        toast.error("Failed to load files");
        setLoading(false);
      });

      return () => unsubscribeDocs();
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    // Limit file size to 5MB for demo
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max size is 5MB.");
      return;
    }

    setUploading(true);
    const storageRef = ref(storage, `users/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(p);
      }, 
      (error) => {
        console.error("Upload error:", error);
        toast.error("Upload failed: " + error.message);
        setUploading(false);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        try {
          await addDoc(collection(db, 'files'), {
            uid: auth.currentUser!.uid,
            fileName: file.name,
            fileUrl: downloadURL,
            fileType: file.type,
            uploadedAt: new Date().toISOString()
          });
          toast.success("File uploaded successfully!");
        } catch (error) {
          console.error("Firestore error:", error);
          toast.error("Failed to save file metadata");
        }
        
        setUploading(false);
        setProgress(0);
      }
    );
  };

  const handleDelete = async (file: UploadedFile) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      // Delete from Storage
      const storageRef = ref(storage, file.fileUrl);
      await deleteObject(storageRef);

      // Delete from Firestore
      await deleteDoc(doc(db, 'files', file.id));
      toast.success("File deleted successfully");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Delete failed: " + error.message);
    }
  };

  if (!auth.currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-black text-brand-navy">Please login to manage your files</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-5xl font-black text-brand-navy tracking-tighter">My Files</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-2">Manage your print-ready designs</p>
        </div>

        <label className={`
          relative flex items-center space-x-3 bg-brand-orange text-white px-8 py-4 rounded-[2rem] font-black text-sm uppercase tracking-widest cursor-pointer hover:scale-105 transition-all shadow-xl shadow-brand-orange/20
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}>
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileUp className="h-5 w-5" />}
          <span>{uploading ? `Uploading ${Math.round(progress)}%` : 'Upload New Design'}</span>
          <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-12 w-12 text-brand-orange animate-spin" />
        </div>
      ) : files.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {files.map((file) => (
              <motion.div
                key={file.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-4 bg-gray-50 rounded-2xl text-brand-orange group-hover:bg-brand-orange group-hover:text-white transition-colors">
                    <File className="h-6 w-6" />
                  </div>
                  <div className="flex space-x-2">
                    <a 
                      href={file.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-brand-navy transition-colors"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                    <button 
                      onClick={() => handleDelete(file)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-black text-brand-navy truncate mb-1" title={file.fileName}>
                  {file.fileName}
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {new Date(file.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                
                <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-center">
                  <span className="text-[10px] font-black bg-gray-100 px-3 py-1 rounded-full uppercase tracking-tighter text-gray-500">
                    {file.fileType.split('/')[1] || 'FILE'}
                  </span>
                  <button className="text-[10px] font-black text-brand-orange uppercase tracking-widest hover:underline">
                    Use for Order
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200">
          <div className="inline-flex p-6 bg-gray-50 rounded-full mb-6">
            <FileUp className="h-12 w-12 text-gray-300" />
          </div>
          <h3 className="text-xl font-black text-brand-navy mb-2">No designs uploaded yet</h3>
          <p className="text-gray-400 font-bold text-sm tracking-tight">Upload your print-ready files to get started with your orders.</p>
        </div>
      )}
    </div>
  );
}
