<script>
/**
 * Admin-panel API routes
 */
import axios from "axios";
import store from '../../state';

const signIn = ({ apiHost, user, password }) =>
  axios({
    method: "get",
    url: `${apiHost}/user/authentication`,
    headers: { "Girder-Authorization": `Basic ${btoa(`${user}:${password}`)}` },
    params: {
      lang: store.state.currentLanguage.substr(0, 2),
    },
  });

const signInWithToken = ({ apiHost, token }) =>
  axios({
    method: "get",
    url: `${apiHost}/user/authentication`,
    headers: { "Girder-Token": `${token}` },
    params: {
      lang: store.state.currentLanguage.substr(0, 2),
    },
  });

const signUp = ({ apiHost, body }) =>
  axios({
    method: "post",
    url: `${apiHost}/user`,
    params: {
      ...body,
      admin: true,
    },
  });

const resetPassword = ({ apiHost, body }) =>
  axios({
    method: "put",
    url: `${apiHost}/user/password/temporary`,
    params: {
      ...body,
    },
  });

const getUserDetails = ({ apiHost, token }) =>
  axios({
    method: "get",
    url: `${apiHost}/user/me`,
    headers: {
      "Girder-Token": token,
    },
  });

const getPublishedApplets = ({ apiHost }) =>
  axios({
    method: "get",
    url: `${apiHost}/library/applets`,
  });

const addAppletsToBasket = ({ apiHost, data }) =>
  axios({
    method: "post",
    url: `${apiHost}/library/basket`,
    data,
  });

const deleteBasketApplet = ({ apiHost, appletId, token }) =>
  axios({
    method: "delete",
    url: `${apiHost}/library/basket/applet?appletId=${appletId}`,
    headers: {
      "Girder-Token": token,
    },
  });

const updateAppletBasket = ({ apiHost, appletId, selection, token }) =>
  axios({
    method: "put",
    url: `${apiHost}/library/basket/selection?appletId=${appletId}`,
    headers: {
      "Girder-Token": token,
    },
    selection,
  });

const getAppletContent = ({ apiHost, libraryId }) =>
  axios({
    method: "get",
    url: `${apiHost}/library/applet/content?libraryId=${libraryId}`,
  });

const getBasketContent = ({ apiHost, libraryId, token }) =>
  axios({
    method: "get",
    url: `${apiHost}/library/basket/content`,
    headers: {
      "Girder-Token": token,
    },
  });

const updateRegistration = ({ apiHost, token, groupId, open }) =>
  axios({
    method: "PUT",
    url: `${apiHost}/group/${groupId}?openRegistration=${open}`,
    headers: {
      "Girder-Token": token,
    },
  });

const getUsersData = ({ apiHost, token, appletId, options }) =>
  axios({
    method: "GET",
    url: `${apiHost}/applet/${appletId}/data`,
    headers: {
      "Girder-Token": token,
    },
    params: options,
  });

export default {
  signIn,
  signUp,
  signInWithToken,
  addAppletsToBasket,
  getUserDetails,
  resetPassword,
  updateRegistration,
  updateAppletBasket,
  deleteBasketApplet,
  getPublishedApplets,
  getAppletContent,
  getBasketContent,
  getUsersData,
}
</script>
