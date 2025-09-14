"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useTheme, getThemeColors } from '../context/ThemeProvider';
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
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

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
      <DialogContent className="sm:max-w-md border-0" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
        <DialogHeader>
          <DialogTitle className="text-2xl" style={{ color: colors.text }}>Login</DialogTitle>
          <DialogDescription style={{ color: colors.textSecondary }}>
            Enter your PIN to access your account.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 mb-4">
          <Button 
            type="button" 
            variant={role === 'teacher' ? 'default' : 'outline'} 
            onClick={() => setRole('teacher')} 
            className={`border-0 transition-all duration-200 ${
              role !== 'teacher' ? 'hover:opacity-80' : ''
            }`}
            style={{ 
              backgroundColor: role === 'teacher' ? colors.primary : (isDark ? colors.hover : colors.lightButton), 
              color: role === 'teacher' ? '#ffffff' : colors.text 
            }}
          >
            Teacher
          </Button>
          <Button 
            type="button" 
            variant={role === 'admin' ? 'default' : 'outline'} 
            onClick={() => setRole('admin')} 
            className={`border-0 transition-all duration-200 ${
              role !== 'admin' ? 'hover:opacity-80' : ''
            }`}
            style={{ 
              backgroundColor: role === 'admin' ? colors.primary : (isDark ? colors.hover : colors.lightButton), 
              color: role === 'admin' ? '#ffffff' : colors.text 
            }}
          >
            Admin
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {role === 'teacher' ? (
            <>
              <div className="grid gap-2 relative">
                <Label htmlFor="pin" style={{ color: colors.text }}>PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  required
                  value={pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                    if (value.length <= 6) {
                      setPin(value);
                    }
                  }}
                  disabled={isLoading}
                  className="text-center text-lg tracking-widest border-0"
                  style={{ backgroundColor: colors.hover, color: colors.text, borderColor: colors.border }}
                  maxLength={6}
                  minLength={6}
                  pattern="[0-9]{6}"
                  placeholder="••••••"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-2 relative">
                <Label htmlFor="password" style={{ color: colors.text }}>Admin Password</Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="border-0 pr-16"
                  style={{ backgroundColor: colors.hover, color: colors.text, borderColor: colors.border }}
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[2.3rem] transform -translate-y-1/2 text-sm font-medium"
                  style={{ color: colors.textSecondary }}
                  onMouseEnter={(e) => e.currentTarget.style.color = colors.text}
                  onMouseLeave={(e) => e.currentTarget.style.color = colors.textSecondary}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </>
          )}
          {error && <p className="text-sm" style={{ color: colors.error }}>{error}</p>}
          <Button 
            type="submit" 
            className="w-full border-0 hover:opacity-90 transition-opacity" 
            style={{ backgroundColor: colors.primary, color: '#ffffff' }}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 