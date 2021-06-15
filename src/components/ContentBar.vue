<template>
  <v-alert
    v-if="fromBuilder"
    class="content-bar text-center mb-0"
    color="yellow"
  >
    <v-row no-gutters>
      <v-col sm=2 />
      <v-col sm=8 align-self="center">
        Adding content for the applet you are currently creating
      </v-col>
      <v-col sm=2 align-self="center">
        <v-btn
          outlined
          text
          @click="onBackToBuilder(false)"
        >
          <v-icon small> mdi-chevron-left </v-icon>
          Back to applet builder
        </v-btn>
      </v-col>
    </v-row>
  </v-alert>
</template>

<style scoped>
</style>

<script>
import { mapState, } from "vuex";
import { AppletMixin } from "../services/mixins/AppletMixin";

export default {
  name: "Header",
  mixins: [AppletMixin],
  computed: {
    ...mapState(["fromBuilder"]),
  }
}
</script>
