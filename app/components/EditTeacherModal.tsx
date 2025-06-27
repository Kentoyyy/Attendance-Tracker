import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';

interface EditTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: { _id: string; name: string; email: string } | null;
  onSave: (updated: { _id: string; name: string; email: string }) => void;
}

export default function EditTeacherModal({ isOpen, onClose, teacher, onSave }: EditTeacherModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (teacher) {
      setName(teacher.name || '');
      setEmail(teacher.email || '');
    }
  }, [teacher]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teacher) {
      onSave({ _id: teacher._id, name, email });
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-900">Edit Teacher</DialogTitle>
          <DialogDescription className="text-gray-600">
            Update the teacher's name and email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div>
            <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700">Full Name</Label>
            <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 bg-white text-gray-900 border-gray-300" />
          </div>
          <div>
            <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700">Email</Label>
            <Input id="edit-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 bg-white text-gray-900 border-gray-300" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-white text-gray-800 border-gray-300 hover:bg-gray-100">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-gray-900 text-white hover:bg-gray-800">
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 