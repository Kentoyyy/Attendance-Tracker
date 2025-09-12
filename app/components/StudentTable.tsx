"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Student, AttendanceRecord } from '../types';
import { getDaysInMonth, format, startOfMonth, getDate, isToday, getDay } from 'date-fns';
import { WarningNote } from './WarningNote';
import { AbsenceNotesModal } from './AbsenceNotesModal';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface StudentTableProps {
  students: Student[];
  isLoading: boolean;
  currentMonth: Date;
  onAttendanceUpdate?: () => void;
  showArchived: boolean;
  setShowArchived: (v: boolean) => void;
}

const getMonthDates = (month: Date) => {
  const dayCount = getDaysInMonth(month);
  const monthStart = startOfMonth(month);
  return Array.from({ length: dayCount }, (_, i) => new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1));
};

export default function StudentTable({ students, isLoading, currentMonth, onAttendanceUpdate, showArchived, setShowArchived }: StudentTableProps) {
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord[]>>({});
  const [hoveredStudent, setHoveredStudent] = useState<Student | null>(null);
  const [hoveredAbsences, setHoveredAbsences] = useState<AttendanceRecord[]>([]);
  const [hoveredAbsenceInfo, setHoveredAbsenceInfo] = useState<{ reason: string; top: number; left: number } | null>(null);
  const [hoveredWarningInfo, setHoveredWarningInfo] = useState<{ count: number; top: number; left: number; width: number; } | null>(null);
  
  const [isNoteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedStudentForNote, setSelectedStudentForNote] = useState<Student | null>(null);
  const [selectedRecordForNote, setSelectedRecordForNote] = useState<AttendanceRecord | null>(null);

  const dates = getMonthDates(currentMonth);

  // Set of dates (yyyy-MM-dd) where any student is absent, for header highlighting
  const absentDatesSet = useMemo(() => {
    const set = new Set<string>();
    Object.values(attendance).forEach((records) => {
      (records || []).forEach((r) => {
        const isAbsent = (r as any).isAbsent === true || (r as any).status === 'ABSENT';
        if (!isAbsent) return;
        const ds = format(new Date((r as any).date), 'yyyy-MM-dd');
        if (ds) set.add(ds);
      });
    });
    return set;
  }, [attendance]);

  // Pagination state
  const [page, setPage] = useState(1);
  const studentsPerPage = 8;

  // Selection state for archiving
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Move paginatedStudents declaration above this block to avoid use-before-declaration
  // allSelected now checks if all paginatedStudents are selected
  let allSelected = false;
  // paginatedStudents will be defined later, so we use a function to check after its declaration
  const getStudentId = (s: any) => String((s as any).id ?? (s as any)._id);
  const isAllSelected = (students: Student[]) =>
    students.length > 0 && students.every(s => selectedIds.includes(getStudentId(s)));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(ids => ids.filter(id => !paginatedStudents.some(s => getStudentId(s) === id)));
    } else {
      setSelectedIds(ids => Array.from(new Set([...ids, ...paginatedStudents.map(s => getStudentId(s))])));
    }
  };
  const toggleSelect = (id: string) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };
  const handleArchiveSelected = async () => {
    for (const id of selectedIds) {
      await fetch(`/api/students?id=${id}`, { method: 'PATCH' });
    }
    setSelectedIds([]);
    onAttendanceUpdate?.();
  };
  const handleRestoreSelected = async () => {
    for (const id of selectedIds) {
      await fetch(`/api/students?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: false }) });
    }
    setSelectedIds([]);
    onAttendanceUpdate?.();
  };

  // Robust filter: treat missing 'archived' as false (active)
  let filteredStudents = students.filter(s =>
    showArchived ? (s as any).archived === true : (s as any).archived !== true
  );
  // Sort: males first, then females
  filteredStudents = filteredStudents.sort((a, b) => {
    if (a.gender === b.gender) return 0;
    if (a.gender === 'Male') return -1;
    return 1;
  });
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const paginatedStudents = filteredStudents.slice((page - 1) * studentsPerPage, page * studentsPerPage);

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
      setAttendance({}); // Clear attendance if students list is empty
    }
  }, [students, currentMonth]);

  useEffect(() => {
    // Reset to first page if students list changes
    setPage(1);
    setSelectedIds([]);
  }, [students, showArchived]);

  const handleDayClick = (student: Student, date: Date, isCurrentlyAbsent: boolean) => {
    const dateStr = format(date, 'yyyy-MM-dd');

    if (isCurrentlyAbsent) {
      // If student is absent, open the modal to edit the note.
      const record = attendance[getStudentId(student)]?.find(r => format(new Date(r.date), 'yyyy-MM-dd') === dateStr);
      if (record) {
        setSelectedStudentForNote(student);
        setSelectedRecordForNote(record);
        setNoteModalOpen(true);
      }
    } else {
      // If student is present, open the modal to mark them as absent with a potential reason.
      const newRecordTemplate = { _id: `new-${Date.now()}`, studentId: getStudentId(student), date: dateStr, isAbsent: true, reason: '' };
      setSelectedStudentForNote(student);
      setSelectedRecordForNote(newRecordTemplate);
      setNoteModalOpen(true);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student and all their records? This cannot be undone.')) {
      try {
        const res = await fetch(`/api/students/${studentId}`, { method: 'DELETE' });
        if (res.ok) {
          onAttendanceUpdate?.();
        }
      } catch (error) {
        console.error('Error deleting student', error);
      }
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

  const handleStudentHover = (student: Student) => {
    setHoveredStudent(student);
    const studentAbsences = attendance[getStudentId(student)]?.filter(r => r.isAbsent) || [];
    setHoveredAbsences(studentAbsences);
  };

  const handleStudentLeave = () => {
    setHoveredStudent(null);
    setHoveredAbsences([]);
  };

  const handleAbsenceHover = (e: React.MouseEvent, record: AttendanceRecord | undefined) => {
    if (record?.isAbsent && record.reason) {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredAbsenceInfo({
        reason: record.reason,
        top: rect.bottom,
        left: rect.left,
      });
    }
  };

  const handleAbsenceLeave = () => {
    setHoveredAbsenceInfo(null);
  };

  const handleAbsenceCountHover = (e: React.MouseEvent, count: number) => {
    if (count >= 3) {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredWarningInfo({
        count: count,
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  const handleAbsenceCountLeave = () => {
    setHoveredWarningInfo(null);
  };

  // Handler for Import Students
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
        onAttendanceUpdate?.();
      } else {
        const error = await res.json();
        alert('Import failed: ' + (error.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Import failed: ' + err);
    }
    e.target.value = '';
  };

  // Handler for Export Absences
  const handleExportClick = async () => {
    // TODO: Fetch absence data from backend
    const res = await fetch('/api/attendance/export');
    const absences: any[] = await res.json();
    // Example: generate Excel file
    const worksheet = XLSX.utils.json_to_sheet(absences);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Absences');
    XLSX.writeFile(workbook, 'absences.xlsx');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading students...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <h3 className="text-lg font-medium text-gray-900">No Students Found</h3>
        <p className="text-sm text-gray-500 mt-1">
          Add a new student to this grade to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <div className="mb-2 text-sm text-gray-500 font-medium">
        Viewing: {showArchived ? 'Archived Students' : 'Active Students'}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
              </th>
              <th scope="col" className="sticky left-0 bg-gray-50 px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider z-10">
                Name
              </th>
              {dates.map(date => {
                const isCurrentDay = isToday(date);
                const dateStrHead = format(date, 'yyyy-MM-dd');
                const isAnyAbsent = absentDatesSet.has(dateStrHead);
                return (
                  <th key={date.toString()} scope="col" className={`px-2 py-3 text-center text-xs font-medium uppercase tracking-wider ${isCurrentDay ? 'bg-blue-100 text-blue-800' : isAnyAbsent ? 'bg-red-50 text-red-700' : 'text-gray-500'}`}>
                    <div className={`font-normal ${isCurrentDay ? 'text-blue-600' : isAnyAbsent ? 'text-red-700' : 'text-gray-400'}`}>{format(date, 'eee')}</div>
                    <div className={`mt-1 font-semibold ${isCurrentDay ? 'bg-blue-600 text-white rounded-full h-6 w-6 flex items-center justify-center mx-auto' : isAnyAbsent ? 'bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center mx-auto' : ''}`}>{getDate(date)}</div>
                  </th>
                );
              })}
              <th scope="col" className="sticky right-0 bg-gray-50 px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200">
                Absences
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedStudents.map(student => {
              const sid = getStudentId(student);
              const studentAttendance = attendance[sid] || [];
              const absentCount = studentAttendance.filter(r => r.isAbsent).length;
              
              return (
                <tr key={sid}>
                  <td className="px-2 py-4">
                    <input type="checkbox" checked={selectedIds.includes(sid)} onChange={() => toggleSelect(sid)} />
                  </td>
                  <td className="sticky left-0 bg-white px-3 sm:px-6 py-4 whitespace-nowrap z-10">
                    <div className="flex items-center">
                      <div className="font-medium text-gray-900 text-sm sm:text-base">{student.name ?? `${student.firstName ?? ''}${student.lastName ? ' ' + student.lastName : ''}`}</div>
                      {absentCount > 0 && (
                        <span className="ml-2 text-xs text-red-600">({absentCount})</span>
                      )}
                      {student.gender && (
                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${student.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                          {student.gender}
                        </span>
                      )}
                    </div>
                  </td>
                  {dates.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const record = studentAttendance.find(r => format(new Date((r as any).date), 'yyyy-MM-dd') === dateStr);
                    const isAbsent = (record as any)?.isAbsent === true || (record as any)?.status === 'ABSENT';
                    const isCurrentDay = isToday(date);

                    return (
                      <td key={dateStr} className={`px-2 py-2 whitespace-nowrap text-center ${isCurrentDay ? 'bg-blue-50' : ''}`}>
                        <button
                          onClick={() => handleDayClick(student, date, isAbsent)}
                          onMouseEnter={(e) => isAbsent && handleAbsenceHover(e, record)}
                          onMouseLeave={handleAbsenceLeave}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors duration-200
                            ${isAbsent 
                              ? 'bg-red-100 text-red-800 font-bold hover:bg-red-200 hover:ring-2 hover:ring-red-300' 
                              : 'text-gray-500 hover:bg-gray-100 hover:ring-2 hover:ring-gray-300'
                            }`
                          }
                          title={isAbsent ? (record?.reason ? `Absent: ${record.reason}` : 'Absent') : 'Mark absent'}
                          aria-label={`Mark day ${getDate(date)} for ${student.name}`}
                        >
                          {getDate(date)}
                        </button>
                      </td>
                    );
                  })}
                  <td className="sticky right-0 bg-white px-3 sm:px-6 py-4 whitespace-nowrap text-center border-l border-gray-200">
                    <div 
                      className="relative font-semibold text-lg text-gray-800 inline-block cursor-pointer"
                      onMouseEnter={(e) => handleAbsenceCountHover(e, absentCount)}
                      onMouseLeave={handleAbsenceCountLeave}
                    >
                      {absentCount}
                      {absentCount >= 3 && (
                        <span className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-white ${
                          absentCount >= 10 ? 'bg-red-500' : absentCount >= 5 ? 'bg-orange-400' : 'bg-yellow-400'
                        }`}>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Hover Tooltip for Absence Details */}
      {hoveredStudent && hoveredAbsences.length > 0 && (
        <div className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
          <h4 className="font-semibold text-gray-900 mb-2">{hoveredStudent.name}'s Absences</h4>
          <div className="space-y-1">
            {hoveredAbsences.map((absence, index) => (
              <div key={index} className="text-sm text-gray-600">
                <span className="font-medium">{format(new Date(absence.date), 'MMM dd, yyyy')}</span>
                {absence.reason && (
                  <span className="text-gray-500 ml-2">- {absence.reason}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {hoveredAbsenceInfo && (
        <div
          className="fixed z-50 rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white shadow-lg"
          style={{ top: hoveredAbsenceInfo.top + 8, left: hoveredAbsenceInfo.left }}
        >
          {hoveredAbsenceInfo.reason}
        </div>
      )}

      {hoveredWarningInfo && (
        <div
          className="fixed z-50"
          style={{ 
            top: hoveredWarningInfo.top + 8, 
            left: hoveredWarningInfo.left + hoveredWarningInfo.width / 2,
            transform: 'translateX(-50%)'
          }}
        >
          <WarningNote absentCount={hoveredWarningInfo.count} />
        </div>
      )}

      <AbsenceNotesModal 
        isOpen={isNoteModalOpen}
        onOpenChange={setNoteModalOpen}
        student={selectedStudentForNote}
        record={selectedRecordForNote}
        onNoteSave={handleNoteSaved}
      />

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
         {showArchived ? (
           <Button
             variant="outline"
             size="sm"
             className="bg-white text-black border border-gray-200 hover:bg-gray-100"
             onClick={handleRestoreSelected}
             disabled={selectedIds.length === 0}
           >
             Restore Selected
           </Button>
         ) : (
           <Button
             variant="outline"
             size="sm"
             className="bg-white text-black border border-gray-200 hover:bg-gray-100"
             onClick={handleArchiveSelected}
             disabled={selectedIds.length === 0}
           >
             Archive Selected
           </Button>
         )}
        <div className="flex justify-center items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="bg-white text-black border border-gray-200 hover:bg-gray-100"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            className="bg-white text-black border border-gray-200 hover:bg-gray-100"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
} 