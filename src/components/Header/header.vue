<template>
  <v-app-bar
    app
    color="primary"
    dark
  >
    <v-img
      class="logo"
      @click="onLibrarySearch"
      src="/images/logo.png"
      max-width="130"
      contain
    />
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
    <v-badge
      v-if="currentRoute !== '/'"
      color="blue-grey darken-3"
      class="pt-5"
      :content="numberOfCartItems"
      bottom
      offset-x="35"
      offset-y="37"
    >
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-icon 
            color="blue-grey darken-3" 
            class="mx-4 mb-6 ds-cursor"
            large 
            v-bind="attrs"
            v-on="on"
            @click="onViewBasket"
          >
            mdi-basket-outline 
          </v-icon>
        </template>
        <span>Go to basket</span>
      </v-tooltip>
    </v-badge>
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
import { mapState } from 'vuex';

TimeAgo.addLocale(en);
TimeAgo.addLocale(fr);

export default {
  name: "Header",
  components: {
  },

  data() {
    return {
      windowWidth: window.innerWidth,
      currentRoute: "",
    }
  },
  mounted() {
    this.currentRoute = this.$route.path;
    window.onresize = () => {
      this.windowWidth = window.innerWidth
    }
  },
  /**
   * Define here all computed properties.
   */
  computed: {
    ...mapState([
      'basketContent',
      'cartSelections',
    ]),
    isLoggedIn() {
      return !_.isEmpty(this.$store.state.auth);
    },
    isTablet() {
      return this.windowWidth <= 1400 && this.windowWidth >= 768; 
    },
    numberOfCartItems() {
      if (this.isLoggedIn) {  // basket
        return this.basketContent.length.toString();
      } else {  // cart
        return Object.keys(this.cartSelections).length.toString();
      }
    }
  },

  watch:{
    $route (to, from){
      this.currentRoute = to.path;
    },
    basketContent (to, from) {

    }
  },
  /**
   * Define here all methods that will be available in the scope of the template.
   */
  methods: {
    onViewBasket() {
      this.$router.push('/cart').catch(err => {});
    },
    onLibrarySearch() {
      this.$router.push('/').catch(err => {});
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
