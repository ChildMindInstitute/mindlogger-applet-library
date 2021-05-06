import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

import { Store } from 'vuex';
import _ from 'lodash';
import createPersistedState from 'vuex-persistedstate';

const baseImageURL = 'https://raw.githubusercontent.com/ChildMindInstitute/mindlogger-applet-builder/master/src/assets/icons/';
const getDefaultState = () => {
  return {
    backend: process.env.VUE_APP_SERVER_URL, //"https://api-staging.mindlogger.org/api/v1",
    auth: {},
    currentUser: {},
    allAccounts: [],
    currentAccount: {},
    currentApplets: [],
    currentRetentions: null,
    currentLanguage: 'en_US',
    itemTypes: [
      {
        text: "radio",
        icon: baseImageURL + 'item-types/radio-icon.png',
      },
      {
        text: "stackedRadio",
        icon: baseImageURL + 'item-types/radio-icon.png',
      },
      {
        text: 'checkbox',
        icon: baseImageURL + 'item-types/check-box-icon.png',
      },
      {
        text: "stackedCheckbox",
        icon: baseImageURL + 'item-types/check-box-icon.png',
      },
      {
        text: "text",
        icon: baseImageURL + 'item-types/text-input-icon.png',
      },
      {
        text: "slider",
        icon: baseImageURL + 'item-types/slider-icon.png',
      },
      {
        text: "stackedSlider",
        icon: baseImageURL + 'item-types/slider-icon.png',
      },
      {
        text: "photo",
        icon: baseImageURL + 'item-types/photo-icon.png',
      },
      {
        text: "video",
        icon: baseImageURL + 'item-types/video-icon.png',
      },
      {
        text: "timeRange",
        icon: baseImageURL + 'item-types/time-range.png',
      },
      {
        text: "date",
        icon: baseImageURL + 'item-types/date-icon.png',
      },
      {
        text: "drawing",
        icon: baseImageURL + 'item-types/drawing-icon.png',
      },
      {
        text: "audioRecord",
        icon: baseImageURL + 'item-types/audio-icon.png',
      },
      {
        text: "audioImageRecord",
        icon: baseImageURL + 'item-types/audio-image-record-icon.png',
      },
      {
        text: "geolocation",
        icon: baseImageURL + 'item-types/geolocation-icon.png',
      },
      {
        text: "audioStimulus",
        icon: baseImageURL + 'item-types/audio-stimulus-icon.png',
      },
      {
        text: "markdownMessage",
        icon: baseImageURL + 'item-types/message-icon.png',
      },
      {
        text: "cumulativeScore",
        icon: baseImageURL + 'item-types/cumulative-icon.png',
      },
    ],
    publishedApplets: [],
    appletContents: {},
    basketContent: [],
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
  itemTypes(state) {
    return state.itemTypes;
  },
  basketContent(state) {
    return state.basketContent;
  }
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
  setAccounts(state, accounts) {
    state.allAccounts = accounts;
  },
  setUserDetails(state, user) {
    state.currentUser = user;
  },
  switchAccount(state, account) {
    state.currentAccount = account;
    state.currentApplets = account.applets;
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
