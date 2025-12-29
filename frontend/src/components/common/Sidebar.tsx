'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  AlertTriangle, 
  Activity, 
  User, 
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setIsOpen(true);
      }
    };
    
    if (typeof window !== 'undefined') {
      checkDesktop();
      window.addEventListener('resize', checkDesktop);
      return () => window.removeEventListener('resize', checkDesktop);
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: FolderKanban, label: 'Projects', path: '/admin/dashboard/projects' },
    { icon: Users, label: 'Users', path: '/admin/dashboard/users' },
    { icon: AlertTriangle, label: 'Risks', path: '/admin/dashboard/risks' },
    { icon: Activity, label: 'Activity', path: '/admin/dashboard/activity' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/dashboard/analytics' },
    { icon: User, label: 'Profile', path: '/admin/dashboard/profile' },
  ];

  const employeeMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/employee/dashboard' },
    { icon: FolderKanban, label: 'Projects', path: '/employee/dashboard/projects' },
    { icon: AlertTriangle, label: 'Risks', path: '/employee/dashboard/risks' },
    { icon: User, label: 'Profile', path: '/employee/dashboard/profile' },
  ];

  const clientMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/client/dashboard' },
    { icon: FolderKanban, label: 'Projects', path: '/client/dashboard/projects' },
    { icon: User, label: 'Profile', path: '/client/dashboard/profile' },
  ];

  let menuItems: { icon: any; label: string; path: string }[] = [];
  if (user?.role === 'ADMIN') {
    menuItems = adminMenuItems;
  } else if (user?.role === 'EMPLOYEE') {
    menuItems = employeeMenuItems;
  } else if (user?.role === 'CLIENT') {
    menuItems = clientMenuItems;
  }

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Toggle Button */}
      {!isDesktop && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-[999] p-2 rounded-lg bg-gray-900 text-white shadow-lg hover:bg-gray-800 transition-colors"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Overlay for Mobile */}
      <AnimatePresence>
        {isOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-[997] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isDesktop ? 0 : (isOpen ? 0 : '-100%')
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed lg:fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-[998] shadow-sm"
      >
        {/* Logo Section */}
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">ProjectPulse</h1>
        </div>

        {/* User Info Section */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <User size={20} className="text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role || 'Role'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item, index) => {
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link href={item.path} onClick={() => !isDesktop && setIsOpen(false)}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer
                        ${active 
                          ? 'bg-gray-900 text-white shadow-sm' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <item.icon 
                        size={20} 
                        className={active ? 'text-white' : 'text-gray-500'} 
                      />
                      <span className="text-sm font-medium flex-1">{item.label}</span>
                      {active && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-1.5 h-1.5 rounded-full bg-white"
                        />
                      )}
                    </motion.div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm shadow-sm"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
}

