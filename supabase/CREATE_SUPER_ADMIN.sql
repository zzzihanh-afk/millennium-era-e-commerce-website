-- ============================================================
-- MILLENNIUM ERA — CREATE INITIAL SUPER ADMIN & STAFF ROLES
-- ============================================================
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vcgkejjnkudffbthvpwx/sql/new
-- ============================================================

-- 1. Ensure assigned_tasks and permissions columns exist on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_tasks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;

-- 2. Fix GoTrue NULL token scan error on auth.users
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone = COALESCE(phone, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE 
  confirmation_token IS NULL 
  OR recovery_token IS NULL 
  OR email_change IS NULL 
  OR email_change_token_new IS NULL
  OR email_change_token_current IS NULL
  OR phone IS NULL
  OR phone_change IS NULL
  OR phone_change_token IS NULL
  OR reauthentication_token IS NULL;

-- 3. Fix handle_new_user trigger function with explicit public search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, account_status, assigned_tasks, permissions)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'::user_role),
    'active',
    '[]'::jsonb,
    '[]'::jsonb
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$;

-- 4. Create RPC function allowing Super Admin to create sub-admins & staff
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
SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  new_user_id UUID;
  existing_id UUID;
BEGIN
  -- Security check: caller must be super_admin or have staff.manage
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'super_admin' OR (permissions @> '["staff.manage"]'::jsonb))
  ) THEN
    RAISE EXCEPTION 'Access denied: Only Super Administrators can create staff members.';
  END IF;

  -- Check if user already exists
  SELECT id INTO existing_id FROM auth.users WHERE LOWER(email) = LOWER(p_email);

  IF existing_id IS NOT NULL THEN
    -- Elevate / update existing user profile
    UPDATE public.profiles
    SET role = p_role,
        full_name = COALESCE(NULLIF(p_full_name, ''), full_name),
        phone = COALESCE(NULLIF(p_phone, ''), phone),
        assigned_tasks = p_assigned_tasks,
        permissions = p_permissions,
        account_status = 'active',
        updated_at = NOW()
    WHERE id = existing_id;

    -- Update password if supplied
    IF p_password IS NOT NULL AND length(trim(p_password)) >= 6 THEN
      UPDATE auth.users
      SET encrypted_password = crypt(p_password, gen_salt('bf')),
          updated_at = NOW()
      WHERE id = existing_id;
    END IF;

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
      LOWER(p_email),
      crypt(COALESCE(NULLIF(p_password, ''), 'MillenniumAdmin2026!'), gen_salt('bf')),
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

    -- Insert profile
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
      LOWER(p_email),
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
      account_status = 'active';

    RETURN new_user_id;
  END IF;
END;
$$;

-- 5. Create or Elevate Super Admin Account
-- Default Credentials:
-- Email:    admin@millenniumera.com
-- Password: MillenniumAdmin2026!
DO $$
DECLARE
  super_admin_id UUID := gen_random_uuid();
  admin_email TEXT := 'admin@millenniumera.com';
  admin_pass TEXT := 'MillenniumAdmin2026!';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
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
      super_admin_id,
      'authenticated',
      'authenticated',
      admin_email,
      crypt(admin_pass, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Super Administrator","role":"super_admin"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    );

    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      role,
      account_status,
      assigned_tasks,
      permissions
    ) VALUES (
      super_admin_id,
      admin_email,
      'Super Administrator',
      'super_admin',
      'active',
      '["orders_fulfillment","payment_verification","catalog_management","inventory_control","customer_support","marketing_promotions","fraud_monitoring","store_settings","manage_staff"]'::jsonb,
      '["*"]'::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'super_admin',
      assigned_tasks = EXCLUDED.assigned_tasks,
      permissions = EXCLUDED.permissions;

  ELSE
    -- If already exists, update tokens, password and elevate
    UPDATE auth.users
    SET encrypted_password = crypt(admin_pass, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change = COALESCE(email_change, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change_token_current = COALESCE(email_change_token_current, ''),
        phone = COALESCE(phone, ''),
        phone_change = COALESCE(phone_change, ''),
        phone_change_token = COALESCE(phone_change_token, ''),
        reauthentication_token = COALESCE(reauthentication_token, ''),
        updated_at = NOW()
    WHERE email = admin_email;

    UPDATE public.profiles
    SET role = 'super_admin',
        full_name = 'Super Administrator',
        account_status = 'active',
        assigned_tasks = '["orders_fulfillment","payment_verification","catalog_management","inventory_control","customer_support","marketing_promotions","fraud_monitoring","store_settings","manage_staff"]'::jsonb,
        permissions = '["*"]'::jsonb
    WHERE email = admin_email;
  END IF;
END $$;
