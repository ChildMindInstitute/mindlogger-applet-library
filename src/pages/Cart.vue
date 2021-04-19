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
          @addToBuilder="onAddToBuilder"
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
      SELECT_ACCOUNT
    </template>
    <template v-else-if="step == 'SELECT_MODE'">
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

export default {
  name: 'Cart',
  mixins: [AppletMixin],
  components: {
    BasketView,
    CartView,
    LoginForm,
  },
  data() {
    return {
      step: '',
    };
  },
  computed: {
    ...mapState([
      'fromBuilder'
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
      window.location.href = `${process.env.VUE_APP_ADMIN_URI}/#/build/
        ?from=library
        &sync=${sync}
      `;
    },
    onAddToBuilder() {
      console.log('onAddToBuilder');
      if (this.fromBuilder) {
        onBackToBuilder(true);
      } else {
        const isLoggedIn = !_.isEmpty(this.$store.state.auth);
        if (isLoggedIn) {
          this.step = 'SELECT_ACCOUNT';
          this.switchToAdmin();
          // api.createToken({
          //   apiHost: this.$store.state.backend,
          //   token: this.$store.state.auth.authToken.token,
          // }).then((res) => {
          //   const { token } = res;
          //   window.location.href = `${process.env.VUE_APP_ADMIN_URI}/#/build/
          //     ?from=library
          //     &sync=true
          //     &token=${token}
          //   `;
          // });
        } else {
          this.step = 'LOGIN';
        }
      }
    },
    async onLoginSuccess() {
      await this.addCartItemsToBasket();
      this.step = 'SELECT_ACCOUNT';
      this.switchToAdmin();
    },

    switchToAdmin() {
      api.createToken({
        apiHost: this.apiHost,
        token: this.token,
      }).then((res) => {
        const { token } = res;
        window.location.href = `${process.env.VUE_APP_ADMIN_URI}/#/build/
          ?from=library
          &token=${token}
        `;
      });
    },
  },
};
</script>
