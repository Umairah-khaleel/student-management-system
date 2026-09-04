'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Edit2, LogOut, Eye, EyeOff, CheckCircle, 
  Search, ChevronLeft, ChevronRight, GraduationCap, Users, BookOpen
} from 'lucide-react';

// Hardcoded authentication credentials and backend API endpoint configuration
const VALID_USERNAME = 'user123';
const VALID_PASSWORD = 'password123';
const API_BASE_URL = 'http://localhost:5000/api/students';

// Predefined list of courses 
const AVAILABLE_COURSES = [
  'Information Technology',
  'Software Engineering',
  'Business Administration',
  'Data Science',
  'Cyber Security'
];

// TypeScript interface defining the structure of a student record
interface Student {
  id: number;
  name: string;
  email: string;
  phone?: string;
  dob: string;
  address: string;
  gender: 'Male' | 'Female';
  course: string;
}

export default function Home() {
  // Navigation & Toast States
  const [currentView, setCurrentView] = useState<'splash' | 'login' | 'dashboard'>('splash');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Login States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState('');

  // Student Data & Pagination States
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Form Inputs
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentDob, setStudentDob] = useState('');
  const [studentAddress, setStudentAddress] = useState('');
  const [studentGender, setStudentGender] = useState<'Male' | 'Female'>('Male');
  const [studentCourse, setStudentCourse] = useState(AVAILABLE_COURSES[0]);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');

  // Toast & Date Helper Functions
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatToLocalDateString = (dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = formatToLocalDateString(new Date());

  const getCleanDate = (rawDate: string) => {
    if (!rawDate) return '';
    return rawDate.split('T')[0];
  };

  // Data Fetching Effect
  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchStudents();
    }
  }, [currentView]);

  const fetchStudents = async () => {
    try {
      const res = await fetch(API_BASE_URL);
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudents(data);
      }
    } catch (err) {
      console.error('Failed to load students', err);
    }
  };

  // Authentication Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    setPasswordError('');

    let hasError = false;
    if (username !== VALID_USERNAME) {
      setUsernameError('Username is incorrect');
      hasError = true;
    }
    if (password !== VALID_PASSWORD) {
      setPasswordError('Password is incorrect');
      hasError = true;
    }

    if (!hasError) {
      setLoggedInUser(username);
      setCurrentView('dashboard');
      triggerToast('Login successful!');
    }
  };

  // Form Validation Logic
  const validateStudentForm = (currentId?: number | null) => {
    if (studentName.length > 100) {
      return 'Student Name cannot exceed 100 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentEmail)) {
      return 'Please enter a valid email address.';
    }

    const emailExists = students.some(
      (s) => s.email.toLowerCase() === studentEmail.toLowerCase() && s.id !== currentId
    );
    if (emailExists) {
      return 'A student with this email address already exists.';
    }

    const phoneRegex = /^\+?[0-9]{10,15}$/;
  if (!phoneRegex.test(studentPhone)) {
    return 'Phone number must contain between 10 and 15 digits.';
  }

    if (studentDob > todayStr) {
      return 'Date of Birth must be in the past.';
    }

    return null;
  };

  // Form Reset Helper
  const resetForm = () => {
    setStudentName('');
    setStudentEmail('');
    setStudentPhone('');
    setStudentDob('');
    setStudentAddress('');
    setStudentGender('Male');
    setStudentCourse(AVAILABLE_COURSES[0]);
    setFormError('');
  };

  // Add Student Handler
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const validationErr = validateStudentForm();
    if (validationErr) {
      setFormError(validationErr);
      return;
    }

    try {
      const res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: studentName,
          email: studentEmail,
          phone: studentPhone,
          dob: studentDob,
          address: studentAddress,
          gender: studentGender,
          course: studentCourse,
        }),
      });

      if (res.ok) {
        resetForm();
        setIsModalOpen(false);
        await fetchStudents();
        triggerToast('Student registered successfully');
      } else {
        const errData = await res.json();
        setFormError(errData.error || 'Failed to add student');
      }
    } catch (err) {
      setFormError('Error connecting to database');
    }
  };

  // Edit Student Handlers
  const openEditModal = (student: Student) => {
    setEditingStudentId(student.id);
    setStudentName(student.name);
    setStudentEmail(student.email);
    setStudentPhone(student.phone || '');
    setStudentDob(getCleanDate(student.dob));
    setStudentAddress(student.address || '');
    setStudentGender(student.gender);
    setStudentCourse(student.course);
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const validationErr = validateStudentForm(editingStudentId);
    if (validationErr) {
      setFormError(validationErr);
      return;
    }

    try {
      const res = await fetch(API_BASE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingStudentId,
          name: studentName,
          email: studentEmail,
          phone: studentPhone,
          dob: studentDob,
          address: studentAddress,
          gender: studentGender,
          course: studentCourse,
        }),
      });

      if (res.ok) {
        resetForm();
        setEditingStudentId(null);
        setIsEditModalOpen(false);
        await fetchStudents();
        triggerToast('Student record updated successfully');
      } else {
        const errData = await res.json();
        setFormError(errData.error || 'Failed to update student');
      }
    } catch (err) {
      setFormError('Failed to edit student');
    }
  };

  // Delete Handlers
  const openDeleteModal = (student: Student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      await fetch(`${API_BASE_URL}?id=${studentToDelete.id}`, { method: 'DELETE' });
      await fetchStudents();
      triggerToast('Student record deleted');
    } catch (err) {
      console.error('Failed to delete student', err);
    }
    setIsDeleteModalOpen(false);
    setStudentToDelete(null);
  };

  // Logout Handler
  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    setCurrentView('login');
  };

  // Search & Pagination Memos
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.gender.toLowerCase().includes(q) ||
        s.course.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage]);

  // Analytics Metrics
  const maleCount = useMemo(() => students.filter((s) => s.gender === 'Male').length, [students]);
  const femaleCount = useMemo(() => students.filter((s) => s.gender === 'Female').length, [students]);
  const totalStudents = students.length || 1;

  const courseCounts = useMemo(() => {
    return AVAILABLE_COURSES.map((course) => ({
      name: course,
      count: students.filter((s) => s.course === course).length,
    }));
  }, [students]);

  return (
    <div className="relative min-h-screen">
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-emerald-950/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl font-sans text-sm border border-emerald-800/40">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* SPLASH SCREEN  */}
      {currentView === 'splash' && (
        <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50/50 font-serif p-6">
       <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center border border-emerald-100 animate-swipe-back">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
           <GraduationCap className="w-8 h-8 text-emerald-800" />
           </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3 tracking-tight">EduPulse Pro</h1>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Unified Student Management Hub. Register, analyze, and oversee academic records effortlessly.
            </p>
            <button
              onClick={() => setCurrentView('login')}
              className="w-full bg-emerald-800 text-white py-3.5 rounded-xl hover:bg-emerald-900 transition font-sans font-semibold shadow-md"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* LOGIN */}
      {currentView === 'login' && (
        <div className="min-h-screen flex items-center justify-center bg-emerald-50/50 font-serif p-4 [perspective:1000px]">
          <style>{`input:-webkit-autofill{-webkit-box-shadow:0 0 0 30px #e0f3e8 inset !important}`}</style>
          <div className="bg-white rounded-3xl shadow-xl flex w-[900px] max-w-full overflow-hidden border border-emerald-100 animate-flip">
            <div className="w-1/2 p-10 flex flex-col justify-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Login</h1>
              <p className="text-gray-400 text-sm mb-8">Log in to access student management records.</p>

              <form onSubmit={handleLogin}>
                <label className="text-sm font-sans font-medium text-gray-600">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border-b border-gray-300 py-2 mb-1 outline-none focus:outline-none focus:ring-0 focus:border-emerald-600 text-gray-800 font-sans transition-colors"
                  placeholder="Enter your username"
                />
                {usernameError && <p className="text-red-500 text-xs mb-3 font-sans">{usernameError}</p>}
                {!usernameError && <div className="mb-6" />}

                <label className="text-sm font-sans font-medium text-gray-600">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-b border-gray-300 py-2 mb-1 outline-none focus:outline-none focus:ring-0 focus:border-emerald-600 text-gray-800 font-sans transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-2 text-gray-400 hover:text-emerald-800"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && <p className="text-red-500 text-xs mb-3 font-sans">{passwordError}</p>}
                {!passwordError && <div className="mb-6" />}

                <button
                  type="submit"
                  className="w-full bg-emerald-800 text-white py-3 rounded-xl mt-4 hover:bg-emerald-900 transition font-sans font-medium shadow"
                >
                  LOGIN
                </button>
              </form>
            </div>

            <div className="w-1/2 bg-emerald-100/50 flex items-center justify-center p-6">
              <img src="/loginpic.png" alt="Login" className="w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD */}
       {currentView === 'dashboard' && (
        <div className="min-h-screen bg-[#f4f7f5] font-sans p-6 md:p-10">
          <div className="max-w-7xl mx-auto bg-[#f8faf9] border border-[#e2eaf4] rounded-3xl p-6 md:p-8 shadow-sm mb-6">
            
            {loggedInUser && (
              <div className="mb-6 p-4 bg-emerald-100/60 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
                <span className="text-base font-serif font-semibold text-gray-700">
                  Welcome back, <span className="text-emerald-900 font-bold underline decoration-emerald-400">{loggedInUser}</span>!
                </span>
                <span className="text-xs font-sans font-medium bg-emerald-800 text-white px-5 py-2 rounded-full">
                  System Admin
                </span>
              </div>
            )}

             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-200">
              <div>
                <span className="text-xs uppercase tracking-widest text-emerald-800 font-semibold">Academic Portal</span>
                <h1 className="text-3xl font-serif font-bold text-gray-800 mt-1">Student Management System</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Total Enrolled: <span className="font-semibold text-emerald-900">{students.length} Students</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => { resetForm(); setIsModalOpen(true); }}
                  className="flex items-center gap-2 bg-emerald-800 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-900 transition text-sm font-medium shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Student
                </button>

                <button
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="flex items-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl transition text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          </div>

            {/* SIMPLE VISUAL ANALYTICS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Gender Distribution Bar */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                  <Users className="w-5 h-5 text-emerald-700" />
                  <h2 className="font-serif font-bold text-gray-800 text-base">Gender Demographics</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                      <span>Male ({maleCount})</span>
                      <span>{Math.round((maleCount / totalStudents) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-800 h-full transition-all duration-300" 
                        style={{ width: `${(maleCount / totalStudents) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                      <span>Female ({femaleCount})</span>
                      <span>{Math.round((femaleCount / totalStudents) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-teal-500 h-full transition-all duration-300" 
                        style={{ width: `${(femaleCount / totalStudents) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Distribution Bars */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                  <BookOpen className="w-5 h-5 text-emerald-700" />
                  <h2 className="font-serif font-bold text-gray-800 text-base">Course Enrollments</h2>
                </div>
                <div className="space-y-2.5">
                  {courseCounts.map((item, index) => {
                  
                    const courseShades = [
                      'bg-emerald-800', // IT
                      'bg-emerald-600', // Software Engineering
                      'bg-teal-600',    // Business Admin
                      'bg-green-600',   // Data Science
                      'bg-lime-600'     // Cyber Security
                    ];

                    return (
                      <div key={item.name}>
                        <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                          <span>{item.name}</span>
                          <span className="font-semibold text-emerald-900">{item.count}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`${courseShades[index]} h-full transition-all duration-300`} 
                            style={{ width: `${(item.count / totalStudents) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SEARCH BAR */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mb-6">
                <div className="relative w-full">
                  <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    placeholder="Search students by name, email, course..."
                    className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-emerald-800"
                  />
                </div>
              </div>  

            {/* STUDENT TABLE */}
            <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-xs mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-emerald-800 border-b border-gray-200 text-sm font-semibold uppercase text-white">
                      <th className="p-4">Name</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">DOB</th>
                      <th className="p-4">Gender</th>
                      <th className="p-4">Course</th>
                      <th className="p-4">Address</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {paginatedStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-emerald-50/30 transition">
                        <td className="p-4 font-semibold text-gray-900">{s.name}</td>
                        <td className="p-4">
                            <div className="font-semibold text-gray-900">{s.email}</div>
                            <div className="text-gray-500 text-[11px] mt-0.5">
                            {s.phone ? s.phone : 'No Phone'}
                             </div>
                        </td>
                        <td className="p-4">{getCleanDate(s.dob)}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            s.gender === 'Male' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'
                          }`}>
                            {s.gender}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-emerald-900">{s.course}</td>
                        <td className="p-4 max-w-[200px] whitespace-normal break-words text-gray-500">{s.address || '-'}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(s)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-800 hover:bg-emerald-50 transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(s)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {paginatedStudents.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-gray-400 italic">
                          No student records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

           {/* PAGINATION CONTROLS */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-medium text-emerald-900">
                Page <span className="font-bold text-emerald-950">{currentPage}</span> of {totalPages}
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-3.5 py-2 bg-emerald-100/70 border border-emerald-300 rounded-lg text-sm font-semibold text-emerald-900 hover:bg-emerald-200/80 disabled:opacity-40 transition shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="flex items-center gap-1 px-3.5 py-2 bg-emerald-100/70 border border-emerald-300 rounded-lg text-sm font-semibold text-emerald-900 hover:bg-emerald-200/80 disabled:opacity-40 transition shadow-xs"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>

          </div>

          {/* ADD MODAL */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100">
                <h2 className="text-xl font-serif font-bold text-gray-800 mb-4">Register New Student</h2>
                <form onSubmit={handleAddStudent} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="e.g. john@gamil.com"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      placeholder="e.g. 0771234567"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-800"
                    />
                   </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        required
                        max={todayStr}
                        value={studentDob}
                        onChange={(e) => setStudentDob(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Gender</label>
                      <select
                        value={studentGender}
                        onChange={(e) => setStudentGender(e.target.value as 'Male' | 'Female')}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-800 bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Course</label>
                    <select
                      value={studentCourse}
                      onChange={(e) => setStudentCourse(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-800 bg-white"
                    >
                      {AVAILABLE_COURSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                    <textarea
                      rows={2}
                      required
                      maxLength={250}
                      value={studentAddress}
                      onChange={(e) => setStudentAddress(e.target.value)}
                      placeholder="Street address..."
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-800"
                    />
                  </div>

                  {formError && <p className="text-red-500 text-xs font-medium">{formError}</p>}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-800 text-white hover:bg-emerald-900"
                    >
                      Save Record
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EDIT MODAL */}
          {isEditModalOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100">
                <h2 className="text-xl font-serif font-bold text-gray-800 mb-4">Edit Student Record</h2>
                <form onSubmit={handleEditStudent} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        required
                        max={todayStr}
                        value={studentDob}
                        onChange={(e) => setStudentDob(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Gender</label>
                      <select
                        value={studentGender}
                        onChange={(e) => setStudentGender(e.target.value as 'Male' | 'Female')}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-800 bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Course</label>
                    <select
                      value={studentCourse}
                      onChange={(e) => setStudentCourse(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-800 bg-white"
                    >
                      {AVAILABLE_COURSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                    <textarea
                      rows={2}
                      value={studentAddress}
                      onChange={(e) => setStudentAddress(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-800"
                    />
                  </div>

                  {formError && <p className="text-red-500 text-xs font-medium">{formError}</p>}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-800 text-white hover:bg-emerald-900"
                    >
                      Update Record
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* DELETE MODAL */}
          {isDeleteModalOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-100 text-center">
                <h3 className="text-lg font-serif font-bold text-gray-800 mb-2">Confirm Delete</h3>
                <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this student record?</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => { setIsDeleteModalOpen(false); setStudentToDelete(null); }}
                    className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-100 transition w-24"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteStudent}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition w-24"
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* LOGOUT MODAL */}
          {isLogoutModalOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-100 text-center">
                <h3 className="text-lg font-serif font-bold text-gray-800 mb-2">Confirm Logout</h3>
                <p className="text-sm text-gray-500 mb-6">Are you sure you want to log out?</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setIsLogoutModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-100 transition w-24"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition w-24"
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}