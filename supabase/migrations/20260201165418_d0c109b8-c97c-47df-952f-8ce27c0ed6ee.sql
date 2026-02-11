-- Create email_templates table for storing customizable email templates
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'custom',
  variables TEXT[] DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view enabled templates"
ON public.email_templates
FOR SELECT
USING (is_enabled = true);

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system templates
INSERT INTO public.email_templates (template_id, name, subject, body, category, variables, is_system) VALUES
('order_confirmation', 'Order Confirmation', 'Your order #{{order_number}} has been confirmed!', '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order Confirmation</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Order Confirmed! 🎉</h1>
      </div>
      <div style="padding: 32px;">
        <p>Hi {{customer_name}},</p>
        <p>Thank you for your order! Your order <strong>#{{order_number}}</strong> has been confirmed.</p>
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <h3 style="margin: 0 0 16px 0;">Order Details</h3>
          {{order_items}}
        </div>
        <div style="display: flex; justify-content: space-between; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
          <span>Total:</span>
          <strong>{{order_total}}</strong>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="{{tracking_url}}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px;">Track Order</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>', 'order', ARRAY['customer_name', 'order_number', 'order_items', 'order_total', 'tracking_url'], true),

('shipping_notification', 'Shipping Notification', 'Your order #{{order_number}} has been shipped!', '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order Shipped</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Your Order is on the Way! 🚚</h1>
      </div>
      <div style="padding: 32px;">
        <p>Hi {{customer_name}},</p>
        <p>Great news! Your order <strong>#{{order_number}}</strong> has been shipped.</p>
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p><strong>Courier:</strong> {{courier_name}}</p>
          <p><strong>Tracking Number:</strong> {{tracking_number}}</p>
          <p><strong>Estimated Delivery:</strong> {{estimated_delivery}}</p>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="{{tracking_url}}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px;">Track Package</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>', 'order', ARRAY['customer_name', 'order_number', 'courier_name', 'tracking_number', 'estimated_delivery', 'tracking_url'], true),

('abandoned_cart', 'Abandoned Cart', 'You left something behind!', '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your Cart is Waiting</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 32px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">🛒</div>
        <h1 style="color: white; margin: 0; font-size: 24px;">Your Cart Misses You!</h1>
      </div>
      <div style="padding: 32px;">
        <p>Hi {{customer_name}},</p>
        <p>We noticed you left some amazing items in your cart. {{urgency_text}}</p>
        {{discount_section}}
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
          {{cart_items}}
        </div>
        <div style="display: flex; justify-content: space-between; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
          <span>Cart Total:</span>
          <strong style="color: #8b5cf6;">{{cart_total}}</strong>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="{{cart_url}}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600;">Complete My Order</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>', 'marketing', ARRAY['customer_name', 'urgency_text', 'discount_section', 'cart_items', 'cart_total', 'cart_url'], true),

('welcome_email', 'Welcome Email', 'Welcome to {{store_name}}!', '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Welcome</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #ec4899, #db2777); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to {{store_name}}! 🎉</h1>
      </div>
      <div style="padding: 32px;">
        <p>Hi {{customer_name}},</p>
        <p>Thank you for creating an account with us!</p>
        <div style="text-align: center; margin-top: 24px;">
          <a href="{{shop_url}}" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #db2777); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px;">Start Shopping</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>', 'auth', ARRAY['customer_name', 'store_name', 'shop_url'], true),

('password_reset', 'Password Reset', 'Reset your password', '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Password Reset</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Reset Your Password 🔐</h1>
      </div>
      <div style="padding: 32px;">
        <p>Hi {{customer_name}},</p>
        <p>We received a request to reset your password.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="{{reset_url}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px;">Reset Password</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This link expires in 1 hour.</p>
      </div>
    </div>
  </div>
</body>
</html>', 'auth', ARRAY['customer_name', 'reset_url'], true),

('lockout_alert', 'Account Lockout Alert', '🔒 Account Locked - Security Alert', '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Account Locked</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🔒 Account Locked</h1>
      </div>
      <div style="padding: 32px;">
        <p>Hi Admin,</p>
        <p>An account has been locked due to multiple failed login attempts.</p>
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p><strong>Email:</strong> {{email}}</p>
          <p><strong>Failed Attempts:</strong> {{failed_attempts}}</p>
          <p><strong>IP Address:</strong> {{ip_address}}</p>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="{{admin_url}}" style="display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px;">View in Admin Panel</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>', 'security', ARRAY['email', 'failed_attempts', 'ip_address', 'admin_url'], true);