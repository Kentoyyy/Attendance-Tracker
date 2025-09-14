"use client";

import React, { useState } from 'react';
import ResponsiveStudentTable from '../ResponsiveStudentTable';
import ImportStudentsPage from './ImportStudentsPage';
import ExportPage from './ExportPage';
import ActionLogsPage from './ActionLogsPage';
import { Student, AttendanceRecord } from '../../types';
import { useTheme, getThemeColors } from '../../context/ThemeProvider';
import { Archive } from 'lucide-react';

interface MainContentProps {
  students: Student[];
  isLoading: boolean;
  currentMonth: Date;
  setCurrentMonth: (month: Date) => void;
  onAttendanceUpdate: () => void;
  selectedGrade: string;
  setSelectedGrade: (grade: string) => void;
  todaysAbsences: AttendanceRecord[];
  absentMaleCount: number;
  absentFemaleCount: number;
  onImportComplete: () => void;
  currentPage: 'dashboard' | 'import' | 'export' | 'logs' | 'archive';
}

type PageType = 'dashboard' | 'import' | 'export' | 'logs' | 'archive';

export default function MainContent({
  students,
  isLoading,
  currentMonth,
  setCurrentMonth,
  onAttendanceUpdate,
  selectedGrade,
  setSelectedGrade,
  todaysAbsences,
  absentMaleCount,
  absentFemaleCount,
  onImportComplete,
  currentPage
}: MainContentProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <>
            <div className="mb-6">
              <div className="rounded-lg border p-4" style={{ 
                backgroundColor: isDark ? '#2d1b1b' : '#fef2f2', 
                borderColor: isDark ? '#7f1d1d' : '#fecaca' 
              }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center" style={{ color: isDark ? '#fca5a5' : '#dc2626' }}>
                      <span className="text-sm sm:text-base font-semibold">Today's Absences</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold mt-1" style={{ color: isDark ? '#f87171' : '#b91c1c' }}>
                      {isLoading ? '...' : todaysAbsences.length}
                    </div>
                  </div>
                  {!isLoading && (
                    <div className="text-left sm:text-right text-xs sm:text-sm" style={{ color: isDark ? '#fca5a5' : '#dc2626' }}>
                      <div>Male: <strong>{absentMaleCount}</strong></div>
                      <div>Female: <strong>{absentFemaleCount}</strong></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
              <div className="px-4 lg:px-6 py-4 border-b" style={{ borderColor: colors.border }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold" style={{ color: colors.text }}>Attendance Calendar</h3>
                    <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                      Click any date to mark absence. Future dates can be marked in advance.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                      className="p-2 rounded-md transition-colors"
                      style={{ backgroundColor: colors.hover, color: colors.text }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverSecondary}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.hover}
                    >
                      ←
                    </button>
                    <span className="text-sm font-medium min-w-[120px] text-center" style={{ color: colors.text }}>
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button 
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                      className="p-2 rounded-md transition-colors"
                      style={{ backgroundColor: colors.hover, color: colors.text }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverSecondary}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.hover}
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
              
              <ResponsiveStudentTable 
                students={students} 
                isLoading={isLoading} 
                currentMonth={currentMonth} 
                onAttendanceUpdate={onAttendanceUpdate}
                selectedGrade={selectedGrade}
                setSelectedGrade={setSelectedGrade}
              />
            </div>
          </>
        );
      
      case 'import':
        return <ImportStudentsPage onImportComplete={onImportComplete} />;
      
      case 'export':
        return <ExportPage students={students} selectedGrade={selectedGrade} />;
      
      case 'logs':
        return <ActionLogsPage />;
      
      case 'archive':
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                <Archive className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold" style={{ color: colors.text }}>Archive View</h2>
              <p className="text-lg" style={{ color: colors.textSecondary }}>
                Still in development
              </p>
              <p className="text-sm max-w-md" style={{ color: colors.textMuted }}>
                This feature will allow you to view and manage archived students. 
                Coming soon!
              </p>
            </div>
            
            <div className="flex items-center space-x-2 text-sm" style={{ color: colors.textMuted }}>
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
              <span>Development in progress</span>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div>
      {renderPage()}
    </div>
  );
}

// Export the setCurrentPage function type for use in parent component
export type { PageType };
export { MainContent };
