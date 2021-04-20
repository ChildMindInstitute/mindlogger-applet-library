import api from "../Api/api.vue";

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
    setAuth(authData) {
      this.$store.commit("setAuth", authData);
    },
  }
}
