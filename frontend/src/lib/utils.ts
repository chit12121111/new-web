import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function getRoleBadgeColor(role: string): string {
  switch (role.toUpperCase()) {
    case 'ADMIN':
      return 'bg-red-100 text-red-800';
    case 'PRO':
      return 'bg-purple-100 text-purple-800';
    case 'BASIC':
      return 'bg-blue-100 text-blue-800';
    case 'TRYOUT':
      return 'bg-yellow-100 text-yellow-800';
    case 'FREE':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function canAccessFeature(role: string, feature: string): boolean {
  const roleHierarchy = ['GUEST', 'FREE', 'TRYOUT', 'BASIC', 'PRO', 'ADMIN'];
  
  const featureRequirements: Record<string, string[]> = {
    dashboard: ['TRYOUT', 'FREE', 'BASIC', 'PRO', 'ADMIN'],
    aiGenerate: ['TRYOUT', 'BASIC', 'PRO', 'ADMIN'],
    contentLibrary: ['TRYOUT', 'FREE', 'BASIC', 'PRO', 'ADMIN'],
    admin: ['ADMIN'],
  };

  const requiredRoles = featureRequirements[feature] || [];
  return requiredRoles.includes(role.toUpperCase());
}

