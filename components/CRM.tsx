import React, { useState, useEffect, useRef, useMemo } from 'react';
import { push, update, remove, ref } from 'firebase/database';
import { db } from '../firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Icon, safeStr, safeArr, exportToExcel } from './Shared';
import { Client, User } from '../types';
import * as XLSX from 'xlsx';

// --- CONSTANTS ---
const STATUS_LIST = [ { key: 'New', label: 'عميل جديد', color: 'bg-blue-50 text-blue-700 border-blue-200' }, { key: 'Contacted1', label: 'تم التواصل 1', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' }, { key: 'Contacted2', label: 'تم التواصل 2', color: 'bg-purple-50 text-purple-700 border-purple-200' }, { key: 'Contacted3', label: 'تم التواصل 3', color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' }, { key: 'Deposit', label: 'دفع عربون', color: 'bg-amber-50 text-amber-700 border-amber-200' }, { key: 'Sold', label: 'تم البيع', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }, { key: 'Cancelled', label: 'ملغي', color: 'bg-red-50 text-red-700 border-red-200' }, ];
const PROJECT_LIST = ["بيوتكم 10", "بيوتكم 11", "بيوتكم 12", "بيوتكم 13", "بيوتكم 14"];
const CLIENT_SOURCES = ["مباشر", "عقار", "اعلانات رقمية", "توصية صديق"];

const CRMHeader = ({ title, clients, onToggleSidebar }: any) => {
    const [showNotifs, setShowNotifs] = useState(false);
    const today = new Date().toISOString().slice(0,10);
    const reminders = clients.filter((c: Client) => c.nextFollowUp === today);
    const allNotifs = reminders.map((c: Client) => ({ type: 'reminder', ...c }));
    return (
        <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-30">
            <div className="flex items-center gap-2"><button onClick={onToggleSidebar} className="md:hidden text-gray-600 p-1"><Icon name="menu" size={24}/></button><div className="font-bold text-xl text-brand-900">{title}</div></div>
            <div className="relative"><button onClick={() => setShowNotifs(!showNotifs)} className="p-2 rounded-full hover:bg-gray-100 relative text-gray-600"><Icon name="bell" size={22} />{allNotifs.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}</button>{showNotifs && (<><div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)}></div><div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border z-50 overflow-hidden"><div className="p-3 border-b bg-gray-50 font-bold text-sm text-brand-900 flex justify-between"><span>التنبيهات</span><span>{allNotifs.length}</span></div><div className="max-h-64 overflow-y-auto">{allNotifs.length===0?<div className="p-4 text-center text-gray-400 text-xs">لا توجد تنبيهات</div>:allNotifs.map((n: any,i: number)=><div key={i} className="p-3 border-b hover:bg-gray-50 text-sm"><div className="font-bold">{n.name}</div><div className="text-xs text-gray-500">متابعة اليوم</div></div>)}</div></div></>)}</div>
        </header>
    );
};

