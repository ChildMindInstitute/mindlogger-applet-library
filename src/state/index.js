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
    appletContents: {},
    basketContent: {},
    appletsTree: {},
    appletSelections: {},
    cartSelections: {},
    basketSelections: {},
    fromBuilder: false,
  };
};

const state = getDefaultState();

const getters = {
  isLoggedIn (state) {
    return !_.isEmpty(state.auth)
  },
};

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
  setAppletContents(state, appletContents) {
    state.appletContents = appletContents;
  },
  setBasketContent(state, basketContent) {
    state.basketContent = basketContent;
  },
  setAppletsTree(state, appletsTree) {
    state.appletsTree = appletsTree;
  },
  setAuth(state, userData) {
    state.auth = userData.auth;
  },
  setCartSelections(state, cartSelections) {
    state.cartSelections = cartSelections;
  },
  setFromBuilder(state, fromBuilder) {
    state.fromBuilder = fromBuilder;
  }
};

const stateCopy = (({ 
  // Excluded properties.
  currentLanguage,
  ...o
}) => o)(state);
const stateToPersist = Object.keys(stateCopy);

export const storeConfig = {
  state,
  getters,
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
