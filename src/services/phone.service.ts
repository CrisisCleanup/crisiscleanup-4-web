import AgentLibrary from 'cf-agent-library';
import axios from 'axios';
import { store } from '../store';
import User from '../models/User';
import Incident from '../models/Incident';
import { i18n } from '@/modules/i18n';
import useEmitter from '@/hooks/useEmitter';
import useCurrentUser from '@/hooks/useCurrentUser';

const LANGUAGE_ID_MAPPING: Record<any, any> = {
  2: import.meta.env.VITE_APP_ENGLISH_PHONE_GATEWAY,
  6: import.meta.env.VITE_APP_SPANISH_PHONE_GATEWAY,
  7: import.meta.env.VITE_APP_SPANISH_PHONE_GATEWAY,
  76: import.meta.env.VITE_APP_SPANISH_PHONE_GATEWAY,
};

// Const Log = Logger({
//   name: 'phoneLegacy',
// });
export default class PhoneService {
  store!: any;
  loggedInAgentId: string | undefined;
  agent_id: string | undefined;
  callInfo: any;
  queueIds: any;
  username: string | undefined;
  password: string | undefined;
  cf: typeof AgentLibrary | undefined;

  constructor() {
    this.loggedInAgentId = undefined;
    this.agent_id = undefined;
    this.username = undefined;
    this.password = undefined;
    this.callInfo = {};
  }

  initPhoneService(accessToken = null) {
    this.store = store;
    this.queueIds = [
      ...new Set([
        import.meta.env.VITE_APP_ENGLISH_PHONE_GATEWAY,
        import.meta.env.VITE_APP_SPANISH_PHONE_GATEWAY,
      ]),
    ];
    const socketDest =
      accessToken && this.agent_id
        ? `wss://c01-con.vacd.biz:8080/?access_token=${accessToken}&agent_id=${this.agent_id}`
        : `wss://c01-con.vacd.biz:8080/`;
    this.cf = new AgentLibrary({
      // Caution, this is prod
      socketDest, // 'ws://d01-test.cf.dev:8080',
      callbacks: {
        closeResponse: this.onCloseFunction.bind(this),
        openResponse: this.onOpenFunction.bind(this),
        newCallNotification: this.onNewCall.bind(this),
        addSessionNotification: this.onNewSession.bind(this),
        endCallNotification: this.endCallFunction.bind(this),
        // AgentStats: this.onGetStatsAgent.bind(this),
        agentDailyStats: this.onGetStatsAgentDaily.bind(this),
        queueStats: this.onQueueStats.bind(this),
      },
    });
  }

  async apiLogoutAgent(agentId: string | undefined) {
    await axios.post(
      `${
        import.meta.env.VITE_APP_API_BASE_URL
      }/connect_first/agents/${agentId}/logout`,
      {},
    );
  }

  async apiUpdateStats(agentId: string | undefined) {
    await axios.post(
      `${
        import.meta.env.VITE_APP_API_BASE_URL
      }/connect_first/agents/${agentId}/update_stats`,
      {},
    );
  }

  async apiGetQueueStats() {
    return axios.get(
      `${import.meta.env.VITE_APP_API_BASE_URL}/connect_first/stats`,
    );
  }

  async apiLoginsByPhone(phone: string, queue: number) {
    return axios.get(
      `${
        import.meta.env.VITE_APP_API_BASE_URL
      }/connect_first/agents/logins?phone=${phone}&queue=${queue}`,
    );
  }

  async createAgent() {
    return axios.post(
      `${import.meta.env.VITE_APP_API_BASE_URL}/connect_first/agents`,
      {},
    );
  }

