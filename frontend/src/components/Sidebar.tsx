import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, User, FileText, Briefcase, 
  Brain, Code, MessageSquare, Users, 
  FileBarChart, Settings, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Resume', href: '/resume', icon: FileText },
  { name: 'Job Description', href: '/job-description', icon: Briefcase },
  { name: 'Interview Config', href: '/interview/config', icon: Brain },
  { name: 'Aptitude', href: '/interview/aptitude', icon: Brain, disabled: true },
  { name: 'Coding', href: '/interview/coding', icon: Code, disabled: true },
  { name: 'Communication', href: '/interview/communication', icon: MessageSquare, disabled: true },
  { name: 'HR Interview', href: '/interview/hr', icon: Users, disabled: true },
  { name: 'Reports', href: '/report', icon: FileBarChart, disabled: true },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside
      className={`fixed left-0 top-0 z-50 h-screen bg-white border-r border-gray-200 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          {!collapsed && (
            <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-primary-600">
              <Brain className="h-8 w-8" />
              <span>AI Interview</span>
            </NavLink>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" role="navigation" aria-label="Main navigation">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/' && location.pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {!collapsed && !item.disabled && <span>{item.name}</span>}
                {collapsed && !item.disabled && (
                  <span className="absolute left-20 top-2 bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm shadow-lg whitespace-nowrap">
                    {item.name}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          {!collapsed && user && (
            <div className="mb-4 px-3 py-2 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900 truncate">{user.full_name || user.email}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={logout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            {!collapsed && <span>Sign out</span>}
            {collapsed && (
              <span className="absolute left-20 top-2 bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm shadow-lg whitespace-nowrap">
                Sign out
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}