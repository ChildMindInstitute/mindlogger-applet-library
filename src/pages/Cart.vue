<template>
  <div>
    <div class="mt-0">
      <template v-if="isLoggedIn">
        <BasketView
          @addToBuilder="onAddToBuilder"
        />
      </template>
      <template v-else>
        <CartView
          @addToBasket="onAddToBasket"
        />
      </template>
    </div>

    <Information
      v-model="informationDialog"
      :dialogText="informationText"
      :title="informationTitle"
    />

    <template v-if="step == 'LOGIN'">
      <v-container
        id="login-wrapper"
        fluid
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
              @loginSuccess="onLoginSuccess"
            />
          </v-flex>
        </v-layout>
      </v-container>
    </template>
    <template v-else-if="step == 'SELECT_ACCOUNT'">
      <SelectAccountDialog
        v-model="showSelectAccountDialog"
        @selectAccount="onSelectedAccount"
      />
    </template>
    <template v-else-if="step == 'SELECT_APPLET'">
      <SelectAppletDialog
        v-model="showSelectAppletDialog"
        @selectApplet="onSelectedApplet"
      />
    </template>
  </div>
</template>

<style lang="scss">
.ds-avatar {
  border-radius: 4px !important;
}

.ds-subtitle {
  padding: 4px !important;
  margin-top: 0 !important;
}

.ds-cursor{
  cursor: pointer;
}

#login-wrapper {
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
}
</style>

<script>
import api from "../services/Api/api";
import { mapState, mapGetters } from 'vuex';
import _ from "lodash";
import LoginForm from "../components/Login/LoginForm";
import BasketView from '../components/Cart/BasketView';
import CartView from '../components/Cart/CartView';
import { AppletMixin } from "../services/mixins/AppletMixin";
import SelectAccountDialog from "../components/dialogs/SelectAccountDialog";
import SelectAppletDialog from "../components/dialogs/SelectAppletDialog";
import Information from "../components/dialogs/InformationDialog";

export default {
  name: 'Cart',
  mixins: [AppletMixin],
  components: {
    BasketView,
    CartView,
    LoginForm,
    SelectAccountDialog,
    SelectAppletDialog,
    Information,
  },
  data() {
    return {
      step: '',
      showSelectAccountDialog: false,
      selectedAccount: null,
      showSelectAppletDialog: false,
      selectedApplet: null,
      informationTitle: '',
      informationText: '',
      informationDialog: false,
    };
  },
  computed: {
    ...mapState([
      'fromBuilder',
      'allAccounts',
      'ownerAccount',
      'currentApplets',
      'cartApplets'
    ]),
    ...mapGetters([
      'isLoggedIn'
    ]),
    accounts() {
      return this.allAccounts.filter((account) => !account.owned)
    }
  },
  methods: {
    checkCartSelections(cartSelections) {
      const allItems = Object.values(cartSelections).reduce((prev, items) => {
        return prev.concat(items);
      },[]);

      if (
        allItems.some(item => item.inputType == 'pastBehaviorTracker' || item.inputType == 'futureBehaviorTracker') &&
        !allItems.some(item => item.inputType == 'tokenSummary')
      ) {
        this.informationDialog = true;
        this.informationText = 'Past/future behavior items can\'t be copied from library to applet builder without token summary screen.';
        this.informationTitle = 'Basket Alert';
        return false;
      }

      return true;
    },

    onAddToBuilder(cartSelections) {
      if (!this.cartApplets.length) {
        this.informationDialog = true;
        this.informationText = 'You have not added anything to your basket yet';
        this.informationTitle = 'Basket Status';

        return ;
      }

      if (!this.checkCartSelections(cartSelections)) {
        return ;
      }

      if (this.fromBuilder) {
        this.onBackToBuilder(true);
      } else {
        const isLoggedIn = !_.isEmpty(this.$store.state.auth);
        if (isLoggedIn) {
          this.onSelectAccount();
        } else {
          this.onLogin();
        }
      }
    },
    onAddToBasket(cartSelections) {
      if (this.checkCartSelections(cartSelections)) {
        this.onLogin();
      }
    },

    onLogin() {
      this.step = 'LOGIN';
    },
    async onLoginSuccess() {
      await this.addCartItemsToBasket();
      await this.fetchBasketApplets();
      this.onSelectAccount();
    },

    onSelectAccount() {
      if (this.accounts.length == 0) {
        this.onSelectedAccount(this.ownerAccount.accountId);
      } else {
        this.step = 'SELECT_ACCOUNT';
        this.showSelectAccountDialog = true;
      }
    },
    onSelectedAccount(selectedAccount) {
      this.selectedAccount = selectedAccount;
      api
        .switchAccount({
          apiHost: this.apiHost,
          token: this.token,
          accountId: this.selectedAccount,
        })
        .then((resp) => {
          this.$store.commit("switchAccount", resp.data.account);
          this.onSelectApplet();
        })
        .catch((err) => {
          console.warn(err);
        });
    },

    onSelectApplet() {
      if (this.currentApplets.length > 0) {
        this.step = 'SELECT_APPLET';
        this.showSelectAppletDialog = true;
      } else {
        this.onSelectedApplet(null);
      }
    },
    onSelectedApplet(selectedApplet) {
      this.selectedApplet = selectedApplet;
      this.switchToAdmin();
    },

    switchToAdmin() {
      api.createToken({
        apiHost: this.apiHost,
        token: this.token,
      }).then((res) => {
        const { token } = res.data;
        window.location.href = `${process.env.VUE_APP_ADMIN_URI}/#/library/?from=library&cache=false&token=${token}&account=${this.selectedAccount}${this.selectedApplet ? `&applet=${this.selectedApplet}` : ''}`;
      });
    },
  },
};
</script>
