import { createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { storeConfig } from '../../src/state/';
import { cloneDeep } from 'lodash';

function getLocalStore() {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  const store = new Vuex.Store(cloneDeep(storeConfig));
  return store;
}


test('sets "backend" value when "setBackend" is committed', () => { 
  const store = getLocalStore();
  const sampleBackend = 'sample.backend.com/api/v1';
  store.commit('setBackend', sampleBackend);
  expect(store.state.backend).toBe(sampleBackend);
});

test('sets "currentApplet" value when "setCurrentApplet" is committed', () => { 
  const store = getLocalStore(); 
  const sampleApplet = { 
    'applet': { 
      '_id': 'testAppletId', 
    } 
  }; 
  store.commit('setCurrentApplet', sampleApplet); 
  expect(store.state.currentAppletMeta).toBe(sampleApplet); 
}); 

test('sets "auth" value when "setAuth" is committed', () => { 
  const store = getLocalStore();
  const token = { 
    'token': 'xxx', 
  };
  const sampleAuth = {
    'authToken': token,
    'user': {
      '_id': 'userId',
      'login': 'userLogin',
      'displayName': 'userName'
    }
  };
  const userData = {
    'auth': sampleAuth,
    'email': 'email@email.com',
  } 
  store.commit('setAuth', userData); 
  expect(store.state.auth).toBe(sampleAuth); 
}); 

test('sets "currentUsers" value when "setCurrentUsers" is committed', () => { 
  const store = getLocalStore(); 
  const sampleUsers = [ 
    'user1', 
    'user2', 
  ]; 
  store.commit('setCurrentUsers', sampleUsers); 
  expect(store.state.currentUsers).toBe(sampleUsers); 
}); 

test('sets "users" value when "setAuth" is committed', () => { 
  const store = getLocalStore(); 
  const sampleUsers = [ 
    'user1', 
    'user2', 
  ]; 
  store.commit('setUsers', sampleUsers); 
  expect(store.state.users).toBe(sampleUsers); 
}); 

test('sets "reviewers" value when "setReviewers" is committed', () => {
  const store = getLocalStore();
  const sampleReviewers = [
    'user1',
    'user2',
  ]; 
  store.commit('setReviewers', sampleReviewers); 
  expect(store.state.reviewers).toBe(sampleReviewers);
});
