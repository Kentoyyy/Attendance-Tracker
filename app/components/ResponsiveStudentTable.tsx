"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Student, AttendanceRecord } from '../types';
import { getDaysInMonth, format, startOfMonth, getDate, isToday } from 'date-fns';
import { WarningNote } from './WarningNote';
import { AbsenceNotesModal } from './AbsenceNotesModal';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, User, Calendar, AlertCircle } from 'lucide-react';
import { useTheme, getThemeColors } from '../context/ThemeProvider';

interface ResponsiveStudentTableProps {
  students: Student[];
  isLoading: boolean;
  currentMonth: Date;
  onAttendanceUpdate?: () => void;
  selectedGrade: string;
  setSelectedGrade: (grade: string) => void;
}

const getMonthDates = (month: Date) => {
  const dayCount = getDaysInMonth(month);
  const monthStart = startOfMonth(month);
  return Array.from({ length: dayCount }, (_, i) => new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1));
};

export default function ResponsiveStudentTable({ 
  students, 
  isLoading, 
  currentMonth, 
  onAttendanceUpdate, 
  selectedGrade, 
  setSelectedGrade 
}: ResponsiveStudentTableProps) {
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord[]>>({});
  const [isNoteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedStudentForNote, setSelectedStudentForNote] = useState<Student | null>(null);
  const [selectedRecordForNote, setSelectedRecordForNote] = useState<AttendanceRecord | null>(null);
  const [currentStudentPage, setCurrentStudentPage] = useState(0);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  
  const dates = getMonthDates(currentMonth);
  const studentsPerPage = 6;
  const studentsPerCardPage = 3;

  const getStudentId = (s: any) => String((s as any).id ?? (s as any)._id);
  
  // Filter students - only show active students
  let filteredStudents = students.filter(s => (s as any).isActive === true);
  
  // Sort: males first, then females
  filteredStudents = filteredStudents.sort((a, b) => {
    if (a.sex === b.sex) return 0;
    if (a.sex === 'Male') return -1;
    return 1;
  });

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const totalCardPages = Math.ceil(filteredStudents.length / studentsPerCardPage);
  const paginatedStudents = filteredStudents.slice(currentStudentPage * studentsPerPage, (currentStudentPage + 1) * studentsPerPage);
  const cardPaginatedStudents = filteredStudents.slice(currentStudentPage * studentsPerCardPage, (currentStudentPage + 1) * studentsPerCardPage);

  const fetchAttendanceForStudents = async (studentList: Student[], month: Date) => {
    const newAttendance: Record<string, AttendanceRecord[]> = {};
    const monthStr = format(month, 'yyyy-MM');
    
    for (const student of studentList) {
      try {
        const sid = getStudentId(student);
        const res = await fetch(`/api/attendance?studentId=${sid}&month=${monthStr}`);
        newAttendance[sid] = res.ok ? await res.json() : [];
      } catch (error) {
        console.error(`Failed to fetch attendance for ${student.name}`, error);
        newAttendance[getStudentId(student)] = [];
      }
    }
    setAttendance(newAttendance);
  };

  useEffect(() => {
    if (students.length > 0) {
      fetchAttendanceForStudents(students, currentMonth);
    } else {
      setAttendance({});
    }
  }, [students, currentMonth]);

  useEffect(() => {
    setCurrentStudentPage(0);
  }, [students]);

  // Auto-detect screen size
  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 1024 ? 'card' : 'table');
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDayClick = (student: Student, date: Date, isCurrentlyAbsent: boolean) => {
    const dateStr = format(date, 'yyyy-MM-dd');

    if (isCurrentlyAbsent) {
      const record = attendance[getStudentId(student)]?.find(r => format(new Date(r.date), 'yyyy-MM-dd') === dateStr);
      if (record) {
        setSelectedStudentForNote(student);
        setSelectedRecordForNote(record);
        setNoteModalOpen(true);
      }
    } else {
      const newRecordTemplate = { _id: `new-${Date.now()}`, studentId: getStudentId(student), date: dateStr, isAbsent: true, reason: '' };
      setSelectedStudentForNote(student);
      setSelectedRecordForNote(newRecordTemplate);
      setNoteModalOpen(true);
    }
  };

  const handleNoteSaved = (updatedRecord: AttendanceRecord) => {
    setAttendance(prev => {
      const studentRecords = prev[updatedRecord.studentId] ? [...prev[updatedRecord.studentId]] : [];
      const recordIndex = studentRecords.findIndex(r => r._id === updatedRecord._id);
      
      if (recordIndex > -1) {
        studentRecords[recordIndex] = updatedRecord;
      } else {
        studentRecords.push(updatedRecord);
      }
      return { ...prev, [updatedRecord.studentId]: studentRecords };
    });
    onAttendanceUpdate?.();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.primary }}></div>
        <p className="ml-3" style={{ color: colors.textSecondary }}>Loading students...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <User className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textMuted }} />
        <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>No Students Found</h3>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Add a new student to this grade to get started.
        </p>
      </div>
    );
  }

  const renderCardView = () => (
    <div className="space-y-4">
      {cardPaginatedStudents.map(student => {
        const sid = getStudentId(student);
        const studentAttendance = attendance[sid] || [];
        const absentCount = studentAttendance.filter(r => r.isAbsent).length;
        
        return (
          <div 
            key={sid}
            className="rounded-lg border p-4"
            style={{ 
              backgroundColor: colors.cardBackground, 
              borderColor: colors.border 
            }}
          >
            {/* Student Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium" style={{ color: colors.text }}>
                    {student.name ?? `${student.firstName ?? ''}${student.lastName ? ' ' + student.lastName : ''}`}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {student.sex && (
                      <span className="text-xs px-2 py-1 rounded-full" style={{
                        backgroundColor: student.sex === 'Male' ? '#dbeafe' : '#fce7f3',
                        color: student.sex === 'Male' ? '#1e40af' : '#be185d'
                      }}>
                        {student.sex}
                      </span>
                    )}
                    {absentCount > 0 && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: colors.error }}>
                        <AlertCircle className="w-3 h-3" />
                        {absentCount} absences
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: colors.error }}>{absentCount}</div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>Absences</div>
              </div>
            </div>

            {/* Simplified Attendance Summary */}
            <div className="space-y-3">
              {/* This Week */}
              <div>
                <h4 className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>This Week</h4>
                <div className="flex gap-2">
                  {dates.slice(0, 7).map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const record = studentAttendance.find(r => format(new Date((r as any).date), 'yyyy-MM-dd') === dateStr);
                    const isAbsent = (record as any)?.isAbsent === true || (record as any)?.status === 'ABSENT';
                    const isCurrentDay = isToday(date);
                    const isFutureDate = date > new Date();

                    return (
                      <button
                        key={dateStr}
                        onClick={() => handleDayClick(student, date, isAbsent)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-200 hover:scale-110 ${
                          isCurrentDay ? 'ring-2 ring-offset-2' : ''
                        }`}
                        style={{
                          backgroundColor: isAbsent 
                            ? colors.error 
                            : isCurrentDay 
                              ? colors.primary 
                              : isFutureDate 
                                ? colors.hoverSecondary 
                                : colors.hover,
                          color: isAbsent || isCurrentDay ? '#ffffff' : colors.text,
                          opacity: isFutureDate && !isAbsent ? 0.7 : 1,
                          border: isFutureDate && !isAbsent ? `1px dashed ${colors.border}` : 'none'
                        }}
                        title={`${format(date, 'MMM dd')} - ${format(date, 'eee')}${isFutureDate ? ' (Future)' : ''}${isAbsent ? ' - Absent' : ' - Click to mark absent'}`}
                      >
                        {getDate(date)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Absence Details */}
              {absentCount > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Absent Days</h4>
                  <div className="flex flex-wrap gap-2">
                    {studentAttendance.filter(r => r.isAbsent).map((record, index) => {
                      const recordDate = new Date(record.date);
                      const isCurrentDay = isToday(recordDate);
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedStudentForNote(student);
                            setSelectedRecordForNote(record);
                            setNoteModalOpen(true);
                          }}
                          className="px-3 py-1 rounded-full text-xs transition-all duration-200 hover:scale-105 flex items-center gap-1"
                          style={{ 
                            backgroundColor: colors.error,
                            color: '#ffffff'
                          }}
                        >
                          {format(recordDate, 'MMM dd')}
                          {record.reason && <span className="ml-1">•</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    const today = new Date();
                    const todayStr = format(today, 'yyyy-MM-dd');
                    const todayRecord = studentAttendance.find(r => format(new Date(r.date), 'yyyy-MM-dd') === todayStr);
                    
                    if (!todayRecord) {
                      const newRecordTemplate = { 
                        _id: `new-${Date.now()}`, 
                        studentId: getStudentId(student), 
                        date: todayStr, 
                        isAbsent: true, 
                        reason: '' 
                      };
                      setSelectedStudentForNote(student);
                      setSelectedRecordForNote(newRecordTemplate);
                      setNoteModalOpen(true);
                    }
                  }}
                  className="px-3 py-1 rounded-md text-xs transition-all duration-200 hover:opacity-80"
                  style={{ 
                    backgroundColor: colors.error,
                    color: '#ffffff'
                  }}
                >
                  Mark Absent Today
                </button>
                
                <button
                  onClick={() => {
                    // Show calendar modal or expand view
                    setViewMode('table');
                  }}
                  className="px-3 py-1 rounded-md text-xs transition-all duration-200 hover:opacity-80"
                  style={{ 
                    backgroundColor: colors.hover,
                    color: colors.text
                  }}
                >
                  View Full Calendar
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTableView = () => (
    <div className="space-y-4">
      {paginatedStudents.map(student => {
        const sid = getStudentId(student);
        const studentAttendance = attendance[sid] || [];
        const absentCount = studentAttendance.filter(r => r.isAbsent).length;
        
        // Get this week's dates
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekDates = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          return date;
        });

        return (
          <div 
            key={sid}
            className="rounded-lg border p-4"
            style={{ 
              backgroundColor: colors.cardBackground, 
              borderColor: colors.border 
            }}
          >
            {/* Student Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium" style={{ color: colors.text }}>
                    {student.name ?? `${student.firstName ?? ''}${student.lastName ? ' ' + student.lastName : ''}`}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {student.sex && (
                      <span className="text-xs px-2 py-1 rounded-full" style={{
                        backgroundColor: student.sex === 'Male' ? '#dbeafe' : '#fce7f3',
                        color: student.sex === 'Male' ? '#1e40af' : '#be185d'
                      }}>
                        {student.sex}
                      </span>
                    )}
                    {absentCount > 0 && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: colors.error }}>
                        <AlertCircle className="w-3 h-3" />
                        {absentCount} absences
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: colors.error }}>{absentCount}</div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>Total Absences</div>
              </div>
            </div>

            {/* This Week's Attendance */}
            <div>
              <h4 className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>This Week</h4>
              <div className="grid grid-cols-7 gap-2">
                {weekDates.map(date => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const record = studentAttendance.find(r => format(new Date((r as any).date), 'yyyy-MM-dd') === dateStr);
                  const isAbsent = (record as any)?.isAbsent === true || (record as any)?.status === 'ABSENT';
                  const isCurrentDay = isToday(date);
                  const isFutureDate = date > new Date();
                  const isPastDate = date < new Date() && !isCurrentDay;

                  return (
                    <div key={dateStr} className="flex flex-col items-center">
                      <div className="text-xs mb-1 w-8 text-center" style={{ color: colors.textMuted }}>
                        {format(date, 'eee')}
                      </div>
                      <button
                        onClick={() => handleDayClick(student, date, isAbsent)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-200 hover:scale-110 ${
                          isCurrentDay ? 'ring-2 ring-offset-2' : ''
                        }`}
                        style={{
                          backgroundColor: isAbsent 
                            ? colors.error 
                            : isCurrentDay 
                              ? colors.primary 
                              : isFutureDate 
                                ? colors.hoverSecondary 
                                : colors.hover,
                          color: isAbsent || isCurrentDay ? '#ffffff' : colors.text,
                          opacity: isFutureDate && !isAbsent ? 0.7 : 1,
                          border: isFutureDate && !isAbsent ? `1px dashed ${colors.border}` : 'none'
                        }}
                        title={`${format(date, 'MMM dd')} - ${format(date, 'eee')}${isFutureDate ? ' (Future)' : ''}${isAbsent ? ' - Absent' : ' - Click to mark absent'}`}
                      >
                        {getDate(date)}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Absence Details */}
            {absentCount > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Absent Days</h4>
                <div className="flex flex-wrap gap-2">
                  {studentAttendance.filter(r => r.isAbsent).map((record, index) => {
                    const recordDate = new Date(record.date);
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedStudentForNote(student);
                          setSelectedRecordForNote(record);
                          setNoteModalOpen(true);
                        }}
                        className="px-3 py-1 rounded-full text-xs transition-all duration-200 hover:scale-105 flex items-center gap-1"
                        style={{ 
                          backgroundColor: colors.error,
                          color: '#ffffff'
                        }}
                      >
                        {format(recordDate, 'MMM dd')}
                        {record.reason && <span className="ml-1">•</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: colors.textSecondary }}>
            {filteredStudents.length} students
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('card')}
            className={`px-3 py-1 rounded-md text-xs transition-colors duration-200 ${
              viewMode === 'card' ? 'text-white' : ''
            }`}
            style={{ 
              backgroundColor: viewMode === 'card' ? colors.primary : colors.hover,
              color: viewMode === 'card' ? '#ffffff' : colors.text
            }}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-md text-xs transition-colors duration-200 ${
              viewMode === 'table' ? 'text-white' : ''
            }`}
            style={{ 
              backgroundColor: viewMode === 'table' ? colors.primary : colors.hover,
              color: viewMode === 'table' ? '#ffffff' : colors.text
            }}
          >
            Table
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'card' ? renderCardView() : renderTableView()}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm" style={{ color: colors.textSecondary }}>
          Showing {currentStudentPage * (viewMode === 'card' ? studentsPerCardPage : studentsPerPage) + 1} to{' '}
          {Math.min((currentStudentPage + 1) * (viewMode === 'card' ? studentsPerCardPage : studentsPerPage), filteredStudents.length)} of{' '}
          {filteredStudents.length} students
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStudentPage(Math.max(0, currentStudentPage - 1))}
            disabled={currentStudentPage === 0}
            className="hover:opacity-80 transition-opacity"
            style={{ 
              backgroundColor: colors.lightButton,
              color: colors.text,
              borderColor: colors.border
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="text-sm px-2" style={{ color: colors.textSecondary }}>
            {currentStudentPage + 1} of {viewMode === 'card' ? totalCardPages : totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStudentPage(Math.min(
              (viewMode === 'card' ? totalCardPages : totalPages) - 1, 
              currentStudentPage + 1
            ))}
            disabled={currentStudentPage >= (viewMode === 'card' ? totalCardPages : totalPages) - 1}
            className="hover:opacity-80 transition-opacity"
            style={{ 
              backgroundColor: colors.lightButton,
              color: colors.text,
              borderColor: colors.border
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AbsenceNotesModal 
        isOpen={isNoteModalOpen}
        onOpenChange={setNoteModalOpen}
        student={selectedStudentForNote}
        record={selectedRecordForNote}
        onNoteSave={handleNoteSaved}
      />
    </div>
  );
}
