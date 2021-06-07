<template>
  <v-container
    fluid
    fill-height
  >
    <v-layout
      align-center
      justify-center
    >
      <v-flex
        xs12
        sm8
        md4
      >
        <LoginForm
          @loginSuccess="loginSuccess"
        />
      </v-flex>

      <v-snackbar
        v-model="snackAlert"
        :color="color"
        :timeout="timeout"
      >
        {{ text }}
        <v-btn
          color="white"
          text
          @click="snackAlert = false"
        >
          {{ $t("close") }}
        </v-btn>
      </v-snackbar>
    </v-layout>
  </v-container>
</template>

<style scoped>
.error {
  color: "red";
}
</style>

<script>
import _ from "lodash";
import LoginForm from "../components/Login/LoginForm.vue";
import { AppletMixin } from "../services/mixins/AppletMixin";

export default {
  name: "Login",
  mixins: [AppletMixin],

  components: {
    LoginForm,
  },

  data: () => ({
    color: "#0abb8a",
    snackAlert: false,
    timeout: 3000,
    text: ""
  }),
  created() {
    this.text = this.$t("resetEmailSent");
  },
  methods: {
    async loginSuccess() {
      await this.addCartItemsToBasket();
      this.$router.push('/').catch(err => {});
    },
  },
};
</script>
