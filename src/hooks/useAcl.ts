import { store } from '../store';
import { useCurrentUser } from '@/hooks';

function $can(rule: string) {
  const { currentUser } = useCurrentUser();
  const acl = store.getters['acl/acl'];
  return acl.can(currentUser, rule);
}

export default function useAcl() {
  return {
    $can,
  };
}
