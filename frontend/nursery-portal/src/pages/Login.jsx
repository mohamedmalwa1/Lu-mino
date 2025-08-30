// src/pages/Login.jsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LuGem, LuUser, LuLock } from 'react-icons/lu';

const schema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await login(data.username, data.password);
      navigate('/');
    } catch (err) {
      setError('root', {
        type: 'manual',
        message: 'Invalid username or password. Please try again.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 to-violet-600 items-center justify-center p-12 text-white">
        <div className="text-center">
          <LuGem size={60} className="mx-auto mb-6" />
          <h1 className="text-4xl font-bold tracking-tight">Welcome to Lu-mino</h1>
          <p className="mt-4 text-lg text-indigo-200">The complete Education ERP System.</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8 lg:hidden">
            <LuGem size={40} className="mx-auto text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-center text-gray-900">Sign in to your account</h2>
          <p className="text-center text-gray-500 mt-2">Enter your credentials to access the dashboard.</p>
          
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
            {errors.root && (
              <p className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                {errors.root.message}
              </p>
            )}
            
            <div className="relative">
              <LuUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                {...register('username')}
                className="input pl-10"
                placeholder="Username"
                disabled={isSubmitting}
              />
            </div>

            <div className="relative">
              <LuLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                {...register('password')}
                type="password"
                className="input pl-10"
                placeholder="Password"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
