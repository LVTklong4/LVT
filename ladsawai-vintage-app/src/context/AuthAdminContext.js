'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AuthAdminContext = createContext();

export function AuthAdminProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [adminList, setAdminList] = useState([]);
  const [adminRolesList, setAdminRolesList] = useState([]);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [selectedAdminEmail, setSelectedAdminEmail] = useState('');
  const [adminForm, setAdminForm] = useState({ name: '', role: 'Admin', status: 'เปิด' });

  // 1. Listen for Supabase auth state changes and verify admin role
  useEffect(() => {
    fetchAdminRoles();

    const checkUserSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          await verifyAndSetAdmin(session.user.email, session.user.user_metadata);
        } else {
          const savedSession = localStorage.getItem('lvt_admin_session');
          if (savedSession) {
            try {
              setAdminUser(JSON.parse(savedSession));
              return;
            } catch (e) {}
          }
          setAdminUser(null);
        }
      } finally {
        setLoadingAuth(false);
      }
    };

    checkUserSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user?.email) {
        await verifyAndSetAdmin(session.user.email, session.user.user_metadata);
      } else if (event === 'SIGNED_OUT') {
        setAdminUser(null);
        localStorage.removeItem('lvt_admin_session');
      }
      setLoadingAuth(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Securely verify admin status via Supabase DB table
  const verifyAndSetAdmin = async (email, googleUserMetadata = null) => {
    try {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const { data: admin, error } = await supabase
        .from('admin_roles')
        .select('*')
        .ilike('email', cleanEmail)
        .eq('status', 'เปิด')
        .maybeSingle();

      if (admin) {
        const enrichedAdmin = {
          ...admin,
          picture: googleUserMetadata?.avatar_url || googleUserMetadata?.picture || admin.picture || null
        };
        setAdminUser(enrichedAdmin);
        localStorage.setItem('lvt_admin_session', JSON.stringify(enrichedAdmin));

        // Clean access_token from URL Hash for clean UX
        if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        return { success: true, admin: enrichedAdmin };
      } else {
        await supabase.auth.signOut();
        setAdminUser(null);
        localStorage.removeItem('lvt_admin_session');
        if (typeof window !== 'undefined' && window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        return { success: false, error: 'อีเมลนี้ไม่มีสิทธิ์เข้าใช้งานระบบ โปรดติดต่อผู้ดูแลหลัก' };
      }
    } catch (e) {
      console.error('Admin verification error:', e);
      setAdminUser(null);
      return { success: false, error: e.message };
    }
  };

  const fetchAdminRoles = async () => {
    setLoadingSettings(true);
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('*')
        .order('email');
      if (error) throw error;
      setAdminRolesList(data || []);
      setAdminList(data || []);
    } catch (e) {
      console.error('Error fetching admin roles:', e);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      if (data?.user?.email) {
        await verifyAndSetAdmin(data.user.email);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message || 'เข้าสู่ระบบไม่สำเร็จ' };
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined
        }
      });
      if (error) throw error;
    } catch (e) {
      console.error('Google login error:', e);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setAdminUser(null);
      localStorage.removeItem('lvt_admin_session');
    }
  };

  const handleSaveAdminRole = async (email, roleObj) => {
    setLoadingSettings(true);
    try {
      const payload = {
        email: email,
        name: roleObj.name || email.split('@')[0],
        role: roleObj.role || 'Admin',
        status: roleObj.status || 'เปิด',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('admin_roles').upsert(payload);
      if (error) throw error;
      await fetchAdminRoles();
      return { success: true };
    } catch (e) {
      console.error('Save admin role error:', e);
      return { success: false, error: e.message };
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleBypassLogin = (email) => {
    const targetEmail = email || selectedAdminEmail;
    const admin = adminList.find(a => a.email === targetEmail);
    if (admin) {
      if (admin.status !== 'เปิด') {
        return { success: false, error: 'บัญชีผู้ใช้นี้ถูกปิดการใช้งาน' };
      }
      setAdminUser(admin);
      localStorage.setItem('lvt_admin_session', JSON.stringify(admin));
      return { success: true, admin };
    }
    return { success: false, error: 'โปรดระบุอีเมลผู้เข้าใช้งาน' };
  };

  return (
    <AuthAdminContext.Provider value={{
      adminUser,
      setAdminUser,
      adminList,
      adminRolesList,
      loadingSettings,
      loadingAuth,
      selectedAdminEmail,
      setSelectedAdminEmail,
      adminForm,
      setAdminForm,
      fetchAdminRoles,
      handleLogin,
      handleBypassLogin,
      handleGoogleLogin,
      handleLogout,
      handleSaveAdminRole,
      verifyAndSetAdmin
    }}>
      {children}
    </AuthAdminContext.Provider>
  );
}

export function useAuthAdmin() {
  const context = useContext(AuthAdminContext);
  if (!context) {
    throw new Error('useAuthAdmin must be used within an AuthAdminProvider');
  }
  return context;
}
