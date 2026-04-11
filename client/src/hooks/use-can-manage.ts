import { useAuth } from '@/contexts/auth-context';
import { USER_ROLE } from '@/constant/enum';

export function useCanManage() {
  const { user } = useAuth();
  return user?.role === USER_ROLE.COACH || user?.role === USER_ROLE.PRESIDENT;
}
