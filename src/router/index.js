import Vue from "vue";
import Router from "vue-router";
import Login from "../pages/Login";
import LibrarySearch from "../pages/LibrarySearch";
import Cart from "../pages/Cart";
import CartView from "../components/Cart/CartView";
import AppletDetail from "../pages/AppletDetail";
import store from "../state";
import { getLanguageCode } from '../plugins/language';
import api from '../services/Api/api.vue';
import _ from "lodash";

Vue.use(Router);

let router = new Router({
  routes: [
    {
      path: "/login",
      name: "Login",
      component: Login,
      meta: {
        guest: true,
      },
    },
    {
      path: "/cart",
      name: "Cart",
      component: Cart,
    },
    {
      path: "/",
      name: "LibrarySearch",
      component: LibrarySearch,
    },
    {
      path: "/appletDetail",
      name: "AppletDetail",
      component: AppletDetail,
    },
    {
      path: "/",
      redirect: "/login",
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  let { isLoggedIn } = store.getters;

  if (!isLoggedIn) {
    const { token } = to.query;
    if (token) {
      try {
        const resp = await api.getUserDetails({
          apiHost: store.state.backend,
          token,
        })
        if (resp.data) {
          store.commit("setAuth", { auth: {
            authToken: {
              token
            }
          }});
          store.commit("setFromBuilder", true);
          store.commit("setUserDetails", resp.data);
          isLoggedIn = true;
        }
      } catch (e) {
        console.log('token error', e.response.data.message)
      }
    }
  }

  const isPrivatePage = to.matched.some((record) => record.meta.requiresAuth);
  const isGuestPage = to.matched.some((record) => record.meta.guest);
  const lang = getLanguageCode(
    from.query.lang || store.state.currentLanguage || 'en'
  );

  // Redirect unauthenticated users to the login page if they are trying to
  // access a page that requires authentication.
  if ( (isPrivatePage || !to.matched.length) && !isLoggedIn) {
    return next({
      path: "/login",
      query: { nextUrl: to.fullPath, lang },
    });
  } 

  // Prevent users from accessing the login page if they are already
  // authenticated.
  if ( (isGuestPage || !to.matched.length) && isLoggedIn) {
    return next({ path: "/dashboard", query: { lang }});
  } 

  // Evaluates to true if the lang parameter is set to just 'en' instead of
  // 'en_US'.
  const isShortLangCode =  to.query.lang && to.query.lang.length < 5;
  
  // When navigating to a page, make sure that the current language is persisted
  // in the URL.
  if (to && !to.query.lang || isShortLangCode) {
    return next({
      ...to,
      path: to.path,
      query: { ...to.query, lang },
      params: to.params,
    });
  } 
  return next();
});

export default router;
