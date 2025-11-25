import React, { useState, useEffect, ReactNode, Component } from 'react';
import * as LucideIcons from 'lucide-react';
import * as XLSX from 'xlsx';

// --- Utils ---
export const safeStr = (val: any) => (val === null || val === undefined) ? '' : String(val);
export const safeArr = (val: any) => Array.isArray(val) ? val : [];

export const formatTime = (isoString: string) => new Date(isoString).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
export const formatDate = (isoString: string) => new Date(isoString).toLocaleDateString('en-GB');

export const calculateDuration = (start: string, end: string) => {
  if (!start || !end) return '-';
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const diffHrs = Math.floor((diffMs % 86400000) / 3600000);
  const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
  return `${diffHrs}س ${diffMins}د`;
};

export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// --- Components ---
export const Icon = ({ name, size = 20, className = "" }: { name: string, size?: number, className?: string }) => {
  // Convert kebab-case (e.g. 'user-plus') to PascalCase (e.g. 'UserPlus')
  // Special cases if needed, but standard conversion covers most Lucide icons
  const pascalName = name
    .split('-')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
    
  const LucideIcon = (LucideIcons as any)[pascalName] || LucideIcons.HelpCircle;

  return <LucideIcon size={size} className={className} />;
};

export const Logo = ({ size = 40 }: { size?: number }) => {
  const [imgError, setImgError] = useState(false);
  if (imgError) {
    return (
      <div className="bg-brand-900 rounded-xl flex items-center justify-center text-accent-500" style={{ width: size, height: size }}>
        <Icon name="box" size={size * 0.6} />
      </div>
    );
  }
  return (
    <img 
      src="/logo.png" 
      alt="شعار" 
      className="object-contain" 
      style={{ width: size, height: size }} 
      onError={() => setImgError(true)} 
    />
  );
};

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  
  static getDerivedStateFromError(_: Error): ErrorBoundaryState { 
    return { hasError: true }; 
  }
  
  componentDidCatch(error: any, errorInfo: any) { 
    console.error("Error:", error, errorInfo); 
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-600 bg-red-50 rounded text-center">
          حدث خطأ في العرض. 
          <button onClick={()=>window.location.reload()} className="underline">تحديث الصفحة</button>
        </div>
      );
    }
    return this.props.children;
  }
}