"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import StudentTable from '../components/StudentTable';
import GradeSelector from '../components/GradeSelector';
import AddStudentModal from '../components/AddStudentModal';
import { Button } from '../components/ui/button';
import { Plus, ChevronLeft, ChevronRight, FileText, UserX, ChevronDown, UserCircle, LogOut, Upload, Download, UserPlus } from 'lucide-react';
import Link from 'next/link';
import Clock from '../components/Clock';
import { Student, AttendanceRecord } from '../types';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const [selectedGrade, setSelectedGrade] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [students, setStudents] = useState<Student[]>([]);
  const [todaysAbsences, setTodaysAbsences] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Import/Export logic
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const students = XLSX.utils.sheet_to_json(worksheet);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(students),
      });
      if (res.ok) {
        alert('Imported ' + students.length + ' students!');
        fetchData();
      } else {
        const error = await res.json();
        alert('Import failed: ' + (error.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Import failed: ' + err);
    }
    e.target.value = '';
  };

  const handleExportClick = async () => {
    const res = await fetch('/api/attendance/export');
    const absences = await res.json();
    const worksheet = XLSX.utils.json_to_sheet(absences);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Absences');
    XLSX.writeFile(workbook, 'absences.xlsx');
  };

  // Update document title when grade changes
  useEffect(() => {
    document.title = `Grade ${selectedGrade} - Teacher's Dashboard`;
  }, [selectedGrade]);

  const fetchData = async () => {
    if (status !== 'authenticated') return;
    setIsLoading(true);
    try {
      const studentsRes = await fetch(`/api/students?grade=${selectedGrade}${showArchived ? '&archived=1' : ''}`);
      const studentsData = await studentsRes.json();
      setStudents(studentsData);

      if (studentsData.length > 0) {
        const studentIds = studentsData.map((s: Student) => s._id);
        const today = format(new Date(), 'yyyy-MM-dd');
        const attendanceRes = await fetch(`/api/attendance/byDate?date=${today}&studentIds=${studentIds.join(',')}`);
        const attendanceData = await attendanceRes.json();
        setTodaysAbsences(attendanceData.filter((a: AttendanceRecord) => a.isAbsent));
      } else {
        setTodaysAbsences([]);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setStudents([]);
      setTodaysAbsences([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [selectedGrade, status, showArchived]);

  const handleAttendanceUpdate = () => {
    fetchData();
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const absentMaleCount = students
    .filter(s => s.gender === 'Male' && todaysAbsences.some(a => a.studentId === s._id))
    .length;

  const absentFemaleCount = students
    .filter(s => s.gender === 'Female' && todaysAbsences.some(a => a.studentId === s._id))
    .length;

  if (status === 'loading' || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight">Teacher's Dashboard</h1>
            <span className="text-gray-500 text-sm">Welcome, {session.user?.name}!</span>
            {/* Grade Dropdown */}
            <div className="relative">
              <Button variant="outline" className="flex items-center gap-2 bg-white text-black border border-gray-200 hover:bg-gray-100" onClick={() => setShowDropdown(v => !v)}>
                Grade {selectedGrade} <ChevronDown className="w-4 h-4" />
              </Button>
              {showDropdown && (
                <div className="absolute left-0 mt-2 w-32 bg-white border rounded shadow z-50">
                  {[1,2,3].map(g => (
                    <button key={g} className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${selectedGrade === g ? 'font-bold' : ''}`} onClick={() => { setSelectedGrade(g); setShowDropdown(false); }}>
                      Grade {g}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Small Clock */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500"><Clock /></span>
            {/* FAB Menu */}
            <div className="relative">
              <Button size="icon" className="rounded-full bg-white text-black border border-gray-200 hover:bg-gray-100 shadow-lg" onClick={() => setShowFabMenu(v => !v)}>
                <Plus className="w-6 h-6" />
              </Button>
              {showFabMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded shadow z-50 flex flex-col">
                  <div className="px-4 pt-3 pb-1 text-xs text-gray-500 font-semibold">Student View</div>
                  <button className={`flex items-center gap-2 px-4 py-2 hover:bg-gray-100 ${!showArchived ? 'font-bold' : ''}`} onClick={() => { setShowFabMenu(false); setShowArchived(false); }}>
                    {!showArchived && <span className="text-green-600 font-bold">✓</span>}
                    Show Active Students
                  </button>
                  <button className={`flex items-center gap-2 px-4 py-2 hover:bg-gray-100 ${showArchived ? 'font-bold' : ''}`} onClick={() => { setShowFabMenu(false); setShowArchived(true); }}>
                    {showArchived && <span className="text-green-600 font-bold">✓</span>}
                    Show Archived Students
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100" onClick={() => { setShowFabMenu(false); setIsModalOpen(true); }}><UserPlus className="w-4 h-4" /> Add Student</button>
                  <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100" onClick={() => { setShowFabMenu(false); handleImportClick(); }}><Upload className="w-4 h-4" /> Import Students</button>
                  <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100" onClick={() => { setShowFabMenu(false); handleExportClick(); }}><Download className="w-4 h-4" /> Export Absences</button>
                  <Link href="/dashboard/logs" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"><FileText className="w-4 h-4" /> Action Logs</Link>
                </div>
              )}
              <input
                type="file"
                accept=".xlsx, .xls"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
            {/* User Menu */}
            <div className="relative">
              <Button size="icon" variant="ghost" className="rounded-full bg-white text-black border border-gray-200 hover:bg-gray-100" onClick={() => setShowUserMenu(v => !v)}>
                <UserCircle className="w-7 h-7 text-gray-500" />
              </Button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-50 flex flex-col">
                  <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-red-600" onClick={() => { setShowUserMenu(false); signOut({ callbackUrl: '/' }); }}><LogOut className="w-4 h-4" /> Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center text-red-700">
                  <UserX className="h-5 w-5 mr-2" />
                  <span className="text-base font-semibold">Today's Absences</span>
                </div>
                <div className="text-3xl font-bold text-red-800 mt-1">
                  {isLoading ? '...' : todaysAbsences.length}
                </div>
              </div>
              {!isLoading && (
                <div className="text-right text-sm text-red-600">
                  <div>Male: <strong>{absentMaleCount}</strong></div>
                  <div>Female: <strong>{absentFemaleCount}</strong></div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <Button onClick={prevMonth} size="icon" className="bg-black text-white hover:bg-gray-800">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <Button onClick={nextMonth} size="icon" className="bg-black text-white hover:bg-gray-800">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <StudentTable
            students={students}
            isLoading={isLoading}
            currentMonth={currentMonth}
            onAttendanceUpdate={handleAttendanceUpdate}
            showArchived={showArchived}
            setShowArchived={setShowArchived}
          />
        </div>
      </main>

      <AddStudentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onStudentAdded={handleAttendanceUpdate}
        selectedGrade={selectedGrade} 
      />
    
    </div>
  );
} 