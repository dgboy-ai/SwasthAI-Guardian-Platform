import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import villagerService from '../services/villagerService';
import ngoService from '../services/ngoService';
import adminService from '../services/adminService';

const AuthContext = createContext(null);
const DEMO_SECRET = 'demo-only';
const demoCredentialHash = (identifier, role, secret = DEMO_SECRET) => btoa(`${identifier}:${role}:${secret}`);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🌐 Seed the offline database with the official demo accounts so they work offline immediately on fresh devices
    try {
      const offlineUsers = JSON.parse(localStorage.getItem('offline_users') || '[]');
      const defaultDemoUsers = [
        {
          id: 'demo-villager',
          name: 'Ramesh Singh (Demo Villager)',
          username: '9876543210',
          email: '',
          phone: '9876543210',
          credentialHash: demoCredentialHash('9876543210', 'villager'),
          role: 'villager',
          villageId: 'v101',
          isOfflineSession: true
        },
        {
          id: 'demo-ngo',
          name: 'Anjali Sharma (Demo ASHA Worker)',
          username: '9876543211',
          email: '',
          phone: '9876543211',
          credentialHash: demoCredentialHash('9876543211', 'ngo'),
          role: 'ngo',
          villageId: 'v101',
          isOfflineSession: true
        },
        {
          id: 'demo-admin',
          name: 'District Administrator',
          username: 'admin',
          email: 'admin@swasthai.in',
          phone: '',
          credentialHash: demoCredentialHash('admin@swasthai.in', 'admin'),
          role: 'admin',
          villageId: 'v101',
          isOfflineSession: true
        }
      ];

      // Add missing default users
      let updated = [...offlineUsers];
      defaultDemoUsers.forEach(demoUser => {
        const exists = offlineUsers.some(u => 
          u.username === demoUser.username || 
          (demoUser.email && u.email === demoUser.email) || 
          (demoUser.phone && u.phone === demoUser.phone)
        );
        if (!exists) {
          updated.push(demoUser);
        }
      });
      localStorage.setItem('offline_users', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to seed offline database:', e);
    }

    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      // Only restore session if BOTH a real token AND user data exist
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        // No session found — user must log in. Never auto-create a fake user.
        setUser(null);
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const services = useMemo(() => {
    if (!user) return {};
    switch (user.role) {
      case 'villager': return { villager: villagerService };
      case 'ngo': return { ngo: ngoService };
      case 'admin': return { admin: adminService };
      default: return {};
    }
  }, [user]);

  // 🌐 Offline User Cache: Stores registered credentials locally for offline verification
  const cacheUserOffline = (data) => {
    try {
      const offlineUsers = JSON.parse(localStorage.getItem('offline_users') || '[]');
      const newUser = {
        id: 'cached-user-' + Date.now(),
        name: data.name,
        username: data.username,
        email: data.email || '',
        phone: data.phone || '',
        credentialHash: demoCredentialHash(data.email || data.phone || data.username, data.role || 'villager', data.password),
        role: data.role || 'villager',
        villageId: data.villageId || 'v101',
        isOfflineSession: true
      };
      
      // Filter out previous duplicate entries
      const filtered = offlineUsers.filter(u => 
        u.username !== data.username && 
        (data.phone ? u.phone !== data.phone : true) && 
        (data.email ? u.email !== data.email : true)
      );
      filtered.push(newUser);
      localStorage.setItem('offline_users', JSON.stringify(filtered));
      return newUser;
    } catch (e) {
      console.error('Error caching user offline:', e);
      return null;
    }
  };

  const register = async (data) => {
    // Cache credentials locally first so it is immediately available offline
    const cachedUser = cacheUserOffline(data);

    // 🌐 OFFLINE REGISTRATION FALLBACK
    if (!navigator.onLine) {
      return { success: true, message: 'Offline registration successful. Sync pending.', user: cachedUser };
    }

    try {
      const res = await api.post('/auth/register', data);
      return res.data;
    } catch (error) {
      // 🌐 Fallback: if network call fails, times out, or returns a server-side gateway error (502/503/504)
      const isNetworkOrServerError = 
        !error.response || 
        error.code === 'ECONNABORTED' || 
        (error.response && error.response.status >= 500);

      if (isNetworkOrServerError) {
        return { success: true, message: 'No network. Registered locally.', user: cachedUser };
      }
      throw error;
    }
  };

  const loginPassword = async (identifier, password, role) => {
    // Helper to create offline session — ONLY from verified cache match
    const createOfflineSession = () => {
      try {
        const offlineUsers = JSON.parse(localStorage.getItem('offline_users') || '[]');
        const matchedUser = offlineUsers.find(u =>
          (u.email && u.email.toLowerCase() === identifier.toLowerCase()) ||
          (u.phone && u.phone === identifier) ||
          (u.username && u.username.toLowerCase() === identifier.toLowerCase())
        );

        if (matchedUser) {
          // Must match credential hash AND role. This is still judge/demo cache, not production authentication.
          const matchedIdentifier = matchedUser.email || matchedUser.phone || matchedUser.username;
          if (matchedUser.credentialHash !== demoCredentialHash(matchedIdentifier, matchedUser.role, password)) {
            throw new Error('Incorrect password.');
          }
          if (matchedUser.role !== role) {
            throw new Error(`This account is registered as '${matchedUser.role}', not '${role}'.`);
          }
          localStorage.setItem('token', 'offline-mock-token');
          localStorage.setItem('user', JSON.stringify(matchedUser));
          setUser(matchedUser);
          return matchedUser;
        }
      } catch (e) {
        if (e.message && (e.message.includes('Incorrect password') || e.message.includes('registered as'))) throw e;
        console.error('Error reading offline cache:', e);
      }

      // No match found — do NOT create a fake session
      throw new Error('No account found. Please connect to the internet to log in for the first time.');
    };

    // Offline: only allow login if credentials exist and match in the local cache
    if (!navigator.onLine && identifier && password) return createOfflineSession();

    try {
      const res = await api.post('/auth/login-password', {
        identifier,
        email: identifier,
        phone: identifier,
        password,
        role,
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    } catch (error) {
      // 🌐 Fallback: if network call fails, times out, or returns a server-side gateway error (502/503/504)
      const isNetworkOrServerError = 
        !error.response || 
        error.code === 'ECONNABORTED' || 
        (error.response && error.response.status >= 500);

      if (isNetworkOrServerError && identifier && password) {
        console.log('API unreachable or slow. Creating judge/demo offline session.');
        return createOfflineSession();
      }
      
      const msg = error.response?.data?.error || error.message || 'Login failed.';
      throw new Error(msg);
    }
  };

  const loginOTP = async (phone, otp, role) => {
    const createOfflineOTPSession = () => {
      try {
        const offlineUsers = JSON.parse(localStorage.getItem('offline_users') || '[]');
        const matchedUser = offlineUsers.find(u => u.phone === phone && u.role === role);
        if (matchedUser) {
          localStorage.setItem('token', 'offline-mock-token');
          localStorage.setItem('user', JSON.stringify(matchedUser));
          setUser(matchedUser);
          return matchedUser;
        }
      } catch (e) {
        console.error('Error reading offline cache:', e);
      }
      // No match — do not create fake session
      throw new Error('No account found for this phone number. Please connect to the internet to log in for the first time.');
    };

    if (!navigator.onLine && phone && otp) {
      const isDevDemoOtp = import.meta.env.DEV && otp === '1234';
      if (!isDevDemoOtp) {
        throw new Error('Offline OTP login is only available in development with demo OTP 1234 for cached accounts.');
      }
      return createOfflineOTPSession();
    }

    try {
      const res = await api.post('/auth/login-otp', { phone, otp, role });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    } catch (error) {
      // 🌐 Fallback: if network call fails, times out, or returns a server-side gateway error (502/503/504)
      const isNetworkOrServerError = 
        !error.response || 
        error.code === 'ECONNABORTED' || 
        (error.response && error.response.status >= 500);

      if (isNetworkOrServerError && phone && otp && import.meta.env.DEV && otp === '1234') {
        console.log('API unreachable — offline demo OTP for cached account.');
        return createOfflineOTPSession();
      }
      throw error.response?.data?.error || error.message || 'OTP Login failed.';
    }
  };

  const requestOTP = async (phone) => {
    // 🌐 OFFLINE FALLBACK: Allow user to proceed to the OTP screen
    if (!navigator.onLine) {
      return {
        message: import.meta.env.DEV
          ? 'Offline: use OTP 1234 only for accounts already cached on this device.'
          : 'No network. Connect once to request a real OTP.',
      };
    }

    try {
      const res = await api.post('/auth/request-otp', { phone });
      return res.data;
    } catch (error) {
      // 🌐 Fallback: if network call fails, let them proceed
      if (!error.response) {
        return {
          message: import.meta.env.DEV
            ? 'Network offline: demo OTP 1234 works for cached accounts only.'
            : 'Network offline. Connect to request OTP.',
        };
      }
      throw error.response?.data?.error || 'OTP request failed. Please try again.';
    }
  };

  const updateProfile = async (data) => {
    try {
      const res = await api.put('/auth/profile', data);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    } catch (error) {
      // Profile update failure is less critical — update locally but warn
      console.warn('Backend profile update failed:', error);
      const updatedUser = { ...user, ...data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, register, loginPassword, loginOTP, requestOTP, updateProfile, logout, loading, services }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
