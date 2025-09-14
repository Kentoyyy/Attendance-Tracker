"use client";

import React, { useState } from 'react';
import { Button } from "@/app/components/ui/button";
import { Download, FileSpreadsheet, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useTheme, getThemeColors } from '../../context/ThemeProvider';

interface ExportPageProps {
  students: any[];
  selectedGrade: string;
}

export default function ExportPage({ students, selectedGrade }: ExportPageProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'attendance' | 'students'>('attendance');
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const handleExportClick = async () => {
    setIsExporting(true);

    try {
      let data: any[] = [];
      let filename = '';

      if (exportType === 'students') {
        // Export student list
        data = students.map(student => ({
          'First Name': student.firstName || '',
          'Last Name': student.lastName || '',
          'Full Name': student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          'Sex': student.sex || '',
          'Grade': student.grade || '',
          'LRN': student.lrn || '',
          'Status': student.isActive ? 'Active' : 'Archived'
        }));
        filename = `students_grade_${selectedGrade}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      } else {
        // Export attendance data
        data = students.map(student => ({
          'Student Name': student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          'Grade': student.grade || '',
          'Sex': student.sex || '',
          'Total Absences': student.attendance?.filter((a: any) => a.isAbsent).length || 0,
          'Status': student.isActive ? 'Active' : 'Archived'
        }));
        filename = `attendance_report_grade_${selectedGrade}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      }

      // Create workbook and download
      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2" style={{ color: colors.text }}>Export Data</h2>
        <p style={{ color: colors.textSecondary }}>Export student data and attendance reports to Excel files.</p>
      </div>

      {/* Export Type Selection */}
      <div className="rounded-lg border p-6" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>Select Export Type</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setExportType('students')}
            className="p-4 rounded-lg border-2 transition-all duration-200"
            style={{
              borderColor: exportType === 'students' ? colors.primary : colors.border,
              backgroundColor: exportType === 'students' ? 'rgba(0, 98, 57, 0.1)' : colors.hover
            }}
            className={`cursor-pointer transition-all duration-200 ${
              exportType !== 'students' ? 'hover:opacity-80' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6" style={{ color: exportType === 'students' ? colors.primary : colors.textSecondary }} />
              <div className="text-left">
                <h4 className="font-semibold" style={{ color: colors.text }}>Student List</h4>
                <p className="text-sm" style={{ color: colors.textSecondary }}>Export student information</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setExportType('attendance')}
            className="p-4 rounded-lg border-2 transition-all duration-200"
            style={{
              borderColor: exportType === 'attendance' ? colors.primary : colors.border,
              backgroundColor: exportType === 'attendance' ? 'rgba(0, 98, 57, 0.1)' : colors.hover
            }}
            className={`cursor-pointer transition-all duration-200 ${
              exportType !== 'attendance' ? 'hover:opacity-80' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6" style={{ color: exportType === 'attendance' ? colors.primary : colors.textSecondary }} />
              <div className="text-left">
                <h4 className="font-semibold" style={{ color: colors.text }}>Attendance Report</h4>
                <p className="text-sm" style={{ color: colors.textSecondary }}>Export attendance summary</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Export Preview */}
      <div className="rounded-lg p-6 border" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
        <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text }}>Export Preview</h3>
        <div className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
          <p><strong>Grade:</strong> {selectedGrade}</p>
          <p><strong>Students:</strong> {students.length}</p>
          <p><strong>Type:</strong> {exportType === 'students' ? 'Student List' : 'Attendance Report'}</p>
          <p><strong>Format:</strong> Excel (.xlsx)</p>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleExportClick}
          disabled={isExporting || students.length === 0}
          className="px-8 py-3 border-0"
          className="border-0 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: colors.primary, color: colors.text }}
        >
          {isExporting ? (
            <>
              <Download className="w-5 h-5 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-5 h-5 mr-2" />
              Export to Excel
            </>
          )}
        </Button>
      </div>

      {students.length === 0 && (
        <div className="text-center py-8" style={{ color: colors.textSecondary }}>
          <Users className="w-12 h-12 mx-auto mb-2" style={{ color: colors.textMuted }} />
          <p>No students found for Grade {selectedGrade}</p>
        </div>
      )}
    </div>
  );
}
