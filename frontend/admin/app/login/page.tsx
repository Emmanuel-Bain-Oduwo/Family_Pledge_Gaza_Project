'use client';
import Image from 'next/image';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { adminLogin, getAdminMe } from '../../lib/api';
import { saveToken, isAuthenticated, removeToken } from '../../lib/auth';
import { FAMILY_PLEDGE_LOGO_DATA_URI } from '../../lib/logo';
import { isAdminRole } from '../../lib/adminDisplay';

interface LoginForm { identifier: string; password: string; }

export default function LoginPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>();

  useEffect(() => {
    if (isAuthenticated()) router.replace('/dashboard');
  }, [router]);

  const onSubmit = async (values: LoginForm) => {
    try {
      const tokens = await adminLogin(values);
      saveToken(tokens.access_token);
      const admin = await getAdminMe();
      if (!isAdminRole(admin)) {
        removeToken();
        toast.error('Admin access required.');
        router.replace('/login');
        return;
      }
      toast.success('Welcome back!');
      router.replace('/dashboard');
    } catch (e: any) {
      toast.error(e.message || 'Invalid credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-primary-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-white mb-4 shadow-lg overflow-hidden">
            <Image
              src={FAMILY_PLEDGE_LOGO_DATA_URI}
              alt="Family Pledge logo"
              width={112}
              height={112}
              className="object-contain"
              unoptimized
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-white">Family Pledge</h1>
          <p className="text-white/60 text-sm mt-1">Admin Dashboard · NAMLEF</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Sign In</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Email or phone</label>
              <input
                type="text"
                {...register('identifier', { required: 'Email or phone is required' })}
                className="input"
                placeholder="admin@familypledge.org or +254700000001"
                autoComplete="username"
              />
              {errors.identifier && <p className="text-red-500 text-xs mt-1">{errors.identifier.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                {...register('password', { required: 'Password is required' })}
                className="input"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-base">
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Family Pledge Admin · Restricted Access Only
          </p>
        </div>
      </div>
    </div>
  );
}
