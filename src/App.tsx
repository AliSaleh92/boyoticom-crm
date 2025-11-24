import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ClientList } from './components/ClientList';
import { Login } from './components/Login';
import { ClientModal } from './components/ClientModal';
import { Client, User } from './types';
import { authService, dbService } from './services/firebaseService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);

  // Initialize Auth Listener & Data Subscriptions
  useEffect(() => {
    const unsubscribeAuth = authService.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch Data when User is Present
  useEffect(() => {
    if (user) {
      const unsubscribeClients = dbService.getClients((data) => setClients(data));
      const unsubscribeUsers = dbService.getUsers((data) => setUsers(data));

      return () => {
        unsubscribeClients();
        unsubscribeUsers();
      };
    } else {
      setClients([]);
      setUsers([]);
    }
  }, [user]);

  const handleLogout = () => {
    authService.logout();
  };

  // CRUD Operations
  const handleSaveClient = async (data: Partial<Client>) => {
    try {
      if (editingClient) {
        // Update
        await dbService.updateClient(editingClient.id, data);
      } else {
        // Create
        const newClient = {
          ...data,
          dateAdded: new Date().toISOString(),
          addedBy: user?.email || 'Unknown',
          // If assignedTo is not set, and creator is employee, assign to self (handled in modal mostly, but safety check)
          assignedTo: data.assignedTo || (user?.role === 'employee' ? user.name : '')
        } as any;
        await dbService.addClient(newClient);
      }
      setIsModalOpen(false);
      setEditingClient(undefined);
    } catch (e) {
      alert('حدث خطأ أثناء الحفظ');
      console.error(e);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع.')) {
      await dbService.deleteClient(id);
    }
  };

  const handleAddNote = async (clientId: string, text: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !user) return;
    
    const newNote = {
      id: Date.now().toString(),
      text,
      author: user.name,
      timestamp: new Date().toISOString()
    };
    
    const updatedNotes = { ...(client.notes || {}), [newNote.id]: newNote };
    await dbService.updateClient(clientId, { notes: updatedNotes });
    
    // Update local editing state if open to reflect immediately in UI
    if (editingClient && editingClient.id === clientId) {
        setEditingClient({ ...editingClient, notes: updatedNotes });
    }
  };

  const handleAddTask = async (clientId: string, text: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const newTask = {
        id: Date.now().toString(),
        text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    const updatedTasks = { ...(client.tasks || {}), [newTask.id]: newTask };
    await dbService.updateClient(clientId, { tasks: updatedTasks });
    
    if (editingClient && editingClient.id === clientId) {
        setEditingClient({ ...editingClient, tasks: updatedTasks });
    }
  };

  const handleToggleTask = async (clientId: string, taskId: string, currentStatus: boolean) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !client.tasks) return;

    const updatedTasks = {
        ...client.tasks,
        [taskId]: { ...client.tasks[taskId], completed: !currentStatus }
    };
    await dbService.updateClient(clientId, { tasks: updatedTasks });
    
    if (editingClient && editingClient.id === clientId) {
        setEditingClient({ ...editingClient, tasks: updatedTasks });
    }
  };

  const handleDeleteTask = async (clientId: string, taskId: string) => {
      const client = clients.find(c => c.id === clientId);
      if (!client || !client.tasks) return;

      const updatedTasks = { ...client.tasks };
      delete updatedTasks[taskId];
      
      await dbService.updateClient(clientId, { tasks: updatedTasks });
      
      if (editingClient && editingClient.id === clientId) {
        setEditingClient({ ...editingClient, tasks: updatedTasks });
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-50 text-brand-900 font-bold">جاري الاتصال بالنظام...</div>;

  if (!user) return <Login />;

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      currentPage={currentPage}
      onNavigate={setCurrentPage}
    >
      {currentPage === 'dashboard' && <Dashboard clients={clients} />}
      
      {currentPage === 'clients' && (
        <ClientList 
          clients={clients} 
          users={users}
          currentUser={user}
          onAdd={() => { setEditingClient(undefined); setIsModalOpen(true); }}
          onEdit={(c) => { setEditingClient(c); setIsModalOpen(true); }}
          onDelete={handleDeleteClient}
        />
      )}

      {currentPage === 'users' && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border text-center py-20">
          <h2 className="text-xl font-bold text-gray-800">إدارة الموظفين</h2>
          <p className="text-gray-500 mt-2">يجب إنشاء حسابات الموظفين من لوحة تحكم Firebase (Authentication).</p>
          <p className="text-sm text-gray-400 mb-6">ستظهر الحسابات هنا بمجرد تسجيل دخولهم للنظام.</p>
          <div className="mt-8 grid gap-4 max-w-2xl mx-auto">
             {users.map(u => (
                 <div key={u.id} className="flex justify-between p-4 border rounded-xl bg-gray-50">
                     <div className="text-right">
                         <div className="font-bold text-brand-900">{u.name}</div>
                         <div className="text-sm text-gray-500 date-en">{u.email}</div>
                     </div>
                     <span className={`px-3 py-1 rounded-lg text-sm flex items-center h-fit ${u.role === 'admin' ? 'bg-brand-900 text-white' : 'bg-white border'}`}>
                       {u.role === 'admin' ? 'مسؤول' : 'مستشار عقاري'}
                     </span>
                 </div>
             ))}
          </div>
        </div>
      )}

      <ClientModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        client={editingClient}
        onSave={handleSaveClient}
        users={users}
        currentUser={user}
        onAddNote={handleAddNote}
        onAddTask={handleAddTask}
        onToggleTask={handleToggleTask}
        onDeleteTask={handleDeleteTask}
      />
    </Layout>
  );
};

export default App;