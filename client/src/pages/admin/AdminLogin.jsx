import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

const AdminLogin = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  if (user) return <Navigate to="/admin/dashboard" replace />;
  const submit = async (event) => {
    event.preventDefault();
    try {
      await login(form.email, form.password);
      toast.success('Logged in');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.message || 'Invalid credentials');
    }
  };
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-tdp-navy via-tdp-red to-tdp-yellow p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
        <h1 className="text-3xl font-black text-tdp-navy">Admin Login</h1>
        <p className="mt-1 text-sm text-gray-500">Firebase Authentication admin access only.</p>
        <div className="mt-6 grid gap-4">
          <input type="email" className="min-h-11 rounded border px-3" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input type="password" className="min-h-11 rounded border px-3" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="min-h-11 rounded bg-tdp-red font-bold text-white">Login</button>
        </div>
      </form>
    </main>
  );
};

export default AdminLogin;
