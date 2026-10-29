-- ============================================================
-- MILLENNIUM ERA — FIX STAFF & ADMINISTRATOR CREATION
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor)
-- ============================================================

-- 1. Ensure pgcrypto extension is installed
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Confirm email for admin1@gmail.com so they can sign in immediately
UPDATE auth.users
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE LOWER(email) = 'admin1@gmail.com' AND email_confirmed_at IS NULL;

-- 3. Fix create_staff_admin_user RPC function with extensions in search_path
CREATE OR REPLACE FUNCTION public.create_staff_admin_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_role user_role,
  p_assigned_tasks JSONB,
  p_permissions JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions
AS $$
DECLARE
  new_user_id UUID;
  existing_id UUID;
  clean_email TEXT := LOWER(TRIM(p_email));
  clean_pass TEXT := COALESCE(NULLIF(TRIM(p_password), ''), 'MillenniumAdmin2026!');
BEGIN
  -- Security check: caller must be super_admin or have staff.manage permission
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'super_admin' OR (permissions @> '["staff.manage"]'::jsonb))
  ) THEN
    RAISE EXCEPTION 'Access denied: Only Super Administrators can create staff members.';
  END IF;

  -- Check if user already exists in auth.users
  SELECT id INTO existing_id FROM auth.users WHERE LOWER(email) = clean_email;

  IF existing_id IS NOT NULL THEN
    -- Update password and confirm email for existing user
    IF clean_pass IS NOT NULL AND length(clean_pass) >= 6 THEN
      UPDATE auth.users
      SET encrypted_password = extensions.crypt(clean_pass, extensions.gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
          raw_user_meta_data = raw_user_meta_data || json_build_object('full_name', p_full_name, 'role', p_role)::jsonb,
          updated_at = NOW()
      WHERE id = existing_id;
    END IF;

    -- Elevate / update existing user profile
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      phone,
      role,
      account_status,
      assigned_tasks,
      permissions
    ) VALUES (
      existing_id,
      clean_email,
      p_full_name,
      p_phone,
      p_role,
      'active',
      p_assigned_tasks,
      p_permissions
    )
    ON CONFLICT (id) DO UPDATE SET
      role = EXCLUDED.role,
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      assigned_tasks = EXCLUDED.assigned_tasks,
      permissions = EXCLUDED.permissions,
      account_status = 'active',
      updated_at = NOW();

    RETURN existing_id;
  ELSE
    -- Create brand new auth user with all GoTrue non-null tokens properly initialized
    new_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change,
      email_change_token_new,
      email_change_token_current,
      phone,
      phone_change,
      phone_change_token,
      reauthentication_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      clean_email,
      extensions.crypt(clean_pass, extensions.gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      json_build_object('full_name', p_full_name, 'role', p_role)::jsonb,
      NOW(),
      NOW(),
      '',
      '',
      '',
      '',
      '',
      COALESCE(p_phone, ''),
      '',
      '',
      ''
    );

    -- Insert or update profile
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      phone,
      role,
      account_status,
      assigned_tasks,
      permissions
    ) VALUES (
      new_user_id,
      clean_email,
      p_full_name,
      p_phone,
      p_role,
      'active',
      p_assigned_tasks,
      p_permissions
    )
    ON CONFLICT (id) DO UPDATE SET
      role = EXCLUDED.role,
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      assigned_tasks = EXCLUDED.assigned_tasks,
      permissions = EXCLUDED.permissions,
      account_status = 'active',
      updated_at = NOW();

    RETURN new_user_id;
  END IF;
END;
$$;

-- 4. Grant execute permission on create_staff_admin_user to authenticated users
GRANT EXECUTE ON FUNCTION public.create_staff_admin_user(TEXT, TEXT, TEXT, TEXT, user_role, JSONB, JSONB) TO authenticated;

-- 5. Add RLS INSERT policy on profiles table for super_admin
DROP POLICY IF EXISTS profiles_super_admin_insert ON public.profiles;
CREATE POLICY profiles_super_admin_insert ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 6. Add RLS UPDATE policy on profiles table for super_admin to manage any profile
DROP POLICY IF EXISTS profiles_super_admin_all_update ON public.profiles;
CREATE POLICY profiles_super_admin_all_update ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
