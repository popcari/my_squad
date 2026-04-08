import { useAuth } from '@/contexts/auth-context';

export function useCanManage() {
  const { user } = useAuth();
  return user?.role === 'coach' || user?.role === 'president';
}
