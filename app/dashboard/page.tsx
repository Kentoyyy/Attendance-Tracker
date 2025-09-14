"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AddStudentModal from '../components/AddStudentModal';
import MainContent from '../components/pages/MainContent';
import { Button } from '../components/ui/button';
import { BookOpen, Users, Archive, UserPlus, Upload, Download, FileText, LogOut, UserX, ChevronLeft, ChevronRight, Sun, Moon, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Clock from '../components/Clock';
import { Student, AttendanceRecord } from '../types';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { useTheme, getThemeColors } from '../context/ThemeProvider';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, toggleTheme, isDark } = useTheme();
  const colors = getThemeColors(isDark);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const [selectedGrade, setSelectedGrade] = useState<string>('Grade 1');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);
  const [isAddGradeModalOpen, setIsAddGradeModalOpen] = useState(false);
  const [newGradeName, setNewGradeName] = useState('');
  const [isLoadingGrades, setIsLoadingGrades] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [todaysAbsences, setTodaysAbsences] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'import' | 'export' | 'logs' | 'archive'>('dashboard');

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

  const handleResetStudents = async () => {
    if (!confirm('Are you sure you want to reset all students? This will remove all students from your grade.')) {
      return;
    }
    
    try {
      const gradeNumber = getGradeNumber(selectedGrade);
      const response = await fetch('/api/students/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: gradeNumber })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Reset result:', result);
        alert(`Students reset successfully! ${result.deletedCount} students removed.`);
        fetchData(); // Refresh the student list
      } else {
        const error = await response.json();
        console.error('Reset error:', error);
        alert('Failed to reset students: ' + error.message);
      }
    } catch (error) {
      console.error('Error resetting students:', error);
      alert('Error resetting students');
    }
  };

  const handleAddGrade = async () => {
    if (!newGradeName.trim()) {
      alert('Please enter a grade name');
      return;
    }

    if (availableGrades.includes(newGradeName.trim())) {
      alert('This grade already exists');
      return;
    }

    const newGrade = newGradeName.trim();
    console.log('➕ Adding new grade to database:', newGrade);
    
    try {
      // Extract number from grade name (e.g., "Grade 7" -> 7)
      const gradeNumber = getGradeNumber(newGrade);
      
      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newGrade,
          number: gradeNumber
        }),
      });

      if (response.ok) {
        const createdGrade = await response.json();
        console.log('✅ Grade created in database:', createdGrade);
        
        // Refresh grades list
        const gradesResponse = await fetch('/api/grades');
        if (gradesResponse.ok) {
          const grades = await gradesResponse.json();
          const gradeNames = grades.map((grade: any) => grade.name);
          setAvailableGrades(gradeNames);
          setSelectedGrade(newGrade);
        }
        
        setIsAddGradeModalOpen(false);
        setNewGradeName('');
        setConfirmModal({
          isOpen: true,
          title: 'Success',
          message: `Grade "${newGrade}" added successfully!`,
          onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
          confirmText: 'OK'
        });
      } else {
        const error = await response.json();
        console.error('❌ Failed to create grade:', error);
        setConfirmModal({
          isOpen: true,
          title: 'Error',
          message: `Failed to add grade: ${error.error}`,
          onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
          confirmText: 'OK'
        });
      }
    } catch (error) {
      console.error('❌ Error adding grade:', error);
      setConfirmModal({
        isOpen: true,
        title: 'Error',
        message: 'Error adding grade. Please try again.',
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        confirmText: 'OK'
      });
    }
  };

  const handleRemoveGrade = async (gradeToRemove: string) => {
    // Don't allow removing if it's the only grade
    if (availableGrades.length <= 1) {
      setConfirmModal({
        isOpen: true,
        title: 'Cannot Remove Grade',
        message: 'Cannot remove the last grade. You must have at least one grade.',
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        confirmText: 'OK'
      });
      return;
    }

    try {
      console.log('🗑️ Removing grade from database:', gradeToRemove);
      
      // First, get the grade ID from the database
      const gradesResponse = await fetch('/api/grades');
      if (!gradesResponse.ok) {
        throw new Error('Failed to fetch grades');
      }
      
      const grades = await gradesResponse.json();
      const gradeToDelete = grades.find((grade: any) => grade.name === gradeToRemove);
      
      if (!gradeToDelete) {
        setConfirmModal({
          isOpen: true,
          title: 'Grade Not Found',
          message: 'Grade not found in database.',
          onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
          confirmText: 'OK'
        });
        return;
      }

      const response = await fetch(`/api/grades?id=${gradeToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('✅ Grade removed from database');
        
        // Refresh grades list
        const updatedGradesResponse = await fetch('/api/grades');
        if (updatedGradesResponse.ok) {
          const updatedGrades = await updatedGradesResponse.json();
          const gradeNames = updatedGrades.map((grade: any) => grade.name);
          setAvailableGrades(gradeNames);
          
          // Switch to the first available grade if the removed grade was selected
          if (selectedGrade === gradeToRemove && gradeNames.length > 0) {
            setSelectedGrade(gradeNames[0]);
          }
        }
        
        setConfirmModal({
          isOpen: true,
          title: 'Success',
          message: `Grade "${gradeToRemove}" removed successfully!`,
          onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
          confirmText: 'OK'
        });
      } else {
        const error = await response.json();
        console.error('❌ Failed to remove grade:', error);
        setConfirmModal({
          isOpen: true,
          title: 'Error',
          message: `Failed to remove grade: ${error.error}`,
          onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
          confirmText: 'OK'
        });
      }
    } catch (error) {
      console.error('❌ Error removing grade:', error);
      setConfirmModal({
        isOpen: true,
        title: 'Error',
        message: 'Error removing grade. Please try again.',
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        confirmText: 'OK'
      });
    }
  };

  // Update document title when grade changes
  useEffect(() => {
    document.title = `${selectedGrade} - Teacher's Dashboard`;
  }, [selectedGrade]);

  // Auto-close add grade modal when navigating to other pages
  useEffect(() => {
    if (currentPage !== 'dashboard' && isAddGradeModalOpen) {
      setIsAddGradeModalOpen(false);
      setNewGradeName('');
    }
  }, [currentPage, isAddGradeModalOpen]);

  // Load grades from database on component mount
  useEffect(() => {
    const loadGrades = async () => {
      try {
        console.log('🔍 Loading grades from database...');
        setIsLoadingGrades(true);
        
        const response = await fetch('/api/grades');
        if (response.ok) {
          const grades = await response.json();
          console.log('✅ Loaded grades from database:', grades);
          
          const gradeNames = grades.map((grade: any) => grade.name);
          setAvailableGrades(gradeNames);
          
          // Set selected grade to first available grade
          if (gradeNames.length > 0) {
            setSelectedGrade(gradeNames[0]);
            console.log('✅ Set selected grade to:', gradeNames[0]);
          }
        } else {
          console.error('❌ Failed to load grades from database');
          // Fallback to defaults
          const defaultGrades = ['Grade 1', 'Grade 2', 'Grade 3'];
          setAvailableGrades(defaultGrades);
          setSelectedGrade('Grade 1');
        }
      } catch (error) {
        console.error('❌ Error loading grades from database:', error);
        // Fallback to defaults
        const defaultGrades = ['Grade 1', 'Grade 2', 'Grade 3'];
        setAvailableGrades(defaultGrades);
        setSelectedGrade('Grade 1');
      } finally {
        setIsLoadingGrades(false);
      }
    };

    loadGrades();
  }, []);

  const getId = (s: any) => String(s?.id ?? s?._id);
  
  // Helper function to extract grade number from grade string
  const getGradeNumber = (gradeString: string): number => {
    const match = gradeString.match(/\d+/);
    return match ? parseInt(match[0]) : 1; // Default to 1 if no number found
  };

  const fetchData = async () => {
    if (status !== 'authenticated') return;
    setIsLoading(true);
    try {
      const gradeNumber = getGradeNumber(selectedGrade);
      const studentsRes = await fetch(`/api/students?grade=${gradeNumber}`);
      const studentsData = await studentsRes.json();
      console.log('Fetched students after reset:', studentsData);
      console.log('Is studentsData an array?', Array.isArray(studentsData));
      console.log('StudentsData type:', typeof studentsData);
      setStudents(Array.isArray(studentsData) ? studentsData : []);

      if (Array.isArray(studentsData) && studentsData.length > 0) {
        const studentIds = studentsData.map((s: Student) => getId(s));
        const today = format(new Date(), 'yyyy-MM-dd');
        const attendanceRes = await fetch(`/api/attendance/byDate?date=${today}&studentIds=${studentIds.join(',')}`);
        const attendanceData = await attendanceRes.json();
        const arr = Array.isArray(attendanceData) ? attendanceData : [];
        setTodaysAbsences(arr.filter((a: any) => a?.isAbsent === true || a?.status === 'ABSENT'));
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
  }, [selectedGrade, status]);

  const handleAttendanceUpdate = () => {
    fetchData();
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const absentMaleCount = Array.isArray(students) 
    ? students.filter(s => s.sex === 'Male' && todaysAbsences.some(a => a.studentId === getId(s))).length
    : 0;

  const absentFemaleCount = Array.isArray(students) 
    ? students.filter(s => s.sex === 'Female' && todaysAbsences.some(a => a.studentId === getId(s))).length
    : 0;

  if (status === 'loading' || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex" style={{ backgroundColor: colors.background }}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`lg:hidden fixed top-4 z-50 p-2 sm:p-3 rounded-lg shadow-lg transition-all duration-300 ${
          isSidebarOpen ? 'left-72 sm:left-80' : 'left-4'
        }`}
        style={{ 
          backgroundColor: colors.primary, 
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-30 backdrop-blur-md z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Responsive Sidebar */}
      <div className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 lg:static lg:inset-auto
        fixed inset-y-0 left-0 z-30 w-72 sm:w-80 lg:w-64 shadow-sm border-r flex flex-col transition-transform duration-300 ease-in-out
      `} style={{ backgroundColor: colors.sidebarBackground, borderColor: colors.border }}>
        {/* Sidebar Header */}
        <div className="p-4 sm:p-6 border-b" style={{ backgroundColor: colors.headerBackground, borderColor: colors.border }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div 
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ 
                  backgroundColor: isDark ? colors.primary : colors.lightButton
                }}
              >
                <img 
                  src="/favicon.ico" 
                  alt="Attendance" 
                  className="w-4 h-4 sm:w-6 sm:h-6"
                />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold truncate" style={{ color: colors.text }}>Attendance</h2>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Mobile Close Button */}
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-1.5 sm:p-2 rounded-lg transition-colors hover:opacity-80"
                style={{ 
                  backgroundColor: colors.hover,
                  color: colors.textSecondary
                }}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 rounded-lg transition-colors hover:opacity-80"
                style={{ 
                  backgroundColor: isDark ? colors.hover : colors.lightButton,
                  color: colors.textSecondary
                }}
              >
                {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
          <div className="text-xs font-medium uppercase tracking-wider mb-2 sm:mb-3 hidden lg:block" style={{ color: colors.textSecondary }}>
            Navigation
          </div>

          {/* Dashboard Button */}
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-md text-left transition-all duration-200 cursor-pointer ${
              currentPage === 'dashboard' ? '' : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: currentPage === 'dashboard' ? colors.primary : 'transparent',
              color: currentPage === 'dashboard' ? '#ffffff' : colors.text
            }}
          >
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base truncate">Dashboard</span>
          </button>

          {/* Archive View Button */}
          <button
            onClick={() => setCurrentPage('archive')}
            className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-md text-left transition-all duration-200 cursor-pointer ${
              currentPage !== 'archive' ? 'hover:opacity-80' : ''
            }`}
            style={{
              backgroundColor: currentPage === 'archive' ? colors.primary : 'transparent',
              color: currentPage === 'archive' ? '#ffffff' : colors.text
            }}
          >
            <Archive className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base truncate">Archive View</span>
          </button>
          
          {/* Grade Selection */}
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium hidden lg:block" style={{ color: colors.textSecondary }}>Current Grade</div>
              <button
                onClick={() => setIsAddGradeModalOpen(true)}
                className="text-xs px-2 py-1 rounded transition-all duration-200 cursor-pointer hover:opacity-80 flex-shrink-0"
                style={{ 
                  backgroundColor: colors.primary,
                  color: '#ffffff'
                }}
              >
                + Add Grade
              </button>
            </div>
            <div 
              className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: `${colors.border} transparent`
              }}
            >
              {isLoadingGrades ? (
                <div className="flex items-center justify-center p-4">
                  <div className="text-sm" style={{ color: colors.textMuted }}>
                    Loading grades...
                  </div>
                </div>
              ) : (
                availableGrades.map((grade, index) => (
                <div
                  key={grade}
                  className="group relative overflow-hidden animate-slide-in"
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <button
                    onClick={() => setSelectedGrade(grade)}
                    className={`w-full p-2 lg:p-2.5 text-xs lg:text-sm font-medium rounded-md transition-all duration-300 text-left cursor-pointer transform hover:scale-[1.02] hover:shadow-sm ${
                      selectedGrade !== grade ? 'hover:opacity-80' : ''
                    }`}
                    style={{
                      backgroundColor: selectedGrade === grade ? colors.primary : (isDark ? colors.hover : colors.lightButton),
                      color: selectedGrade === grade ? '#ffffff' : colors.text
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate flex-1">{grade}</span>
                      {availableGrades.length > 1 && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmModal({
                              isOpen: true,
                              title: 'Remove Grade',
                              message: `Are you sure you want to remove ${grade}?`,
                              onConfirm: () => {
                                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                handleRemoveGrade(grade);
                              },
                              confirmText: 'Remove',
                              cancelText: 'Cancel'
                            });
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded hover:bg-red-500 hover:text-white ml-2 flex-shrink-0 cursor-pointer"
                          style={{ color: colors.textSecondary }}
                          title={`Remove ${grade}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              )))}
            </div>
          </div>

        </div>

        {/* Quick Actions */}
        <div className="p-3 sm:p-4 border-t" style={{ borderColor: colors.border }}>
          <div className="text-xs font-medium uppercase tracking-wider mb-2 sm:mb-3" style={{ color: colors.textSecondary }}>
            Quick Actions
          </div>
          <div className="space-y-1 sm:space-y-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-md text-left transition-all duration-200 hover:opacity-80 cursor-pointer"
              style={{ color: colors.text }}
            >
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base truncate">Add Student</span>
            </button>

            <button
              onClick={() => setCurrentPage('import')}
              className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-md text-left transition-all duration-200 cursor-pointer ${
                currentPage !== 'import' ? 'hover:opacity-80' : ''
              }`}
              style={{
                backgroundColor: currentPage === 'import' ? colors.primary : 'transparent',
                color: currentPage === 'import' ? '#ffffff' : colors.text
              }}
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base truncate">Import Students</span>
            </button>

            <button
              onClick={() => setCurrentPage('export')}
              className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-md text-left transition-all duration-200 cursor-pointer ${
                currentPage !== 'export' ? 'hover:opacity-80' : ''
              }`}
              style={{
                backgroundColor: currentPage === 'export' ? colors.primary : 'transparent',
                color: currentPage === 'export' ? '#ffffff' : colors.text
              }}
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base truncate">Export Data</span>
            </button>

            <button
              onClick={() => setCurrentPage('logs')}
              className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-md text-left transition-all duration-200 cursor-pointer ${
                currentPage !== 'logs' ? 'hover:opacity-80' : ''
              }`}
              style={{
                backgroundColor: currentPage === 'logs' ? colors.primary : 'transparent',
                color: currentPage === 'logs' ? '#ffffff' : colors.text
              }}
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base truncate">Action Logs</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t" style={{ borderColor: colors.border }}>
          <div className="text-center text-xs" style={{ color: colors.textMuted }}>
            Made by Ken ❤️
          </div>
        </div>

        {/* User Menu */}
        <div className="p-3 sm:p-4 border-t" style={{ borderColor: colors.border }}>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-md text-left transition-all duration-200 hover:opacity-80 cursor-pointer"
            style={{ color: colors.error }}
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base truncate">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-screen lg:ml-0" style={{ backgroundColor: colors.background }}>
        {/* Top Header */}
        <header className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b" style={{ backgroundColor: colors.headerBackground, borderColor: colors.border }}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight truncate" style={{ color: colors.text }}>Teacher Dashboard</h1>
              <p className="text-xs sm:text-sm hidden sm:block truncate" style={{ color: colors.textSecondary }}>Welcome, {session.user?.name}!</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <span className="text-xs" style={{ color: colors.textSecondary }}><Clock /></span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-3 sm:p-4 lg:p-6" style={{ backgroundColor: colors.background }}>
          <MainContent
            students={students}
            isLoading={isLoading}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            onAttendanceUpdate={handleAttendanceUpdate}
            selectedGrade={selectedGrade}
            setSelectedGrade={setSelectedGrade}
            todaysAbsences={todaysAbsences}
            absentMaleCount={absentMaleCount}
            absentFemaleCount={absentFemaleCount}
            onImportComplete={handleAttendanceUpdate}
            currentPage={currentPage}
          />
        </div>
      </div>

      <AddStudentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onStudentAdded={handleAttendanceUpdate}
        selectedGrade={selectedGrade} 
      />

      {/* Add Grade Modal */}
      {isAddGradeModalOpen && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div 
            className="rounded-lg p-6 w-96 max-w-md mx-4 shadow-lg border"
            style={{ 
              backgroundColor: colors.cardBackground,
              borderColor: colors.border
            }}
          >
            {/* Modal Header with X button */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: colors.text }}>Add New Grade</h3>
              <button
                onClick={() => {
                  setIsAddGradeModalOpen(false);
                  setNewGradeName('');
                }}
                className="p-1 rounded-md transition-all duration-200 cursor-pointer hover:opacity-80"
                style={{ 
                  backgroundColor: colors.hover,
                  color: colors.textSecondary
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                Grade Name
              </label>
              <input
                type="text"
                value={newGradeName}
                onChange={(e) => setNewGradeName(e.target.value)}
                placeholder="e.g., Senior High, College, Grade 4"
                className="w-full p-3 rounded-md focus:outline-none"
                style={{ 
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                  borderWidth: '2px',
                  borderStyle: 'solid'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddGrade();
                  }
                }}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsAddGradeModalOpen(false);
                  setNewGradeName('');
                }}
                className="px-4 py-2 rounded-md transition-all duration-200 cursor-pointer hover:opacity-80"
                style={{ 
                  backgroundColor: colors.hover,
                  color: colors.text
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddGrade}
                className="px-4 py-2 rounded-md transition-all duration-200 cursor-pointer hover:opacity-80"
                style={{ 
                  backgroundColor: colors.primary,
                  color: '#ffffff'
                }}
              >
                Add Grade
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        accept=".xlsx, .xls"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div 
            className="rounded-lg p-6 max-w-md w-full mx-4 pointer-events-auto shadow-2xl"
            style={{ 
              backgroundColor: colors.cardBackground,
              border: `1px solid ${colors.border}`
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
              {confirmModal.title}
            </h3>
            <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
              {confirmModal.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:opacity-80"
                style={{ 
                  backgroundColor: colors.lightButton,
                  color: colors.text,
                  borderColor: colors.border
                }}
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 rounded-md text-sm font-medium text-white transition-all duration-200 hover:opacity-80"
                style={{ backgroundColor: colors.primary }}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    
    </div>
  );
} 