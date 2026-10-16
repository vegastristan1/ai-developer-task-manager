interface SendResetEmailInput {
  to: string;
  resetUrl: string;
}

function sender(): string {
  return process.env['EMAIL_FROM'] ?? 'AI Developer Task Manager <no-reply@example.com>';
}

/**
 * Sends the password-reset link. Uses Resend when RESEND_API_KEY is set,
 * otherwise logs the link (local dev / prod without email configured).
 * Returns how the email was delivered for API responses and tests.
 */
export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: SendResetEmailInput): Promise<{ delivered: 'resend' | 'log' }> {
  const apiKey = process.env['RESEND_API_KEY'];
  if (!apiKey) {
    console.log(`[email:log] password reset for ${to}: ${resetUrl}`);
    return { delivered: 'log' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: sender(),
      to,
      subject: 'Reset your password',
      text: [
        'You requested a password reset for your workspace account.',
        '',
        `Reset your password (valid for 1 hour): ${resetUrl}`,
        '',
        'If you did not request this, you can ignore this email.',
      ].join('\n'),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error(`[email:resend] failed for ${to}: ${response.status} ${detail}`);
    // Fall back to logging so the user is never silently locked out.
    console.log(`[email:log] password reset for ${to}: ${resetUrl}`);
    return { delivered: 'log' };
  }

  return { delivered: 'resend' };
}
