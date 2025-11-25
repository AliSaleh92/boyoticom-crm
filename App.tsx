import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, push, update } from 'firebase/database';
import { auth, db } from './firebase';

import Login from './components/Login';
import Portal from './components/Portal';
import CRMApp from './components/CRM';
import AttendanceApp from './components/Attendance';
import { safeStr, safeArr } from './components/Shared';
import { User, Client, Zone, AttendanceLog, PermissionRequest } from './types';

const App = () => {
    const [user, setUser] = useState<any>(null); 
    const [dbUser, setDbUser] = useState<User | null>(null); 
    const [originalAdmin, setOriginalAdmin] = useState<User | null>(null);
    const [currentApp, setCurrentApp] = useState('portal'); 
    
    // Data States
    const [clients, setClients] = useState<Client[]>([]); 
    const [users, setUsers] = useState<User[]>([]); 
    const [zones, setZones] = useState<Zone[]>([]); 
    const [logs, setLogs] = useState<AttendanceLog[]>([]); 
    const [permissions, setPermissions] = useState<PermissionRequest[]>([]); 
    const [loading, setLoading] = useState(true);

    useEffect(() => { 
        const unsub = onAuthStateChanged(auth, u => { 
            if (u) { 
                setUser(u); 
                onValue(ref(db, 'users'), s => { 
                    const data = s.val() || {}; 
                    const list = Object.keys(data).map(k => ({ id: k, ...data[k] })); 
                    setUsers(list); 
                    
                    if (!originalAdmin) {
                        const profile = list.find((x: User) => x.email.toLowerCase() === u.email?.toLowerCase()); 
                        if (u.email?.toLowerCase() === 'asleh@boyoticom.com') { 
                            setDbUser({ ...profile, id: u.uid, role: 'admin', name: 'Ali Saleh', email: u.email } as User); 
                        } else { 
                            setDbUser(profile ? { ...profile, id: u.uid } : { id: u.uid, email: u.email || '', role: 'employee', name: 'مستخدم جديد' } as User); 
                        }
                    }
                }); 
                onValue(ref(db, 'clients'), s => setClients(s.val() ? Object.keys(s.val()).map(k => ({id:k, ...s.val()[k]})).reverse() : [])); 
                onValue(ref(db, 'zones'), s => setZones(s.val() ? Object.keys(s.val()).map(k => ({id:k, ...s.val()[k]})) : [])); 
                onValue(ref(db, 'attendance'), s => setLogs(s.val() ? Object.keys(s.val()).map(k => ({id:k, ...s.val()[k]})) : [])); 
                onValue(ref(db, 'permissions'), s => setPermissions(s.val() ? Object.keys(s.val()).map(k => ({id:k, ...s.val()[k]})) : [])); 
            } else { 
                setUser(null); setDbUser(null); setOriginalAdmin(null);
            } 
            setLoading(false); 
        }); 
        return () => unsub(); 
    }, [originalAdmin]); 

    const handleLoginAs = (targetUser: User) => {
        if(dbUser?.role !== 'admin') return;
        setOriginalAdmin(dbUser);
        setDbUser(targetUser);
        setCurrentApp('portal');
    };

    const handleRevertLogin = () => {
        if(originalAdmin) {
            setDbUser(originalAdmin);
            setOriginalAdmin(null);
            setCurrentApp('portal');
        }
    };

    const handleSaveClient = (data: Client, existing: Client | null, log: any) => { 
        const payload = { ...data, assignedTo: safeStr(data.assignedTo), projects: safeArr(data.projects) }; 
        if (existing) {
            const { history, notes, ...updatePayload } = payload;
            update(ref(db, `clients/${existing.id}`), updatePayload);
            if(log) push(ref(db, `clients/${existing.id}/history`), log);
        } else { 
            push(ref(db, 'clients'), { ...payload, dateAdded: new Date().toISOString(), addedBy: dbUser?.email }); 
        } 
    };
    
    const handleImport = (data: any[]) => { 
        if(!confirm(`سيتم استيراد ${data.length} عميل. هل أنت متأكد؟`)) return; 
        data.forEach(row => { 
            push(ref(db, 'clients'), { 
                name: row['الاسم']||row['Name']||'No Name', 
                phone: row['رقم الهاتف']||row['Phone']||'', 
                projects: [row['المشروع']||''], 
                status: 'New', 
                addedBy: dbUser?.email, 
                dateAdded: new Date().toISOString() 
            }); 
        }); 
        alert('تم الاستيراد بنجاح!'); 
    };
    
    if (loading) return <div className="h-screen flex items-center justify-center"><div className="loader"></div></div>;
    if (!user) return <Login />;
    if (!dbUser) return <div className="h-screen flex items-center justify-center"><div className="loader"></div></div>;

    return (
        <>
            {originalAdmin && (
                <div className="bg-orange-500 text-white px-4 py-2 text-center font-bold flex justify-between items-center sticky top-0 z-[60]">
                    <span>⚠️ أنت الآن تتصفح بصلاحيات: {dbUser.name}</span>
                    <button onClick={handleRevertLogin} className="bg-white text-orange-600 px-3 py-1 rounded text-xs font-black hover:bg-orange-50">العودة لحسابي</button>
                </div>
            )}
            {(() => {
                if (currentApp === 'crm') return <CRMApp user={dbUser} clients={clients} users={users} onSaveClient={handleSaveClient} onImport={handleImport} onBack={() => setCurrentApp('portal')} />;
                if (currentApp === 'attendance') return <AttendanceApp user={dbUser} zones={zones} usersList={users} logs={logs} permissions={permissions} onBack={() => setCurrentApp('portal')} />;
                return <Portal user={dbUser} users={users} onSelectApp={setCurrentApp} onLoginAs={handleLoginAs} />;
            })()}
        </>
    );
};

export default App;