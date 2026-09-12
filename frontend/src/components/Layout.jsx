import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isStaff = location.pathname.startsWith('/staff');
  const staffToken = sessionStorage.getItem('staffToken');

  function handleLogout() {
    sessionStorage.removeItem('staffToken');
    navigate('/staff/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 flex flex-col">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v7H6v-7z" />
              </svg>
            </div>
            <span className="text-base font-bold text-gray-900 tracking-tight">
              Campus<span className="text-indigo-600">Print</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-sm font-medium">
            {!isStaff && (
              <>
                <NavLink to="/order/new">New Order</NavLink>
                <NavLink to="/my-orders">My Orders</NavLink>
              </>
            )}
            {isStaff && staffToken && (
              <>
                <NavLink to="/staff/dashboard">Dashboard</NavLink>
                <button
                  onClick={handleLogout}
                  className="ml-1 px-3 py-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              </>
            )}
            {isStaff && !staffToken && (
              <NavLink to="/staff/login">Staff Login</NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 page-enter">
        {children}
      </main>

      <footer className="border-t border-gray-100 bg-white/60 text-center text-xs text-gray-400 py-4">
        <span className="font-medium text-gray-500">CampusPrint</span> — Digital Xerox &amp; Stationery
      </footer>
    </div>
  );
}

function NavLink({ to, children }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-gray-600 hover:text-indigo-700 hover:bg-indigo-50'
      }`}
    >
      {children}
    </Link>
  );
}
