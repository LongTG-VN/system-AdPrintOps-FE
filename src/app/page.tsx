'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/employee');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-indigo-950 flex flex-col items-center justify-center text-white">
      <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-3" />
      <p className="text-xs font-bold tracking-wider uppercase text-indigo-200">
        Đang chuyển hướng về Bàn Làm Việc Employee...
      </p>
    </div>
  );
}
