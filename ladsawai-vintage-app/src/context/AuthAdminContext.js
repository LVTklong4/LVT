'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AuthAdminContext = createContext();

export function AuthAdminProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [adminList, setAdminList] = useState([]);
  const [adminRolesList, setAdminRolesList] = useState([]);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [selectedAdminEmail, setSelectedAdminEmail] = useState('');
  const [adminForm, setAdminForm] = useState({ name: '', role: 'Admin', status: 'เปิด' });

  // 1. Listen for Supabase auth state changes and verify admin role
  useEffect(() => {
    fetchAdminRoles();

    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        await verifyAndSetAdmin(session.user.email);
      } else {
        setAdminUser(null);
      }
    };

    checkUserSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user?.email) {
        await verifyAndSetAdmin(session.user.email);
      } else if (event === 'SIGNED_OUT') {
        setAdminUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Securely verify admin status via Supabase DB table
  const verifyAndSetAdmin = async (email) => {
    try {
      const { data: admin, error } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('email', email)
        .eq('status', 'เปิด')
        .maybeSingle();

      if (admin) {
        setAdminUser(admin);
      } else {
        await supabase.auth.signOut();
        setAdminUser(null);
      }
    } catch (e) {
      console.error('Admin verification error:', e);
      setAdminUser(null);
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

  return (
    <AuthAdminContext.Provider value={{
      adminUser,
      setAdminUser,
      adminList,
      adminRolesList,
      loadingSettings,
      selectedAdminEmail,
      setSelectedAdminEmail,
      adminForm,
      setAdminForm,
      fetchAdminRoles,
      handleLogin,
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
