// src/services/phoneTest.service.ts
import AgentLibrary from 'cf-agent-library';
import axios from 'axios';
import useCurrentUser from '@/hooks/useCurrentUser';
import { i18n } from '@/modules/i18n';
import PhoneService from './phone.service';
import { reject } from 'lodash';

export default class PhoneTestService extends PhoneService {
  constructor() {
    super();
    // Any additional initialization for testing
  }

  initPhoneService(
    accessToken: string,
    newCallNotificationCallback: (data: any) => void,
    addSessionNotificationCallback: (data: any) => void,
    endCallNotificationCallback: (data: any) => void,
  ) {
    const socketDest =
      accessToken && this.agent_id
        ? `wss://c01-con.vacd.biz:8080/?access_token=${accessToken}&agent_id=${this.agent_id}`
        : `wss://c01-con.vacd.biz:8080/`;
    this.cf = new AgentLibrary({
      socketDest,
      callbacks: {
        closeResponse: () => {},
        openResponse: () => {},
        newCallNotification: newCallNotificationCallback || (() => {}),
        addSessionNotification: addSessionNotificationCallback || (() => {}),
        endCallNotification: endCallNotificationCallback || (() => {}),
        agentDailyStats: () => {},
        queueStats: () => {},
      },
    });
  }

  async login(
    username = import.meta.env.VITE_APP_PHONE_DEFAULT_USERNAME,
    password = import.meta.env.VITE_APP_PHONE_DEFAULT_PASSWORD,
    state = 'AWAY',
    agentId?: string,
  ) {
    this.username = username;
    this.password = password;
    this.agent_id = agentId;
    const currentUserStore = useCurrentUser();
    const currentUser = currentUserStore.currentUser.value;
    return new Promise((resolve, reject) => {
      this.cf.loginAgent(
        username,
        password,
        async (data: any) => {
          if (data.status === 'FAILURE') {
            reject(new Error(i18n.global.t('phoneDashboard.phone_no_log_in')));
            return;
          }
          const queueIds = [import.meta.env.VITE_APP_ENGLISH_PHONE_GATEWAY];

          this.cf.configureAgent(
            currentUser.mobile,
            queueIds,
            null,
            null,
            null,
            null,
            (configureResponse: any) => {
              if (configureResponse.status === 'FAILURE') {
                if (
                  configureResponse.detail.includes(
                    'Active agent session found',
                  )
                ) {
                  reject(new Error('Active agent session found'));
                } else {
                  reject(
                    new Error(
                      'Configuration failed: ' + configureResponse.detail,
                    ),
                  );
                }
              } else {
                this.cf.setAgentState(
                  state,
                  null,
                  (setAgentStateResponse: any) => {
                    resolve(true);
                  },
                );
              }
            },
          );
        },
        (e: Error) => {
          reject(e);
        },
      );
    });
  }

  async logout(agentId = null) {
    return new Promise((resolve) => {
      this.cf.logoutAgent(agentId, (data: any) => {
        // Log.debug('logged out agent', data);
        resolve(true);
      });
    });
  }

  async dial(destination: string, callerId?: string) {
    this.cf.offhookTerm((offhookTermResponse: any) => {});

    return new Promise((resolve) => {
      this.cf.offhookInit((offhookInitResponse: any) => {
        if (offhookInitResponse.status === 'FAILURE') {
          reject(new Error('Failed to go offhook'));
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
}
