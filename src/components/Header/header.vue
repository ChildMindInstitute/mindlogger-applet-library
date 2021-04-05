<template>
  <v-app-bar
    app
    color="primary"
    dark
  >
    <v-img
      class="logo"
      @click="onDashboard"
      src="/images/logo.png"
      max-width="130"
      contain
    />

    <v-btn
      color="primary"
      class="toolbar-btn"
      @click="onDashboard"
    >
      {{ $t('mindloggerDashboard') }}
    </v-btn>
    <v-btn
      color="primary"
      class="toolbar-btn"
      @click="onLibrarySearch"
    >
      {{ $t('mindloggerLibrary') }}
    </v-btn>
    <v-spacer />
    <v-btn
      v-if="isLoggedIn"
      class="toolbar-btn"
      color="primary"
      @click="onLogout"
    >
      {{ $t('logout') }}
    </v-btn>
    <v-btn
      v-else
      color="primary"
      class="toolbar-btn"
      @click="onLogin"
    >
      {{ $t('login') }}
    </v-btn>
  </v-app-bar>
</template>

<style scoped>
.toolbar-btn {
  box-shadow: unset;
  text-transform: none;
  font-size: 18px !important;
}

.logo {
  margin-right: 12px;
  cursor: pointer;
}

.logout {
  font-size: 15px !important;
}

</style>

<script>

import api from '../../services/Api/api.vue';
import encryption from '../../services/Encryption/encryption.vue';

import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import fr from 'javascript-time-ago/locale/fr';

TimeAgo.addLocale(en);
TimeAgo.addLocale(fr);

export default {
  name: "Header",
  components: {
  },

  data() {
    return {
      windowWidth: window.innerWidth,
    }
  },
  mounted() {
    window.onresize = () => {
      this.windowWidth = window.innerWidth
    }
  },
  /**
   * Define here all computed properties.
   */
  computed: {
    isLoggedIn() {
      return !_.isEmpty(this.$store.state.auth);
    },
    isTablet() {
      return this.windowWidth <= 1400 && this.windowWidth >= 768; 
    },
  },
  /**
   * Define here all methods that will be available in the scope of the template.
   */
  methods: {
    onDashboard() {
      if (this.isLoggedIn) {
        this.$router.push('/dashboard').catch(err => {
          console.log(err);
        });
      }
    },
    onLibrarySearch() {
      this.$router.push('/librarySearch').catch(err => {});
    },
    onLogout() {
      this.$store.commit('resetState');
      this.$router.push('/login').catch(err => {});
    },
    onLogin() {
      this.$router.push('/login').catch(err => {});
    }
  },
};
</script>
