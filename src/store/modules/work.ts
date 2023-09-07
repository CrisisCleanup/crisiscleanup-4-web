import type { Module } from 'vuex';
import type { CCURootState } from '@/store/types';

export interface WorkModuleState {
  sviScale: number;
}

const work: Module<WorkModuleState, CCURootState> = {
  namespaced: true,
  state: {
    sviScale: 100,
  },
  getters: {
    getSviScale(state) {
      return state.sviScale;
    },
  },
  actions: {},
  mutations: {
    setSviScale(state, sviScale: number) {
      state.sviScale = sviScale;
    },
  },
};

export default work;
