import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  CalendarClock,
  UtensilsCrossed,
  Boxes,
  Users,
  TrendingUp,
  FileBarChart2,
  Settings,
  LogOut,
  Search,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { formatCurrency } from '../utils/analytics';
import type { Customer, MenuItem, Order } from '../types';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/reservations', label: 'Reservations', icon: CalendarClock },
  { to: '/menu', label: 'Menu Management', icon: UtensilsCrossed },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/analytics', label: 'Business Analytics', icon: TrendingUp },
  { to: '/reports', label: 'Reports', icon: FileBarChart2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    orders: Order[];
    menu: MenuItem[];
    customers: Customer[];
  }>({ orders: [], menu: [], customers: [] });
  const [avatarError, setAvatarError] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults({ orders: [], menu: [], customers: [] });
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const [ordersRes, menuRes, customersRes] = await Promise.all([
          api.get<{ data: Order[] }>('/orders'),
          api.get<{ data: MenuItem[] }>('/menu'),
          api.get<{ data: Customer[] }>('/customers'),
        ]);
        if (cancelled) return;
        setSearchResults({
          orders: ordersRes.data.data
            .filter(
              (o) =>
                o.orderCode.toLowerCase().includes(q) ||
                o.customerName.toLowerCase().includes(q) ||
                o.status.toLowerCase().includes(q)
            )
            .slice(0, 4),
          menu: menuRes.data.data
            .filter(
              (m) =>
                m.name.toLowerCase().includes(q) ||
                m.category.toLowerCase().includes(q)
            )
            .slice(0, 4),
          customers: customersRes.data.data
            .filter(
              (c) =>
                c.name.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q) ||
                c.phone.toLowerCase().includes(q)
            )
            .slice(0, 4),
        });
      } catch {
        // ignore search fetch errors
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const hasResults =
    searchResults.orders.length > 0 ||
    searchResults.menu.length > 0 ||
    searchResults.customers.length > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200/90 z-30">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-[#0F172A] whitespace-nowrap">
            BaryoBite
          </span>
        </div>

        <nav aria-label="Main Navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-[#0F172A]'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-white h-full flex flex-col border-r border-slate-200 z-10">
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <span className="font-display text-lg font-bold text-[#0F172A]">BaryoBite</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav aria-label="Mobile Navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-[#0F172A]'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 flex-1 max-w-md" ref={searchContainerRef}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search orders, products, or customers..."
                aria-label="Search orders, products, or customers"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 py-2 text-sm text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-colors"
              />

              {searchOpen && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-lg py-2 z-50 max-h-96 overflow-y-auto">
                  {!hasResults ? (
                    <div className="px-4 py-3 text-sm text-slate-500">
                      No matching orders, menu items, or customers found.
                    </div>
                  ) : (
                    <>
                      {searchResults.orders.length > 0 && (
                        <div className="px-3 py-1.5">
                          <div className="px-2 py-1 text-xs font-semibold text-slate-400">
                            Orders
                          </div>
                          {searchResults.orders.map((o) => (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => {
                                setSearchOpen(false);
                                navigate('/orders');
                              }}
                              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-sm hover:bg-slate-50"
                            >
                              <span className="font-medium text-[#0F172A]">
                                {o.orderCode} &middot; {o.customerName}
                              </span>
                              <span className="font-mono-tabular text-xs text-slate-600">
                                {formatCurrency(o.totalAmount)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {searchResults.menu.length > 0 && (
                        <div className="px-3 py-1.5 border-t border-slate-100">
                          <div className="px-2 py-1 text-xs font-semibold text-slate-400">
                            Menu Items
                          </div>
                          {searchResults.menu.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setSearchOpen(false);
                                navigate('/menu');
                              }}
                              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-sm hover:bg-slate-50"
                            >
                              <span className="font-medium text-[#0F172A]">{m.name}</span>
                              <span className="font-mono-tabular text-xs text-slate-600">
                                {formatCurrency(m.price)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {searchResults.customers.length > 0 && (
                        <div className="px-3 py-1.5 border-t border-slate-100">
                          <div className="px-2 py-1 text-xs font-semibold text-slate-400">
                            Customers
                          </div>
                          {searchResults.customers.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSearchOpen(false);
                                navigate('/customers');
                              }}
                              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-sm hover:bg-slate-50"
                            >
                              <span className="font-medium text-[#0F172A]">{c.name}</span>
                              <span className="text-xs text-slate-500">{c.loyaltyTier}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Profile Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-[#0F172A] leading-tight">
                {user?.name || 'Manager'}
              </div>
              <div className="text-xs text-slate-500">{user?.role || 'Admin'}</div>
            </div>
            {!avatarError ? (
              <img
                src="/src/assets/images/avatar_restaurant_manager_1793962102510.jpg"
                alt={user?.name || 'Restaurant Manager'}
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
                className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                {(user?.name || 'M').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
