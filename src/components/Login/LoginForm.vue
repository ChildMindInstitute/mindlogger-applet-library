<template>
  <div>
    <v-card class="elevation-12">
      <v-toolbar
        color="primary"
        dark
        flat
      >
        <v-toolbar-title>{{ $t("login") }} </v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <p>
          {{ $t("logIntoAccount") }}
        </p>
        <v-form
          ref="form"
          lazy-validation
        >
          <v-text-field
            v-model="email"
            :label="$t('login')"
            prepend-icon="mdi-account"
          />

          <v-text-field
            v-model="password"
            :rules="passwordRules"
            :label="$t('password')"
            type="password"
            prepend-icon="lock"
          />
        </v-form>

        <div
          v-if="error"
          class="error"
        >
          {{ error }}
        </div>
        <v-row align="center">
          <v-col cols="auto">
            <v-btn
              color="primary"
              @click="login"
            >
              {{ $t("login") }}
            </v-btn>
          </v-col>
          <v-col cols="4">
            <v-select
              v-model="currentLanguage"
              :items="languages"
              :label="$t('selectLanguage')"
              item-text="label"
              item-value="value"
              hide-details
              single-line
              outlined
              dense
              @change="onLanguageChange"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.error {
  color: "red";
}

.v-btn {
  margin: 6px 8px;
}

/* .v-select__selections input {
  width: 0;
} */
</style>

<script>
import api from '../../services/Api/api';
import _ from "lodash";
import { AccountMixin } from '../../services/mixins/AccountMixin';

export default {
  mixins: [AccountMixin],
  data() {
    return {
      valid: true,
      email: "",
      emailRules: [
        (v) => !!v || this.$i18n.t("emailRequired"),
        (v) => /.+@.+\..+/.test(v) || this.$i18n.t("emailMustBeValid"),
      ],
      password: "",
      passwordRules: [(v) => !!v || this.$i18n.t("passwordRequired")],
      error: "",
      // languages: [
      //   {
      //     label: this.$i18n.t('en'),
      //     value: "en_US",
      //   },
      //   {
      //     label: this.$i18n.t('fr'),
      //     value: "fr_FR",
      //   },
      // ],
      currentLanguage: "en_US",
    }
  },

  computed: {
    apiHost() {
      return this.$store.state.backend;
    },
    languages() {
      return [
        {
          label: this.$i18n.t('en'),
          value: "en_US",
        },
        {
          label: this.$i18n.t('fr'),
          value: "fr_FR",
        },
      ]
    }
  },

  created() {
    this.currentLanguage = this.$route.query.lang || this.$store.state.currentLanguage;
  },

  methods: {
    onLanguageChange() {
      this.$i18n.locale = this.currentLanguage;
      this.$store.commit("setCurrentLanguage", this.currentLanguage);
      this.$router.replace({ query: { lang: this.currentLanguage }})
    },
    login() {
      if (!this.$refs.form.validate()) {
        return;
      }

      this.error = "";
      api
        .signIn({
          apiHost: this.$store.state.backend,
          user: this.email,
          password: this.password,
        })
        .then((resp) => {
          this.setAuth({ auth: resp.data, email: this.email });
          this.onLoginSuccess();
        })
        .catch((e) => {
          this.error = e.response.data.message;
        });
    },
    onLoginSuccess() {
      this.$emit("loginSuccess");
    },
    onSetBackend() {
      this.$emit("setBackend", null);
    },
  },
};
</script>

<style lang="scss" scoped>
.ml-32 {
  margin-left: 32px;
}
.text-underline {
  text-decoration: underline;
  user-select: none;
  cursor: pointer;
}
</style>
