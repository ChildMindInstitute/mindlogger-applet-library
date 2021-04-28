<template>
  <v-dialog
    max-width="800"
    :value="value"
    @input="$emit('input', $event)"
  >
    <v-card>
      <v-card-title class="headline">
        {{ $t('selectAccountToAddBasket') }}
      </v-card-title>

      <v-card-text>
        <v-radio-group v-model="type">
          <v-radio
            :label="$t('addToExistingApplet')"
            value="existing"
          />
          <template v-if="type === 'existing'">
            <v-text-field
              v-model="searchText"
              label="Search"
              prepend-inner-icon="search"
            />
            <select
              v-model="selectedApplet"
              size=5
            >
              <option
                v-for="applet in filteredApplets"
                :key="applet.id"
                :value="applet.id"
              >
                {{ applet.name }}
              </option>
            </select>
          </template>
          <v-radio
            :label="$t('addToNewApplet')"
            value="new"
          />
        </v-radio-group>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn
          color="primary darken-1"
          text
          @click="onAdd"
          :disabled="!type || (type == 'existing' && !selectedApplet)"
        >
          Add
        </v-btn>
        <v-btn
          color="primary darken-1"
          text
          @click="onCancel"
        >
          {{ $t('cancel') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'SelectAppletDialog',
  props: {
    value: {
      type: Boolean,
      required: true
    },
  },
  data() {
    return {
      type: null,
      searchText: '',
      selectedApplet: null,
    };
  },
  computed: {
    ...mapState([
      'currentApplets'
    ]),
    filteredApplets() {
      if (!this.searchText) {
        return this.currentApplets;
      }
      return this.currentApplets.filter(applet => applet.name.toLowerCase().includes(this.searchText.toLowerCase()))
    }
  },
  methods: {
    onAdd() {
      if (this.type == 'existing') {
        this.$emit('selectApplet', this.selectedApplet);
      } else {
        this.$emit('selectApplet', null);
      }
      this.$emit('input', false);
    },
    onCancel() {
      this.$emit('input', false);
    },
  }
}
</script>
