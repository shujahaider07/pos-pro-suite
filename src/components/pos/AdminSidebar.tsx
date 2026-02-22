import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, BarChart3, Package, FolderTree, Grid3X3,
  Users, FileText, Settings, LogOut, UtensilsCrossed, ChevronLeft
} from 'lucide-react';
import { useAuth } from '@/lib/pos-context';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Sales Analytics', icon: BarChart3, path: '/admin/sales' },
  { label: 'Products', icon: Package, path: '/admin/products' },
  { label: 'Categories', icon: FolderTree, path: '/admin/categories' },
  { label: 'Tables', icon: Grid3X3, path: '/admin/tables' },
  { label: 'Employees', icon: Users, path: '/admin/employees' },
  { label: 'Reports', icon: FileText, path: '/admin/reports' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

interface AdminSidebarProps {
  children: React.ReactNode;
}

const AdminSidebar = ({ children }: AdminSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-background">
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col bg-card border-r overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <UtensilsCrossed className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-bold text-base whitespace-nowrap">RestoPOS</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t space-y-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <ChevronLeft className={`w-4 h-4 flex-shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span>Collapse</span>}
          </button>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminSidebar;
