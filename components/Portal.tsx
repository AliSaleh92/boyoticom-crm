import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Icon, Logo } from './Shared';
import { UserManagerMain } from './UserManagement';

const Portal = ({ user, users, onSelectApp, onLoginAs }: any) => {
    const [showUserManager, setShowUserManager] = useState(false);
    const isAdmin = user.role === 'admin';
    const p = user.permissions || {};
    const canAccessCRM = isAdmin || p.crm_access;
    const canAccessAttendance = isAdmin || p.att_access;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative">
            {isAdmin && (
                <div className="absolute top-6 right-6 flex gap-2 z-10">
                    <button onClick={()=>setShowUserManager(true)} className="bg-brand-900 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl hover:bg-brand-800 transition transform hover:scale-105"><Icon name="users" size={20}/> <span>إدارة الموظفين</span></button>
                </div>
            )}
            <div className="max-w-4xl w-full">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div className="flex items-center gap-5"><div className="w-20 h-20 bg-brand-900 rounded-2xl text-white flex items-center justify-center text-3xl font-black shadow-2xl shadow-brand-900/30"><Logo size={60} /></div><div><h1 className="text-3xl font-black text-brand-900 mb-1">مرحباً، {user.name} 👋</h1><p className="text-gray-500 font-medium">{isAdmin ? 'لوحة تحكم المدير العام' : 'اختر النظام للمتابعة'}</p></div></div>
                    <button onClick={()=>signOut(auth)} className="text-red-500 bg-red-50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-100 transition"><Icon name="log-out"/> <span>خروج</span></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {canAccessCRM ? (
                        <div onClick={() => onSelectApp('crm')} className="portal-card bg-white p-10 rounded-[2rem] shadow-lg border-2 border-transparent hover:border-crm-500 cursor-pointer group relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-2 bg-crm-500"></div><div className="w-24 h-24 bg-crm-500 text-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-crm-500/30 group-hover:scale-110 transition-transform duration-300"><Icon name="layout-grid" size={48} /></div><h2 className="text-3xl font-black text-gray-800 mb-3">إدارة العملاء</h2><p className="text-gray-500 leading-relaxed text-lg">نظامك المتكامل لإدارة العملاء والصفقات والتقارير.</p><div className="mt-10 flex items-center text-crm-600 font-bold text-lg group-hover:translate-x-2 transition-transform"><span>الدخول للنظام</span> <Icon name="arrow-left" className="mr-2"/></div></div>
                    ) : ( <div className="bg-gray-50 p-10 rounded-[2rem] border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center opacity-60 grayscale cursor-not-allowed"><Icon name="lock" size={48} className="text-gray-400 mb-4"/><h2 className="text-2xl font-bold text-gray-500">إدارة العملاء</h2><p className="text-gray-400 mt-2">غير مصرح لك بالدخول</p></div> )}
                    {canAccessAttendance ? (
                        <div onClick={() => onSelectApp('attendance')} className="portal-card bg-white p-10 rounded-[2rem] shadow-lg border-2 border-transparent hover:border-accent-500 cursor-pointer group relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-2 bg-accent-500"></div><div className="w-24 h-24 bg-accent-500 text-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-accent-500/30 group-hover:scale-110 transition-transform duration-300"><Icon name="clock" size={48} /></div><h2 className="text-3xl font-black text-gray-800 mb-3">الحضور والانصراف</h2><p className="text-gray-500 leading-relaxed text-lg">تسجيل الحضور اليومي وتتبع ساعات العمل.</p><div className="mt-10 flex items-center text-accent-600 font-bold text-lg group-hover:translate-x-2 transition-transform"><span>الدخول للنظام</span> <Icon name="arrow-left" className="mr-2"/></div></div>
                    ) : ( <div className="bg-gray-50 p-10 rounded-[2rem] border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center opacity-60 grayscale cursor-not-allowed"><Icon name="lock" size={48} className="text-gray-400 mb-4"/><h2 className="text-2xl font-bold text-gray-500">الحضور والانصراف</h2><p className="text-gray-400 mt-2">غير مصرح لك بالدخول</p></div> )}
                </div>
            </div>
            {showUserManager && <UserManagerMain users={users} currentUser={user} onClose={()=>setShowUserManager(false)} onLoginAs={onLoginAs} />}
        </div>
    );
};

export default Portal;