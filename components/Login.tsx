import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Logo } from './Shared';

const Login = () => {
    const [email, setEmail] = useState(''); 
    const [password, setPassword] = useState(''); 
    const [error, setError] = useState(''); 
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => { 
        e.preventDefault(); 
        setLoading(true); 
        setError(''); 
        try { 
            await signInWithEmailAndPassword(auth, email, password); 
        } catch (err) { 
            setError('البريد أو كلمة المرور غير صحيحة'); 
            setLoading(false); 
        } 
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
            <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md text-center">
                <div className="mx-auto flex items-center justify-center mb-6"><Logo size={80} /></div>
                <h1 className="text-3xl font-black text-brand-900 mb-2">بيوتكم ERP</h1>
                <p className="text-gray-500 mb-8">بوابة الموظفين الموحدة</p>
                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-bold">{error}</div>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <input className="w-full p-4 border rounded-xl bg-gray-50 text-right date-en outline-none focus:border-brand-900" type="email" required placeholder="البريد الإلكتروني" value={email} onChange={e=>setEmail(e.target.value)} />
                    <input className="w-full p-4 border rounded-xl bg-gray-50 text-right date-en outline-none focus:border-brand-900" type="password" required placeholder="كلمة المرور" value={password} onChange={e=>setPassword(e.target.value)} />
                    <button disabled={loading} className="w-full bg-brand-900 text-white p-4 rounded-xl font-bold hover:bg-brand-800 transition shadow-lg disabled:opacity-70">{loading ? 'جاري الدخول...' : 'تسجيل الدخول'}</button>
                </form>
            </div>
        </div>
    );
};

export default Login;