'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { useTheme, getThemeColors } from '../context/ThemeProvider';
import { MoreVertical, LogOut, UserPlus, Users, Settings, Sun, Moon, History, BarChart3, Calendar, AlertTriangle, TrendingUp, Clock, FileText } from 'lucide-react';
import TeacherStudentsModal from '../components/TeacherStudentsModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import EditTeacherModal from '../components/EditTeacherModal';

type IUser = { id: string; name: string; email?: string; role?: string };
type Student = { id: string; name: string; grade?: number; createdBy: string };

// Augment the Student type to include the populated createdBy field
interface PopulatedStudent extends Omit<Student, 'createdBy'> {
  createdBy: {
    id: string;
    name: string;
  }
}


export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const colors = getThemeColors(isDark);

  const [teachers, setTeachers] = useState<IUser[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState({ teachers: true, students: true, logs: true, stats: true });
  const [error, setError] = useState<string | null>(null);
  
  // New state for admin features
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState<'teachers' | 'history' | 'analytics' | 'settings'>('teachers');
  
  // Filter and sort states
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'grade' | 'email'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPin, setNewTeacherPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<{ _id: string; name: string } | null>(null);

  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [selectedTeacherForPassword, setSelectedTeacherForPassword] = useState<{ _id: string; name: string; role?: string } | null>(null);

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; teacher: IUser | null }>({ open: false, teacher: null });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTeacherForEdit, setSelectedTeacherForEdit] = useState<{ _id: string; name: string; email: string } | null>(null);

  const fetchTeachers = async () => {
    setIsLoading(prev => ({ ...prev, teachers: true }));
    try {
      const teachersRes = await fetch('/api/users?role=teacher');
      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        setTeachers(teachersData);
      }
    } catch (e) {
      console.error("Failed to fetch teachers", e);
      setError('Failed to fetch teachers');
    } finally {
      setIsLoading(prev => ({ ...prev, teachers: false }));
    }
  };

  const fetchLogs = async () => {
    setIsLoading(prev => ({ ...prev, logs: true }));
    try {
      const logsRes = await fetch('/api/logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        
        // Fetch teacher names for logs that have userId
        const logsWithTeacherNames = await Promise.all(
          logsData.map(async (log: any) => {
            if (log.userId) {
              try {
                const userRes = await fetch(`/api/users/${log.userId}`);
                if (userRes.ok) {
                  const userData = await userRes.json();
                  return { ...log, teacherName: userData.name, teacherRole: userData.role };
                }
              } catch (e) {
                console.error('Failed to fetch user data for log:', e);
              }
            }
            return { ...log, teacherName: 'System', teacherRole: 'System' };
          })
        );
        
        setLogs(logsWithTeacherNames);
      }
    } catch (e) {
      console.error("Failed to fetch logs", e);
    } finally {
      setIsLoading(prev => ({ ...prev, logs: false }));
    }
  };

  const fetchStats = async () => {
    setIsLoading(prev => ({ ...prev, stats: true }));
    try {
      // Fetch attendance statistics
      const attendanceRes = await fetch('/api/attendance/export');
      const attendanceData = await attendanceRes.ok ? await attendanceRes.json() : [];
      
      // Calculate statistics
      const totalAbsences = attendanceData.length;
      const today = new Date().toISOString().split('T')[0];
      const todayAbsences = attendanceData.filter((a: any) => a.date?.startsWith(today)).length;
      
      // Get student count by grade
      const studentsRes = await fetch('/api/students');
      const studentsData = await studentsRes.ok ? await studentsRes.json() : [];
      const studentsByGrade = studentsData.reduce((acc: any, student: any) => {
        acc[student.grade] = (acc[student.grade] || 0) + 1;
        return acc;
      }, {});

      setStats({
        totalAbsences,
        todayAbsences,
        totalStudents: studentsData.length,
        studentsByGrade,
        recentActivity: logs.slice(0, 5)
      });
    } catch (e) {
      console.error("Failed to fetch stats", e);
    } finally {
      setIsLoading(prev => ({ ...prev, stats: false }));
    }
  };

  useEffect(() => {
    // Protect route for admin only
    if (status === 'authenticated') {
      // Use type guard to check for 'role' property
      if (!isAdminUser(session.user) || session.user.role !== 'admin') {
        router.replace('/dashboard');
      } else {
        fetchTeachers();
        fetchLogs();
        fetchStats();
      }
    } else if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (logs.length > 0) {
      fetchStats();
    }
  }, [logs]);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeacherName, email: newTeacherEmail, pin: newTeacherPin, role: 'teacher' }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitMessage(`Teacher account for ${data.name} created successfully!`);
        setNewTeacherName('');
        setNewTeacherEmail('');
        setNewTeacherPin('');
        fetchTeachers(); // Refresh teachers list
      } else {
        setSubmitMessage(data.message || 'Failed to create teacher account.');
      }
    } catch (e) {
      setSubmitMessage('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewStudents = (teacher: IUser) => {
    setSelectedTeacher({ 
      _id: teacher.id, 
      name: teacher.name 
    });
    setIsModalOpen(true);
  };

  const handleChangePassword = (teacher: IUser) => {
    setSelectedTeacherForPassword({ 
      _id: teacher.id, 
      name: teacher.name,
      role: teacher.role
    });
    setIsChangePasswordModalOpen(true);
  };

  const handleDeleteTeacher = async (teacher: IUser) => {
    if (!teacher) return;
    try {
      const res = await fetch(`/api/users/${teacher.id}`, {
        method: 'DELETE',
      });
      await res.json();
      fetchTeachers();
    } catch (e) {
      // Optionally show error
    }
    setDeleteDialog({ open: false, teacher: null });
  };

  const handleEditTeacher = (teacher: IUser) => {
    setSelectedTeacherForEdit({
      _id: teacher.id,
      name: teacher.name,
      email: teacher.email || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditTeacherSave = async (updatedTeacher: { _id: string; name: string; email: string }) => {
    try {
      const res = await fetch(`/api/users/${updatedTeacher._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: updatedTeacher.name, email: updatedTeacher.email }),
      });
      if (res.ok) {
        fetchTeachers();
        setIsEditModalOpen(false);
        setSelectedTeacherForEdit(null);
      }
    } catch (e) {
      // Optionally show error
    }
  };

  function isAdminUser(user: unknown): user is { role: string } {
    return typeof user === 'object' && user !== null && 'role' in user;
  }

  // Filter and sort teachers
  const filteredAndSortedTeachers = useMemo(() => {
    let filtered = teachers;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(teacher => 
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (teacher.email && teacher.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply grade filter (this would need to be implemented based on how you want to filter teachers by grade)
    // For now, we'll just return all teachers since teachers don't have grades directly
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'email':
          comparison = (a.email || '').localeCompare(b.email || '');
          break;
        case 'grade':
          // For now, we'll sort by name since teachers don't have grades
          comparison = a.name.localeCompare(b.name);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [teachers, searchTerm, gradeFilter, sortBy, sortOrder]);


  if (
    status === 'loading' ||
    !session ||
    !isAdminUser(session.user) ||
    session.user.role !== 'admin'
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: colors.primary }}></div>
          <p style={{ color: colors.text }}>Loading & Verifying Access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <header className="px-2 sm:px-4 lg:px-8 py-3 sm:py-4 border-b" style={{ borderColor: colors.border, backgroundColor: colors.headerBackground }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.primary }}>
              <Settings className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold truncate" style={{ color: colors.text }}>Admin Dashboard</h1>
              <p className="text-xs sm:text-sm truncate" style={{ color: colors.textSecondary }}>Welcome, {session.user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-lg transition-colors hover:opacity-80"
              style={{ 
                backgroundColor: isDark ? colors.hover : colors.lightButton,
                color: colors.textSecondary
              }}
            >
              {isDark ? <Sun className="w-3 h-3 sm:w-4 sm:h-4" /> : <Moon className="w-3 h-3 sm:w-4 sm:h-4" />}
            </button>
            <Button 
              onClick={() => signOut({ callbackUrl: '/' })} 
              className="flex items-center gap-1 sm:gap-2 border-0 hover:opacity-90 transition-opacity text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
              style={{ backgroundColor: colors.error, color: '#ffffff' }}
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Navigation Tabs */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="border-b" style={{ borderColor: colors.border }}>
            <nav className="-mb-px flex flex-wrap gap-1 sm:gap-2 lg:gap-4 overflow-x-auto">
              {[
                { id: 'teachers', name: 'Teachers', icon: Users, shortName: 'Teachers' },
                { id: 'history', name: 'Activity Logs', icon: History, shortName: 'Logs' },
                { id: 'analytics', name: 'Analytics', icon: BarChart3, shortName: 'Analytics' },
                { id: 'settings', name: 'Settings', icon: Settings, shortName: 'Settings' }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id as any)}
                    className={`flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 lg:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                      currentTab === tab.id ? '' : 'hover:opacity-80'
                    }`}
                    style={{
                      borderColor: currentTab === tab.id ? colors.primary : 'transparent',
                      color: currentTab === tab.id ? colors.primary : colors.textSecondary
                    }}
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline sm:inline">{tab.name}</span>
                    <span className="xs:hidden sm:hidden">{tab.shortName}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {currentTab === 'teachers' && (
          <div className="space-y-6">
            {/* Filter and Sort Controls */}
            <Card style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-4">
                  {/* Search Bar - Full Width on Mobile */}
                  <div className="w-full">
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>Search Teachers</label>
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 rounded-md text-sm border-0"
                      style={{ 
                        backgroundColor: colors.hover, 
                        color: colors.text,
                        borderColor: colors.border
                      }}
                    />
                  </div>
                  
                  {/* Filter Controls - Responsive Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium" style={{ color: colors.text }}>Filter by Grade</label>
                      <select
                        value={gradeFilter}
                        onChange={(e) => setGradeFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-md text-sm border-0"
                        style={{ 
                          backgroundColor: colors.hover, 
                          color: colors.text,
                          borderColor: colors.border
                        }}
                      >
                        <option value="all">All Grades</option>
                        <option value="1">Grade 1</option>
                        <option value="2">Grade 2</option>
                        <option value="3">Grade 3</option>
                        <option value="4">Grade 4</option>
                        <option value="5">Grade 5</option>
                        <option value="6">Grade 6</option>
                        <option value="7">Grade 7</option>
                        <option value="8">Grade 8</option>
                        <option value="9">Grade 9</option>
                        <option value="10">Grade 10</option>
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium" style={{ color: colors.text }}>Sort by</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'name' | 'grade' | 'email')}
                        className="w-full px-3 py-2 rounded-md text-sm border-0"
                        style={{ 
                          backgroundColor: colors.hover, 
                          color: colors.text,
                          borderColor: colors.border
                        }}
                      >
                        <option value="name">Name</option>
                        <option value="email">Email</option>
                        <option value="grade">Grade</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium" style={{ color: colors.text }}>Order</label>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                        className="w-full px-3 py-2 rounded-md text-sm border-0"
                        style={{ 
                          backgroundColor: colors.hover, 
                          color: colors.text,
                          borderColor: colors.border
                        }}
                      >
                        <option value="asc">A-Z</option>
                        <option value="desc">Z-A</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Results Count */}
                  <div className="text-xs sm:text-sm text-center sm:text-right" style={{ color: colors.textSecondary }}>
                    Showing {filteredAndSortedTeachers.length} of {teachers.length} teachers
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
              {/* Left Column: Create Teacher Form */}
              <div className="xl:col-span-2 order-2 xl:order-1">
                <Card style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2" style={{ color: colors.text }}>
                      <UserPlus className="w-5 h-5" />
                      Create New Teacher
                    </CardTitle>
                    <CardDescription style={{ color: colors.textSecondary }}>
                      Add a new teacher account to the system.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateTeacher} className="grid gap-y-6">
                      <div>
                        <Label htmlFor="name" style={{ color: colors.text }}>Full Name</Label>
                        <Input 
                          id="name" 
                          value={newTeacherName} 
                          onChange={e => setNewTeacherName(e.target.value)} 
                          required 
                          disabled={isSubmitting} 
                          className="mt-1 border-0"
                          style={{ 
                            backgroundColor: colors.hover, 
                            color: colors.text, 
                            borderColor: colors.border 
                          }} 
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" style={{ color: colors.text }}>Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={newTeacherEmail} 
                          onChange={e => setNewTeacherEmail(e.target.value)} 
                          required 
                          disabled={isSubmitting} 
                          className="mt-1 border-0"
                          style={{ 
                            backgroundColor: colors.hover, 
                            color: colors.text, 
                            borderColor: colors.border 
                          }} 
                          placeholder="teacher@email.com" 
                        />
                      </div>
                      <div>
                        <Label htmlFor="pin" style={{ color: colors.text }}>PIN</Label>
                        <Input 
                          id="pin" 
                          type="password" 
                          value={newTeacherPin} 
                          onChange={e => setNewTeacherPin(e.target.value)} 
                          required 
                          disabled={isSubmitting} 
                          className="mt-1 border-0"
                          style={{ 
                            backgroundColor: colors.hover, 
                            color: colors.text, 
                            borderColor: colors.border 
                          }} 
                          maxLength={6} 
                          minLength={6} 
                          pattern="[0-9]{6}" 
                          placeholder="6-digit PIN" 
                        />
                      </div>
                      {submitMessage && (
                        <p 
                          className="text-sm" 
                          style={{ 
                            color: submitMessage.includes('successfully') ? colors.success : colors.error 
                          }}
                        >
                          {submitMessage}
                        </p>
                      )}
                      <Button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="w-full justify-center border-0 hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                      >
                        {isSubmitting ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Teacher List */}
              <div className="xl:col-span-3 order-1 xl:order-2">
                <Card style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2" style={{ color: colors.text }}>
                      <Users className="w-5 h-5" />
                      Teacher Accounts ({filteredAndSortedTeachers.length})
                    </CardTitle>
                    <CardDescription style={{ color: colors.textSecondary }}>
                      List of all registered teacher accounts.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 sm:p-6">
                    {/* Mobile View - Card Layout */}
                    <div className="block sm:hidden">
                      {isLoading.teachers ? (
                        <div className="text-center p-6 text-sm" style={{ color: colors.textMuted }}>
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: colors.primary }}></div>
                            Loading teachers...
                          </div>
                        </div>
                      ) : filteredAndSortedTeachers.length > 0 ? (
                        <div className="space-y-3 p-4">
                          {filteredAndSortedTeachers.map((teacher, idx) => (
                            <div key={teacher.id ?? idx} className="p-4 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.border }}>
                              <div className="space-y-3">
                                <div>
                                  <h3 className="font-medium text-sm" style={{ color: colors.text }}>{teacher.name}</h3>
                                  <p className="text-xs" style={{ color: colors.textSecondary }}>{teacher.email}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    className="px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 hover:opacity-80 cursor-pointer"
                                    style={{ 
                                      backgroundColor: colors.primary,
                                      color: '#ffffff'
                                    }}
                                    onClick={() => handleViewStudents(teacher)}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      <Users className="w-3 h-3" />
                                      View
                                    </div>
                                  </button>
                                  
                                  <button
                                    className="px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 hover:opacity-80 cursor-pointer"
                                    style={{ 
                                      backgroundColor: colors.hover,
                                      color: colors.text
                                    }}
                                    onClick={() => handleChangePassword(teacher)}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      <Settings className="w-3 h-3" />
                                      PIN
                                    </div>
                                  </button>
                                  
                                  <button
                                    className="px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 hover:opacity-80 cursor-pointer"
                                    style={{ 
                                      backgroundColor: colors.hover,
                                      color: colors.text
                                    }}
                                    onClick={() => handleEditTeacher(teacher)}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      <Settings className="w-3 h-3" />
                                      Edit
                                    </div>
                                  </button>
                                  
                                  <button
                                    className="px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 hover:opacity-80 cursor-pointer"
                                    style={{ 
                                      backgroundColor: colors.error,
                                      color: '#ffffff'
                                    }}
                                    onClick={() => setDeleteDialog({ open: true, teacher })}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      Delete
                                    </div>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-6 text-sm" style={{ color: colors.textMuted }}>
                          No teacher accounts found.
                        </div>
                      )}
                    </div>

                    {/* Desktop View - Table Layout */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="min-w-full divide-y" style={{ borderColor: colors.border }}>
                        <thead style={{ backgroundColor: colors.headerBackground }}>
                          <tr>
                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>Name</th>
                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>Email</th>
                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                          {isLoading.teachers ? (
                            <tr>
                              <td colSpan={3} className="text-center p-6 text-sm" style={{ color: colors.textMuted }}>
                                <div className="flex items-center justify-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: colors.primary }}></div>
                                  Loading teachers...
                                </div>
                              </td>
                            </tr>
                          ) : filteredAndSortedTeachers.length > 0 ? (
                            filteredAndSortedTeachers.map((teacher, idx) => (
                              <tr key={teacher.id ?? idx} className="hover:opacity-80 transition-opacity" style={{ backgroundColor: colors.cardBackground }}>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: colors.text }}>{teacher.name}</td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm" style={{ color: colors.textSecondary }}>{teacher.email}</td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                    <button
                                      className="px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 hover:opacity-80 cursor-pointer"
                                      style={{ 
                                        backgroundColor: colors.primary,
                                        color: '#ffffff'
                                      }}
                                      onClick={() => handleViewStudents(teacher)}
                                    >
                                      <div className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        <span className="hidden sm:inline">View</span>
                                      </div>
                                    </button>
                                    
                                    <button
                                      className="px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 hover:opacity-80 cursor-pointer"
                                      style={{ 
                                        backgroundColor: colors.hover,
                                        color: colors.text
                                      }}
                                      onClick={() => handleChangePassword(teacher)}
                                    >
                                      <div className="flex items-center gap-1">
                                        <Settings className="w-3 h-3" />
                                        <span className="hidden sm:inline">PIN</span>
                                      </div>
                                    </button>
                                    
                                    <button
                                      className="px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 hover:opacity-80 cursor-pointer"
                                      style={{ 
                                        backgroundColor: colors.hover,
                                        color: colors.text
                                      }}
                                      onClick={() => handleEditTeacher(teacher)}
                                    >
                                      <div className="flex items-center gap-1">
                                        <Settings className="w-3 h-3" />
                                        <span className="hidden sm:inline">Edit</span>
                                      </div>
                                    </button>
                                    
                                    <button
                                      className="px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 hover:opacity-80 cursor-pointer"
                                      style={{ 
                                        backgroundColor: colors.error,
                                        color: '#ffffff'
                                      }}
                                      onClick={() => setDeleteDialog({ open: true, teacher })}
                                    >
                                      <div className="flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span className="hidden sm:inline">Delete</span>
                                      </div>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="text-center p-6 text-sm" style={{ color: colors.textMuted }}>
                                No teacher accounts found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {currentTab === 'history' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Card style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                      <History className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold" style={{ color: colors.text }}>{logs.length}</p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>Total Activities</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.error }}>
                      <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold" style={{ color: colors.text }}>
                        {logs.filter(log => log.action.includes('Absent')).length}
                      </p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>Absence Records</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.success }}>
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold" style={{ color: colors.text }}>
                        {new Set(logs.map(log => log.userId).filter(Boolean)).size}
                      </p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>Active Teachers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: colors.text }}>
                  <History className="w-5 h-5" />
                  Teacher Activity Logs
                </CardTitle>
                <CardDescription style={{ color: colors.textSecondary }}>
                  Monitor all teacher actions and attendance activities across the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading.logs ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: colors.primary }}></div>
                    <span className="ml-2" style={{ color: colors.textMuted }}>Loading logs...</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {logs.map((log, index) => (
                      <div
                        key={log.id || index}
                        className="flex items-start gap-3 p-3 rounded-lg border"
                        style={{ 
                          backgroundColor: colors.background, 
                          borderColor: colors.border 
                        }}
                      >
                        <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.primary }}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: colors.text }}>
                            {log.action}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs" style={{ color: colors.textMuted }}>
                              {new Date(log.createdAt).toLocaleString()}
                            </p>
                            <span className="text-xs px-2 py-1 rounded-full" style={{ 
                              backgroundColor: log.teacherRole === 'ADMIN' ? colors.primary : colors.hover,
                              color: log.teacherRole === 'ADMIN' ? '#ffffff' : colors.text
                            }}>
                              {log.teacherName || 'Unknown'}
                            </span>
                            {log.teacherRole && (
                              <span className="text-xs px-2 py-1 rounded-full" style={{ 
                                backgroundColor: colors.border,
                                color: colors.textSecondary
                              }}>
                                {log.teacherRole}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <div className="text-center py-8" style={{ color: colors.textMuted }}>
                        No activity logs found
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {currentTab === 'analytics' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <Card style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: colors.text }}>
                        {stats?.totalStudents || 0}
                      </p>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Total Students</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.error }}>
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: colors.text }}>
                        {stats?.totalAbsences || 0}
                      </p>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Total Absences</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.warning }}>
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: colors.text }}>
                        {stats?.todayAbsences || 0}
                      </p>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Today's Absences</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.success }}>
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: colors.text }}>
                        {teachers.length}
                      </p>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Active Teachers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Students by Grade */}
            <Card style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: colors.text }}>
                  <BarChart3 className="w-5 h-5" />
                  Students by Grade
                </CardTitle>
                <CardDescription style={{ color: colors.textSecondary }}>
                  Distribution of students across different grades
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading.stats ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: colors.primary }}></div>
                    <span className="ml-2" style={{ color: colors.textMuted }}>Loading statistics...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats?.studentsByGrade && Object.entries(stats.studentsByGrade).map(([grade, count]) => (
                      <div key={grade} className="flex items-center justify-between">
                        <span className="text-sm font-medium" style={{ color: colors.text }}>
                          Grade {grade}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full" 
                              style={{ 
                                backgroundColor: colors.primary,
                                width: `${(count as number / stats.totalStudents) * 100}%`
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                            {count as number}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {currentTab === 'settings' && (
          <div className="space-y-6">
            <Card style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: colors.text }}>
                  <Settings className="w-5 h-5" />
                  System Settings
                </CardTitle>
                <CardDescription style={{ color: colors.textSecondary }}>
                  Configure attendance tracking settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3" style={{ color: colors.text }}>Attendance Policies</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: colors.textSecondary }}>Auto-mark absent after 15 minutes</span>
                        <input type="checkbox" className="rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: colors.textSecondary }}>Send absence notifications</span>
                        <input type="checkbox" className="rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: colors.textSecondary }}>Require absence notes</span>
                        <input type="checkbox" className="rounded" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-3" style={{ color: colors.text }}>System Information</h4>
                    <div className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
                      <p>Version: 1.0.0</p>
                      <p>Database: PostgreSQL</p>
                      <p>Last Backup: {new Date().toLocaleDateString()}</p>
                      <p>Total Records: {logs.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
                  <Button 
                    className="border-0 hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export System Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <TeacherStudentsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        teacher={selectedTeacher}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        teacher={selectedTeacherForPassword}
      />

      <EditTeacherModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        teacher={selectedTeacherForEdit}
        onSave={handleEditTeacherSave}
      />

      {/* Delete Confirmation Dialog */}
      {deleteDialog.open && deleteDialog.teacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div 
            className="p-4 sm:p-6 rounded-lg shadow-lg max-w-sm w-full border"
            style={{ 
              backgroundColor: colors.cardBackground, 
              borderColor: colors.border 
            }}
          >
            <h2 className="text-lg font-semibold mb-2" style={{ color: colors.text }}>Delete Teacher</h2>
            <p className="mb-4 text-sm sm:text-base" style={{ color: colors.textSecondary }}>
              Are you sure you want to <b>delete</b> <b>{deleteDialog.teacher.name}</b>? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button
                className="border-0 hover:opacity-80 transition-opacity w-full sm:w-auto"
                style={{ 
                  backgroundColor: colors.lightButton, 
                  color: colors.text,
                  borderColor: colors.border
                }}
                onClick={() => setDeleteDialog({ open: false, teacher: null })}
              >
                Cancel
              </Button>
              <Button
                className="border-0 hover:opacity-80 transition-opacity w-full sm:w-auto"
                style={{ backgroundColor: colors.error, color: '#ffffff' }}
                onClick={() => {
                  if (deleteDialog.teacher) {
                    handleDeleteTeacher(deleteDialog.teacher);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
