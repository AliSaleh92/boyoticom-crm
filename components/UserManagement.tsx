import React, { useState, useEffect } from 'react';
import { set, ref, update } from 'firebase/database';
import { db } from '../firebase';
import { Icon, safeStr } from './Shared';
import { User } from '../types';

export const AddUserModal = ({ isOpen, onClose, onSave }: any) => {
    const [newUser, setNewUser] = useState({ name: '', email: '', uid: '' });
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">إضافة موظف جديد</h3><button onClick={onClose}><Icon name="x"/></button></div>
                <div className="space-y-3">
                    <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800"> انسخ الـ UID من صفحة Authentication</div>
                    <input className="w-full border rounded p-3" value={newUser.name} onChange={e=>setNewUser({...newUser, name:e.target.value})} placeholder="الاسم الثلاثي" />
                    <input className="w-full border rounded p-3 text-right date-en" value={newUser.email} onChange={e=>setNewUser({...newUser, email:e.target.value})} placeholder="البريد الإلكتروني" />
                    <input className="w-full border rounded p-3 text-right date-en font-mono" value={newUser.uid} onChange={e=>setNewUser({...newUser, uid:e.target.value})} placeholder="UID" />
                    <button onClick={() => onSave(newUser)} className="w-full bg-brand-900 text-white py-3 rounded-xl font-bold mt-2"><span>حفظ ومتابعة</span></button>
                </div>
            </div>
        </div>
    );
};

