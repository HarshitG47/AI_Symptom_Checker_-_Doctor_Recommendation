import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sun, Moon, LogOut, User, Menu, X,
  LayoutDashboard, ClipboardList, ChevronDown
} from 'lucide-react';
import dooperLogo from '/dooperlogo.png';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
    setProfileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-border-light dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 group">
            <img
              src={dooperLogo}
              alt="Dooper"
              className="h-9 w-auto object-contain transition-all duration-300 group-hover:scale-105"
            />
            <span className="block text-[10px] font-medium text-text-muted dark:text-slate-400 tracking-widest uppercase">DOOPER</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/dashboard')
                      ? 'bg-primary-light text-primary dark:bg-primary/20'
                      : 'text-text-secondary dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-800'
                    }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg text-text-secondary dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-800 transition-all duration-200"
                  title="Toggle theme"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-800 transition-all duration-200"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user.fullName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="max-w-[100px] truncate">{user.fullName?.split(' ')[0]}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-border-light dark:border-slate-700 py-1 z-50">
                      <div className="px-4 py-3 border-b border-border-light dark:border-slate-700">
                        <p className="text-sm font-semibold text-text-primary dark:text-slate-100 truncate">{user.fullName}</p>
                        <p className="text-xs text-text-muted dark:text-slate-400 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-800 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>
                      <Link
                        to="/history"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-800 transition-colors"
                      >
                        <ClipboardList className="w-4 h-4" />
                        Assessment History
                      </Link>
                      <div className="border-t border-border-light dark:border-slate-700 mt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg text-text-secondary dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-800 transition-all duration-200"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <Link to="/login" className="px-4 py-2 text-sm font-semibold text-text-secondary dark:text-slate-300 hover:text-primary transition-colors">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-5">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-text-secondary dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-800 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-border-light dark:border-slate-800 px-4 pb-4">
          {user ? (
            <div className="pt-3 space-y-1">
              <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-surface dark:bg-slate-800 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{user.fullName?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary dark:text-slate-100">{user.fullName}</p>
                  <p className="text-xs text-text-muted dark:text-slate-400">{user.email}</p>
                </div>
              </div>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-text-secondary dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-800 rounded-lg transition-colors">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-text-secondary dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-800 rounded-lg transition-colors">
                <User className="w-4 h-4" /> My Profile
              </Link>
              <Link to="/history" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-text-secondary dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-800 rounded-lg transition-colors">
                <ClipboardList className="w-4 h-4" /> Assessment History
              </Link>
              <button onClick={toggleTheme} className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-text-secondary dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-800 rounded-lg transition-colors">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          ) : (
            <div className="pt-3 space-y-2">
              <button onClick={toggleTheme} className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-text-secondary dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-800 rounded-lg transition-colors">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-semibold text-text-secondary dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-800 rounded-lg transition-colors">
                Login
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm font-semibold text-center bg-primary text-white rounded-lg">
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {profileOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
      )}
    </nav>
  );
};

export default Navbar;
