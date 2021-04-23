<template>
  <v-container fluid>
    <Loading v-if="isLoading" />
    <div v-else> Dashboard </div>
  </v-container>
</template>

<style scoped>
</style>

<script>
import api from "../services/Api/api.vue";
import Loading from "../components/Loading";

export default {
  name: "Dashboard",
  components: {
    Loading,
  },
  data: () => ({
    isLoading: true,
  }),

  mounted() {

  },
  methods: {
 
  },
};
</script>