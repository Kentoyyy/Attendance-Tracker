"use client";

import { useState } from 'react';
import StudentTable from '../components/StudentTable';
import GradeSelector from '../components/GradeSelector';
import AddStudentModal from '../components/AddStudentModal';
import OfflineStatus from '../components/OfflineStatus';
import { Button } from '../components/ui/button';
import { Plus, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';
import Clock from '../components/Clock';

export default function Dashboard() {
  const [selectedGrade, setSelectedGrade] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Teacher Mia Attendance System</h1>
            <p className="text-gray-500">Manage your student's attendance - Works offline!</p>
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
          </div>
        </header>

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
          
          <StudentTable grade={selectedGrade} currentMonth={currentMonth} />
        </div>
      </main>

      <AddStudentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} selectedGrade={selectedGrade} />
      <OfflineStatus />
    </div>
  );
} 