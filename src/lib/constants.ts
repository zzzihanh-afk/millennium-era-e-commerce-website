// ============================================================
// MILLENNIUM ERA — GLOBAL CONSTANTS
// ============================================================

export const APP_NAME = 'Millennium Era';
export const APP_TAGLINE = 'Shop Beyond Time';
export const CURRENCY_SYMBOL = '৳';
export const CURRENCY_CODE = 'BDT';

export const BANGLADESH_DIVISIONS = [
  'Dhaka',
  'Chittagong',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
] as const;

export const BD_DISTRICTS_BY_DIVISION: Record<string, string[]> = {
  Dhaka: [
    'Dhaka', 'Gazipur', 'Kishoreganj', 'Manikganj', 'Munshiganj',
    'Narayanganj', 'Narsingdi', 'Tangail', 'Faridpur', 'Gopalganj',
    'Madaripur', 'Rajbari', 'Shariatpur'
  ],
  Chittagong: [
    'Chittagong', 'Cox\'s Bazar', 'Comilla', 'Feni', 'Brahmanbaria',
    'Chandpur', 'Lakshmipur', 'Noakhali', 'Khagrachhari', 'Rangamati', 'Bandarban'
  ],
  Rajshahi: [
    'Rajshahi', 'Bogra', 'Joypurhat', 'Naogaon', 'Natore',
    'Nawabganj', 'Pabna', 'Sirajganj'
  ],
  Khulna: [
    'Khulna', 'Bagerhat', 'Chuadanga', 'Jessore', 'Jhenaidah',
    'Kushtia', 'Magura', 'Meherpur', 'Narail', 'Satkhira'
  ],
  Barishal: [
    'Barishal', 'Barguna', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur'
  ],
  Sylhet: [
    'Sylhet', 'Habiganj', 'Moulvibazar', 'Sunamganj'
  ],
  Rangpur: [
    'Rangpur', 'Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat',
    'Nilphamari', 'Panchagarh', 'Thakurgaon'
  ],
  Mymensingh: [
    'Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur'
  ],
};

export const ALL_BD_DISTRICTS = Object.values(BD_DISTRICTS_BY_DIVISION).flat().sort();

export const NAV_LINKS = [
  { name: 'Home', href: '/' },
  { name: 'Shop', href: '/shop' },
  { name: 'Offers', href: '/offers' },
  { name: 'About Us', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

export const ADMIN_NAV_ITEMS = [
  { name: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
  { name: 'User Management', href: '/admin/users', icon: 'Users' },
  { name: 'Fraud / Fake Order Prevention', href: '/admin/fraud', icon: 'ShieldAlert' },
  { name: 'Categories', href: '/admin/categories', icon: 'FolderTree' },
  { name: 'Attributes', href: '/admin/attributes', icon: 'Sliders' },
  { name: 'Products', href: '/admin/products', icon: 'Package' },
  { name: 'Product Variations', href: '/admin/variations', icon: 'Layers' },
  { name: 'Inventory / Stock Management', href: '/admin/inventory', icon: 'Boxes' },
  { name: 'Orders', href: '/admin/orders', icon: 'ShoppingBag' },
  { name: 'Payments', href: '/admin/payments', icon: 'CreditCard' },
  { name: 'Shipping', href: '/admin/shipping', icon: 'Truck' },
  { name: 'Homepage / Banners', href: '/admin/banners', icon: 'Image' },
  { name: 'Reviews', href: '/admin/reviews', icon: 'Star' },
  { name: 'Coupons / Discounts', href: '/admin/coupons', icon: 'Tag' },
  { name: 'Social Links', href: '/admin/social', icon: 'Share2' },
  { name: 'Store Settings', href: '/admin/settings', icon: 'Settings' },
  { name: 'Staff / Roles', href: '/admin/staff', icon: 'UserCheck' },
  { name: 'Audit Logs', href: '/admin/audit', icon: 'FileText' },
];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_confirmation: 'Pending Confirmation',
  confirmed: 'Confirmed',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancellation_requested: 'Cancellation Requested',
  cancelled: 'Cancelled',
  return_requested: 'Return Requested',
  returned: 'Returned',
};

export const PAYMENT_METHOD_NAMES: Record<string, string> = {
  cod: 'Cash on Delivery (COD)',
  bkash: 'bKash Manual Payment',
  nagad: 'Nagad Manual Payment',
  rocket: 'Rocket Manual Payment',
  gateway: 'Online Payment Gateway',
};

export const BD_PHONE_REGEX = /^(?:\+88|88)?(01[3-9]\d{8})$/;

export const DEFAULT_PAGE_SIZE = 12;
export const ADMIN_PAGE_SIZE = 20;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
