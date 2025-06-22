"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Student } from '../models/Student';

interface TeacherStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: { _id: string; name: string } | null;
}

export default function TeacherStudentsModal({ isOpen, onClose, teacher }: TeacherStudentsModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!teacher) return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/students/byTeacher/${teacher._id}`);
        if (res.ok) {
          const data = await res.json();
          setStudents(data);
        } else {
          setStudents([]);
        }
      } catch (error) {
        console.error('Failed to fetch students for teacher:', error);
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen, teacher]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Students Managed by {teacher?.name}</DialogTitle>
          <DialogDescription className="text-gray-600">
            A list of all students created by this teacher.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
           <div className="border rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Gender</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan={3} className="text-center p-6">Loading students...</td></tr>
                ) : students.length > 0 ? (
                  students.map(student => (
                    <tr key={student._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.grade}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.gender}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="text-center p-6">This teacher has not added any students yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 