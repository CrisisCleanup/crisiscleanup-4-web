import { createStore } from 'vuex';
import * as VuexORM from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import incident from './modules/incident';
import worksite from './modules/worksite';
import database from './database';
import acl from './modules/acl';
import enums from './modules/enums';
import locale from './modules/locale';
import loading from './modules/loading';
import events from './modules/events';
// Import events from './modules/events';
import phone from './modules/phone';
// Import rc from './modules/rc';
// import socket from './modules/socket';
// import ui from './modules/ui';
import map from './modules/map';
import type { CCURootState } from '@/store/types';

const debug = import.meta.env.NODE_ENV !== 'production';

VuexORM.use(VuexORMAxios, {
  axios,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  baseURL: `${import.meta.env.VITE_APP_API_BASE_URL}`,
});
export const store = createStore<CCURootState>({
  modules: {
    acl,
    events,
    incident,
    worksite,
    loading,
    locale,
    enums,
    // Rc,
    // socket,
    phone,
    map,
    // Ui,
  },
  plugins: [VuexORM.install(database)],
  strict: debug,
});
