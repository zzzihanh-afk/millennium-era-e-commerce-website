import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  isAdminRole,
  isStaffRole,
  canTransitionTo,
  ROLE_PERMISSIONS,
  ORDER_STATUS_TRANSITIONS,
} from '../src/types';

describe('Security & Role-Based Access Control', () => {
  it('correctly identifies super_admin and admin privileges', () => {
    expect(isAdminRole('super_admin')).toBe(true);
    expect(isAdminRole('admin')).toBe(true);
    expect(isAdminRole('customer')).toBe(false);
    expect(isAdminRole('support_agent')).toBe(false);
  });

  it('correctly identifies staff roles', () => {
    expect(isStaffRole('super_admin')).toBe(true);
    expect(isStaffRole('admin')).toBe(true);
    expect(isStaffRole('order_manager')).toBe(true);
    expect(isStaffRole('inventory_manager')).toBe(true);
    expect(isStaffRole('support_agent')).toBe(true);
    expect(isStaffRole('customer')).toBe(false);
  });

  it('enforces least-privilege permission matrix', () => {
    // Customers have 0 admin permissions
    expect(hasPermission('customer', 'orders.manage')).toBe(false);
    expect(hasPermission('customer', 'settings.manage')).toBe(false);

    // Support agents can view orders but cannot manage settings
    expect(hasPermission('support_agent', 'orders.view')).toBe(true);
    expect(hasPermission('support_agent', 'settings.manage')).toBe(false);

    // Order manager can verify payments
    expect(hasPermission('order_manager', 'payments.verify')).toBe(true);
    expect(hasPermission('order_manager', 'staff.manage')).toBe(false);

    // Super Admin has all permissions including staff.manage
    expect(hasPermission('super_admin', 'staff.manage')).toBe(true);
    expect(hasPermission('admin', 'staff.manage')).toBe(false);
  });

  it('honors custom delegated permissions assigned by super admin', () => {
    // An admin who has been explicitly designated staff.manage by Super Admin
    expect(hasPermission('admin', 'staff.manage', ['staff.manage'])).toBe(true);
    // Wildcard permission grants all
    expect(hasPermission('support_agent', 'settings.manage', ['*'])).toBe(true);
    // Unassigned permission is denied
    expect(hasPermission('support_agent', 'fraud.manage', ['orders.view'])).toBe(false);
  });
});

describe('Order Status Lifecycle Transitions', () => {
  it('allows valid forward order status transitions', () => {
    // pending_confirmation -> confirmed
    expect(canTransitionTo('pending_confirmation', 'confirmed')).toBe(true);
    // confirmed -> processing
    expect(canTransitionTo('confirmed', 'processing')).toBe(true);
    // processing -> packed
    expect(canTransitionTo('processing', 'packed')).toBe(true);
    // packed -> shipped
    expect(canTransitionTo('packed', 'shipped')).toBe(true);
    // shipped -> delivered
    expect(canTransitionTo('shipped', 'delivered')).toBe(true);
  });

  it('prevents illegal status jumps that bypass fulfillment checks', () => {
    // Cannot jump directly from pending_confirmation to delivered
    expect(canTransitionTo('pending_confirmation', 'delivered')).toBe(false);
    // Cannot jump from cancelled to shipped
    expect(canTransitionTo('cancelled', 'shipped')).toBe(false);
    // Cannot jump from delivered to confirmed
    expect(canTransitionTo('delivered', 'confirmed')).toBe(false);
  });
});
