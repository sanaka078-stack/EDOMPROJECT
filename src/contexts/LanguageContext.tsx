import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'en' | 'bn';

interface Translations {
  [key: string]: {
    en: string;
    bn: string;
  };
}

export const translations: Translations = {
  // Navigation
  'nav.dashboard': { en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
  'nav.products': { en: 'Products', bn: 'প্রোডাক্ট' },
  'nav.orders': { en: 'Orders', bn: 'অর্ডার' },
  'nav.customers': { en: 'Customers', bn: 'কাস্টমার' },
  'nav.categories': { en: 'Categories', bn: 'ক্যাটাগরি' },
  'nav.shipping': { en: 'Shipping', bn: 'শিপিং' },
  'nav.analytics': { en: 'Analytics', bn: 'অ্যানালিটিক্স' },
  'nav.messages': { en: 'Messages', bn: 'মেসেজ' },
  'nav.reports': { en: 'Reports', bn: 'রিপোর্ট' },
  'nav.inventory': { en: 'Inventory', bn: 'ইনভেন্টরি' },
  'nav.coupons': { en: 'Coupons', bn: 'কুপন' },
  'nav.settings': { en: 'Settings', bn: 'সেটিংস' },
  'nav.logout': { en: 'Logout', bn: 'লগআউট' },
  'nav.menu': { en: 'Menu', bn: 'মেনু' },
  'nav.management': { en: 'Management', bn: 'ম্যানেজমেন্ট' },
  'nav.profile': { en: 'Profile', bn: 'প্রোফাইল' },
  'nav.roles': { en: 'Role Management', bn: 'রোল ম্যানেজমেন্ট' },

  // Common
  'common.search': { en: 'Search', bn: 'খুঁজুন' },
  'common.add': { en: 'Add', bn: 'যোগ করুন' },
  'common.edit': { en: 'Edit', bn: 'এডিট' },
  'common.delete': { en: 'Delete', bn: 'মুছুন' },
  'common.save': { en: 'Save', bn: 'সেভ করুন' },
  'common.cancel': { en: 'Cancel', bn: 'বাতিল' },
  'common.confirm': { en: 'Confirm', bn: 'নিশ্চিত' },
  'common.status': { en: 'Status', bn: 'স্ট্যাটাস' },
  'common.actions': { en: 'Actions', bn: 'অ্যাকশন' },
  'common.all': { en: 'All', bn: 'সব' },
  'common.active': { en: 'Active', bn: 'সক্রিয়' },
  'common.inactive': { en: 'Inactive', bn: 'নিষ্ক্রিয়' },
  'common.filter': { en: 'Filter', bn: 'ফিল্টার' },
  'common.export': { en: 'Export', bn: 'এক্সপোর্ট' },
  'common.import': { en: 'Import', bn: 'ইমপোর্ট' },
  'common.download': { en: 'Download', bn: 'ডাউনলোড' },
  'common.total': { en: 'Total', bn: 'মোট' },
  'common.view': { en: 'View', bn: 'দেখুন' },
  'common.details': { en: 'Details', bn: 'বিস্তারিত' },
  'common.name': { en: 'Name', bn: 'নাম' },
  'common.email': { en: 'Email', bn: 'ইমেইল' },
  'common.phone': { en: 'Phone', bn: 'ফোন' },
  'common.address': { en: 'Address', bn: 'ঠিকানা' },
  'common.date': { en: 'Date', bn: 'তারিখ' },
  'common.amount': { en: 'Amount', bn: 'পরিমাণ' },
  'common.price': { en: 'Price', bn: 'মূল্য' },
  'common.quantity': { en: 'Quantity', bn: 'পরিমাণ' },

  // Dashboard
  'dashboard.title': { en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
  'dashboard.welcome': { en: 'Welcome back', bn: 'স্বাগতম' },
  'dashboard.totalSales': { en: 'Total Sales', bn: 'মোট বিক্রয়' },
  'dashboard.totalOrders': { en: 'Total Orders', bn: 'মোট অর্ডার' },
  'dashboard.totalCustomers': { en: 'Total Customers', bn: 'মোট কাস্টমার' },
  'dashboard.totalProducts': { en: 'Total Products', bn: 'মোট প্রোডাক্ট' },
  'dashboard.recentOrders': { en: 'Recent Orders', bn: 'সাম্প্রতিক অর্ডার' },
  'dashboard.topProducts': { en: 'Top Products', bn: 'টপ প্রোডাক্ট' },

  // Products
  'products.title': { en: 'Products', bn: 'প্রোডাক্ট' },
  'products.addProduct': { en: 'Add Product', bn: 'প্রোডাক্ট যোগ করুন' },
  'products.editProduct': { en: 'Edit Product', bn: 'প্রোডাক্ট এডিট করুন' },
  'products.productName': { en: 'Product Name', bn: 'প্রোডাক্ট নাম' },
  'products.category': { en: 'Category', bn: 'ক্যাটাগরি' },
  'products.stock': { en: 'Stock', bn: 'স্টক' },
  'products.inStock': { en: 'In Stock', bn: 'স্টকে আছে' },
  'products.outOfStock': { en: 'Out of Stock', bn: 'স্টক শেষ' },
  'products.lowStock': { en: 'Low Stock', bn: 'কম স্টক' },

  // Orders
  'orders.title': { en: 'Orders', bn: 'অর্ডার' },
  'orders.orderId': { en: 'Order ID', bn: 'অর্ডার আইডি' },
  'orders.customer': { en: 'Customer', bn: 'কাস্টমার' },
  'orders.orderDate': { en: 'Order Date', bn: 'অর্ডার তারিখ' },
  'orders.orderStatus': { en: 'Order Status', bn: 'অর্ডার স্ট্যাটাস' },
  'orders.pending': { en: 'Pending', bn: 'পেন্ডিং' },
  'orders.processing': { en: 'Processing', bn: 'প্রসেসিং' },
  'orders.shipped': { en: 'Shipped', bn: 'শিপড' },
  'orders.delivered': { en: 'Delivered', bn: 'ডেলিভার্ড' },
  'orders.cancelled': { en: 'Cancelled', bn: 'বাতিল' },

  // Customers
  'customers.title': { en: 'Customers', bn: 'কাস্টমার' },
  'customers.totalCustomers': { en: 'Total Customers', bn: 'মোট কাস্টমার' },
  'customers.newCustomers': { en: 'New Customers', bn: 'নতুন কাস্টমার' },
  'customers.loyaltyTier': { en: 'Loyalty Tier', bn: 'লয়্যালটি টিয়ার' },

  // Shipping
  'shipping.title': { en: 'Shipping Management', bn: 'শিপিং ম্যানেজমেন্ট' },
  'shipping.zones': { en: 'Shipping Zones', bn: 'শিপিং জোন' },
  'shipping.rates': { en: 'Rates Configuration', bn: 'রেট কনফিগারেশন' },
  'shipping.couriers': { en: 'Courier Integration', bn: 'কুরিয়ার ইন্টিগ্রেশন' },
  'shipping.tracking': { en: 'Delivery Tracking', bn: 'ডেলিভারি ট্র্যাকিং' },

  // Messages
  'messages.title': { en: 'Messages & Support', bn: 'মেসেজ ও সাপোর্ট' },
  'messages.liveChat': { en: 'Live Chat', bn: 'লাইভ চ্যাট' },
  'messages.tickets': { en: 'Support Tickets', bn: 'সাপোর্ট টিকেট' },
  'messages.newTicket': { en: 'New Ticket', bn: 'নতুন টিকেট' },

  // Reports
  'reports.title': { en: 'Reports', bn: 'রিপোর্ট' },
  'reports.generate': { en: 'Generate Report', bn: 'রিপোর্ট জেনারেট' },
  'reports.scheduled': { en: 'Scheduled Reports', bn: 'শিডিউলড রিপোর্ট' },
  'reports.templates': { en: 'Templates', bn: 'টেমপ্লেট' },

  // Inventory
  'inventory.title': { en: 'Inventory Management', bn: 'ইনভেন্টরি ম্যানেজমেন্ট' },
  'inventory.stockLevels': { en: 'Stock Levels', bn: 'স্টক লেভেল' },
  'inventory.alerts': { en: 'Alerts', bn: 'অ্যালার্ট' },
  'inventory.suppliers': { en: 'Suppliers', bn: 'সাপ্লায়ার' },
  'inventory.purchaseOrders': { en: 'Purchase Orders', bn: 'পার্চেজ অর্ডার' },

  // Coupons
  'coupons.title': { en: 'Discounts & Coupons', bn: 'ডিসকাউন্ট ও কুপন' },
  'coupons.newCoupon': { en: 'New Coupon', bn: 'নতুন কুপন' },
  'coupons.autoRules': { en: 'Auto Rules', bn: 'অটো রুল' },
  'coupons.usageRecords': { en: 'Usage Records', bn: 'ব্যবহার রেকর্ড' },

  // Settings
  'settings.title': { en: 'Settings', bn: 'সেটিংস' },
  'settings.storeInfo': { en: 'Store Information', bn: 'স্টোর তথ্য' },
  'settings.payment': { en: 'Payment Gateways', bn: 'পেমেন্ট গেটওয়ে' },
  'settings.email': { en: 'Email Templates', bn: 'ইমেইল টেমপ্লেট' },
  'settings.notifications': { en: 'Notifications', bn: 'নোটিফিকেশন' },
  'settings.language': { en: 'Language', bn: 'ভাষা' },
  'settings.saveChanges': { en: 'Save Changes', bn: 'পরিবর্তন সেভ করুন' },

  // Analytics
  'analytics.title': { en: 'Analytics', bn: 'অ্যানালিটিক্স' },
  'analytics.revenue': { en: 'Revenue', bn: 'রেভিনিউ' },
  'analytics.profit': { en: 'Profit', bn: 'প্রফিট' },
  'analytics.visitors': { en: 'Visitors', bn: 'ভিজিটর' },
  'analytics.conversion': { en: 'Conversion Rate', bn: 'কনভার্সন রেট' },

  // Header
  'header.search': { en: 'Search...', bn: 'খুঁজুন...' },
  'header.notifications': { en: 'Notifications', bn: 'নোটিফিকেশন' },
  'header.profile': { en: 'Profile', bn: 'প্রোফাইল' },

  // Authentication
  'login': { en: 'Login', bn: 'লগইন' },
  'logout': { en: 'Logout', bn: 'লগআউট' },
  'createAccount': { en: 'Create Account', bn: 'অ্যাকাউন্ট তৈরি করুন' },
  'resetPassword': { en: 'Reset Password', bn: 'পাসওয়ার্ড রিসেট' },
  'updatePassword': { en: 'Update Password', bn: 'পাসওয়ার্ড আপডেট' },
  'loginDescription': { en: 'Enter your credentials to access the admin panel', bn: 'অ্যাডমিন প্যানেলে প্রবেশ করতে আপনার তথ্য দিন' },
  'signupDescription': { en: 'Create a new admin account', bn: 'নতুন অ্যাডমিন অ্যাকাউন্ট তৈরি করুন' },
  'resetDescription': { en: 'Enter your email to receive a reset link', bn: 'রিসেট লিংক পেতে আপনার ইমেইল দিন' },
  'updatePasswordDescription': { en: 'Enter your new password', bn: 'আপনার নতুন পাসওয়ার্ড দিন' },
  'email': { en: 'Email', bn: 'ইমেইল' },
  'password': { en: 'Password', bn: 'পাসওয়ার্ড' },
  'newPassword': { en: 'New Password', bn: 'নতুন পাসওয়ার্ড' },
  'confirmPassword': { en: 'Confirm Password', bn: 'পাসওয়ার্ড নিশ্চিত করুন' },
  'fullName': { en: 'Full Name', bn: 'পুরো নাম' },
  'forgotPassword': { en: 'Forgot password?', bn: 'পাসওয়ার্ড ভুলে গেছেন?' },
  'noAccount': { en: "Don't have an account?", bn: 'অ্যাকাউন্ট নেই?' },
  'signUp': { en: 'Sign up', bn: 'সাইন আপ' },
  'alreadyHaveAccount': { en: 'Already have an account?', bn: 'ইতিমধ্যে অ্যাকাউন্ট আছে?' },
  'backToLogin': { en: 'Back to Login', bn: 'লগইনে ফিরে যান' },
  'sendResetLink': { en: 'Send Reset Link', bn: 'রিসেট লিংক পাঠান' },
  'loginFailed': { en: 'Login Failed', bn: 'লগইন ব্যর্থ' },
  'invalidCredentials': { en: 'Invalid email or password', bn: 'ভুল ইমেইল বা পাসওয়ার্ড' },
  'loginSuccess': { en: 'Login Successful', bn: 'লগইন সফল' },
  'welcomeBack': { en: 'Welcome back!', bn: 'স্বাগতম!' },
  'signupFailed': { en: 'Signup Failed', bn: 'সাইন আপ ব্যর্থ' },
  'emailAlreadyRegistered': { en: 'This email is already registered', bn: 'এই ইমেইল ইতিমধ্যে নিবন্ধিত' },
  'signupSuccess': { en: 'Signup Successful', bn: 'সাইন আপ সফল' },
  'accountCreated': { en: 'Your account has been created', bn: 'আপনার অ্যাকাউন্ট তৈরি হয়েছে' },
  'resetFailed': { en: 'Reset Failed', bn: 'রিসেট ব্যর্থ' },
  'resetEmailSent': { en: 'Reset Email Sent', bn: 'রিসেট ইমেইল পাঠানো হয়েছে' },
  'checkYourEmail': { en: 'Check your email for the reset link', bn: 'রিসেট লিংকের জন্য আপনার ইমেইল চেক করুন' },
  'updatePasswordFailed': { en: 'Update Failed', bn: 'আপডেট ব্যর্থ' },
  'passwordUpdated': { en: 'Password Updated', bn: 'পাসওয়ার্ড আপডেট হয়েছে' },
  'passwordUpdateSuccess': { en: 'Your password has been updated', bn: 'আপনার পাসওয়ার্ড আপডেট হয়েছে' },
  'auth.orContinueWith': { en: 'Or continue with', bn: 'অথবা দিয়ে চালিয়ে যান' },
  'auth.continueWithGoogle': { en: 'Continue with Google', bn: 'Google দিয়ে চালিয়ে যান' },

  // Profile
  'profile.title': { en: 'Profile Settings', bn: 'প্রোফাইল সেটিংস' },
  'profile.subtitle': { en: 'Manage your account settings and preferences', bn: 'আপনার অ্যাকাউন্ট সেটিংস এবং পছন্দ পরিচালনা করুন' },
  'profile.avatar': { en: 'Profile Picture', bn: 'প্রোফাইল ছবি' },
  'profile.avatarDesc': { en: 'Upload a new profile picture', bn: 'একটি নতুন প্রোফাইল ছবি আপলোড করুন' },
  'profile.changeAvatar': { en: 'Change Avatar', bn: 'অ্যাভাটার পরিবর্তন' },
  'profile.uploading': { en: 'Uploading...', bn: 'আপলোড হচ্ছে...' },
  'profile.avatarUpdated': { en: 'Avatar Updated', bn: 'অ্যাভাটার আপডেট হয়েছে' },
  'profile.avatarUpdatedDesc': { en: 'Your profile picture has been updated', bn: 'আপনার প্রোফাইল ছবি আপডেট হয়েছে' },
  'profile.uploadFailed': { en: 'Upload Failed', bn: 'আপলোড ব্যর্থ' },
  'profile.personalInfo': { en: 'Personal Information', bn: 'ব্যক্তিগত তথ্য' },
  'profile.personalInfoDesc': { en: 'Update your personal details', bn: 'আপনার ব্যক্তিগত বিবরণ আপডেট করুন' },
  'profile.profileUpdated': { en: 'Profile Updated', bn: 'প্রোফাইল আপডেট হয়েছে' },
  'profile.profileUpdatedDesc': { en: 'Your profile has been updated', bn: 'আপনার প্রোফাইল আপডেট হয়েছে' },
  'profile.updateFailed': { en: 'Update Failed', bn: 'আপডেট ব্যর্থ' },
  'profile.changePassword': { en: 'Change Password', bn: 'পাসওয়ার্ড পরিবর্তন' },
  'profile.changePasswordDesc': { en: 'Update your password for security', bn: 'নিরাপত্তার জন্য আপনার পাসওয়ার্ড আপডেট করুন' },
  'profile.currentPassword': { en: 'Current Password', bn: 'বর্তমান পাসওয়ার্ড' },
  'profile.updatePassword': { en: 'Update Password', bn: 'পাসওয়ার্ড আপডেট' },
  'profile.passwordChanged': { en: 'Password Changed', bn: 'পাসওয়ার্ড পরিবর্তিত' },
  'profile.passwordChangedDesc': { en: 'Your password has been updated successfully', bn: 'আপনার পাসওয়ার্ড সফলভাবে আপডেট হয়েছে' },
  'profile.passwordFailed': { en: 'Password Update Failed', bn: 'পাসওয়ার্ড আপডেট ব্যর্থ' },

  // Role Management
  'roles.title': { en: 'Role Management', bn: 'রোল ম্যানেজমেন্ট' },
  'roles.subtitle': { en: 'Manage user roles and permissions', bn: 'ব্যবহারকারীর রোল এবং অনুমতি পরিচালনা করুন' },
  'roles.users': { en: 'Users', bn: 'ব্যবহারকারী' },
  'roles.admins': { en: 'Admins', bn: 'অ্যাডমিন' },
  'roles.superAdmins': { en: 'Super Admins', bn: 'সুপার অ্যাডমিন' },
  'roles.usersList': { en: 'All Users', bn: 'সব ব্যবহারকারী' },
  'roles.usersListDesc': { en: 'View and manage all user roles', bn: 'সব ব্যবহারকারীর রোল দেখুন এবং পরিচালনা করুন' },
  'roles.searchUsers': { en: 'Search users...', bn: 'ব্যবহারকারী খুঁজুন...' },
  'roles.user': { en: 'User', bn: 'ব্যবহারকারী' },
  'roles.role': { en: 'Role', bn: 'রোল' },
  'roles.changeRole': { en: 'Change Role', bn: 'রোল পরিবর্তন' },
  'roles.changeRoleTitle': { en: 'Change User Role', bn: 'ব্যবহারকারীর রোল পরিবর্তন' },
  'roles.changeRoleDesc': { en: 'Select a new role for', bn: 'নতুন রোল নির্বাচন করুন' },
  'roles.roleUpdated': { en: 'Role Updated', bn: 'রোল আপডেট হয়েছে' },
  'roles.roleUpdatedTo': { en: 'role changed to', bn: 'রোল পরিবর্তন হয়েছে' },
  'roles.updateFailed': { en: 'Update Failed', bn: 'আপডেট ব্যর্থ' },
  'roles.fetchFailed': { en: 'Failed to fetch users', bn: 'ব্যবহারকারী লোড করতে ব্যর্থ' },
  'roles.noUsers': { en: 'No users found', bn: 'কোন ব্যবহারকারী পাওয়া যায়নি' },
  'roles.unnamed': { en: 'Unnamed', bn: 'নামহীন' },
  'roles.accessDenied': { en: 'Access Denied', bn: 'অ্যাক্সেস অস্বীকৃত' },
  'roles.accessDeniedDesc': { en: 'Only Super Admins can access role management. Please contact a Super Admin if you need access.', bn: 'শুধুমাত্র সুপার অ্যাডমিনরা রোল ম্যানেজমেন্ট অ্যাক্সেস করতে পারেন।' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
