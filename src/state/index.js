import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

import { Store } from 'vuex';
import _ from 'lodash';
import createPersistedState from 'vuex-persistedstate';

const getDefaultState = () => {
  return {
    backend: process.env.VUE_APP_SERVER_URL,
    auth: {},
    currentLanguage: 'en_US',
    currentRetentions: null,
    publishedApplets: [],
  };
};

const state = getDefaultState();

const mutations = {
  setCurrentLanguage(state, lang) {
    state.currentLanguage = lang;
  },
  resetState(state) {
    Object.assign(state, getDefaultState());
  },
  setBackend(state, backend) {
    state.backend = backend || process.env.VUE_APP_SERVER_URL;
  },
  setPublishedApplets(state, publishedApplets) {
    state.publishedApplets = publishedApplets;
  },
  setAuth(state, userData) {
    state.auth = userData.auth;
  },
};

const stateCopy = (({ 
  // Excluded properties.
  currentLanguage,
  ...o
}) => o)(state);
const stateToPersist = Object.keys(stateCopy);

export const storeConfig = {
  state,
  mutations,
  plugins: [
    createPersistedState({
      storage: window.sessionStorage,
      paths: stateToPersist,
    }),
  ],
};

const store = new Store(storeConfig);

export default store;
