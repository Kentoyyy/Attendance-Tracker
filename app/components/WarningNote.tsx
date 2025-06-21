import React from 'react';
import { AlertTriangle, Bell, OctagonAlert } from 'lucide-react';

interface WarningNoteProps {
  absentCount: number;
}

const WARNINGS = {
  3: {
    message: 'Notice: 3 absences this month.',
    Icon: Bell,
    className: 'bg-yellow-100 text-yellow-800',
  },
  5: {
    message: 'Reminder: 5 absents. Please monitor.',
    Icon: AlertTriangle,
    className: 'bg-orange-100 text-orange-800',
  },
  10: {
    message: 'Warning: 10+ absents. Action may be needed.',
    Icon: OctagonAlert,
    className: 'bg-red-100 text-red-800',
  },
};

export function WarningNote({ absentCount }: WarningNoteProps) {
  let warning = null;
  if (absentCount >= 10) {
    warning = WARNINGS[10];
  } else if (absentCount >= 5) {
    warning = WARNINGS[5];
  } else if (absentCount >= 3) {
    warning = WARNINGS[3];
  }

  if (!warning) {
    return null;
  }

  const { message, Icon, className } = warning;

  return (
    <div className={`mt-1 flex items-center space-x-1.5 rounded-md p-1.5 text-[11px] font-medium ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      <span>{message}</span>
    </div>
  );
} 