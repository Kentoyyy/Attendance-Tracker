"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/app/components/ui/button";
import { 
  X, 
  UserPlus, 
  Upload, 
  Download, 
  RotateCcw, 
  FileText, 
  Users, 
  Archive,
  Menu,
  Home,
  BookOpen,
  Settings,
  LogOut
} from 'lucide-react';
import Link from 'next/link';

interface StudentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  showArchived: boolean;
  setShowArchived: (show: boolean) => void;
  selectedGrade: number;
  setSelectedGrade: (grade: number) => void;
  onAddStudent: () => void;
  onImportClick: () => void;
  onExportClick: () => void;
  onResetStudents: () => void;
}

export default function StudentSidebar({
  isOpen,
  onClose,
  showArchived,
  setShowArchived,
  selectedGrade,
  setSelectedGrade,
  onAddStudent,
  onImportClick,
  onExportClick,
  onResetStudents
}: StudentSidebarProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 200); // Match animation duration
  };

  const handleMenuClick = (action: () => void) => {
    action();
    handleClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-200 ${
            isAnimating ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handleClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-white">Student Manager</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="rounded-full hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Menu Items */}
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <div className="p-4 space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Navigation
            </div>
            
            {/* Grade Selection */}
            <div className="mb-4">
              <div className="text-xs font-medium text-gray-600 mb-2">Current Grade</div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(grade => (
                  <button
                    key={grade}
                    onClick={() => handleMenuClick(() => setSelectedGrade(grade))}
                    className={`p-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      selectedGrade === grade
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Grade {grade}
                  </button>
                ))}
              </div>
            </div>

            {/* Student View Tabs */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600 mb-2">Student View</div>
              <button
                onClick={() => handleMenuClick(() => setShowArchived(false))}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                  !showArchived 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="font-medium text-sm">Active Students</span>
                {!showArchived && (
                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>

              <button
                onClick={() => handleMenuClick(() => setShowArchived(true))}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                  showArchived 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Archive className="w-4 h-4" />
                <span className="font-medium text-sm">Archived Students</span>
                {showArchived && (
                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex-1 p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Actions
            </div>
            <div className="space-y-2">
              <button
                onClick={() => handleMenuClick(onAddStudent)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200 group"
              >
                <div className="p-1.5 bg-green-100 rounded-md group-hover:bg-green-200 transition-colors">
                  <UserPlus className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-medium text-sm">Add Student</span>
              </button>

              <button
                onClick={() => handleMenuClick(onImportClick)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 group"
              >
                <div className="p-1.5 bg-purple-100 rounded-md group-hover:bg-purple-200 transition-colors">
                  <Upload className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-medium text-sm">Import Students</span>
              </button>

              <button
                onClick={() => handleMenuClick(onExportClick)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200 group"
              >
                <div className="p-1.5 bg-orange-100 rounded-md group-hover:bg-orange-200 transition-colors">
                  <Download className="w-4 h-4 text-orange-600" />
                </div>
                <span className="font-medium text-sm">Export Absences</span>
              </button>

              <button
                onClick={() => handleMenuClick(onResetStudents)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-red-600 hover:bg-red-50 transition-all duration-200 group"
              >
                <div className="p-1.5 bg-red-100 rounded-md group-hover:bg-red-200 transition-colors">
                  <RotateCcw className="w-4 h-4 text-red-600" />
                </div>
                <span className="font-medium text-sm">Reset Students</span>
              </button>
            </div>
          </div>

          {/* Reports & Settings */}
          <div className="p-4 border-t border-gray-100">
            <div className="space-y-2">
              <Link
                href="/dashboard/logs"
                onClick={handleClose}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-gray-700 hover:bg-gray-50 transition-all duration-200 group"
              >
                <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-gray-200 transition-colors">
                  <FileText className="w-4 h-4 text-gray-600" />
                </div>
                <span className="font-medium text-sm">Action Logs</span>
              </Link>

              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-gray-700 hover:bg-gray-50 transition-all duration-200 group">
                <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-gray-200 transition-colors">
                  <Settings className="w-4 h-4 text-gray-600" />
                </div>
                <span className="font-medium text-sm">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
