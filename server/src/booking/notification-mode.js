export function notificationConfiguration(env = process.env) {
  const mode = String(env.NOTIFICATIONS_MODE || 'resend').trim().toLowerCase();
  const mockAllowed = mode === 'mock'
    && ['development', 'test'].includes(env.NODE_ENV)
    && (env.RAZORPAY_MODE || 'test') === 'test';
  const resendConfigured = mode === 'resend'
    && Boolean(env.RESEND_API_KEY && env.EMAIL_FROM && env.OWNER_EMAIL);
  return {
    mode,
    mockAllowed,
    configured: mockAllowed || resendConfigured,
    issue: mode === 'mock' && !mockAllowed
      ? 'notification_mock_not_allowed'
      : !['mock', 'resend'].includes(mode)
        ? 'notification_mode_invalid'
        : !mockAllowed && !resendConfigured
          ? 'email_notifications_not_configured'
          : null,
  };
}
