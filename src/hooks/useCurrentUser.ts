import { computed } from 'vue';
import * as Sentry from '@sentry/vue';
import createDebug from 'debug';
import Bowser from 'bowser';
import User from '../models/User';
import { getErrorMessage } from '../utils/errors';
import { useAuthStore } from './useAuth';

const debug = createDebug('@crisiscleanup:useCurrentUser');

/**
 * Merge user states.
 *
 * @remarks
 * To be backwards-compatible with clients without per-incident states,
 * update top-level with both globalStates and incidentStates
 * and then update state for current incident with incidentStates.
 *
 * @param currentStates Current user states.
 * @param globalStates Global states.
 * @param incidentStates Per Incident states.
 */
const mergeUserStates = (
  currentStates: Record<string, unknown>,
  globalStates: Record<string, unknown>,
  incidentStates: Record<string, unknown>,
) => {
  const currentIncident = (globalStates.incident ??
    currentStates.incident) as number;
  let updatedStates = {
    ...currentStates,
    ...globalStates,
    ...incidentStates,
  };
  let updatedIncidentStates: Record<number, unknown> =
    (currentStates.incidents ?? {}) as Record<number, unknown>;
  if (incidentStates) {
    const currentIncidentStates = updatedIncidentStates[currentIncident] ?? {};
    updatedIncidentStates = {
      ...updatedIncidentStates,
      [currentIncident]: {
        ...currentIncidentStates,
        ...incidentStates,
      },
    };
  }

  updatedStates = {
    ...updatedStates,
    incidents: updatedIncidentStates,
    // eslint-disable-next-line import/no-named-as-default-member
    userAgent: Bowser.parse(window.navigator.userAgent),
  };
  return updatedStates;
};

/**
 * Hook to retrieve and manage the current user.
 */
export default function useCurrentUser() {
  const authStore = useAuthStore();

  const currentUser = computed(() =>
    authStore.currentUserId.value
      ? User.find(authStore.currentUserId.value)
      : undefined,
  );

  // Readonly user states and preferences.
  const userStates = computed(() => currentUser.value?.states);
  const userPreferences = computed(() => currentUser.value?.preferences);

  // Insert or update the user when the current user is retrieved.
  authStore.onCurrentUserHook.on(async (data) =>
    User.insertOrUpdate({
      data,
      insertOrUpdate: [String(data.id)],
    }),
  );

  // Update sentry context when user becomes available.
  whenever(currentUser, (newUser) => {
    debug('updating current user context: %O', newUser);
    Sentry.setUser(newUser.$toJson());
    Sentry.setContext('user_states', newUser.states);
    Sentry.setContext('user_preferences', newUser.preferences);
  });

  /**
   * Patch current user.
   * @param userData Partial user data to update.
   */
  const updateCurrentUser = async (userData: Partial<User>) => {
    debug('updating current user: %O', userData);
    await Promise.any([
      User.update({
        where: currentUser.value!.id,
        data: userData,
      }).catch(getErrorMessage),
      User.api()
        .patch(`/users/${currentUser.value!.id}`, userData, { save: false })
        .catch(getErrorMessage),
    ]).catch(getErrorMessage);
  };

  /**
   * Update user states.
   * @param globalStates Global states.
   * @param incidentStates Per Incident states.
   */
  const updateUserStates = async (
    globalStates: Record<string, unknown> = {},
    incidentStates: Record<string, unknown> = {},
  ) => {
    const newStates = mergeUserStates(
      currentUser.value?.states ?? {},
      globalStates,
      incidentStates,
    );
    await updateCurrentUser({ states: newStates });
  };

  const updateCurrentUserDebounced = useDebounceFn(updateCurrentUser, 300, {
    maxWait: 1000,
  });
  const updateUserStatesDebounced = useDebounceFn(updateUserStates, 300, {
    maxWait: 1000,
  });

  return {
    currentUser,
    updateUserStates,
    updateCurrentUser,
    updateCurrentUserDebounced,
    updateUserStatesDebounced,
    userStates,
    userPreferences,
  };
}
