import type Worksite from '@/models/Worksite';

interface WorksiteWithTimestamp {
  timestamp: number;
  worksite: Worksite;
}

export const useRecentWorksites = () => {
  const storeKey = 'recent_worksites';
  const storeLimit = 4;

  const _recentWorksitesMap = new Map<number, WorksiteWithTimestamp>();
  const _recentWorksites = useStorage(
    storeKey,
    _recentWorksitesMap,
    window.localStorage,
    {},
  );

  const recentWorksites = computed(() => {
    return [..._recentWorksites.value.values()]
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((item) => item.worksite);
  });

  function addRecentWorksite(worksite: Worksite) {
    _recentWorksites.value.set(worksite.id as number, {
      timestamp: Date.now(),
      worksite,
    });
    // Check if the size of the Map exceeds the limit
    if (_recentWorksites.value.size > storeLimit) {
      console.info('map exceeding limit', _recentWorksites.value);
      // Find the oldest entry
      let oldestKey = null;
      let oldestTimestamp = Number.POSITIVE_INFINITY;
      for (const [key, value] of _recentWorksites.value.entries()) {
        if (value.timestamp < oldestTimestamp) {
          oldestTimestamp = value.timestamp;
          oldestKey = key;
        }
      }

      // Remove the oldest entry
      if (oldestKey !== null) {
        deleteRecentWorksite(oldestKey);
      }
    }
  }

  function deleteRecentWorksite(worksiteId: number) {
    console.info('deleting recent worksite', worksiteId);
    return _recentWorksites.value.delete(Number(worksiteId));
  }

  function clearRecentWorksites() {
    _recentWorksites.value.clear();
  }

  function getRecentWorksite(worksiteId: number) {
    return _recentWorksites.value.get(worksiteId)?.worksite;
  }

  return {
    recentWorksites,
    getRecentWorksite,
    addRecentWorksite,
    deleteRecentWorksite,
    clearRecentWorksites,
  };
};
