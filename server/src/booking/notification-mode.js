export function notificationConfiguration(env = process.env) {
  const mode = String(env.NOTIFICATIONS_MODE || 'resend').trim().toLowerCase();
  const mockAllowed = mode === 'mock'
    && ['development', 'test'].includes(env.NODE_ENV)
    && (env.RAZORPAY_MODE || 'test') === 'test';
  const resendConfigured = mode === 'resend'
    && Boolean(env.RESEND_API_KEY && env.EMAIL_FROM && env.OWNER_EMAIL);
  const ownerNumberDigits = String(env.WHATSAPP_OWNER_NUMBER || '').replace(/\D/g, '');
  const whatsappConfigured = mode === 'whatsapp'
    && Boolean(
      env.WHATSAPP_ACCESS_TOKEN
      && env.WHATSAPP_PHONE_NUMBER_ID
      && env.WHATSAPP_OWNER_NUMBER
      && /^\d{8,15}$/.test(ownerNumberDigits)
      && env.WHATSAPP_CUSTOMER_TEMPLATE
      && env.WHATSAPP_OWNER_TEMPLATE
      && env.WHATSAPP_TEMPLATE_LANGUAGE
      && /^v\d+\.\d+$/.test(env.WHATSAPP_GRAPH_API_VERSION || '')
    );
  return {
    mode,
    mockAllowed,
    configured: mockAllowed || resendConfigured || whatsappConfigured,
    issue: mode === 'mock' && !mockAllowed
      ? 'notification_mock_not_allowed'
      : !['mock', 'resend', 'whatsapp'].includes(mode)
        ? 'notification_mode_invalid'
        : !mockAllowed && !resendConfigured && !whatsappConfigured
          ? mode === 'whatsapp' ? 'whatsapp_notifications_not_configured' : 'email_notifications_not_configured'
          : null,
  };
}
