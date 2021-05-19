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

const createToken = ({ apiHost, token }) =>
  axios({
    method: "post",
    url: `${apiHost}/user/token`,
    headers: {
      "Girder-Token": token,
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

const getAccounts = ({ apiHost, token }) =>
  axios({
    method: "get",
    url: `${apiHost}/user/accounts`,
    headers: {
      "Girder-Token": token,
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

const switchAccount = ({ apiHost, token, accountId }) =>
  axios({
    method: "put",
    url: `${apiHost}/user/switchAccount`,
    headers: {
      "Girder-Token": token,
    },
    params: {
      accountId,
    },
  });

const getPublishedApplets = ({ apiHost }) =>
  axios({
    method: "get",
    url: `${apiHost}/library/applets`,
  });

const addAppletsToBasket = ({ apiHost, token, data }) =>
  axios({
    method: "post",
    url: `${apiHost}/library/basket`,
    headers: {
      "Girder-Token": token,
    },
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

const updateAppletBasket = ({ apiHost, token, appletId, data }) =>
  axios({
    method: "put",
    url: `${apiHost}/library/basket/selection?appletId=${appletId}`,
    headers: {
      "Girder-Token": token,
    },
    data,
  });

const getAppletContent = ({ apiHost, libraryId, nextActivity }) => {
  let url = `${apiHost}/library/applet/content?libraryId=${libraryId}`;

  if (nextActivity) {
    url = url + `&nextActivity=${nextActivity}`;
  }

  return axios({
    method: "get",
    url,
  }).then(resp => {
    const response = resp.data;

    if (response.nextActivity)
    {
      return new Promise(resolve => setTimeout(() => resolve(getAppletContent({ apiHost, libraryId, nextActivity: response.nextActivity }).then(next => {
        for (const activityIRI in next.data.activities) {
          response.activities[activityIRI] = next.data.activities[activityIRI];
        }

        for (const itemIRI in next.data.items) {
          response.items[itemIRI] = next.data.items[itemIRI];
        }

        return {
          data: {
            ...response
          }
        };
      })), 50));
    }

    return resp;
  })
}

const getBasketContents = ({ apiHost, token }) =>
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

const getAppletContributionOrigin = ({ apiHost, libraryId }) =>
  axios({
    method: "get",
    url: `${apiHost}/library/contribution/origin?libraryId=${libraryId}`,
  });

const getAppletContributionUpdates = ({ apiHost, libraryId }) =>
  axios({
    method: "get",
    url: `${apiHost}/library/contribution/updates?libraryId=${libraryId}`,
  });

export default {
  signIn,
  signUp,
  signInWithToken,
  addAppletsToBasket,
  getAccounts,
  getUserDetails,
  switchAccount,
  resetPassword,
  updateRegistration,
  updateAppletBasket,
  deleteBasketApplet,
  getPublishedApplets,
  getAppletContent,
  getBasketContents,
  getUsersData,
  createToken,
  getAppletContributionOrigin,
  getAppletContributionUpdates,
}
</script>