export const RoleEditorModal = ({ user, isOpen, onClose, onSave }: any) => {
    const [localUser, setLocalUser] = useState<User>(user || {});
    const [crmRole, setCrmRole] = useState(user?.permissions?.crm_role || 'none');
    const [attRole, setAttRole] = useState(user?.permissions?.att_role || 'none');

    useEffect(() => {
        if(user) {
            setLocalUser(user);
            setCrmRole(user.permissions?.crm_role || 'none');
            setAttRole(user.permissions?.att_role || 'none');
        }
    }, [user]);

    if (!isOpen || !user) return null;

    const handleSave = () => {
        const perms = { 
            crm_access: crmRole !== 'none',
            crm_role: crmRole,
            crm_reports: crmRole === 'supervisor',
            crm_delete: crmRole === 'supervisor',
            crm_export: false, 
            
            att_access: attRole !== 'none',
            att_role: attRole,
            att_reports: attRole === 'supervisor',
            att_zones: attRole === 'supervisor'
        };
        const apps = [];
        if (crmRole !== 'none') apps.push('crm');
        if (attRole !== 'none') apps.push('attendance');
        onSave(localUser.id, localUser.name, localUser.email, apps, perms);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl">
                <div className="text-center mb-4 border-b pb-4">
                    <div className="font-bold text-xl text-brand-900">تعديل صلاحيات: {user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                <div className="space-y-4">
                    <div className="border rounded-xl p-4 space-y-3">
                        <h4 className="font-bold text-md text-brand-900">بيانات الموظف</h4>
                        <input className="w-full border rounded p-3" placeholder="الاسم الثلاثي" value={localUser.name} onChange={e=>setLocalUser({...localUser, name:e.target.value})} />
                        <input className="w-full border rounded p-3 text-right date-en" placeholder="البريد الإلكتروني" value={localUser.email} onChange={e=>setLocalUser({...localUser, email:e.target.value})} />
                    </div>
                    <div className="border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3 text-crm-600 font-bold"><Icon name="layout-grid"/> نظام CRM</div>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={()=>setCrmRole('none')} className={`p-2 rounded border text-sm ${crmRole==='none'?'bg-gray-200':'bg-white'}`}>لا يوجد</button>
                            <button onClick={()=>setCrmRole('employee')} className={`p-2 rounded border text-sm ${crmRole==='employee'?'bg-crm-600 text-white':'bg-white'}`}>موظف</button>
                            <button onClick={()=>setCrmRole('supervisor')} className={`p-2 rounded border text-sm ${crmRole==='supervisor'?'bg-crm-600 text-white':'bg-white'}`}>مشرف</button>
                        </div>
                    </div>
                    <div className="border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3 text-accent-600 font-bold"><Icon name="clock"/> نظام الحضور</div>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={()=>setAttRole('none')} className={`p-2 rounded border text-sm ${attRole==='none'?'bg-gray-200':'bg-white'}`}>لا يوجد</button>
                            <button onClick={()=>setAttRole('employee')} className={`p-2 rounded border text-sm ${attRole==='employee'?'bg-accent-600 text-white':'bg-white'}`}>موظف</button>
                            <button onClick={()=>setAttRole('supervisor')} className={`p-2 rounded border text-sm ${attRole==='supervisor'?'bg-accent-600 text-white':'bg-white'}`}>مشرف</button>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 mt-6 pt-4 border-t">
                    <button onClick={onClose} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold">إلغاء</button>
                    <button onClick={handleSave} className="flex-1 bg-brand-900 text-white py-3 rounded-xl font-bold">حفظ الصلاحيات</button>
                </div>
            </div>
        </div>
    );
};

export const UserManagerMain = ({ users, currentUser, onClose, onLoginAs }: any) => {
    const [addModal, setAddModal] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);
    const displayUsers = users.filter((u: User) => u.id !== currentUser.id);

    const handleSaveNew = (userData: any) => {
        if(!userData.uid) return alert('UID مطلوب');
        set(ref(db, `users/${userData.uid}`), { name: userData.name, email: userData.email, role: 'user', allowedApps: [], permissions: {crm_role: 'none', att_role: 'none'} }).then(() => {
            setAddModal(false);
            setEditUser({ id: userData.uid, name: userData.name, email: userData.email, role: 'user', allowedApps: [], permissions: {crm_role: 'none', att_role: 'none'} }); 
        }).catch(err => { console.error("Error", err); alert("فشل حفظ المستخدم الجديد."); });
    };

    const handleSaveRoles = (uid: string, name: string, email: string, apps: string[], perms: any) => {
        update(ref(db, `users/${uid}`), { name: name, email: email, allowedApps: apps, permissions: perms });
        setEditUser(null);
    };

    return (
        <div className="fixed inset-0 bg-brand-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-xl font-black text-brand-900 flex items-center gap-2"><Icon name="users"/> <span>إدارة الموظفين</span></h3>
                    <button onClick={onClose} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"><Icon name="x"/></button>
                </div>
                <div className="space-y-4">
                    <button onClick={() => setAddModal(true)} className="w-full bg-brand-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow"><Icon name="user-plus"/> <span>إضافة موظف جديد</span></button>
                    <div className="space-y-2 mt-4">
                        {displayUsers.map((u: User) => (
                            <div key={u.id} className="flex justify-between items-center p-4 bg-white border rounded-xl hover:shadow-md transition cursor-pointer" onClick={()=>setEditUser(u)}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">{safeStr(u.name).charAt(0)}</div>
                                    <div><div className="font-bold text-brand-900">{u.name}</div><div className="text-xs text-gray-500">{u.email}</div></div>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    {/* Impersonation Button */}
                                    <button onClick={(e) => { e.stopPropagation(); onLoginAs(u); }} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 flex items-center gap-1">
                                        <Icon name="log-in" size={14}/> دخول كـ
                                    </button>
                                    <div className="text-gray-400 flex gap-1">
                                        <Icon name="settings-2" size={16}/>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {displayUsers.length === 0 && <div className="text-center py-10 text-gray-400"><span>لا يوجد موظفين آخرين.</span></div>}
                    </div>
                </div>
            </div>
            <AddUserModal isOpen={addModal} onClose={()=>setAddModal(false)} onSave={handleSaveNew} />
            <RoleEditorModal user={editUser} isOpen={!!editUser} onClose={()=>setEditUser(null)} onSave={handleSaveRoles} />
        </div>
    );
};