const CRMDashboard = ({ clients, currentUser }: any) => {
    const isAdmin = currentUser.role === 'admin';
    const isSupervisor = currentUser.permissions?.crm_role === 'supervisor';
    const isEmployee = currentUser.permissions?.crm_role === 'employee';
    const relevantClients = clients.filter((c: Client) => {
        if (isAdmin || isSupervisor) return true;
        if (isEmployee) return c.assignedTo === currentUser.name;
        return false;
    });
    const totalClients = relevantClients.length; const today = new Date().toISOString().slice(0,10); const reminders = relevantClients.filter((c:Client) => c.nextFollowUp === today); const statusData = STATUS_LIST.map(s => ({ name: s.label, count: relevantClients.filter((c:Client) => c.status === s.key).length, key: s.key, color: s.color })); const projectStats: any = {}; relevantClients.forEach((c:Client) => safeArr(c.projects).forEach((p:any) => { const n = safeStr(p); if(n) projectStats[n] = (projectStats[n]||0)+1; })); const projectData = Object.entries(projectStats).map(([name, value]) => ({ name, value })); const COLORS = ['#2C3340', '#CE9B52', '#E6BC76', '#94a3b8', '#475569', '#64748b'];
    return (
        <div className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="bg-gradient-to-r from-brand-900 to-brand-800 text-white p-6 rounded-2xl shadow-lg flex justify-between items-center"><div><h2 className="text-lg font-bold opacity-80 mb-1">إجمالي العملاء</h2><div className="text-4xl font-black">{totalClients}</div></div><div className="bg-white/10 p-4 rounded-full"><Icon name="users" size={32} /></div></div><div className="bg-white p-6 rounded-2xl shadow-lg border border-amber-100 md:col-span-2 relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div><div className="flex justify-between items-start mb-4"><h3 className="font-bold text-brand-900 flex items-center gap-2"><Icon name="bell" className="text-amber-500"/> تذكيرات اليوم ({reminders.length})</h3></div>{reminders.length > 0 ? <div className="flex gap-3 overflow-x-auto pb-2">{reminders.map((c:Client) => (<div key={c.id} className="min-w-[200px] bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm"><div className="font-bold text-brand-900 mb-1">{c.name}</div><div className="text-xs text-gray-500 mb-2 date-en">{c.phone}</div></div>))}</div> : <div className="text-center text-gray-400 text-sm py-2">لا توجد متابعات</div>}</div></div><div><h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2"><Icon name="activity" size={18}/> حالة العملاء</h3><div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">{statusData.map(s => (<div key={s.key} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition"><div className="text-xs text-gray-500 font-bold mb-2">{s.name}</div><div className="flex justify-between items-end"><div className="text-2xl font-black text-brand-900">{s.count}</div><div className={`w-2 h-2 rounded-full ${s.color.split(' ')[0].replace('bg-', 'bg-')}`}></div></div></div>))}</div></div>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><h3 className="font-bold text-brand-900 mb-4 text-sm">توزيع المشاريع</h3><div className="h-64" dir="ltr"><ResponsiveContainer><PieChart><Pie data={projectData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">{projectData.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><RechartsTooltip/><Legend/></PieChart></ResponsiveContainer></div></div><div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><h3 className="font-bold text-brand-900 mb-4 text-sm">نظرة عامة</h3><div className="h-64" dir="ltr"><ResponsiveContainer><BarChart data={statusData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" hide/><YAxis/><RechartsTooltip/><Bar dataKey="count" fill="#2C3340" radius={[4,4,0,0]} barSize={30}/></BarChart></ResponsiveContainer></div></div></div></div>
    );
};

const CRMReports = ({ clients, users, currentUser }: any) => {
    const [startDate, setStartDate] = useState(''); const [endDate, setEndDate] = useState(''); 
    const relevantUsers = useMemo(() => users.filter((u:User) => u.role === 'admin' || u.permissions?.crm_access), [users]);
    const filteredClients = clients.filter((c:Client) => { const d = c.dateAdded ? c.dateAdded.slice(0, 10) : ''; return (startDate ? d >= startDate : true) && (endDate ? d <= endDate : true); }); 
    const reportData = relevantUsers.map((u:User) => { const userClients = filteredClients.filter((c:Client) => c.assignedTo === u.name); return { id: u.id, name: u.name, total: userClients.length, sold: userClients.filter((c:Client) => c.status === 'Sold').length, deposit: userClients.filter((c:Client) => c.status === 'Deposit').length, inProgress: userClients.filter((c:Client) => ['New','Contacted1','Contacted2','Contacted3'].includes(c.status)).length }; });
    const canExport = currentUser.role === 'admin' || currentUser.permissions?.crm_role === 'supervisor';
    const handleExportReports = () => { exportToExcel(reportData, "Employee_Performance_Reports"); };
    return ( <div className="space-y-6"><div className="bg-white p-4 rounded-xl shadow-sm border flex flex-wrap items-center gap-4"><div className="flex items-center gap-2"><span className="text-sm font-bold text-gray-500">من:</span><input type="date" className="bg-gray-50 border rounded-lg px-3 py-2 outline-none text-sm date-en" value={startDate} onChange={e=>setStartDate(e.target.value)} /></div><div className="flex items-center gap-2"><span className="text-sm font-bold text-gray-500">إلى:</span><input type="date" className="bg-gray-50 border rounded-lg px-3 py-2 outline-none text-sm date-en" value={endDate} onChange={e=>setEndDate(e.target.value)} /></div>{(startDate||endDate)&&<button onClick={()=>{setStartDate('');setEndDate('')}} className="text-xs text-red-500 hover:underline font-bold">إلغاء</button>}{canExport && <button onClick={handleExportReports} className="mr-auto bg-green-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"><Icon name="file-spreadsheet" size={16}/> تصدير التقرير</button>}</div><div className="bg-white rounded-xl shadow-sm border overflow-hidden"><table className="w-full text-right"><thead className="bg-gray-50 text-sm font-bold text-brand-900"><tr><th className="p-4">الموظف (المسند إليه)</th><th className="p-4 text-center">إجمالي العملاء</th><th className="p-4 text-center text-emerald-600">تم البيع</th><th className="p-4 text-center text-amber-600">عربون</th><th className="p-4 text-center text-blue-600">قيد المتابعة</th></tr></thead><tbody className="divide-y">{reportData.map((r:any)=><tr key={r.id} className="hover:bg-gray-50"><td className="p-4"><div className="font-bold text-brand-900">{r.name}</div></td><td className="p-4 text-center font-bold">{r.total}</td><td className="p-4 text-center font-bold text-emerald-600">{r.sold}</td><td className="p-4 text-center font-bold text-amber-600">{r.deposit}</td><td className="p-4 text-center font-bold text-blue-600">{r.inProgress}</td></tr>)}</tbody></table></div></div> );
};

