<template>
  <div>
    <div class="mt-0">
      <template v-if="isLoggedIn">
        <BasketView
          @addToBuilder="onAddToBuilder"
          @backToBuilder="onBackToBuilder(false)"
        />
      </template>
      <template v-else>
        <CartView
          @addToBasket="onAddToBasket"
        />
      </template>
    </div>

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

.ds-tree-view, .ds-tree-layout {
  width: 100%
}

.ds-cursor{
  cursor: pointer;
}

#login-wrapper {
  position: absolute;
  z-index: 1;
  top: 0;
}
</style>

<script>
import api from "../services/Api/api.vue";
import { mapState, mapGetters } from 'vuex';
import _ from "lodash";
import LoginForm from "../components/Login/LoginForm.vue";
import BasketView from '../components/Cart/BasketView.vue';
import CartView from '../components/Cart/CartView.vue';
import { AppletMixin } from "../services/mixins/AppletMixin";
import SelectAccountDialog from "../components/dialogs/SelectAccountDialog";
import SelectAppletDialog from "../components/dialogs/SelectAppletDialog";

export default {
  name: 'Cart',
  mixins: [AppletMixin],
  components: {
    BasketView,
    CartView,
    LoginForm,
    SelectAccountDialog,
    SelectAppletDialog,
  },
  data() {
    return {
      step: '',
      showSelectAccountDialog: false,
      selectedAccount: null,
      showSelectAppletDialog: false,
      selectedApplet: null,
    };
  },
  computed: {
    ...mapState([
      'fromBuilder',
      'allAccounts',
    ]),
    ...mapGetters([
      'isLoggedIn'
    ]),
  },
  async beforeMount() {
    try {
      this.isLoading = true;
      if (this.isLoggedIn) {
        await this.fetchBasketContent();
      }
      this.isLoading = false;
    } catch(err) {
      console.log(err);
    }
  },
  methods: {
    onBackToBuilder(sync = false) {
      window.location.href = `${process.env.VUE_APP_ADMIN_URI}/#/library/?from=library&cache=true&sync=${sync}`;
    },
    onAddToBuilder() {
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
    onAddToBasket() {
      this.onLogin();
    },

    onLogin() {
      this.step = 'LOGIN';
    },
    async onLoginSuccess() {
      await this.addCartItemsToBasket();
      this.onSelectAccount();
    },

    onSelectAccount() {
      if (this.allAccounts.length <= 1) {
        this.onSelectedAccount(this.allAccounts[0].accountId);
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
      this.step = 'SELECT_APPLET';
      this.showSelectAppletDialog = true;
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
