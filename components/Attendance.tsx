import React, { useState, useEffect, useRef } from 'react';
import { push, update, ref } from 'firebase/database';
import { db } from '../firebase';
import L from 'leaflet';
import { Icon, safeStr, safeArr, calculateDuration, formatTime, exportToExcel, Logo } from './Shared';
import { Zone, AttendanceLog, User, PermissionRequest } from '../types';

const MapZoneEditor = ({ center, radius, onChange }: any) => { 
    const mapRef = useRef<HTMLDivElement>(null); 
    const mapObj = useRef<L.Map | null>(null); 
    const markerObj = useRef<L.Marker | null>(null); 
    const circleObj = useRef<L.Circle | null>(null); 
    
    const propsRef = useRef({ radius, onChange, center });
    propsRef.current = { radius, onChange, center };

    useEffect(() => { 
        if (!mapRef.current) return; 
        
        if (!mapObj.current) { 
            mapObj.current = L.map(mapRef.current).setView([center.lat, center.lng], 15); 
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapObj.current); 
            
            const icon = L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png', shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] }); 
            
            markerObj.current = L.marker([center.lat, center.lng], { icon, draggable: true }).addTo(mapObj.current); 
            circleObj.current = L.circle([center.lat, center.lng], { color: '#CE9B52', fillColor: '#CE9B52', fillOpacity: 0.2, radius: radius }).addTo(mapObj.current); 
            
            const handleUpdate = (lat: number, lng: number) => { 
                const currentRadius = propsRef.current.radius;
                const currentOnChange = propsRef.current.onChange;
                
                if(markerObj.current) markerObj.current.setLatLng([lat, lng]); 
                if(circleObj.current) circleObj.current.setLatLng([lat, lng]); 
                
                currentOnChange({ lat, lng }, currentRadius); 
            }; 

            mapObj.current.on('click', (e) => handleUpdate(e.latlng.lat, e.latlng.lng)); 
            markerObj.current.on('dragend', (e) => { const l = e.target.getLatLng(); handleUpdate(l.lat, l.lng); }); 
        } else {
             mapObj.current.setView([center.lat, center.lng], 15);
        }
    }, []); 
    
    useEffect(() => { 
        if(circleObj.current) circleObj.current.setRadius(radius); 
    }, [radius]); 
    
    useEffect(() => {
        if(mapObj.current && markerObj.current && circleObj.current) {
            const newLatLng: [number, number] = [center.lat, center.lng];
            const currentLatLng = markerObj.current.getLatLng();
            
            if (Math.abs(currentLatLng.lat - center.lat) > 0.0001 || Math.abs(currentLatLng.lng - center.lng) > 0.0001) {
                 markerObj.current.setLatLng(newLatLng);
                 circleObj.current.setLatLng(newLatLng);
                 mapObj.current.setView(newLatLng); 
            }
        }
    }, [center.lat, center.lng]);

    return <div ref={mapRef} className="w-full h-64 rounded-xl z-0" />; 
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => { const R = 6371e3; const φ1 = lat1 * Math.PI/180; const φ2 = lat2 * Math.PI/180; const Δφ = (lat2-lat1) * Math.PI/180; const Δλ = (lon2-lon1) * Math.PI/180; const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2); return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); };

const PermissionModal = ({ isOpen, onClose, onSend }: any) => {
    const [reason, setReason] = useState('');
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-slide-up">
                <h3 className="font-bold text-lg mb-4">طلب استئذان / خروج</h3>
                <textarea className="w-full border rounded-xl p-3 mb-4 h-32 resize-none focus:ring-2 focus:ring-accent-500 outline-none" placeholder="سبب الاستئذان..." value={reason} onChange={e=>setReason(e.target.value)}/>
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200">إلغاء</button>
                    <button onClick={()=>{onSend(reason); setReason('');}} className="flex-1 bg-accent-600 text-white py-3 rounded-xl font-bold hover:bg-accent-700">إرسال الطلب</button>
                </div>
            </div>
        </div>
    );
};

