"use client";

import React, { useRef, useState } from 'react';
import { Button } from "@/app/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTheme, getThemeColors } from '../../context/ThemeProvider';

interface ImportStudentsPageProps {
  onImportComplete: () => void;
}

export default function ImportStudentsPage({ onImportComplete }: ImportStudentsPageProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const students = XLSX.utils.sheet_to_json(worksheet);

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(students),
      });

      if (res.ok) {
        const result = await res.json();
        setUploadResult({
          success: true,
          message: `Successfully imported ${students.length} students!`,
          count: students.length
        });
        onImportComplete();
      } else {
        const error = await res.json();
        setUploadResult({
          success: false,
          message: error.message || 'Failed to import students'
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Error processing file. Please check the format.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2" style={{ color: colors.text }}>Import Students</h2>
        <p style={{ color: colors.textSecondary }}>Upload an Excel file to import multiple students at once.</p>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed rounded-lg p-8 text-center transition-colors" 
           style={{ 
             borderColor: colors.border, 
             backgroundColor: colors.cardBackground 
           }}
           onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.primary}
           onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.border}>
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: isDark ? colors.primary : colors.lightButton }}>
            <FileSpreadsheet className="w-8 h-8" style={{ color: isDark ? '#ffffff' : colors.text }} />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold" style={{ color: colors.text }}>Upload Excel File</h3>
            <p style={{ color: colors.textSecondary }}>Supported formats: .xlsx, .xls</p>
          </div>

          <Button
            onClick={handleImportClick}
            disabled={isUploading}
            className="border-0 hover:opacity-90 transition-opacity"
            style={{ 
              backgroundColor: isDark ? colors.primary : colors.lightButton,
              color: isDark ? '#ffffff' : colors.text,
              border: isDark ? 'none' : `1px solid ${colors.border}`
            }}
          >
            {isUploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" style={{ color: isDark ? '#ffffff' : colors.text }} />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" style={{ color: isDark ? '#ffffff' : colors.text }} />
                Choose File
              </>
            )}
          </Button>

          <input
            type="file"
            accept=".xlsx,.xls"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className={`p-4 rounded-lg border ${
          uploadResult.success 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {uploadResult.success ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{uploadResult.message}</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="rounded-lg p-6 border" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
        <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text }}>File Format Requirements</h3>
        <div className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
          <p>• Excel file should have the following columns:</p>
          <ul className="ml-4 space-y-1">
            <li>- <strong>firstName</strong> (required)</li>
            <li>- <strong>lastName</strong> (required)</li>
            <li>- <strong>sex</strong> (Male/Female)</li>
            <li>- <strong>grade</strong> (1, 2, or 3)</li>
            <li>- <strong>lrn</strong> (optional)</li>
          </ul>
          <p className="mt-3">• First row should contain column headers</p>
          <p>• Each subsequent row represents one student</p>
        </div>
      </div>
    </div>
  );
}
