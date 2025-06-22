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
    <div className="flex items-center space-x-1">
      {GRADES.map((grade) => {
        const isSelected = selectedGrade === grade;
        return (
          <Button
            key={grade}
            variant="ghost"
            onClick={() => onGradeChange(grade)}
            className={`
              text-sm font-medium cursor-pointer transition-all duration-200 ease-in-out
              bg-white border border-gray-200 rounded-md px-3 py-2
              ${isSelected 
                ? 'bg-gray-50 text-gray-900 border-gray-300 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300'
              }
            `}
          >
            Grade {grade}
          </Button>
        );
      })}
    </div>
  );
} 