import Vue from "vue";
import Router from "vue-router";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import LibrarySearch from "../pages/LibrarySearch";
import ViewBasket from "../pages/ViewBasket";
import AppletDetail from "../pages/AppletDetail";
import store from "../state";
import api from "../services/Api/api.vue";
import { getLanguageCode } from '../plugins/language';
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
      path: "/viewBasket",
      name: "ViewBasket",
      component: ViewBasket,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/librarySearch",
      name: "LibrarySearch",
      component: LibrarySearch,
    },
    {
      path: "/appletDetail",
      name: "AppletDetail",
      component: AppletDetail,
    },
    {
      path: "/dashboard",
      name: "Dashboard",
      component: Dashboard,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/",
      redirect: "/librarySearch",
    },
  ],
});

router.beforeEach((to, from, next) => {
  const isLoggedIn = !_.isEmpty(store.state.auth);
  const isPrivatePage = to.matched.some((record) => record.meta.requiresAuth);
  const isGuestPage = to.matched.some((record) => record.meta.guest);
  const lang = getLanguageCode(
    from.query.lang || store.state.currentLanguage || 'en'
  );
  const token = to.query.token || '';
  
  if (token) {
    console.log('token', token)
    api
      .signInWithToken({
        apiHost: store.state.backend,
        token,
      })
      .then((resp) => {
        store.commit("setAuth", { auth: resp.data, email: resp.data.user.email });
        return next({
          path: "/librarySearch",
          query: { nextUrl: to.fullPath, lang },
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }
  // Redirect unauthenticated users to the login page if they are trying to
  // access a page that requires authentication.
  if ((isPrivatePage || !to.matched.length) && !isLoggedIn) {
    console.log('from', from);
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
