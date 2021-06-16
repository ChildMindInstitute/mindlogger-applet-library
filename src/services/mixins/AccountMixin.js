import api from "../Api/api";

export const AccountMixin = {
  computed: {
    apiHost() {
      return this.$store.state.backend;
    },
    token() {
      return this.$store.state.auth.authToken.token;
    },
  },
  methods: {
    async signInWithToken(token) {
      const resp = await api.signInWithToken({
        apiHost: this.apiHost,
        token
      });
      this.setAuth({
        auth: resp.data,
        email: resp.data.user.email
      });
    },
    setAuth(authData) {
      this.$store.commit("setAuth", authData);
      this.setAccounts();
      this.setUserDetails();
    },
    setAccounts() {
      api
        .getAccounts({
          apiHost: this.apiHost,
          token: this.token,
        })
        .then((resp) => {
          this.$store.commit("setAccounts", resp.data);
        })
        .catch((err) => {
          console.warn(err);
        });
    },
    setUserDetails() {
      api
        .getUserDetails({
          apiHost: this.apiHost,
          token: this.token,
        })
        .then((resp) => {
          this.$store.commit("setUserDetails", resp.data);
        })
        .catch((err) => {
          console.warn(err);
        });
    },
  }
}
