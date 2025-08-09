import { i18n } from '@/modules/i18n';
import Worksite from '@/models/Worksite';
import useCurrentPortal from '@/hooks/useCurrentPortal';
import { getErrorMessage } from '@/utils/errors';
import useDialogs from '@/hooks/useDialogs';

export default function useClaimWorksite() {
  const { confirm } = useDialogs();
  const { portal } = useCurrentPortal();

  async function claim(worksiteId: string | number, workTypes: string[] = []) {
    try {
      await Worksite.api().claimWorksite(worksiteId, workTypes, {
        portal: portal.value,
      });
      return { ok: true as const };
    } catch (error) {
      const message =
        getErrorMessage(error) || i18n.global.t('errors.unexpected_error');
      const restrictionMessage = i18n.global.t(
        'info.claiming_restricted_threshold_exceeded',
      );
      const restrictionFallback =
        'Additional claiming is restricted for this incident due to your current claiming statistics. Please close existing claimed work types before claiming additional work.';
      const isRestriction =
        message === restrictionMessage || message === restrictionFallback;

      await confirm({
        title: isRestriction
          ? i18n.global.t('info.claiming_restricted_threshold_exceeded_title')
          : i18n.global.t('actions.claim'),
        content: message,
      });
      return { ok: false as const, error };
    }
  }

  return { claim };
}
