import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, BarChart3, Package, FolderTree, Boxes,
  Users, FileText, Settings, LogOut, ChevronLeft, Store, Shield
} from 'lucide-react';
import { useAuth } from '@/lib/pos-context';

const navItems = [
  { label: 'Dashboard',        icon: LayoutDashboard, path: '/admin' },
  { label: 'Counter POS',      icon: Store,           path: '/order' },
  { label: 'Stock & Inventory',icon: Boxes,           path: '/admin/stock' },
  { label: 'Products',         icon: Package,         path: '/admin/products' },
  { label: 'Categories',       icon: FolderTree,      path: '/admin/categories' },
  { label: 'Sales History',    icon: BarChart3,       path: '/admin/sales' },
  { label: 'Staff Users',      icon: Users,           path: '/admin/employees' },
  { label: 'Reports',          icon: FileText,        path: '/admin/reports' },
  { label: 'Settings',         icon: Settings,        path: '/admin/settings' },
];

interface AdminSidebarProps {
  children: React.ReactNode;
}

const AdminSidebar = ({ children }: AdminSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { userName, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <motion.aside
        animate={{ width: collapsed ? 76 : 260 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col bg-card border-r select-none z-20 flex-shrink-0"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-soft font-bold text-lg">
            🛒
          </div>
          {!collapsed && (
            <div>
              <span className="font-bold text-base whitespace-nowrap block leading-none">TuckShop POS</span>
              <span className="text-[10px] text-primary font-semibold uppercase tracking-wider">Management Portal</span>
            </div>
          )}
        </div>

        {/* Quick POS Mode Button */}
        <div className="p-3">
          <button
            onClick={() => navigate('/order')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl gradient-primary text-primary-foreground text-xs font-bold shadow-soft hover:opacity-95 transition-opacity"
            title="Open Counter POS Screen"
          >
            <Store className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Open Counter POS</span>}
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-2 px-3 space-y-1 overflow-y-auto pos-scrollbar">
          {navItems.map(item => {
            const isActive =
              item.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User Info & Controls */}
        <div className="p-3 border-t space-y-1.5">
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/50 mb-1">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">{userName || 'Administrator'}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Tuck Shop Admin</p>
              </div>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <ChevronLeft className={`w-4 h-4 flex-shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span>Collapse Menu</span>}
          </button>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs text-destructive hover:bg-destructive/10 transition-all font-medium"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
};

export default AdminSidebar;
