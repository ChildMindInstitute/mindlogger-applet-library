<template>
  <v-app>
    <Header />
    <v-content>
      <ContentBar @backToBuilder="onBackToBuilder(false)" />
      <v-container fluid>
        <router-view />
      </v-container>
    </v-content>
    <Footer />
  </v-app>
</template>

<script>
import store from './state';
import Header from './components/Header/header';
import Footer from './components/Footer/footer';
import ContentBar from './components/ContentBar';


export default {
  name: 'App',
  store,
  components: {
    Header,
    Footer,
    ContentBar,
  },

  /**
   * This method gets executed when the VNode has been created.
   *
   * @returns {void}
   */
  created() {
    this.$store.commit('setCurrentLanguage', this.$route.query.lang || 'en_US');
    this.$store.commit('setBackend', null);
  },
};
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css?family=IBM+Plex+Sans:300,400');
@import '../node_modules/@ag-grid-community/all-modules/dist/styles/ag-grid.css';
@import '../node_modules/@ag-grid-community/all-modules/dist/styles/ag-theme-balham.css';
</style>

<style>
.primary {
  background-color: #005fa3 !important;
  border-color: #005fa3 !important;
}
.v-application > .v-application--wrap > .v-content {
  background-color: rgb(239,239,243) !important;
}

.export-icon {
  transform: rotate(90deg) translateX(2px);
}
.v-data-table td {text-align: left}
.v-data-table th {   border-right: 1px solid #eee !important }
body,
html,
#app,
#dayspan {
  font-family: 'IBM Plex Sans', sans-serif !important;
  width: 100%;
  height: 100%;
}

div.ag-root .ag-cell-focus {
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  user-select: text;
}

.item-type-icon {
  opacity: 0.5;
}
</style>
