import { useAuth } from '@/contexts/auth-context';

export function useCurrentUser() {
  const { user } = useAuth();
  return user;
}
