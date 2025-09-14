"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentAdded: () => void;
  selectedGrade?: string;
}

export default function AddStudentModal({ isOpen, onClose, onStudentAdded, selectedGrade = 'Grade 1' }: AddStudentModalProps) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Female');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setGender('Female');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      // Extract grade number from grade string
      const getGradeNumber = (gradeString: string): number => {
        const match = gradeString.match(/\d+/);
        return match ? parseInt(match[0]) : 1; // Default to 1 if no number found
      };

      const gradeNumber = getGradeNumber(selectedGrade);
      
      // Split name into firstName and lastName
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          firstName, 
          lastName, 
          grade: gradeNumber, 
          sex: gender 
        }),
      });

      if (response.ok) {
        onClose();
        setName('');
        onStudentAdded();
      } else {
        const errorData = await response.json();
        console.error('Failed to add student:', errorData);
        alert('Failed to add student: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding student:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-gray-900">Add New Student</DialogTitle>
            <DialogDescription className="text-gray-600">
              Enter the name of the new student for {selectedGrade}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-gray-800">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3 bg-white text-black"
                placeholder="e.g., Juan Dela Cruz"
                required
                
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gender" className="text-right text-black">
                Gender
              </Label>
              <div className="col-span-3">
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-black"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className='text-black' disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
