import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Tag,
  Truck,
  MessageSquare,
  FileText,
  Boxes,
  Ticket,
  UserCog,
  User,
  ShoppingBasket
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function AdminSidebar() {
  const { t } = useLanguage();
  const { signOut, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast({
      title: t('logout'),
      description: 'You have been logged out successfully.',
    });
    navigate('/login');
  };

  // Determine base path based on role
  const getBasePath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'manager') return '/manager';
    if (role === 'support') return '/support';
    return '/admin';
  };

  const basePath = getBasePath();

  // Get panel name based on role
  const getPanelName = () => {
    if (role === 'admin') return 'Admin Panel';
    if (role === 'manager') return 'Manager Panel';
    if (role === 'support') return 'Support Panel';
    return 'Dashboard';
  };

  // Menu items - visibility based on role
  const allMenuItems = [
    { title: t('nav.dashboard'), url: `${basePath}/dashboard`, icon: LayoutDashboard, roles: ['admin', 'manager', 'support'] },
    { title: t('nav.products'), url: `${basePath}/products`, icon: Package, roles: ['admin', 'manager'] },
    { title: t('nav.orders'), url: `${basePath}/orders`, icon: ShoppingCart, roles: ['admin', 'manager', 'support'] },
    { title: t('nav.customers'), url: `${basePath}/customers`, icon: Users, roles: ['admin', 'manager', 'support'] },
    { title: t('nav.categories'), url: "/admin/categories", icon: Tag, roles: ['admin'] },
    { title: t('nav.analytics'), url: "/admin/analytics", icon: BarChart3, roles: ['admin'] },
  ];

  // Management items - visibility based on role
  const allManagementItems = [
    { title: t('nav.shipping'), url: `${role === 'admin' ? '/admin' : '/manager'}/shipping`, icon: Truck, roles: ['admin', 'manager'] },
    { title: t('nav.inventory'), url: "/admin/inventory", icon: Boxes, roles: ['admin'] },
    { title: t('nav.coupons'), url: `${role === 'admin' ? '/admin' : '/manager'}/coupons`, icon: Ticket, roles: ['admin', 'manager'] },
    { title: "Abandoned Carts", url: "/admin/abandoned-carts", icon: ShoppingBasket, roles: ['admin'] },
    { title: t('nav.messages'), url: `${basePath}/messages`, icon: MessageSquare, roles: ['admin', 'manager', 'support'] },
    { title: t('nav.reports'), url: "/admin/reports", icon: FileText, roles: ['admin'] },
    { title: t('nav.roles'), url: "/admin/roles", icon: UserCog, roles: ['admin'] },
  ];

  // Filter items based on role
  const menuItems = allMenuItems.filter(item => role && item.roles.includes(role));
  const managementItems = allManagementItems.filter(item => role && item.roles.includes(role));

  const bottomMenuItems = [
    { title: t('nav.profile'), url: `${basePath}/profile`, icon: User, roles: ['admin', 'manager', 'support'] },
    { title: t('nav.settings'), url: "/admin/settings", icon: Settings, roles: ['admin'] },
  ].filter(item => role && item.roles.includes(role));

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar transition-transform">
      <div className="flex h-full flex-col overflow-y-auto px-4 py-6">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <span className="font-display text-lg font-bold text-sidebar-primary-foreground">E</span>
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-sidebar-foreground">Ekta</h1>
            <p className="text-xs text-sidebar-muted">
              {getPanelName()}
            </p>
          </div>
        </div>

        {/* Main Menu */}
        <nav className="flex-1 space-y-6">
          <div>
            <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-muted">
              {t('nav.menu')}
            </p>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  end={item.url.endsWith('/dashboard')}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  activeClassName="bg-sidebar-accent text-sidebar-foreground"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </div>
          </div>

          {/* Management Section */}
          {managementItems.length > 0 && (
            <div>
              <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-muted">
                {t('nav.management')}
              </p>
              <div className="space-y-1">
                {managementItems.map((item) => (
                  <NavLink
                    key={item.url}
                    to={item.url}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    activeClassName="bg-sidebar-accent text-sidebar-foreground"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom Menu */}
        <div className="mt-auto space-y-1 border-t border-sidebar-border pt-4">
          {bottomMenuItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
              activeClassName="bg-sidebar-accent text-sidebar-foreground"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </NavLink>
          ))}
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-all hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
