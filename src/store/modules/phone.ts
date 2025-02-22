import type State from '@vuex-orm/core/dist/src/model/contracts/State';

const AppState = {
  user: {},
  call: null,
  lastCall: null,
  incomingCall: null,
  outgoingCall: null,
  stats: {},
  gateStats: [],
  agentStats: {},
  caller: null,
  gateway: {},
  needsWelcome: true,
  callState: 'AWAY',
  callType: null,
  languages: [],
  callHistory: [],
  potentialFailedCall: null,
  currentDnisHistoryRecord: null,
};

// Getters
const getters = {
  callState: (state: State) => state.callState,
  callType: (state: State) => state.callType,
  call: (state: State) => state.call,
  lastCall: (state: State) => state.lastCall,
  potentialFailedCall: (state: State) => state.potentialFailedCall,
  currentDnisHistoryRecord: (state: State) => state.currentDnisHistoryRecord,
  caller: (state: State) => state.caller,
  incomingCall: (state: State) => state.incomingCall,
  outgoingCall: (state: State) => state.outgoingCall,
  stats: (state: State) => state.stats,
  agentStats: (state: State) => state.agentStats,
  gateStats: (state: State) => state.gateStats,
  callHistory: (state: State) => state.callHistory,
  getUser: (state: State) => state.user,
  getGateway: (state: State) => state.gateway,
  isTakingCalls(state: State) {
    return state.callState !== 'AWAY';
  },
  isNotTakingCalls(state: State) {
    return !(state.callState !== 'AWAY');
  },
  isOnCall(state: State) {
    return (
      state.callState === 'ENGAGED-INBOUND' ||
      state.callState === 'ENGAGED-OUTBOUND'
    );
  },
  isInboundCall(state: State) {
    return state.callState === 'ENGAGED-INBOUND';
  },
  isOutboundCall(state: State) {
    return state.callState === 'ENGAGED-OUTBOUND';
  },
  isTransitioning(state: State) {
    return state.callState === 'TRANSITION';
  },
  getLanguages: (state: State) => state.languages,
};

// Actions
const actions = {};

// Mutations
const mutations = {
  setUser(state: State, user: any) {
    state.user = user;
  },
  setCurrentCall(state: State, call: any) {
    state.call = call;
  },
  setIncomingCall(state: State, call: any) {
    state.incomingCall = call;
  },
  setOutgoingCall(state: State, call: any) {
    state.outgoingCall = call;
  },
  setCaller(state: State, caller: any) {
    state.caller = caller;
  },
  setGateway(state: State, gateway: any) {
    state.gateway = gateway;
  },
  seenWelcome(state: State) {
    state.needsWelcome = false;
  },
  needsWelcome(state: State) {
    state.needsWelcome = true;
  },
  setState(state: State, newState: any) {
    state.callState = newState;
  },
  setCallType(state: State, newType: any) {
    state.callType = newType;
  },
  clearLastCall(state: State) {
    state.lastCall = null;
  },
  clearCall(state: State) {
    state.lastCall = state.call;
    state.call = null;
    state.incomingCall = null;
    state.outgoingCall = null;
    state.caller = null;
    state.callType = null;
    state.currentDnisHistoryRecord = null;
  },
  setGeneralStats(state: State, stats: any) {
    state.stats = stats;
  },
  setAgentStats(state: State, stats: any) {
    state.agentStats = stats;
  },
  setGateStats(state: State, stats: any) {
    state.gateStats = stats;
  },
  setLanguages(state: State, languages: any) {
    state.languages = languages;
  },
  setCallHistory(state: State, callHistory: any) {
    state.callHistory = callHistory;
  },
  setPotentialFailedCall(state: State, call: any) {
    state.potentialFailedCall = call;
  },
  setCurrentDnisHistoryRecord(state: State, record: any) {
    state.currentDnisHistoryRecord = record;
  },
  resetState(state: State) {
    Object.assign(state, {
      user: {},
      call: null,
      incomingCall: null,
      outgoingCall: null,
      stats: {},
      agentStats: {},
      gateStats: [],
      caller: null,
      gateway: {},
      needsWelcome: true,
      callState: 'AWAY',
      callType: null,
      languages: [],
      callHistory: [],
      potentialFailedCall: null,
      currentDnisHistoryRecord: null,
    });
  },
};

export default {
  namespaced: true,
  state: AppState,
  getters,
  actions,
  mutations,
};