const ConfirmOutsideModal = ({ isOpen, onClose, onConfirm }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl text-center animate-slide-up">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="alert-triangle" size={32}/>
                </div>
                <h3 className="font-bold text-lg mb-2 text-brand-900">تنبيه: أنت خارج النطاق!</h3>
                <p className="text-gray-500 mb-6">سيتم تسجيل هذا الإجراء مع ملاحظة أنك خارج النطاق الجغرافي المسموح. هل تريد المتابعة؟</p>
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200">إلغاء</button>
                    <button onClick={onConfirm} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg">نعم، سجل</button>
                </div>
            </div>
        </div>
    );
};

const ZoneModal = ({ isOpen, onClose, users, zones, onSave, zoneToEdit }: any) => {
    const [zone, setZone] = useState({ name: '', startTime: '08:00', endTime: '16:00', lat: 24.7136, lng: 46.6753, radius: 200, assignedUsers: [] as string[], id: '' });
    
    useEffect(() => { 
        if (isOpen) { 
            if (zoneToEdit) {
                setZone(JSON.parse(JSON.stringify(zoneToEdit))); 
            } else {
                setZone({ name: '', startTime: '08:00', endTime: '16:00', lat: 24.7136, lng: 46.6753, radius: 200, assignedUsers: [], id: '' }); 
            }
        } 
    }, [isOpen, zoneToEdit]);
    
    if(!isOpen) return null;

    const toggleUser = (uid: string) => {
        const current = safeArr(zone.assignedUsers);
        const otherZones = zones.filter((z: Zone) => z.id !== (zone.id || 'new')); 
        const isAssignedElsewhere = otherZones.some((z: Zone) => safeArr(z.assignedUsers).includes(uid));
        
        if (isAssignedElsewhere && !current.includes(uid)) {
            return alert("هذا الموظف مسجل في نطاق آخر بالفعل. لا يمكن تسجيله في نطاقين.");
        }
        setZone((prev: any) => ({...prev, assignedUsers: current.includes(uid) ? current.filter((id:string)=>id!==uid) : [...current, uid] }));
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">{zoneToEdit ? 'تعديل النطاق' : 'إضافة نطاق جديد'}</h3><button onClick={onClose}><Icon name="x"/></button></div>
                <div className="grid md:grid-cols-2 gap-4 mb-4"><input className="border p-2 rounded-lg" placeholder="اسم النطاق" value={zone.name} onChange={e=>setZone(prev=>({...prev, name:e.target.value}))}/><div className="flex gap-2"><div className="flex-1"><label className="text-xs block">بداية الدوام</label><input type="time" className="w-full border p-2 rounded-lg" value={zone.startTime} onChange={e=>setZone(prev=>({...prev, startTime:e.target.value}))}/></div><div className="flex-1"><label className="text-xs block">نهاية الدوام</label><input type="time" className="w-full border p-2 rounded-lg" value={zone.endTime} onChange={e=>setZone(prev=>({...prev, endTime:e.target.value}))}/></div></div></div><div className="mb-4"><label className="text-xs block mb-1 font-bold">تحديد الموقع والقطر ({zone.radius}م)</label><MapZoneEditor center={{lat: zone.lat, lng: zone.lng}} radius={zone.radius} onChange={(c: any, r: number) => setZone(prev => ({...prev, lat: c.lat, lng: c.lng, radius: r}))} /><input type="range" min="50" max="2000" step="50" className="w-full mt-2 accent-accent-600" value={zone.radius} onChange={e=>setZone(prev=>({...prev, radius: Number(e.target.value)}))} /></div><div className="mb-4 border-t pt-4"><label className="font-bold block mb-2">الموظفين المصرح لهم:</label><div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg bg-gray-50">{users.filter((u:User) => u.id !== 'admin').map((u:User) => { const isAssignedHere = safeArr(zone.assignedUsers).includes(u.id); const otherZones = zones.filter((z:Zone) => z.id !== (zone.id || 'new')); const isAssignedElsewhere = otherZones.some((z:Zone) => safeArr(z.assignedUsers).includes(u.id)); return ( <label key={u.id} className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${isAssignedElsewhere ? 'bg-gray-100 opacity-50 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}`}><input type="checkbox" checked={isAssignedHere} onChange={()=>toggleUser(u.id)} disabled={isAssignedElsewhere} className="accent-accent-600"/><span className="text-sm">{u.name} {isAssignedElsewhere && '(مسجل بنطاق آخر)'}</span></label> ); })}</div></div><button onClick={() => onSave(zone)} className="w-full bg-accent-600 text-white py-3 rounded-xl font-bold">حفظ النطاق</button>
            </div>
        </div>
    );
};