const CRMClientList = ({ clients, users, currentUser, onAdd, onEdit, onImport }: any) => {
    const [search, setSearch] = useState(''); const [filterStatus, setFilterStatus] = useState(''); const [filterAssignee, setFilterAssignee] = useState(''); const [itemsPerPage, setItemsPerPage] = useState<number | 'All'>(10); const [currentPage, setCurrentPage] = useState(1); const [deleteId, setDeleteId] = useState<string | null>(null); const assignees = useMemo(() => [...new Set(clients.map((c:Client) => c.assignedTo).filter(Boolean))], [clients]);
    const isAdmin = currentUser.role === 'admin'; const isSupervisor = currentUser.permissions?.crm_role === 'supervisor'; const isEmployee = currentUser.permissions?.crm_role === 'employee';
    const filtered = clients.filter((c:Client) => { 
        if(isAdmin || isSupervisor) { const s = safeStr(search).toLowerCase(); return (safeStr(c.name).toLowerCase().includes(s) || safeStr(c.phone).includes(s)) && (filterStatus ? c.status === filterStatus : true) && (filterAssignee ? c.assignedTo === filterAssignee : true); }
        if (isEmployee && (c.assignedTo !== currentUser.name && c.addedBy !== currentUser.email)) return false;
        const s = safeStr(search).toLowerCase(); return (safeStr(c.name).toLowerCase().includes(s) || safeStr(c.phone).includes(s)) && (filterStatus ? c.status === filterStatus : true) && (filterAssignee ? c.assignedTo === filterAssignee : true); 
    });
    useEffect(() => { setCurrentPage(1); }, [search, filterStatus, filterAssignee, itemsPerPage]); 
    const displayedClients = itemsPerPage === 'All' ? filtered : filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage); 
    const canDelete = isAdmin || isSupervisor; const canExport = isAdmin; 
    const handleExport = () => { const excelData = filtered.map((c:Client) => ({ 'الاسم': c.name, 'رقم الهاتف': c.phone, 'المشاريع': safeArr(c.projects).join(', '), 'الحالة': STATUS_LIST.find(s=>s.key===c.status)?.label||c.status, 'الموظف': c.assignedTo||'-', 'المنشئ': c.addedBy||'-', 'تاريخ الإضافة': c.dateAdded ? new Date(c.dateAdded).toLocaleDateString('en-GB') : '-' })); exportToExcel(excelData, "Clients"); }; 
    const handleImportFile = (e: any) => { const file = e.target.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = (evt) => { const bstr = evt.target?.result; const wb = XLSX.read(bstr, {type:'binary'}); const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]); onImport(data); }; reader.readAsBinaryString(file); }; 
    const confirmDelete = () => { if(deleteId) { remove(ref(db, `clients/${deleteId}`)); setDeleteId(null); } };
    
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex gap-2 flex-wrap mr-auto">
                    {canExport && (<><div className="relative overflow-hidden"><button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"><Icon name="upload" size={18}/> استيراد</button><input type="file" accept=".xlsx" onChange={handleImportFile} className="absolute inset-0 opacity-0 cursor-pointer"/></div><button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"><Icon name="file-spreadsheet" size={18}/> تصدير</button></>)}
                    <button onClick={onAdd} className="bg-brand-900 hover:bg-brand-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"><Icon name="plus" size={18}/> إضافة عميل</button>
                </div>
            </div>
            <div className="bg-white p-3 rounded-xl shadow-sm border flex flex-wrap gap-2 items-center">
                <input className="flex-1 bg-gray-50 rounded-lg px-3 py-2 outline-none min-w-[150px] text-sm" placeholder="بحث..." value={search} onChange={e=>setSearch(e.target.value)} />
                <select className="bg-gray-50 rounded-lg px-3 py-2 outline-none text-sm" value={itemsPerPage} onChange={e=>setItemsPerPage(e.target.value === 'All' ? 'All' : Number(e.target.value))}> <option value={10}>10 صفوف</option> <option value={50}>50 صف</option> <option value={100}>100 صف</option> <option value="All">الكل</option> </select>
                <select className="bg-gray-50 rounded-lg px-3 py-2 outline-none text-sm" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option value="">كل الحالات</option>{STATUS_LIST.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}</select>
                {!isEmployee && ( <select className="bg-gray-50 rounded-lg px-3 py-2 outline-none text-sm" value={filterAssignee} onChange={(e:any)=>setFilterAssignee(e.target.value)}> <option value="">كل الموظفين</option> {assignees.map((a:any)=><option key={a} value={a}>{a}</option>)} </select> )}
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-right"><thead className="bg-gray-50 text-sm font-bold text-brand-900"><tr><th className="p-4">الاسم</th><th className="p-4">المشاريع</th><th className="p-4">الحالة</th><th className="p-4">الموظف المسند</th><th className="p-4">المنشئ</th><th className="p-4">تاريخ الإضافة</th><th className="p-4">تاريخ المتابعة</th><th className="p-4"></th></tr></thead><tbody className="divide-y">{displayedClients.length > 0 ? displayedClients.map(c => (<tr key={c.id} className="hover:bg-gray-50 group"><td className="p-4"><div className="font-bold text-brand-900">{safeStr(c.name)}</div><div className="flex items-center gap-2 mt-1"><span className="text-xs text-gray-500 date-en">{safeStr(c.phone)}</span><a href={`https://wa.me/966${safeStr(c.phone).substring(1)}`} target="_blank" className="bg-green-50 text-green-600 p-1.5 rounded-full"><Icon name="message-circle" size={14} /></a><a href={`tel:${safeStr(c.phone)}`} className="bg-blue-50 text-blue-600 p-1.5 rounded-full"><Icon name="phone" size={14} /></a></div></td><td className="p-4 text-sm text-gray-600">{safeArr(c.projects).map((p:any,i:number)=><div key={i}>• {safeStr(p)}</div>)}</td><td className="p-4"><span className={`px-2 py-1 rounded text-xs border ${STATUS_LIST.find(s=>s.key===c.status)?.color}`}>{STATUS_LIST.find(s=>s.key===c.status)?.label}</span></td><td className="p-4 text-sm text-gray-600">{safeStr(c.assignedTo)}</td><td className="p-4 text-sm text-gray-500">{safeStr(c.addedBy)}</td><td className="p-4 text-sm text-gray-500 date-en">{c.dateAdded ? new Date(c.dateAdded).toLocaleDateString('en-GB') : '-'}</td><td className="p-4 text-xs text-amber-600 font-bold date-en">{c.nextFollowUp||'-'}</td><td className="p-4 flex items-center gap-2"><button onClick={()=>onEdit(c)} className="text-brand-900 hover:bg-gray-100 p-2 rounded"><Icon name="edit" size={16}/></button>{canDelete && <button onClick={()=>setDeleteId(c.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Icon name="trash-2" size={16}/></button>}</td></tr>)) : <tr><td colSpan={8} className="p-8 text-center text-gray-400">لا توجد نتائج</td></tr>}</tbody></table></div></div>
            {deleteId && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full text-center"><h3 className="text-lg font-bold mb-2">هل أنت متأكد؟</h3><div className="flex gap-3 justify-center mt-4"><button onClick={confirmDelete} className="bg-red-600 text-white px-4 py-2 rounded-lg">حذف</button><button onClick={()=>setDeleteId(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">إلغاء</button></div></div></div>}
        </div>
    );
};

