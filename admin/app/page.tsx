'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../lib/auth';

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(isAuthenticated() ? '/dashboard' : '/login');
  }, [router]);
  return (
    <div className="flex h-screen items-center justify-center bg-primary-dark">
      <div className="text-center text-white">
        <div className="text-3xl font-bold mb-2">Family Pledge</div>
        <div className="text-primary-100 text-sm">Admin Dashboard</div>
      </div>
    </div>
  );
}
