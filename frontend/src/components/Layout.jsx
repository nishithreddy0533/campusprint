import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isStaff = location.pathname.startsWith('/staff');
  const staffToken = sessionStorage.getItem('staffToken');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  function handleLogout() {
    sessionStorage.removeItem('staffToken');
    navigate('/staff/login');
  }

  return (
    <div className="bg-app relative">
      {/* Background floating blobs */}
      <div className="bg-blob bg-blob-1" aria-hidden="true" />
      <div className="bg-blob bg-blob-2" aria-hidden="true" />
      <div className="bg-blob bg-blob-3" aria-hidden="true" />

      {/* Navbar */}
      <header className={`sticky top-0 z-50 navbar-glass ${scrolled ? 'scrolled' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200/60 group-hover:shadow-indigo-300/70 transition-shadow duration-300">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v7H6v-7z" />
              </svg>
            </div>
            <span className="text-base font-bold text-gray-900 tracking-tight">
              Campus<span className="gradient-text">Print</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1 text-sm font-medium">
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
                  className="ml-2 px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                >
                  Logout
                </button>
              </>
            )}
            {isStaff && !staffToken && (
              <NavLink to="/staff/login">Staff Login</NavLink>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-xl text-gray-500 hover:bg-indigo-50 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-white/60 bg-white/90 backdrop-blur-xl px-4 py-3 space-y-1 animate-fade-in-up">
            {!isStaff && (
              <>
                <MobileNavLink to="/order/new">New Order</MobileNavLink>
                <MobileNavLink to="/my-orders">My Orders</MobileNavLink>
              </>
            )}
            {isStaff && staffToken && (
              <>
                <MobileNavLink to="/staff/dashboard">Dashboard</MobileNavLink>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            )}
            {isStaff && !staffToken && (
              <MobileNavLink to="/staff/login">Staff Login</MobileNavLink>
            )}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 page-enter">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/60 mt-8 py-6 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-gray-400">
          <span className="font-semibold text-gray-500">CampusPrint</span>
          <span className="hidden sm:block">·</span>
          <span>Digital Xerox &amp; Stationery</span>
          <span className="hidden sm:block">·</span>
          <span>Print Smarter, Skip the Queue</span>
        </div>
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
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-indigo-50 text-indigo-700 shadow-sm'
          : 'text-gray-600 hover:text-indigo-700 hover:bg-indigo-50/70'
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ to, children }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-indigo-50'
      }`}
    >
      {children}
    </Link>
  );
}
