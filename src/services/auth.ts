// ============================================================
// Millennium Era — Auth Service
// ============================================================

import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

// ---- Service Functions ----

/**
 * Sign up a new user with email, password, and full name.
 * The profile row is created by a Supabase trigger on auth.users.
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<{ user: Profile | null }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  // Fetch the profile that was created by the trigger
  let profile: Profile | null = null;
  if (data.user) {
    profile = await getProfile(data.user.id);
  }

  return { user: profile };
}

/**
 * Sign in with email and password.
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: Profile | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  let profile: Profile | null = null;
  if (data.user) {
    profile = await getProfile(data.user.id);
  }

  return { user: profile };
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Sign out failed: ${error.message}`);
  }
}

/**
 * Send a password reset email.
 */
export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    throw new Error(`Password reset failed: ${error.message}`);
  }
}

/**
 * Update the current user's profile.
 */
export async function updateProfile(
  data: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url'>>
): Promise<Profile> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;

  if (!userId) {
    throw new Error('Not authenticated');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return profile as Profile;
}

/**
 * Get a profile by user ID.
 */
export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Profile not found: ${error.message}`);
  }

  return data as Profile;
}

/**
 * Get the currently authenticated user's profile.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return null;
  }

  return data as Profile;
}
