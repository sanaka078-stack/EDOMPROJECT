import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { usePasswordSecurity } from '@/hooks/usePasswordSecurity';
import { PasswordStrengthIndicator } from '@/components/ui/password-strength';
import { TwoFactorSetup } from '@/components/profile/TwoFactorSetup';
import { RecoveryCodes } from '@/components/profile/RecoveryCodes';
import { SessionManagement } from '@/components/profile/SessionManagement';
import { LoginActivity } from '@/components/profile/LoginActivity';
import { TrustedDevices } from '@/components/profile/TrustedDevices';
import { Loader2, Camera, User, Lock, Mail, Eye, EyeOff } from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

const emailSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Password must be at least 6 characters'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Profile() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { calculateStrength, checkLeakedPassword, leakCheck, resetLeakCheck } = usePasswordSecurity();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password strength state
  const [newPassword, setNewPassword] = useState('');
  const passwordStrength = calculateStrength(newPassword);
  
  // Debounced leak check
  const [leakCheckTimeout, setLeakCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.user_metadata?.full_name || '',
    },
  });

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      newEmail: '',
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        fullName: user.user_metadata?.full_name || '',
      });
      fetchAvatar();
    }
  }, [user]);

  const fetchAvatar = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data?.avatar_url) {
      setAvatarUrl(data.avatar_url);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) {
      return;
    }

    const file = event.target.files[0];
    
    // File validation
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: t('profile.uploadFailed'),
        description: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.',
      });
      return;
    }

    if (file.size > MAX_SIZE) {
      toast({
        variant: 'destructive',
        title: t('profile.uploadFailed'),
        description: 'File too large. Maximum size is 5MB.',
      });
      return;
    }

    // Derive extension from MIME type for security (not from filename)
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const fileExt = mimeToExt[file.type] || 'jpg';
    
    // Use crypto.randomUUID() for secure, unpredictable file paths
    const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

    setUploading(true);

    try {
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({
        title: t('profile.avatarUpdated'),
        description: t('profile.avatarUpdatedDesc'),
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('profile.uploadFailed'),
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: values.fullName },
      });

      if (authError) throw authError;

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: values.fullName })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      toast({
        title: t('profile.profileUpdated'),
        description: t('profile.profileUpdatedDesc'),
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('profile.updateFailed'),
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    if (!user) return;
    
    setIsEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: values.newEmail,
      });

      if (error) throw error;

      emailForm.reset();
      toast({
        title: 'Email Change Requested',
        description: 'A confirmation link has been sent to your new email address. Please check your inbox.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Email Update Failed',
        description: error.message,
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleNewPasswordChange = useCallback((value: string) => {
    setNewPassword(value);
    
    // Clear previous timeout
    if (leakCheckTimeout) {
      clearTimeout(leakCheckTimeout);
    }
    
    // Reset leak check when password changes
    resetLeakCheck();
    
    // Debounce the leak check (wait 500ms after user stops typing)
    if (value.length >= 6) {
      const timeout = setTimeout(() => {
        checkLeakedPassword(value);
      }, 500);
      setLeakCheckTimeout(timeout);
    }
  }, [leakCheckTimeout, checkLeakedPassword, resetLeakCheck]);

  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    // Check if password is leaked before submitting
    if (leakCheck.isLeaked) {
      toast({
        variant: 'destructive',
        title: 'Compromised Password',
        description: 'This password has been exposed in data breaches. Please choose a different password.',
      });
      return;
    }
    
    // Check minimum strength
    if (passwordStrength.score < 2) {
      toast({
        variant: 'destructive',
        title: 'Weak Password',
        description: 'Please choose a stronger password that meets more requirements.',
      });
      return;
    }
    
    setIsPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) throw error;

      passwordForm.reset();
      setNewPassword('');
      resetLeakCheck();
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      toast({
        title: t('profile.passwordChanged'),
        description: t('profile.passwordChangedDesc'),
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('profile.passwordFailed'),
        description: error.message,
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'AD';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('profile.title')}</h1>
          <p className="text-muted-foreground">{t('profile.subtitle')}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Avatar Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {t('profile.avatar')}
              </CardTitle>
              <CardDescription>{t('profile.avatarDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={avatarUrl || ''} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  id="avatar"
                  accept="image/*"
                  className="hidden"
                  onChange={uploadAvatar}
                  disabled={uploading}
                />
                <Button asChild variant="outline" disabled={uploading}>
                  <label htmlFor="avatar" className="cursor-pointer">
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('profile.uploading')}
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-4 w-4" />
                        {t('profile.changeAvatar')}
                      </>
                    )}
                  </label>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Profile Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('profile.personalInfo')}
              </CardTitle>
              <CardDescription>{t('profile.personalInfoDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('fullName')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <FormLabel>{t('email')}</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10" disabled value={user?.email || ''} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      To change your email, use the form below.
                    </p>
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('common.save')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Email Change Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Change Email
              </CardTitle>
              <CardDescription>
                Update your email address. A confirmation link will be sent to the new email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <FormLabel>Current Email</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10" disabled value={user?.email || ''} />
                    </div>
                  </div>
                  <FormField
                    control={emailForm.control}
                    name="newEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              className="pl-10" 
                              placeholder="Enter new email address"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isEmailLoading}>
                    {isEmailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Email
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Password Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t('profile.changePassword')}
              </CardTitle>
              <CardDescription>{t('profile.changePasswordDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('profile.currentPassword')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type={showCurrentPassword ? "text" : "password"} 
                              className="pl-10 pr-10" 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('newPassword')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type={showNewPassword ? "text" : "password"} 
                              className="pl-10 pr-10" 
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handleNewPasswordChange(e.target.value);
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <PasswordStrengthIndicator 
                          password={newPassword}
                          strength={passwordStrength}
                          leakCheck={leakCheck}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('confirmPassword')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              className="pl-10 pr-10" 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isPasswordLoading}>
                    {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('profile.updatePassword')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <TwoFactorSetup />

          {/* Recovery Codes */}
          <RecoveryCodes />

          {/* Trusted Devices */}
          <TrustedDevices />

          {/* Session Management */}
          <SessionManagement />

          {/* Login Activity */}
          <LoginActivity />
        </div>
      </div>
    </AdminLayout>
  );
}
