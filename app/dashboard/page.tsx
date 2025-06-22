"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import StudentTable from '../components/StudentTable';
import GradeSelector from '../components/GradeSelector';
import AddStudentModal from '../components/AddStudentModal';
import { Button } from '../components/ui/button';
import { Plus, ChevronLeft, ChevronRight, FileText, UserX } from 'lucide-react';
import Link from 'next/link';
import Clock from '../components/Clock';
import { Student, AttendanceRecord } from '../types';
import { format } from 'date-fns';

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

  // Update document title when grade changes
  useEffect(() => {
    document.title = `Grade ${selectedGrade} - Teacher's Dashboard`;
  }, [selectedGrade]);

  const fetchData = async () => {
    if (status !== 'authenticated') return;
    setIsLoading(true);
    try {
      const studentsRes = await fetch(`/api/students?grade=${selectedGrade}`);
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
        
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Teacher's Dashboard</h1>
            <p className="text-gray-500">Welcome, {session.user?.name}! Manage attendance for Grade {selectedGrade}.</p>
          </div>
          <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-2">
            <Clock />
            
            <Link href="/dashboard/logs" passHref>
              <Button variant="outline" className='cursor-pointer bg-white text-black hover:bg-gray-100'>
                <FileText className="mr-2 h-4 w-4" />
                Action Logs
              </Button>
            </Link>
            <GradeSelector selectedGrade={selectedGrade} onGradeChange={setSelectedGrade} />
            <Button onClick={() => setIsModalOpen(true)} className="hover:bg-gray-100 cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
            <Button onClick={() => signOut({ callbackUrl: '/' })} variant="destructive" className='cursor-pointer'>
              Logout
            </Button>
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