const AttendanceReports = ({ logs, users, zones, permissions }: any) => {
    const [startDate, setStartDate] = useState(''); const [endDate, setEndDate] = useState('');
    const [selectedUser, setSelectedUser] = useState(''); 

    const reportData = logs.slice().reverse().filter((l: AttendanceLog) => { 
        const logDate = l.timestamp.slice(0, 10); 
        const dateMatch = (!startDate || logDate >= startDate) && (!endDate || logDate <= endDate); 
        const userMatch = !selectedUser || l.uid === selectedUser;
        return dateMatch && userMatch;
    }).reduce((acc: any, log: AttendanceLog) => { const date = log.timestamp.slice(0, 10); const key = `${log.uid}-${date}`; if (!acc[key]) acc[key] = { uid: log.uid, date: date, user: users.find((u:User)=>u.id===log.uid)?.name, checkIn: '-', checkOut: '-', late: 0, early: 0, hours: 0, inStatus: '', outStatus: '' }; if (log.type === 'IN') { acc[key].checkIn = log.timestamp; acc[key].inStatus = log.locationStatus; } if (log.type === 'OUT') { acc[key].checkOut = log.timestamp; acc[key].outStatus = log.locationStatus; } return acc; }, {});
    
    const processedRows = Object.values(reportData).map((row: any) => {
        let lateText = '-', earlyText = '-', hoursText = '-', deduction = '-';
        const zone = zones.find((z:Zone) => safeArr(z.assignedUsers).includes(row.uid));
        const hasPermission = permissions.find((p:PermissionRequest) => p.uid === row.uid && p.date === row.date && p.status === 'approved');

        if (row.checkIn !== '-' && zone) {
            const shiftStart = new Date(`${row.date}T${zone.startTime}`); const actualIn = new Date(row.checkIn); const diffLate = (actualIn.getTime() - shiftStart.getTime()) / 60000; 
            if (diffLate > 15) { lateText = `${Math.round(diffLate)} دقيقة`; if (diffLate > 60) deduction = 'خصم يوم'; else if (diffLate > 30) deduction = 'خصم نصف يوم'; else deduction = 'تنبيه (تأخير)'; }
        }
        if (row.checkOut !== '-' && zone) {
            const shiftEnd = new Date(`${row.date}T${zone.endTime}`); const actualOut = new Date(row.checkOut); const diffEarly = (shiftEnd.getTime() - actualOut.getTime()) / 60000;
            if (diffEarly > 0) earlyText = `${Math.round(diffEarly)} دقيقة`;
        }
        if (row.checkIn !== '-' && row.checkOut !== '-') hoursText = calculateDuration(row.checkIn, row.checkOut);
        
        if(hasPermission) deduction = `تم الاستئذان: ${hasPermission.reason}`;

        return { ...row, lateText, earlyText, hoursText, deduction };
    });

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2"><span className="font-bold text-gray-600 text-sm">الموظف:</span>
                    <select className="border rounded-lg p-2 text-sm w-40" value={selectedUser} onChange={e=>setSelectedUser(e.target.value)}>
                        <option value="">الكل</option>
                        {users.filter((u:User) => u.role !== 'admin').map((u:User) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2"><span className="font-bold text-gray-600 text-sm">من:</span><input type="date" className="border rounded-lg p-2 text-sm" value={startDate} onChange={e=>setStartDate(e.target.value)} /></div>
                <div className="flex items-center gap-2"><span className="font-bold text-gray-600 text-sm">إلى:</span><input type="date" className="border rounded-lg p-2 text-sm" value={endDate} onChange={e=>setEndDate(e.target.value)} /></div>
                {(startDate || endDate || selectedUser) && <button onClick={()=>{setStartDate('');setEndDate('');setSelectedUser('')}} className="text-xs text-red-500 font-bold">مسح</button>}
                <button onClick={()=>exportToExcel(processedRows, 'Attendance')} className="mr-auto bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm"><Icon name="file-spreadsheet" size={16}/> تصدير</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden"><table className="w-full text-right text-sm"><thead className="bg-gray-50 text-brand-900 font-bold"><tr><th className="p-3">الموظف</th><th className="p-3">التاريخ</th><th className="p-3">دخول</th><th className="p-3 text-red-600">تأخير</th><th className="p-3">خروج</th><th className="p-3 text-orange-600">مبكر</th><th className="p-3 font-black">ساعات العمل</th><th className="p-3 text-red-800">الجزاء / الخصم</th></tr></thead><tbody className="divide-y">{processedRows.map((r: any, i: number) => (<tr key={i} className="hover:bg-gray-50"><td className="p-3 font-bold">{r.user}</td><td className="p-3 date-en">{r.date}</td><td className="p-3"><span className="date-en block">{r.checkIn !== '-' ? formatTime(r.checkIn) : '-'}</span>{r.inStatus === 'outside_zone' && <span className="text-[10px] text-red-500 font-bold block">(خارج النطاق)</span>}</td><td className="p-3 text-red-600 font-bold">{r.lateText}</td><td className="p-3"><span className="date-en block">{r.checkOut !== '-' ? formatTime(r.checkOut) : '-'}</span>{r.outStatus === 'outside_zone' && <span className="text-[10px] text-red-500 font-bold block">(خارج النطاق)</span>}</td><td className="p-3 text-orange-600 font-bold">{r.earlyText}</td><td className="p-3 font-black bg-gray-50">{r.hoursText}</td><td className={`p-3 text-xs font-bold ${r.deduction.includes('الاستئذان') ? 'text-green-600' : 'text-red-800'}`}>{r.deduction}</td></tr>))}</tbody></table></div></div>
    );
};

const PermissionsManager = ({ permissions }: any) => {
    const updateStatus = (id: string, status: string) => {
        update(ref(db, `permissions/${id}`), { status });
    };
    const pending = permissions.filter((p:PermissionRequest) => p.status === 'pending');
    return (
        <div className="space-y-4">
            <h3 className="font-bold text-xl text-brand-900">طلبات الاستئذان المعلقة</h3>
            <div className="grid gap-4">
                {pending.length === 0 && <div className="text-center p-8 text-gray-400">لا توجد طلبات جديدة</div>}
                {pending.map((p:PermissionRequest) => (
                    <div key={p.id} className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center">
                        <div>
                            <div className="font-bold text-brand-900">{p.userName}</div>
                            <div className="text-sm text-gray-500">{p.reason}</div>
                            <div className="text-xs text-gray-400 date-en mt-1">{p.date}</div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={()=>updateStatus(p.id, 'approved')} className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-bold hover:bg-green-200">موافقة</button>
                            <button onClick={()=>updateStatus(p.id, 'rejected')} className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm font-bold hover:bg-red-200">رفض</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AttendanceApp = ({ user, zones, usersList, logs, permissions, onBack }: any) => {
    const isAdmin = user.role === 'admin'; const isSupervisor = user.permissions?.att_role === 'supervisor'; 
    const canSeeReports = isAdmin || isSupervisor || user.permissions?.att_reports; const canManageZones = isAdmin || user.permissions?.att_zones;
    const [page, setPage] = useState(canSeeReports ? 'live' : 'my_attendance'); 
    const [modalOpen, setModalOpen] = useState(false); 
    const [editingZone, setEditingZone] = useState<Zone | null>(null);
    const [myStatus, setMyStatus] = useState('loading'); const [currentZone, setCurrentZone] = useState<Zone | null>(null); const [todayLog, setTodayLog] = useState<any>({ in: null, out: null });
    const [dist, setDist] = useState<number | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    const [permModalOpen, setPermModalOpen] = useState(false);
    const [outsideConfirmOpen, setOutsideConfirmOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<string | null>(null); 

    useEffect(() => {
        const foundZone = zones.find((z:Zone) => safeArr(z.assignedUsers).includes(user.id)); setCurrentZone(foundZone);
        const today = new Date().toDateString(); const myLogsToday = logs.filter((l:AttendanceLog) => l.uid === user.id && new Date(l.timestamp).toDateString() === today); setTodayLog({ in: myLogsToday.find((l:AttendanceLog) => l.type === 'IN'), out: myLogsToday.find((l:AttendanceLog) => l.type === 'OUT') });
        if(foundZone) { 
            const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
            const id = navigator.geolocation.watchPosition(pos => { 
                const d = calculateDistance(pos.coords.latitude, pos.coords.longitude, foundZone.lat, foundZone.lng); setDist(Math.round(d)); setMyStatus(d <= foundZone.radius ? 'inside' : 'outside'); 
            }, err => { console.error(err); setMyStatus('error'); }, options); 
            return () => navigator.geolocation.clearWatch(id); 
        } else { setMyStatus('no_zone'); }
    }, [zones, logs, user.id]);

    const initiateAttendance = (type: string) => {
        if (myStatus === 'inside') {
            handleAttendance(type, 'inside_zone');
        } else {
            setPendingAction(type);
            setOutsideConfirmOpen(true);
        }
    };

    const confirmOutside = () => {
        if (pendingAction) {
            handleAttendance(pendingAction, 'outside_zone');
            setOutsideConfirmOpen(false);
            setPendingAction(null);
        }
    };

    const handleAttendance = (type: string, locationStatus: string) => { 
        push(ref(db, 'attendance'), { uid: user.id, type, timestamp: new Date().toISOString(), locationStatus }); 
        alert(`تم تسجيل ${type==='IN'?'الدخول':'الخروج'} بنجاح (${locationStatus === 'outside_zone' ? 'خارج النطاق' : 'داخل النطاق'})`); 
    };

    const handlePermissionRequest = (reason: string) => {
        if(!reason.trim()) return;
        push(ref(db, 'permissions'), {
            uid: user.id,
            userName: user.name,
            reason,
            status: 'pending',
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().slice(0, 10)
        });
        setPermModalOpen(false);
        alert('تم إرسال طلب الاستئذان للمشرف');
    };

    const handleSaveZone = (z: Zone) => { if(z.id) { const { id, ...data } = z; update(ref(db, `zones/${id}`), data); } else { push(ref(db, 'zones'), z); } setModalOpen(false); setEditingZone(null); };
    const openAddModal = () => { setEditingZone(null); setModalOpen(true); }; const openEditModal = (zone: Zone) => { setEditingZone(zone); setModalOpen(true); };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-white border-l transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 flex justify-between items-center gap-2 font-black text-xl text-brand-900 border-b">
                    <div className="flex items-center gap-2"><Logo size={32} /> بيوتكم</div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500"><Icon name="x" /></button>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={()=>{setPage('my_attendance'); setSidebarOpen(false)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${page==='my_attendance'?'bg-accent-600 text-white':'text-gray-500 hover:bg-gray-50'}`}><Icon name="fingerprint"/> تسجيلي</button>
                    {canSeeReports && (<><button onClick={()=>{setPage('live'); setSidebarOpen(false)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${page==='live'?'bg-accent-600 text-white':'text-gray-500 hover:bg-gray-50'}`}><Icon name="activity"/> مباشر (Live)</button><button onClick={()=>{setPage('reports'); setSidebarOpen(false)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${page==='reports'?'bg-accent-600 text-white':'text-gray-500 hover:bg-gray-50'}`}><Icon name="file-text"/> التقارير والخصومات</button><button onClick={()=>{setPage('perms'); setSidebarOpen(false)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${page==='perms'?'bg-accent-600 text-white':'text-gray-500 hover:bg-gray-50'}`}><Icon name="check-square"/> إدارة الاستئذانات</button></>)}
                    {canManageZones && <button onClick={()=>{setPage('zones'); setSidebarOpen(false)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${page==='zones'?'bg-accent-600 text-white':'text-gray-500 hover:bg-gray-50'}`}><Icon name="map"/> النطاقات</button>}
                </nav>
                <div className="p-4 border-t"><button onClick={onBack} className="w-full bg-gray-100 text-gray-600 p-2 rounded-lg font-bold flex items-center justify-center gap-2"><Icon name="grid" size={16}/> تبديل التطبيق</button></div>
            </aside>
            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)}></div>}
            
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg bg-white shadow-sm text-brand-900"><Icon name="menu" /></button>
                        <h2 className="text-2xl font-bold text-brand-900">{page==='my_attendance'?'تسجيل الحضور':page==='live'?'المتواجدون الآن':page==='reports'?'التقارير':'إدارة النطاقات'}</h2>
                    </div>
                    <div className="flex items-center gap-2"><div className="text-sm font-bold">{user.name}</div><div className="w-8 h-8 bg-accent-600 rounded-full text-white flex items-center justify-center">{user.name[0]}</div></div>
                </header>
                
                {page === 'my_attendance' && (
                    <div className="max-w-2xl mx-auto text-center space-y-6">
                        <div className={`p-8 rounded-3xl shadow-lg border-4 transition-colors duration-300 ${myStatus==='inside'?'bg-green-50 border-green-500':myStatus==='outside'?'bg-red-50 border-red-500':'bg-gray-50 border-gray-300'}`}>
                            <div className="text-6xl mb-4">{myStatus==='inside'?'📍':myStatus==='outside'?'🚫':'❓'}</div>
                            <h3 className="text-2xl font-black mb-2">{myStatus==='inside'?'أنت في الموقع الصحيح':myStatus==='outside'?'أنت خارج نطاق العمل':'جاري تحديد الموقع...'}</h3>
                            
                            <div className="text-gray-500 space-y-1">
                                <p>{currentZone ? `النطاق المصرح: ${currentZone.name}` : 'لم يتم ربطك بنطاق عمل، راجع المشرف'}</p>
                                {currentZone && dist !== null && (<p className="text-sm font-bold dir-ltr"><span className="text-brand-900">Current Dist: {dist}m</span> | <span className="text-gray-400">Allowed: {currentZone.radius}m</span></p>)}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <span className="text-sm font-bold text-gray-500 block mb-2">حالة الدوام اليوم:</span>
                                {todayLog.out ? (
                                    <span className="inline-block bg-gray-200 text-gray-600 px-4 py-2 rounded-full font-black">تم الانصراف 👋</span>
                                ) : todayLog.in ? (
                                    <span className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full font-black animate-pulse">حاضر الآن ✅</span>
                                ) : (
                                    <span className="inline-block bg-yellow-50 text-yellow-600 px-4 py-2 rounded-full font-black">لم يبدأ بعد ⏳</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={()=>initiateAttendance('IN')} disabled={todayLog.in || todayLog.out} className="relative bg-green-600 text-white py-6 rounded-2xl font-black text-xl shadow-xl hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex flex-col items-center gap-2 group overflow-hidden transition-all">
                                <div className="absolute top-2 right-2 bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div> مباشر</div>
                                <Icon name="log-in" size={32}/> تسجيل دخول 
                                <span className="text-sm font-normal opacity-80">{todayLog.in ? formatTime(todayLog.in.timestamp) : '--:--'}</span>
                            </button>
                            
                            <button onClick={()=>initiateAttendance('OUT')} disabled={!todayLog.in || todayLog.out} className="relative bg-red-600 text-white py-6 rounded-2xl font-black text-xl shadow-xl hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex flex-col items-center gap-2 overflow-hidden transition-all">
                                <div className="absolute top-2 right-2 bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse"></div> مباشر</div>
                                <Icon name="log-out" size={32}/> انصراف 
                                <span className="text-sm font-normal opacity-80">{todayLog.out ? formatTime(todayLog.out.timestamp) : '--:--'}</span>
                            </button>
                        </div>
                        
                        <button onClick={()=>setPermModalOpen(true)} className="w-full bg-white border-2 border-accent-500 text-accent-600 py-4 rounded-2xl font-bold hover:bg-accent-50 transition flex items-center justify-center gap-2"><Icon name="file-text"/> طلب استئذان / خروج</button>
                        
                        {todayLog.in && (<div className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center"><span className="font-bold text-gray-600">ساعات العمل اليوم:</span><span className="font-black text-2xl text-accent-600 date-en">{todayLog.out ? calculateDuration(todayLog.in.timestamp, todayLog.out.timestamp) : 'جاري الحساب...'}</span></div>)}
                    </div>
                )}
                {page === 'zones' && (<div><button onClick={openAddModal} className="bg-accent-600 text-white px-6 py-3 rounded-xl font-bold mb-6 shadow-lg">+ إضافة نطاق جديد</button><div className="grid gap-4">{zones.map((z:Zone) => (<div key={z.id} className="bg-white p-5 rounded-2xl shadow-sm border flex justify-between items-center"><div><h4 className="font-bold text-lg text-brand-900">{z.name}</h4><div className="text-sm text-gray-500 date-en">{z.startTime} - {z.endTime}</div></div><div className="flex items-center gap-3"><span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold">{safeArr(z.assignedUsers).length} موظف</span><button onClick={()=>openEditModal(z)} className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 text-brand-900"><Icon name="pencil" size={16}/></button></div></div>))}</div></div>)}
                {page === 'reports' && <AttendanceReports logs={logs} users={usersList} zones={zones} permissions={permissions} />}
                {page === 'perms' && <PermissionsManager permissions={permissions} />}
                {page === 'live' && (<div className="grid grid-cols-1 md:grid-cols-3 gap-4">{usersList.filter((u:User) => u.id !== 'admin').map((u:User) => { 
                    const lastLog = logs.filter((l:AttendanceLog) => l.uid === u.id).sort((a:AttendanceLog,b:AttendanceLog)=>new Date(b.timestamp).getTime()-new Date(a.timestamp).getTime())[0]; 
                    const isOnline = lastLog?.type === 'IN' && new Date(lastLog.timestamp).toDateString() === new Date().toDateString(); 
                    const isOutside = lastLog?.locationStatus === 'outside_zone';
                    
                    return ( 
                        <div key={u.id} className="bg-white p-5 rounded-2xl shadow-sm border flex items-center gap-4 relative overflow-hidden">
                            {isOnline && (
                                <div className={`absolute top-0 left-0 px-2 py-1 text-[10px] font-bold text-white ${isOutside ? 'bg-red-500' : 'bg-green-500'} rounded-br-lg`}>
                                    {isOutside ? 'خارج النطاق' : 'داخل النطاق'}
                                </div>
                            )}
                            <div className={`w-4 h-4 rounded-full ${isOnline?'bg-green-500 animate-pulse':'bg-gray-300'}`}></div>
                            <div>
                                <div className="font-bold text-brand-900">{u.name}</div>
                                <div className="text-xs text-gray-500">{isOnline ? `دخل منذ ${formatTime(lastLog.timestamp)}` : 'غير متواجد'}</div>
                            </div>
                        </div> 
                    ) 
                })}</div>)}
            </main>
            <ZoneModal 
                key={editingZone ? editingZone.id : 'new_zone_modal'} 
                isOpen={modalOpen} 
                onClose={()=>setModalOpen(false)} 
                users={usersList} 
                zones={zones} 
                onSave={handleSaveZone} 
                zoneToEdit={editingZone} 
            />
            <PermissionModal isOpen={permModalOpen} onClose={()=>setPermModalOpen(false)} onSend={handlePermissionRequest} />
            <ConfirmOutsideModal isOpen={outsideConfirmOpen} onClose={()=>setOutsideConfirmOpen(false)} onConfirm={confirmOutside} />
        </div>
    );
};

export default AttendanceApp;