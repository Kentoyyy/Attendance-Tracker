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
import { AttendanceRecord, Student } from '../types';

interface AbsenceNotesModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  student: Student | null;
  record: AttendanceRecord | null;
  onNoteSave: (updatedRecord: AttendanceRecord) => void;
}

export function AbsenceNotesModal({ isOpen, onOpenChange, student, record, onNoteSave }: AbsenceNotesModalProps) {
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setReason(record.reason || '');
    }
  }, [record]);

  const handleSave = async () => {
    if (!record || !student) return;

    setIsSaving(true);
    try {
      const studentId = String((student as any).id ?? (student as any)._id);
      const d = new Date(record.date);
      d.setUTCHours(0, 0, 0, 0);
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          date: d.toISOString(),
          status: 'ABSENT',
          reason,
        }),
      });

      if (response.ok) {
        const upserted = await response.json();
        const updatedRecord: AttendanceRecord = {
          _id: String(upserted.id ?? record._id ?? `${studentId}-${record.date}`),
          studentId,
          date: d.toISOString(),
          isAbsent: true,
          reason,
        };
        onNoteSave(updatedRecord);
        onOpenChange(false);
      } else {
        let details: any = null;
        try { details = await response.json(); } catch {
          try { const t = await response.text(); details = t || null; } catch {}
        }
        console.error('Failed to save note', details || response.statusText);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const formattedDate = record ? new Date(record.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC' // Important to avoid timezone shifts
  }) : '';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white text-black">
        <DialogHeader>
          <DialogTitle>Absence Note for {student?.name}</DialogTitle>
          <DialogDescription>
            Date: {formattedDate}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="reason">Reason for Absence</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Sick, Family Emergency"
              className="text-black bg-white"
            />
          </div>
        </div>
        <DialogFooter>
          <Button  className='text-black bg-white cursor-pointer' onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className='cursor-pointer' onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
