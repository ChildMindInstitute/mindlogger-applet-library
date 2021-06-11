import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

import { Store } from "vuex";
import _ from "lodash";
import createPersistedState from "vuex-persistedstate";

const baseImageURL =
  "https://raw.githubusercontent.com/ChildMindInstitute/mindlogger-applet-builder/master/src/assets/icons/";
const getDefaultState = () => {
  return {
    backend: "https://api-staging.mindlogger.org/api/v1", //"https://api-staging.mindlogger.org/api/v1",
    auth: {},
    currentUser: {},
    ownerAccount: {},
    allAccounts: [],
    currentAccount: {},
    currentApplets: [],
    currentRetentions: null,
    currentLanguage: "en_US",
    itemTypes: [
      {
        text: "radio",
        icon: baseImageURL + "item-types/radio-icon.png"
      },
      {
        text: "stackedRadio",
        icon: baseImageURL + "item-types/radio-icon.png"
      },
      {
        text: "checkbox",
        icon: baseImageURL + "item-types/check-box-icon.png"
      },
      {
        text: "stackedCheckbox",
        icon: baseImageURL + "item-types/check-box-icon.png"
      },
      {
        text: "text",
        icon: baseImageURL + "item-types/text-input-icon.png"
      },
      {
        text: "slider",
        icon: baseImageURL + "item-types/slider-icon.png"
      },
      {
        text: "stackedSlider",
        icon: baseImageURL + "item-types/slider-icon.png"
      },
      {
        text: "photo",
        icon: baseImageURL + "item-types/photo-icon.png"
      },
      {
        text: "video",
        icon: baseImageURL + "item-types/video-icon.png"
      },
      {
        text: "time",
        icon: baseImageURL + "item-types/time-range.png"
      },
      {
        text: "timeRange",
        icon: baseImageURL + "item-types/time-range.png"
      },
      {
        text: "date",
        icon: baseImageURL + "item-types/date-icon.png"
      },
      {
        text: "drawing",
        icon: baseImageURL + "item-types/drawing-icon.png"
      },
      {
        text: "audioRecord",
        icon: baseImageURL + "item-types/audio-icon.png"
      },
      {
        text: "audioImageRecord",
        icon: baseImageURL + "item-types/audio-image-record-icon.png"
      },
      {
        text: "geolocation",
        icon: baseImageURL + "item-types/geolocation-icon.png"
      },
      {
        text: "audioStimulus",
        icon: baseImageURL + "item-types/audio-stimulus-icon.png"
      },
      {
        text: "markdownMessage",
        icon: baseImageURL + "item-types/message-icon.png"
      },
      {
        text: "cumulativeScore",
        icon: baseImageURL + "item-types/cumulative-icon.png"
      }
    ],
    publishedApplets: [],
    appletContents: {},
    appletsTree: {},
    appletSelections: {},
    cartApplets: [],
    cartSelections: {},
    fromBuilder: false
  };
};

const state = getDefaultState();

const getters = {
  isLoggedIn(state) {
    return !_.isEmpty(state.auth);
  },
  numberOfCartItems(state) {
    return state.cartApplets.length.toString();
  },
  appletsTree(state) {
    return state.appletsTree;
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
    state.backend = backend || "https://api-staging.mindlogger.org/api/v1";
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
  setPublishedApplets(state, applets) {
    state.publishedApplets = applets;
  },
  setAppletContent(state, { appletContent, appletId }) {
    state.appletContents[appletId] = appletContent;
  },
  setAppletTree(state, { tree, appletId }) {
    state.appletsTree[appletId] = tree;
  },
  addTreeNodes(state, { children, appletId }) {
    for (const child of children) {
      state.appletsTree[appletId].children.push(child);
    }
  },
  setAuth(state, userData) {
    state.auth = userData.auth;
    if (userData.auth.account) {
      state.currentAccount = userData.auth.account;
      state.currentApplets = userData.auth.account.applets.owner;
      state.ownerAccount = userData.auth.account;
    }
  },
  setCartApplets(state, cartApplets) {
    state.cartApplets = cartApplets;
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
  appletContents,
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
      paths: stateToPersist
    })
  ]
};

const store = new Store(storeConfig);

export default store;
