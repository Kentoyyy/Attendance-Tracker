'use client';

import { useState } from 'react';
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

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: { _id: string; name: string; role?: string } | null;
}

export default function ChangePasswordModal({ isOpen, onClose, teacher }: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Check if this is a teacher (use PIN) or admin (use password)
  const isTeacher = teacher?.role === 'teacher';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teacher) return;

    if (isTeacher) {
      // Handle teacher PIN change
      if (!/^[0-9]{6}$/.test(newPin)) {
        setMessage('PIN must be exactly 6 digits');
        return;
      }

      if (newPin !== confirmPin) {
        setMessage('PINs do not match');
        return;
      }

      setIsSubmitting(true);
      setMessage('');

      try {
        const res = await fetch(`/api/users/${teacher._id}/change-pin`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPin }),
        });

        const data = await res.json();

        if (res.ok) {
          setMessage('Teacher PIN changed successfully!');
          setNewPin('');
          setConfirmPin('');
          // Close modal after 2 seconds
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          setMessage(data.message || 'Failed to change teacher PIN');
        }
      } catch (error) {
        setMessage('An unexpected error occurred');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Handle admin password change
      if (newPassword.length < 6) {
        setMessage('Password must be at least 6 characters long');
        return;
      }

      if (newPassword !== confirmPassword) {
        setMessage('Passwords do not match');
        return;
      }

      setIsSubmitting(true);
      setMessage('');

      try {
        const res = await fetch(`/api/users/${teacher._id}/change-password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword }),
        });

        const data = await res.json();

        if (res.ok) {
          setMessage('Password changed successfully!');
          setNewPassword('');
          setConfirmPassword('');
          // Close modal after 2 seconds
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          setMessage(data.message || 'Failed to change password');
        }
      } catch (error) {
        setMessage('An unexpected error occurred');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Reset form on close
      setNewPassword('');
      setConfirmPassword('');
      setNewPin('');
      setConfirmPin('');
      setMessage('');
      setIsSubmitting(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-900">
            {isTeacher ? 'Change PIN' : 'Change Password'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {isTeacher ? `Change PIN for teacher ${teacher?.name}` : `Change password for ${teacher?.name}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {isTeacher ? (
            // Teacher PIN fields
            <>
              <div className="grid gap-2 relative">
                <Label htmlFor="newPin" className="text-gray-800">New PIN</Label>
                <Input
                  id="newPin"
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-white text-gray-900 border-gray-300 pr-16"
                  maxLength={6}
                  minLength={6}
                  pattern="[0-9]{6}"
                  placeholder="Enter 6-digit PIN"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[2.3rem] transform -translate-y-1/2 text-sm font-medium text-gray-600 hover:text-gray-900"
                  aria-label={showPassword ? "Hide PIN" : "Show PIN"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div className="grid gap-2 relative">
                <Label htmlFor="confirmPin" className="text-gray-800">Confirm PIN</Label>
                <Input
                  id="confirmPin"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-white text-gray-900 border-gray-300 pr-16"
                  maxLength={6}
                  minLength={6}
                  pattern="[0-9]{6}"
                  placeholder="Confirm 6-digit PIN"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-[2.3rem] transform -translate-y-1/2 text-sm font-medium text-gray-600 hover:text-gray-900"
                  aria-label={showConfirmPassword ? "Hide PIN" : "Show PIN"}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </>
          ) : (
            // Admin password fields
            <>
              <div className="grid gap-2 relative">
                <Label htmlFor="newPassword" className="text-gray-800">New Password</Label>
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-white text-gray-900 border-gray-300 pr-16"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[2.3rem] transform -translate-y-1/2 text-sm font-medium text-gray-600 hover:text-gray-900"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div className="grid gap-2 relative">
                <Label htmlFor="confirmPassword" className="text-gray-800">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-white text-gray-900 border-gray-300 pr-16"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-[2.3rem] transform -translate-y-1/2 text-sm font-medium text-gray-600 hover:text-gray-900"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </>
          )}
          {message && (
            <p className={`text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gray-900 text-white hover:bg-gray-800"
            >
              {isSubmitting 
                ? (isTeacher ? 'Changing PIN...' : 'Changing Password...') 
                : (isTeacher ? 'Change PIN' : 'Change Password')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 