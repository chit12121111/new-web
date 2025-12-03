'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Library,
  CreditCard,
  Settings,
  Users,
  FileText,
  DollarSign,
  Webhook,
  FileCode,
  ShoppingBag,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  roles?: string[];
}

const userNavItems: NavItem[] = [
  {
    name: 'sidebar.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'sidebar.ai_generate',
    href: '/dashboard/generate',
    icon: Sparkles,
    roles: ['TRYOUT', 'BASIC', 'PRO', 'ADMIN'],
  },
  {
    name: 'sidebar.content_library',
    href: '/dashboard/library',
    icon: Library,
  },
  {
    name: 'sidebar.store',
    href: '/dashboard/store',
    icon: ShoppingBag,
  },
  {
    name: 'sidebar.subscription',
    href: '/dashboard/subscription',
    icon: CreditCard,
  },
  {
    name: 'sidebar.settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

const adminNavItems: NavItem[] = [
  {
    name: 'sidebar.admin_dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'sidebar.users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'sidebar.contents',
    href: '/admin/contents',
    icon: FileText,
  },
  {
    name: 'sidebar.templates',
    href: '/admin/templates',
    icon: FileCode,
  },
  {
    name: 'sidebar.payments',
    href: '/admin/payments',
    icon: DollarSign,
  },
  {
    name: 'sidebar.webhooks',
    href: '/admin/webhooks',
    icon: Webhook,
  },
];

interface SidebarProps {
  isAdmin?: boolean;
}

export default function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { locale } = useLanguageStore();
  const [t, setT] = useState<any>({});

  useEffect(() => {
    import(`../../messages/${locale}.json`).then((msgs) => {
      setT(msgs.default);
    });
  }, [locale]);

  const getText = (key: string) => {
    const keys = key.split('.');
    let value = t;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const navItems = isAdmin ? adminNavItems : userNavItems;

  const canAccessItem = (item: NavItem) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || '');
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              if (!canAccessItem(item)) return null;

              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon
                    className={cn(
                      'mr-3 flex-shrink-0 h-5 w-5',
                      isActive ? 'text-primary-700' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {getText(item.name)}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Credits Display for User Sidebar */}
        {!isAdmin && user && (
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="w-full">
              <p className="text-xs font-medium text-gray-500 mb-2">
                {getText('generate.credits_remaining')}
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{getText('generate.seo_articles')}:</span>
                  <span className="font-semibold text-gray-900">
                    {user.seoCredits}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{getText('generate.reel_scripts')}:</span>
                  <span className="font-semibold text-gray-900">
                    {user.reelCredits}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