  async getUserNameForAgent(agentId: string) {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_APP_API_BASE_URL
        }/connect_first/agents/${agentId}`,
      );
      return response.data.username;
    } catch {
      const { updateUserStates } = useCurrentUser();
      await updateUserStates({
        currentAgentId: null,
      });
      return import.meta.env.VITE_APP_PHONE_DEFAULT_USERNAME;
    }
  }

  async onNewCall(info: any) {
    const currentUserStore = useCurrentUser();
    const { emitter } = useEmitter();
    const currentUser = currentUserStore.currentUser.value;
    this.callInfo = info;
    let state = null;
    let incomingCall = null;
    if (info.callType === 'INBOUND') {
      state = 'ENGAGED-INBOUND';
      const response = await axios.get(
        `${
          import.meta.env.VITE_APP_API_BASE_URL
        }/phone_inbound/get_by_session_id?session_id=${info.uii}`,
      );
      this.store.commit('phone/setIncomingCall', response.data);
      incomingCall = response.data;

      const availableIncidentIds = new Set(
        Incident.all().map((incident) => incident.id),
      );
      const incidentsToRequest = response.data.incident_id.filter(
        (id: string) => {
          return !availableIncidentIds.has(id);
        },
      );
      try {
        await Promise.all(
          incidentsToRequest.map(async (id: string) => {
            return axios.post(
              `${import.meta.env.VITE_APP_API_BASE_URL}/incident_requests`,
              {
                organization: currentUser?.organization.id,
                incident: id,
                temporary_access: true,
              },
            );
          }),
        );

        await Incident.api().fetchById(response.data.incident_id[0]);
        const { updateUserStates } = useCurrentUser();
        await updateUserStates({ incident: response.data.incident_id[0] });
        emitter.emit('update:incident', response.data.incident_id[0]);
      } catch {
        // Log.debug('Error requesting incident access: ', error);
      }
    } else if (info.callType === 'OUTBOUND') {
      state = 'ENGAGED-OUTBOUND';
    }

    this.store.commit('phone/setState', state);
    const dnisResponse = await axios.get(
      `${import.meta.env.VITE_APP_API_BASE_URL}/phone_dnis?dnis=${
        info.ani
      }&sort=-created_at&limit=1`,
    );

    const [caller] = dnisResponse.data.results;
    this.store.commit('phone/setCaller', caller);

    const dnisHistoryResponse = await axios.post(
      `${import.meta.env.VITE_APP_API_BASE_URL}/phone/history`,
      {
        session_id: info.uii,
        dnis: caller.id,
        inbound: incomingCall?.id || null,
      },
    );
    const currentDnisHistoryRecord = dnisHistoryResponse.data;
    this.store.commit(
      'phone/setCurrentDnisHistoryRecord',
      currentDnisHistoryRecord,
    );

    emitter.emit('phone_component:close');
    emitter.emit('phone_component:open', 'caller');
  }

  async getAccessToken() {
    const myHeaders = new Headers();
    myHeaders.append('accept', '*/*');
    myHeaders.append('accept-language', 'en-US,en;q=0.9,es;q=0.8,es-MX;q=0.7');
    myHeaders.append(
      'content-type',
      'application/x-www-form-urlencoded;charset=UTF-8',
    );

    const raw = `username=${this.username}&password=${
      this.password || 'volunteer'
    }&platformId=aws80&redirectToApp=true`;

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    } as RequestInit;

    return fetch(
      'https://engage.ringcentral.com/api/auth/login/agent',
      requestOptions,
    )
      .then(async (response) => response.json())
      .catch((error) => {
        console.log('error', error);
      });
  }

  onCloseFunction() {
    // Log.debug('AgentLibrary closed');
    this.loggedInAgentId = undefined;
    this.store.commit('phone/resetState');

    this.getAccessToken().then((result) => {
      this.initPhoneService(result.accessToken);
    });
  }

  async resetPhoneSystem() {
    await this.logout();
    this.store.commit('phone/resetState');
  }

  async onNewSession(info: any) {
    if (info.sessionType === 'AGENT') {
      if (this.store.getters['phone/incomingCall']) {
        this.store.commit(
          'phone/setCurrentCall',
          this.store.getters['phone/incomingCall'],
        );
        this.store.commit('phone/setCallType', 'INBOUND');
        this.store.commit('phone/setIncomingCall', null);
      } else {
        this.store.commit(
          'phone/setCurrentCall',
          this.store.getters['phone/outgoingCall'],
        );
        this.store.commit('phone/setOutgoingCall', null);
      }

      await Incident.api().get(
        '/incidents?fields=id,name,short_name,geofence,locations,turn_on_release,active_phone_number&limit=250&sort=-start_at',
        {
          dataKey: 'results',
        },
      );
    }
    // Log.debug(info);
  }

  onOpenFunction() {
    // Log.debug('AgentLibrary open');
  }

  endCallFunction(info: any) {
    // Log.debug(info);
    if (info.callDts) {
      this.store.commit('phone/setIncomingCall', null);
      this.store.commit('phone/setOutgoingCall', null);
    } else {
      this.store.commit(
        'phone/setPotentialFailedCall',
        this.store.getters['phone/call'],
      );
      this.store.commit('phone/clearCall');
    }

    this.changeState('AWAY').then(null);
    this.apiUpdateStats(this.loggedInAgentId).catch(null);
  }

  onGetStatsAgent(info: any) {
    // Log.debug(info);
  }

  onGetStatsAgentDaily(info: any) {
    this.store.commit('phone/setAgentStats', { ...info });
  }

  onQueueStats(info: any) {
    this.store.commit('phone/setGeneralStats', { ...info.totals });
    this.store.commit('phone/setGateStats', [...info.queues]);
  }

  async login(
    username = import.meta.env.VITE_APP_PHONE_DEFAULT_USERNAME,
    password = import.meta.env.VITE_APP_PHONE_DEFAULT_PASSWORD,
    state = 'AVAILABLE',
    agentId: string | undefined,
  ) {
    this.username = username;
    this.password = password;
    this.agent_id = agentId;
    const currentUserStore = useCurrentUser();
    const currentUser = currentUserStore.currentUser.value;
    return new Promise((resolve, reject) => {
      if (!currentUser?.mobile) {
        throw new Error(
          i18n.global.t('phoneDashboard.please_set_valid_phone_number'),
        );
      }

      this.cf.loginAgent(
        username,
        password,
        async (data: any) => {
          // Log.debug('Logged in agent', data);
          if (data.status === 'FAILURE') {
            reject(new Error(i18n.global.t('phoneDashboard.phone_no_log_in')));
            return;
          }

          this.loggedInAgentId = data.agentSettings?.agentId;

          const queueIds = [];

          if (
            currentUser.primary_language &&
            LANGUAGE_ID_MAPPING[currentUser.primary_language]
          ) {
            queueIds.push(LANGUAGE_ID_MAPPING[currentUser.primary_language]);
          }

          if (
            currentUser.secondary_language &&
            LANGUAGE_ID_MAPPING[currentUser.secondary_language]
          ) {
            queueIds.push(LANGUAGE_ID_MAPPING[currentUser.secondary_language]);
          }

          this.cf.configureAgent(
            currentUser.mobile,
            queueIds,
            null,
            null,
            null,
            null,
            (configureResponse: any) => {
              // Log.debug('Configure response', configureResponse);
              if (configureResponse.status === 'FAILURE') {
                if (
                  configureResponse.detail.includes(
                    'Active agent session found',
                  )
                ) {
                  // Log.debug('Existing login found. Setting status');
                  this.apiLogoutAgent(this.loggedInAgentId).then(() => {
                    this.loggedInAgentId = undefined;
                    reject(new Error('Active agent session found'));
                  });
                } else {
                  this.logout(data.agentSettings.agentId);
                  reject(
                    new Error(
                      'Configuration failed: ' + configureResponse.detail,
                    ),
                  );
                }
              } else {
                // Log.debug('AgentLibrary successfully logged in');
                this.changeState(state)
                  .then(() => {
                    resolve(state);
                  })
                  .catch(() => {
                    reject(
                      new Error(`Failed to change state: ${error.message}`),
                    );
                  });
              }
            },
          );
        },
        (e: Error) => {
          reject(e);
          // Log.debug(e);
        },
      );
    });
  }

  async logout(agentId = null) {
    return new Promise((resolve) => {
      this.cf.logoutAgent(agentId || this.loggedInAgentId, (data: any) => {
        // Log.debug('logged out agent', data);
        this.store.commit('phone/setState', 'AWAY');
        resolve(true);
      });
    });
  }

  async changeState(newState: any) {
    return new Promise((resolve) => {
      let state = newState;
      this.cf.setAgentState(newState, null, (setAgentStateResponse: any) => {
        if (setAgentStateResponse.currentState === 'ENGAGED') {
          if (this.callInfo.callType === 'INBOUND') {
            state = 'ENGAGED-INBOUND';
          } else if (this.callInfo.callType === 'OUTBOUND') {
            state = 'ENGAGED-OUTBOUND';
          }
        } else {
          state = setAgentStateResponse.currentState;
        }

        this.store.commit('phone/setState', state);
        // Window.vue.$log.debug(
        //   'Set agent state response',
        //   setAgentStateResponse,
        // );
        resolve(true);
      });
    });
  }

  async dial(destination: string, callerId: string | undefined) {
    return new Promise((resolve) => {
      this.cf.offhookInit((offhookInitResponse: any) => {
        // Log.debug('Offhook init response', offhookInitResponse);
        if (offhookInitResponse.status === 'FAILURE') {
          this.store.commit('phone/setState', 'ENDED');
          this.store.commit('phone/setIncomingCall', null);
          this.store.commit('phone/setOutgoingCall', null);
          this.callInfo = {};
          resolve(true);
        } else {
          this.cf.manualOutdial(
            destination,
            callerId || import.meta.env.VITE_APP_DEFAULT_CALLER_ID,
          );
          resolve(true);
        }
      });
    });
  }

  async hangup() {
    return new Promise((resolve) => {
      this.cf.hangup(this.callInfo.sessionId);
      // Log.debug(this.store.callState);
      this.cf.offhookTerm((offhookTermResponse: any) => {
        // Log.debug('Offhook term response', offhookTermResponse);
        this.changeState('AWAY').then(() => {
          resolve(true);
        });
      });
    });
  }
}
