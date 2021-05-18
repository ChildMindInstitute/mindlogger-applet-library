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
        <v-radio-group v-model="selectedAccount">
          <v-radio
            v-for="account in accounts"
            :key="account.accountId"
            :label="account.accountName"
            :value="account.accountId"
          />
        </v-radio-group>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn
          color="primary darken-1"
          text
          @click="onAdd"
          :disabled="!selectedAccount"
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
  name: 'SelectAccountDialog',
  props: {
    value: {
      type: Boolean,
      required: true
    },
  },
  data() {
    return {
      selectedAccount: '',
    };
  },
  computed: {
    ...mapState([
      'ownerAccount',
      'allAccounts'
    ]),
    accounts() {
      return [
        this.ownerAccount,
        ...this.allAccounts.filter(account => account.accountId !== this.ownerAccount.accountId)
      ]
    }
  },
  methods: {
    onAdd() {
      this.$emit('selectAccount', this.selectedAccount);
      this.$emit('input', false);
    },
    onCancel() {
      this.$emit('input', false);
    },
  }
}
</script>
