import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuthContext();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Stock Screener', href: '/screener' },
    { name: 'Company Search', href: '/search' },
    { name: 'Database (Public)', href: '/supabase-test' },
    { name: 'Database (Private)', href: '/private-db' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <header className="glass-strong sticky top-0 z-50 mb-8">
      <div className="container">
        <nav className="flex items-center justify-between py-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">IC</span>
            </div>
            <span className="text-xl font-bold text-primary">Iron Capital</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  isActive(item.href)
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-glass-bg'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Auth Button */}
            {user ? (
              <button
                onClick={() => signOut()}
                className="btn btn-glass text-sm"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                className={`btn btn-primary text-sm ${
                  isActive('/login') ? 'ring-2 ring-white/30' : ''
                }`}
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg glass hover:glass-strong transition-all duration-300"
            aria-label="Toggle menu"
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              <span
                className={`w-5 h-05 bg-text-primary transform transition-all duration-300 ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-1' : ''
                }`}
              />
              <span
                className={`w-5 h-05 bg-text-primary transition-all duration-300 my-1 ${
                  isMobileMenuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`w-5 h-05 bg-text-primary transform transition-all duration-300 ${
                  isMobileMenuOpen ? '-rotate-45 -translate-y-1' : ''
                }`}
              />
            </div>
          </button>
        </nav>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-glass-border">
            <div className="flex flex-col gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg transition-all duration-300 ${
                    isActive(item.href)
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-glass-bg'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Auth Button */}
              {user ? (
                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-4 py-3 rounded-lg text-left text-text-secondary hover:text-text-primary hover:bg-glass-bg transition-all duration-300"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg transition-all duration-300 ${
                    isActive('/login')
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-glass-bg'
                  }`}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;