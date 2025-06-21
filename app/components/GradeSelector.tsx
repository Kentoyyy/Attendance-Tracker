"use client"

import * as React from 'react';
import { Button } from './ui/button';

interface GradeSelectorProps {
  selectedGrade: number;
  onGradeChange: (grade: number) => void;
}

const GRADES = [1, 2, 3];

export default function GradeSelector({ selectedGrade, onGradeChange }: GradeSelectorProps) {
  return (
    <div className="flex items-center space-x-2">
      {GRADES.map((grade) => (
        <Button
          key={grade}
          variant={selectedGrade === grade ? 'secondary' : 'ghost'}
          onClick={() => onGradeChange(grade)}
          className="text-sm font-medium cursor-pointer hover:bg-gray-100"
        >
          Grade {grade}
        </Button>
      ))}
    </div>
  );
} 