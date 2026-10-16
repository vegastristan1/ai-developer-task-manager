import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const instant = false;

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ResetPasswordForm token={token} />;
}