const CRMClientModal = ({ isOpen, onClose, client, onSave, users, currentUser }: any) => {
    const [d, setD] = useState<any>({ name: '', phone: '', projects: [], status: 'New', assignedTo: currentUser.role==='employee'?currentUser.name:'', source: 'مباشر', nextFollowUp: '', history: [] }); 
    const [newNote, setNewNote] = useState(''); const [notes, setNotes] = useState<any[]>([]); const notesEndRef = useRef<HTMLDivElement>(null); const [activeTab, setActiveTab] = useState('notes');
    const crmUsers = useMemo(() => users.filter((u:User) => u.permissions?.crm_access || u.role === 'admin'), [users]);
    useEffect(() => { if(client) { setD({ ...client, history: client.history ? Object.values(client.history) : [] }); setNotes(client.notes ? Object.values(client.notes) : []); } else { setD({ name: '', phone: '', projects: [], status: 'New', assignedTo: currentUser.permissions?.crm_role === 'employee' ? currentUser.name : '', source: 'مباشر', nextFollowUp: '', history: [] }); setNotes([]); } }, [client]); 
    useEffect(() => { notesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [notes, isOpen]);
    const toggleProject = (p: string) => { const curr = safeArr(d.projects); setD({ ...d, projects: curr.includes(p) ? curr.filter((x:any)=>x!==p) : [...curr, p] }); };
    const handleAddNote = () => { if(!newNote.trim()) return; const noteData = { text: newNote, date: new Date().toISOString(), author: currentUser.name }; setNotes([...notes, noteData]); const logData = { action: 'إضافة ملاحظة', user: currentUser.name, date: new Date().toISOString() }; setD((prev:any) => ({...prev, history: [...(prev.history||[]), logData]})); if(client) { push(ref(db, `clients/${client.id}/notes`), noteData); push(ref(db, `clients/${client.id}/history`), logData); } setNewNote(''); };
    const handleSaveInternal = () => { let logAction = 'تحديث البيانات'; if (!client) logAction = 'إنشاء عميل جديد'; else if (d.status !== client.status) logAction = `تغيير الحالة إلى ${STATUS_LIST.find(s=>s.key===d.status)?.label}`; else if (d.assignedTo !== client.assignedTo) logAction = `إسناد إلى ${d.assignedTo}`; const logData = { action: logAction, user: currentUser.name, date: new Date().toISOString() }; onSave(client ? d : { ...d, history: [...(d.history||[]), logData], notes: notes }, logData); };
    const canAssign = currentUser.role === 'admin' || currentUser.permissions?.crm_role === 'supervisor';
    return ( 
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4"><h3 className="font-bold text-lg">{client?'تعديل العميل':'إضافة عميل'}</h3><input className="w-full bg-gray-50 border rounded-lg p-3" placeholder="الاسم" value={safeStr(d.name)} onChange={e=>setD({...d, name:e.target.value})} /><input className="w-full bg-gray-50 border rounded-lg p-3 date-en text-right" placeholder="05xxxxxxxx" value={safeStr(d.phone)} onChange={e=>setD({...d, phone:e.target.value})} /><div><label className="text-xs font-bold block mb-2">المشاريع</label><div className="grid grid-cols-2 gap-2">{PROJECT_LIST.map(p => (<button key={p} onClick={()=>toggleProject(p)} className={`p-2 rounded text-xs border ${safeArr(d.projects).includes(p)?'bg-brand-900 text-white':'bg-white'}`}>{p}</button>))}</div></div><select className="w-full bg-gray-50 border rounded-lg p-3" value={safeStr(d.source)} onChange={e=>setD({...d, source:e.target.value})}>{CLIENT_SOURCES.map(s=><option key={s} value={s}>{s}</option>)}</select><input className="w-full bg-gray-50 border rounded-lg p-3" placeholder="رقم الوحدة" value={safeStr(d.unitNumber)} onChange={e=>setD({...d, unitNumber:e.target.value})} /><select className="w-full bg-gray-50 border rounded-lg p-3" value={safeStr(d.status)} onChange={e=>setD({...d, status:e.target.value})}>{STATUS_LIST.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}</select><select className="w-full bg-gray-50 border rounded-lg p-3 disabled:opacity-50" value={safeStr(d.assignedTo)} onChange={e=>setD({...d, assignedTo:e.target.value})} disabled={!canAssign}> <option value="">بدون إسناد</option> {crmUsers.map(u => ( <option key={u.id} value={u.name}>{u.name}</option> ))} </select><div><label className="text-xs font-bold block mb-1 text-amber-600">تاريخ المتابعة القادم</label><input type="date" className="w-full bg-amber-50 border border-amber-200 rounded-lg p-3 date-en" value={d.nextFollowUp || ''} onChange={e=>setD({...d, nextFollowUp:e.target.value})} /></div></div>
                <div className="flex flex-col h-full"><div className="flex justify-between items-center mb-4 border-b"><div className="flex gap-4"><button onClick={() => setActiveTab('notes')} className={`font-bold text-lg pb-2 transition ${activeTab === 'notes' ? 'text-brand-900 border-b-2 border-brand-900' : 'text-gray-500'}`}><Icon name="notebook-pen" size={18} className="inline-block ml-2"/> الملاحظات</button><button onClick={() => setActiveTab('history')} className={`font-bold text-lg pb-2 transition ${activeTab === 'history' ? 'text-brand-900 border-b-2 border-brand-900' : 'text-gray-500'}`}><Icon name="history" size={18} className="inline-block ml-2"/> سجل الأحداث</button></div><button onClick={onClose} className="md:hidden p-1"><Icon name="x"/></button></div>{activeTab === 'notes' && (<div className="flex-1 flex flex-col min-h-0"><div className="flex-1 bg-gray-50 border rounded-xl p-4 mb-4 overflow-y-auto max-h-[400px] space-y-3">{notes.length === 0 && <div className="text-center text-gray-400 text-sm mt-10">لا توجد ملاحظات بعد</div>}{notes.map((n, i) => (<div key={i} className="bg-white p-3 rounded-lg border shadow-sm text-sm"><p className="text-gray-800 mb-2">{n.text}</p><div className="flex justify-between text-xs text-gray-400"><span>{n.author}</span><span className="date-en">{new Date(n.date).toLocaleDateString('en-GB')} {new Date(n.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span></div></div>))}<div ref={notesEndRef} /></div><div className="flex gap-2 mb-6"><input className="flex-1 border rounded-lg p-2 text-sm" placeholder="اكتب ملاحظة..." value={newNote} onChange={e=>setNewNote(e.target.value)} onKeyPress={e=>e.key==='Enter'&&handleAddNote()} /><button onClick={handleAddNote} className="bg-gray-200 hover:bg-gray-300 p-2 rounded-lg"><Icon name="send" size={16}/></button></div></div>)}{activeTab === 'history' && client && (<div className="flex-1 bg-gray-50 border rounded-xl p-4 mb-4 overflow-y-auto max-h-[400px]"><div className="text-xs space-y-2">{safeArr(d.history).slice().reverse().map((h:any, i:number) => (<div key={i} className="flex justify-between items-start border-b pb-2 last:border-0 last:pb-0"><span className="font-bold text-gray-700 w-3/5">{h.action}</span><div className="text-gray-500 text-left w-2/5"><div className='text-[11px]'>{h.user}</div><div className="date-en text-[10px] text-gray-400">{new Date(h.date).toLocaleDateString('en-GB')} <span className='mr-1'>{new Date(h.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span></div></div></div>))}{safeArr(d.history).length === 0 && <div className="text-center text-gray-400 text-sm mt-10">لا يوجد سجل أحداث لهذا العميل.</div>}</div></div>)}<div className="mt-auto flex gap-3"><button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200">إلغاء</button><button onClick={handleSaveInternal} className="flex-1 bg-brand-900 text-white py-3 rounded-lg font-bold hover:bg-brand-800 shadow-lg">حفظ البيانات</button></div></div>
            </div>
        </div>
    );
};

const CRMBackup = ({ clients, users, onImport }: any) => {
    const handleImportFile = (e: any) => { const file = e.target.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = (evt) => { const bstr = evt.target?.result; const wb = XLSX.read(bstr, {type:'binary'}); const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]); onImport(data); }; reader.readAsBinaryString(file); }; 
    const downloadTemplate = () => { const headers = [{ 'الاسم': 'اسم تجريبي', 'رقم الهاتف': '0500000000', 'المشروع': 'بيوتكم 10' }]; exportToExcel(headers, "Import_Template"); };
    return ( 
       <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
           <h3 className="font-bold text-lg mb-4">إدارة البيانات</h3>
           <button onClick={() => { const data = { clients, users, date: new Date().toISOString() }; const blob = new Blob([JSON.stringify(data)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "backup.json"; link.click(); }} className="w-full bg-brand-900 text-white p-4 rounded-xl flex justify-center gap-2 font-bold"><Icon name="download" /> تحميل نسخة احتياطية كاملة (JSON)</button>
           <div className="h-px bg-gray-100 my-4"></div>
           <h3 className="font-bold text-lg mb-4">استيراد العملاء</h3>
           <div className="grid grid-cols-2 gap-4">
               <button onClick={downloadTemplate} className="w-full bg-gray-100 text-gray-700 p-4 rounded-xl flex justify-center gap-2 font-bold hover:bg-gray-200 transition"><Icon name="file-spreadsheet" /> تحميل نموذج الاستيراد</button>
               <div className="relative overflow-hidden w-full">
                   <button className="w-full bg-indigo-600 text-white p-4 rounded-xl flex justify-center gap-2 font-bold hover:bg-indigo-700 transition"><Icon name="upload" /> رفع ملف العملاء (Excel)</button>
                   <input type="file" accept=".xlsx" onChange={handleImportFile} className="absolute inset-0 opacity-0 cursor-pointer"/>
               </div>
           </div>
       </div> 
   );
};

const CRMApp = ({ user, clients, users, onSaveClient, onImport, onBack }: any) => {
    const [page, setPage] = useState('dashboard'); 
    const [modalOpen, setModalOpen] = useState(false); 
    const [editClient, setEditClient] = useState(null); 
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isAdmin = user.role === 'admin'; 
    const isSupervisor = user.permissions?.crm_role === 'supervisor'; 
    const canSeeReports = isAdmin || isSupervisor || user.permissions?.crm_reports; 
    const canBackup = isAdmin; 

    return ( 
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar Overlay */}
            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)}></div>}
            
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-white border-l transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 flex justify-between items-center gap-2 font-black text-xl text-brand-900 border-b">
                    <div className="flex items-center gap-2"><Icon name="box" size={32} /> بيوتكم</div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500"><Icon name="x" /></button>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={()=>{setPage('dashboard');setSidebarOpen(false)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${page==='dashboard'?'bg-brand-900 text-white':'text-gray-500 hover:bg-gray-50'}`}><Icon name="layout-dashboard"/> لوحة التحكم</button>
                    <button onClick={()=>{setPage('clients');setSidebarOpen(false)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${page==='clients'?'bg-brand-900 text-white':'text-gray-500 hover:bg-gray-50'}`}><Icon name="users"/> العملاء</button>
                    {canSeeReports && (<button onClick={()=>{setPage('reports');setSidebarOpen(false)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${page==='reports'?'bg-brand-900 text-white':'text-gray-500 hover:bg-gray-50'}`}><Icon name="bar-chart-2"/> التقارير</button>)}
                    {canBackup && (<button onClick={()=>{setPage('backup');setSidebarOpen(false)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${page==='backup'?'bg-brand-900 text-white':'text-gray-500 hover:bg-gray-50'}`}><Icon name="settings"/> الإعدادات</button>)}
                </nav>
                <div className="p-4 border-t">
                    <button onClick={onBack} className="w-full bg-gray-100 text-gray-600 p-2 rounded-lg font-bold flex items-center justify-center gap-2"><Icon name="grid" size={16}/> تبديل التطبيق</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <CRMHeader title={page==='dashboard'?'لوحة التحكم':page==='clients'?'العملاء':page==='reports'?'التقارير':'الإعدادات'} clients={clients} onToggleSidebar={()=>setSidebarOpen(true)} />
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-5xl mx-auto">
                        {page === 'dashboard' && <CRMDashboard clients={clients} currentUser={user} />}
                        {page === 'clients' && <CRMClientList clients={clients} users={users} currentUser={user} onAdd={()=>{setEditClient(null);setModalOpen(true)}} onEdit={(c:any)=>{setEditClient(c);setModalOpen(true)}} onImport={onImport} />}
                        {page === 'reports' && canSeeReports && <CRMReports clients={clients} users={users} currentUser={user} />}
                        {page === 'backup' && canBackup && <CRMBackup clients={clients} users={users} onImport={onImport} />}
                    </div>
                </div>
            </main>
            
            {modalOpen && <CRMClientModal isOpen={modalOpen} onClose={()=>setModalOpen(false)} client={editClient} onSave={(d:any, log:any)=>{onSaveClient(d, editClient, log);setModalOpen(false)}} users={users} currentUser={user} />}
        </div> 
    );
};

export default CRMApp;