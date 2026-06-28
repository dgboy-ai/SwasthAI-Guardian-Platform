import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import villagerService from '../services/villagerService';
import ngoService from '../services/ngoService';
import adminService from '../services/adminService';

// Simple, pure JavaScript implementation of SHA-256 for demo mode hashing.
function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  var mathPow = Math.pow;
  var maxWord = mathPow(2, 32);
  var lengthProperty = 'length';
  var i, j;

  var result = '';

  var words = [];
  var asciiLength = ascii[lengthProperty] * 8;
  
  var hash = [];
  var k = [];
  var primeCounter = 0;

  var isComposite = {};
  for (var candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = 1;
      }
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1/3) * maxWord) | 0;
      primeCounter++;
    }
  }
  
  ascii += '\x80';
  while (ascii[lengthProperty] % 64 - 56) {
    ascii += '\x00';
  }
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << ((3 - i % 4) * 8);
  }
  words[words[lengthProperty]] = ((asciiLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiLength | 0);
  
  for (j = 0; j < words[lengthProperty];) {
    var w = words.slice(j, j += 16);
    var oldHash = hash.slice(0);
    
    hash = hash.slice(0, 8);
    
    for (i = 0; i < 64; i++) {
      var wItem = w[i];
      if (i >= 16) {
        var s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        var s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        wItem = w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      
      var ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      var maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      var sigma0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      var sigma1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      
      var temp1 = (hash[7] + sigma1 + ch + k[i] + wItem) | 0;
      var temp2 = (sigma0 + maj) | 0;
      
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  
  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      var b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

const AuthContext = createContext(null);
const DEMO_SECRET = 'Demo@1234';
const DEMO_CREDENTIALS = [
  { id: '9876543210',       phone: '9876543210',       credentialHash: sha256('9876543210:villager:Demo@1234'),       role: 'villager', name: 'Ramesh Singh' },
  { id: '9876543211',       phone: '9876543211',       credentialHash: sha256('9876543211:ngo:Demo@1234'),            role: 'ngo',      name: 'Anjali Sharma' },
  { id: 'admin@swasthai.in', email: 'admin@swasthai.in', phone: '0000000000', credentialHash: sha256('admin@swasthai.in:admin:Demo@1234'), role: 'admin', name: 'District Administrator' },
];
const OFFLINE_CACHE_KEY = 'swasthai_offline_user_cache';
const demoCredentialHash = (identifier, role, secret = DEMO_SECRET) => sha256(`${identifier}:${role}:${secret}`);

function seedOfflineCache() {
  const existing = normalizeOfflineUsers(JSON.parse(localStorage.getItem(OFFLINE_CACHE_KEY) || '[]'));
  const merged = [...existing];
  DEMO_CREDENTIALS.forEach(demoUser => {
    const idx = merged.findIndex(u => {
      if (u.role !== demoUser.role) return false;
      if (u.id === demoUser.id || u.email === demoUser.id || u.phone === demoUser.id || u.username === demoUser.id) return true;
      if (demoUser.email && u.email === demoUser.email) return true;
      if (demoUser.phone && u.phone === demoUser.phone) return true;
      return false;
    });
    if (idx >= 0) merged[idx] = { ...merged[idx], ...demoUser };
    else merged.push(demoUser);
  });
  localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(merged));
}

function cleanUserObject(userObj) {
  if (!userObj) return userObj;
  const next = { ...userObj };
  if (next.name) {
    next.name = next.name
      .replace(/\(Demo\s+Villager\)/gi, '')
      .replace(/\(Demo\s+ASHA\s+Worker\)/gi, '')
      .replace(/\(Demo\s+ASHA\)/gi, '')
      .replace(/\(Demo\s+Admin\)/gi, '')
      .trim();
    if (next.name === 'Demo Villager') next.name = 'Ramesh Singh';
    if (next.name === 'Demo ASHA') next.name = 'Anjali Sharma';
    if (next.name === 'Demo Admin') next.name = 'District Administrator';
  }
  return next;
}

function normalizeOfflineUsers(users) {
  return (Array.isArray(users) ? users : []).map(user => {
    const identifier = user.email || user.phone || user.username || user.id;
    const next = { ...user };
    if (!next.credentialHash && next.password && identifier && next.role) {
      next.credentialHash = demoCredentialHash(identifier, next.role, next.password);
    }
    delete next.password;
    return cleanUserObject(next);
  });
}

export const AuthProvider = ({ children }) => {
  const [user, _setUser] = useState(null);
  const setUser = (val) => {
    _setUser(typeof val === 'function' ? (prev) => cleanUserObject(val(prev)) : cleanUserObject(val));
  };
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🌐 Seed the offline database with the official demo accounts so they work offline immediately on fresh devices
    try {
      const offlineUsers = normalizeOfflineUsers(JSON.parse(localStorage.getItem('swasthai_offline_user_cache') || '[]'));
      const defaultDemoUsers = [
        {
          id: 'demo-villager',
          name: 'Ramesh Singh',
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
          name: 'Anjali Sharma',
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
          phone: '0000000000',
          credentialHash: demoCredentialHash('admin@swasthai.in', 'admin'),
          role: 'admin',
          villageId: 'v101',
          isOfflineSession: true
        }
      ];

      // Add missing default users
      let updated = [...offlineUsers];
      defaultDemoUsers.forEach(demoUser => {
        const existingIndex = updated.findIndex(u => 
          u.username === demoUser.username || 
          (demoUser.email && u.email === demoUser.email) || 
          (demoUser.phone && u.phone === demoUser.phone)
        );
        if (existingIndex >= 0) {
          // Merge while ensuring we use the updated names
          updated[existingIndex] = { ...updated[existingIndex], ...demoUser };
        } else {
          updated.push(demoUser);
        }
      });
      localStorage.setItem('swasthai_offline_user_cache', JSON.stringify(updated));
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
      const offlineUsers = JSON.parse(localStorage.getItem('swasthai_offline_user_cache') || '[]');
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
      localStorage.setItem('swasthai_offline_user_cache', JSON.stringify(filtered));
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
      // 🌐 Fallback: if backend is unreachable or returns an error, use the locally cached user
      console.warn('Backend registration failed, using local cache:', error.message);
      return { success: true, message: 'Backend unavailable. Registered locally — you can log in offline.', user: cachedUser };
    }
  };

  const loginPassword = async (identifier, password, role) => {
    // Helper to create offline session — ONLY from verified cache match
    const createOfflineSession = () => {
      try {
        const offlineUsers = JSON.parse(localStorage.getItem('swasthai_offline_user_cache') || '[]');
        const matchedUser = offlineUsers.find(u =>
          (u.email && u.email.toLowerCase() === identifier.toLowerCase()) ||
          (u.phone && u.phone === identifier) ||
          (u.username && u.username.toLowerCase() === identifier.toLowerCase())
        );

        if (matchedUser) {
          // Must match credential hash AND role. This is still evaluation/demo cache, not production authentication.
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
      // 🌐 Fallback: if backend is unreachable, slow, or returns an error, try the offline cache
      if (identifier && password) {
        console.log('API call failed. Falling back to offline cache.');
        return createOfflineSession();
      }
      
      const msg = error.response?.data?.error || error.message || 'Login failed.';
      throw new Error(msg);
    }
  };

  const loginOTP = async (phone, otp, role) => {
    const createOfflineOTPSession = () => {
      try {
        const offlineUsers = JSON.parse(localStorage.getItem('swasthai_offline_user_cache') || '[]');
        const matchedUser = offlineUsers.find(u => {
          const idMatch = u.phone === phone || u.email === phone || u.username === phone || u.id === phone;
          return idMatch && u.role === role;
        });
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
      if (otp === '1234') {
        return createOfflineOTPSession();
      }
      throw new Error('Offline demo OTP is 1234 for cached accounts.');
    }

    try {
      const res = await api.post('/auth/login-otp', { phone, otp, role });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    } catch (error) {
      // 🌐 Fallback: if backend is unreachable, slow, or returns an error, try the offline cache
      if (phone && otp && otp === '1234') {
        console.log('API failed — offline demo OTP for cached account.');
        return createOfflineOTPSession();
      }
      throw error.response?.data?.error || error.message || 'OTP Login failed.';
    }
  };

  const requestOTP = async (phone) => {
    // 🌐 OFFLINE FALLBACK: Allow user to proceed to the OTP screen
    if (!navigator.onLine) {
      return {
        message: 'Offline: use OTP 1234 for accounts cached on this device.',
      };
    }

    try {
      const res = await api.post('/auth/request-otp', { phone });
      return res.data;
    } catch (error) {
      // 🌐 Fallback: if network call fails, let them proceed
      if (!error.response) {
        return {
          message: 'Network offline: demo OTP 1234 works for cached accounts.',
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
