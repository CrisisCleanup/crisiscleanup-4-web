import type { Module } from 'vuex';
import type { CCURootState } from '@/store/types';

export interface WorksiteModuleState {
  visitedWorksiteIds: Set<number>;
}

const worksiteModule: Module<WorksiteModuleState, CCURootState> = {
  namespaced: true,
  state: {
    visitedWorksiteIds: new Set<number>(),
  },
  getters: {
    visitedWorksiteIds(state) {
      return [...state.visitedWorksiteIds];
    },
  },
  mutations: {
    addVisitedWorksite(state, visitedWorksiteId: number) {
      state.visitedWorksiteIds.add(visitedWorksiteId);
    },
    removeVisitedWorksite(state, visitedWorksiteId: number) {
      return state.visitedWorksiteIds.delete(visitedWorksiteId);
    },
    clearVisitedWorksites(state) {
      return state.visitedWorksiteIds.clear();
    },
  },
};

export default worksiteModule;
