'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { IUser } from '@/app/models/User';
import { Student } from '@/app/models/Student';
import TeacherStudentsModal from '../components/TeacherStudentsModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { MoreVertical } from 'lucide-react';
import EditTeacherModal from '../components/EditTeacherModal';

// Augment the Student type to include the populated createdBy field
interface PopulatedStudent extends Omit<Student, 'createdBy'> {
  createdBy: {
    _id: string;
    name: string;
  }
}


export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [teachers, setTeachers] = useState<IUser[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState({ teachers: true, students: true });
  const [error, setError] = useState<string | null>(null);
  
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPin, setNewTeacherPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<{ _id: string; name: string } | null>(null);

  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [selectedTeacherForPassword, setSelectedTeacherForPassword] = useState<{ _id: string; name: string } | null>(null);

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; teacher: IUser | null }>({ open: false, teacher: null });

  const [openMenuIdx, setOpenMenuIdx] = useState<number | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTeacherForEdit, setSelectedTeacherForEdit] = useState<{ _id: string; name: string; email: string } | null>(null);

  const fetchTeachers = async () => {
    setIsLoading(prev => ({ ...prev, teachers: true }));
    try {
      const teachersRes = await fetch('/api/users?role=teacher');
      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        setTeachers(teachersData);
      }
    } catch (e) {
      console.error("Failed to fetch teachers", e);
      setError('Failed to fetch teachers');
    } finally {
      setIsLoading(prev => ({ ...prev, teachers: false }));
    }
  };

  useEffect(() => {
    // Protect route for admin only
    if (status === 'authenticated') {
      // Use type guard to check for 'role' property
      if (!isAdminUser(session.user) || session.user.role !== 'admin') {
        router.replace('/dashboard');
      } else {
        fetchTeachers();
      }
    } else if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, session, router]);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeacherName, email: newTeacherEmail, pin: newTeacherPin, role: 'teacher' }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitMessage(`Teacher account for ${data.name} created successfully!`);
        setNewTeacherName('');
        setNewTeacherEmail('');
        setNewTeacherPin('');
        fetchTeachers(); // Refresh teachers list
      } else {
        setSubmitMessage(data.message || 'Failed to create teacher account.');
      }
    } catch (e) {
      setSubmitMessage('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewStudents = (teacher: IUser) => {
    setSelectedTeacher({ 
      _id: typeof teacher._id === 'string' ? teacher._id : String(teacher._id), 
      name: typeof teacher.name === 'string' ? teacher.name : String(teacher.name) 
    });
    setIsModalOpen(true);
  };

  const handleChangePassword = (teacher: IUser) => {
    setSelectedTeacherForPassword({ 
      _id: typeof teacher._id === 'string' ? teacher._id : String(teacher._id), 
      name: typeof teacher.name === 'string' ? teacher.name : String(teacher.name) 
    });
    setIsChangePasswordModalOpen(true);
  };

  const handleDeleteTeacher = async (teacher: IUser) => {
    if (!teacher) return;
    try {
      const res = await fetch(`/api/users/${teacher._id}`, {
        method: 'DELETE',
      });
      await res.json();
      fetchTeachers();
    } catch (e) {
      // Optionally show error
    }
    setDeleteDialog({ open: false, teacher: null });
  };

  const handleEditTeacher = (teacher: IUser) => {
    setSelectedTeacherForEdit({
      _id: typeof teacher._id === 'string' ? teacher._id : String(teacher._id),
      name: teacher.name,
      email: teacher.email || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditTeacherSave = async (updatedTeacher: { _id: string; name: string; email: string }) => {
    try {
      const res = await fetch(`/api/users/${updatedTeacher._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: updatedTeacher.name, email: updatedTeacher.email }),
      });
      if (res.ok) {
        fetchTeachers();
        setIsEditModalOpen(false);
        setSelectedTeacherForEdit(null);
      }
    } catch (e) {
      // Optionally show error
    }
  };

  function isAdminUser(user: unknown): user is { role: string } {
    return typeof user === 'object' && user !== null && 'role' in user;
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      setOpenMenuIdx(null);
    };
    if (openMenuIdx !== null) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [openMenuIdx]);

  if (
    status === 'loading' ||
    !session ||
    !isAdminUser(session.user) ||
    session.user.role !== 'admin'
  ) {
    return <div className="flex items-center justify-center min-h-screen">Loading & Verifying Access...</div>;
  }

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-8 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Welcome, {session.user?.name}. Manage teacher accounts.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button onClick={() => signOut({ callbackUrl: '/' })} variant="outline" className="bg-white text-gray-800 border-gray-300 hover:bg-gray-100">Logout</Button>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Left Column: Create Teacher Form */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900">Create New Teacher</h2>
            <p className="mt-1 text-sm text-gray-500">Add a new teacher account to the system.</p>
            
            <form onSubmit={handleCreateTeacher} className="mt-6 grid gap-y-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
                <Input id="name" value={newTeacherName} onChange={e => setNewTeacherName(e.target.value)} required disabled={isSubmitting} className="mt-1 bg-white text-gray-900 border-gray-300" />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                <Input id="email" type="email" value={newTeacherEmail} onChange={e => setNewTeacherEmail(e.target.value)} required disabled={isSubmitting} className="mt-1 bg-white text-gray-900 border-gray-300" placeholder="teacher@email.com" />
              </div>
              <div>
                <Label htmlFor="pin" className="text-sm font-medium text-gray-700">PIN</Label>
                <Input id="pin" type="password" value={newTeacherPin} onChange={e => setNewTeacherPin(e.target.value)} required disabled={isSubmitting} className="mt-1 bg-white text-gray-900 border-gray-300" maxLength={6} minLength={6} pattern="[0-9]{6}" placeholder="6-digit PIN" />
              </div>
              {submitMessage && <p className={`text-sm ${submitMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{submitMessage}</p>}
              <Button type="submit" disabled={isSubmitting} className="w-full justify-center bg-gray-900 text-white hover:bg-gray-800">
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </div>

          {/* Right Column: Teacher List */}
          <div className="lg:col-span-3">
            <h2 className="text-lg font-semibold text-gray-900">Teacher Accounts ({teachers.length})</h2>
            <p className="mt-1 text-sm text-gray-500">List of all registered teacher accounts.</p>
            
            <div className="mt-6 flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <div className="overflow-visible border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading.teachers ? (
                          <tr><td colSpan={3} className="text-center p-6 text-sm text-gray-500">Loading teachers...</td></tr>
                        ) : teachers.length > 0 ? (
                          teachers.map((teacher, idx) => (
                            <tr key={typeof teacher._id === 'string' || typeof teacher._id === 'number' ? teacher._id : idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                                <button
                                  className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setOpenMenuIdx(openMenuIdx === idx ? null : idx);
                                  }}
                                  aria-label="More actions"
                                >
                                  <MoreVertical className="w-5 h-5 text-gray-700" />
                                </button>
                                {openMenuIdx === idx && (
                                  <div className="absolute right-0 z-50 mt-2 w-44 bg-white border border-gray-200 rounded shadow-lg flex flex-col">
                                    <button
                                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800"
                                      onClick={() => { setOpenMenuIdx(null); handleViewStudents(teacher); }}
                                    >
                                      View Students
                                    </button>
                                    <button
                                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800"
                                      onClick={() => { setOpenMenuIdx(null); handleChangePassword(teacher); }}
                                    >
                                      Change Password
                                    </button>
                                    <button
                                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800"
                                      onClick={() => { setOpenMenuIdx(null); handleEditTeacher(teacher); }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                                      onClick={() => { setOpenMenuIdx(null); setDeleteDialog({ open: true, teacher }); }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={3} className="text-center p-6 text-sm text-gray-500">No teacher accounts found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <TeacherStudentsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        teacher={selectedTeacher}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        teacher={selectedTeacherForPassword}
      />

      <EditTeacherModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        teacher={selectedTeacherForEdit}
        onSave={handleEditTeacherSave}
      />

      {/* Delete Confirmation Dialog */}
      {deleteDialog.open && deleteDialog.teacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-2">Delete Teacher</h2>
            <p className="mb-4">Are you sure you want to <b>delete</b> <b>{deleteDialog.teacher.name}</b>? This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                className="bg-white text-gray-800 border border-gray-300 hover:bg-gray-100"
                onClick={() => setDeleteDialog({ open: false, teacher: null })}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 text-white"
                onClick={() => {
                  if (deleteDialog.teacher) {
                    handleDeleteTeacher(deleteDialog.teacher);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
