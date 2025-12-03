'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TemplatesRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to store page instead
    router.replace('/dashboard/store');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600">Redirecting to Store...</p>
    </div>
  );
}

