import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import createContextHook from '@nkzw/create-context-hook';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { trackEvent } from '@/lib/analytics';

WebBrowser.maybeCompleteAuthSession();

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[Auth] Initializing auth state');
    
    const initTimeout = setTimeout(() => {
      console.log('[Auth] Initialization timeout, setting loading to false');
      setIsLoading(false);
    }, 5000);
    
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      clearTimeout(initTimeout);
      console.log('[Auth] Current session:', currentSession ? 'Authenticated' : 'Not authenticated');
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    }).catch((error) => {
      clearTimeout(initTimeout);
      console.error('[Auth] Error getting session:', error);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      console.log('[Auth] Auth state changed:', _event, currentSession ? 'Authenticated' : 'Not authenticated');
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
    });

    return () => {
      console.log('[Auth] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      console.log('[Auth] Signing in with email:', email);
      setError(null);
      setIsLoading(true);
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('[Auth] Sign in error:', signInError);
        setError(signInError.message);
        throw signInError;
      }

      console.log('[Auth] Sign in successful');
      trackEvent('user_logged_in', { provider: 'email' });
      return data;
    } catch (err) {
      console.error('[Auth] Sign in failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      console.log('[Auth] Signing up with email:', email);
      setError(null);
      setIsLoading(true);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        console.error('[Auth] Sign up error:', signUpError);
        setError(signUpError.message);
        throw signUpError;
      }

      console.log('[Auth] Sign up successful');
      trackEvent('user_signed_up', { provider: 'email' });
      return data;
    } catch (err) {
      console.error('[Auth] Sign up failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      console.log('[Auth] Initiating Google Sign-In');
      setError(null);
      setIsLoading(true);

      if (Platform.OS === 'web') {
        const { data, error: signInError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });

        if (signInError) {
          console.error('[Auth] Google sign in error:', signInError);
          setError(signInError.message);
          throw signInError;
        }

        return data;
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'beemind://',
          },
        });

        if (signInError) {
          console.error('[Auth] Google sign in error:', signInError);
          setError(signInError.message);
          throw signInError;
        }

        if (data.url) {
          const result = await WebBrowser.openAuthSessionAsync(data.url, 'beemind://');
          
          if (result.type === 'success' && result.url) {
            console.log('[Auth] Google auth success, processing callback');
          }
        }

        return data;
      }
    } catch (err) {
      console.error('[Auth] Google sign in failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('[Auth] Signing out');
      setError(null);
      setIsLoading(true);

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error('[Auth] Sign out error:', signOutError);
        setError(signOutError.message);
        throw signOutError;
      }

      console.log('[Auth] Sign out successful');
    } catch (err) {
      console.error('[Auth] Sign out failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      console.log('[Auth] Requesting password reset for:', email);
      setError(null);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: Platform.OS === 'web' ? window.location.origin : 'beemind://',
      });

      if (resetError) {
        console.error('[Auth] Password reset error:', resetError);
        setError(resetError.message);
        throw resetError;
      }

      console.log('[Auth] Password reset email sent');
    } catch (err) {
      console.error('[Auth] Password reset failed:', err);
      throw err;
    }
  }, []);

  return useMemo(() => ({
    session,
    user,
    isLoading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    resetPassword,
    isAuthenticated: !!session,
  }), [session, user, isLoading, error, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, resetPassword]);
});
