"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'teacher' | 'admin'>('teacher');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let result;
      if (role === 'teacher') {
        result = await signIn('credentials', {
          redirect: false,
          pin,
        });
      } else {
        result = await signIn('credentials', {
          redirect: false,
          password,
        });
      }

      if (result?.error) {
        setError('Invalid credentials. Please try again.');
        setIsLoading(false);
      } else if (result?.ok) {
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        onClose();
        if (session.user?.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Reset form on close
      setEmail('');
      setPassword('');
      setError('');
      setIsLoading(false);
      setShowPassword(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-900">Login</DialogTitle>
          <DialogDescription className="text-gray-600">
            Enter your credentials to access your account.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 mb-4">
          <Button type="button" variant={role === 'teacher' ? 'default' : 'outline'} onClick={() => setRole('teacher')} className={role === 'teacher' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 border-gray-300'}>Teacher</Button>
          <Button type="button" variant={role === 'admin' ? 'default' : 'outline'} onClick={() => setRole('admin')} className={role === 'admin' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 border-gray-300'}>Admin</Button>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {role === 'teacher' ? (
            <>
              <div className="grid gap-2 relative">
                <Label htmlFor="pin" className="text-gray-800">PIN</Label>
                <Input
                  id="pin"
                  type={showPassword ? "text" : "password"}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  disabled={isLoading}
                  className="bg-white text-gray-900 border-gray-300 pr-16"
                  maxLength={6}
                  minLength={6}
                  pattern="[0-9]{6}"
                  placeholder="Enter your 6-digit PIN"
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
            </>
          ) : (
            <>
              <div className="grid gap-2 relative">
                <Label htmlFor="password" className="text-gray-800">Admin Password</Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-white text-gray-900 border-gray-300 pr-16"
                  placeholder="Enter admin password"
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
            </>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full bg-gray-900 text-white hover:bg-gray-800" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 