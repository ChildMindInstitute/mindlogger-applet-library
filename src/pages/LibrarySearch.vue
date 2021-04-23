<template>
  <div v-show="!isLoading">
    <div class="d-flex align-center justify-center align-content-ceneter">
      <v-text-field
        v-model="searchText"
        @input="onSearchText"
        light
        solo
        prepend-inner-icon="search"
        placeholder="Type keyword...">
      </v-text-field>

      <v-badge
        color="primary"
        content="0"
        bottom
        offset-x="35"
        offset-y="37"
      >
        <v-icon 
          color="blue-grey darken-3" 
          class="mx-4 mb-6 ds-cursor"
          large 
          @click="onViewBasket"
        >
          mdi-basket-outline 
        </v-icon>
      </v-badge>
    </div>

    <div class="mt-0">
      <v-card 
        class="mx-auto mb-4 d-flex pa-md-2"
        v-for="applet in filteredApplets"
        :key="applet.id"
      >
        <div class="text-center">
          <v-img
            v-if="applet.image"
            class="ma-2 ds-avatar"
            :src="applet.image"
            max-width="150px"
            height="150px"
          />

          <v-avatar
            v-else
            tile
            class="ma-2 ds-avatar"
            color="blue"
            size="150"
          >
            <span class="white--text text-h3">
              {{ applet.name[0] }}
            </span>
          </v-avatar>
        </div>
        <div class="ds-tree-layout ml-2">
          <v-card-title class="text-decoration-underline text-h6">
            {{ applet.name }}
          </v-card-title>

          <v-card-subtitle 
            v-if="applet.description"
            class="mx-6 black--text text-body-1 ds-subtitle"
          >
            Description: {{ applet.description }}
          </v-card-subtitle>

          <v-card-actions class="mx-5 px-2 py-0">
            <span 
              v-if="applet.keywords.length"
              class="text-body-1"
            >
              Keywords: 
            </span>
            <v-btn
              v-for="keyword in applet.keywords"
              :key="keyword"
              color="orange lighten-2"
              text
              :class="searchText === keyword ? 'font-weight-bold' : ''"
              @click="searchText = keyword"
            >
              {{ keyword }}
            </v-btn>
          </v-card-actions>

          <div class="ds-tree-layout ml-2">
            <v-treeview
              class="ds-tree-view"
              v-model="appletSelections[applet.appletId]"
              :items="[appletsTree[applet.appletId]]"
              selection-type="leaf"
              selected-color="darkgrey"
              on-icon="mdi-checkbox-marked-circle-outline"
              off-icon="mdi-checkbox-blank-circle-outline"
              indeterminate-icon="mdi-minus-circle-outline"
              open-on-click
              selectable
              return-object
            >
              <template v-slot:prepend="{ item }">
                  <v-icon 
                    v-if="item.selected === true && item.options"
                    class="mr-1"
                    color="dark-grey"
                    @click="item.selected = !item.selected"
                  >
                    mdi-menu-down
                  </v-icon>
                  <v-icon 
                    v-if="item.selected === false && item.options"
                    class="mr-1"
                    color="dark-grey" 
                    @click="item.selected = !item.selected"
                  >
                    mdi-menu-right
                  </v-icon>
              </template>
              <template v-slot:append="{ item }">
                <template v-if="item.selected === true && (item.inputType === 'radio' || item.inputType === 'checkbox')">
                  <div
                    v-for="option in item.options"
                    :key="option"
                    class="d-flex align-center pt-2"
                  >
                    <v-icon 
                      v-if="item.inputType === 'checkbox'"
                      class="mr-1"
                      color="dark-grey" 
                    >
                      mdi-checkbox-marked-outline
                    </v-icon>
                    <v-icon 
                      v-else 
                      class="mr-1"
                      color="dark-grey" 
                    >
                      mdi-radiobox-marked
                    </v-icon>
                    <v-img
                      v-if="option.image"
                      class="ds-avatar mr-2"
                      :src="option.image"
                      max-width="27px"
                      height="27px"
                    />
                    {{ option.name }}
                  </div>
                </template>
              </template>
            </v-treeview>
          </div>
        </div>
        <div class="d-flex align-baseline">
          <v-btn
            class="mx-2 mt-2"
            fab
            small
            @click="onAddBasket(applet.appletId)"
            :disabled="!appletSelections[applet.appletId] || appletSelections[applet.appletId].length == 0"
          >
            <v-icon color="grey darken-3" >
              mdi-basket-plus-outline
            </v-icon>
          </v-btn>

          <v-btn
            class="ml-2 mt-2 mr-6"
            fab
            small
            @click="onAppletDetail(applet)"
          >
            <v-icon color="grey darken-3">
              mdi-information-outline
            </v-icon>
          </v-btn>
        </div>
      </v-card>
    </div>
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

</style>

<script>
import api from "../services/Api/api.vue";
import { mapState, mapGetters } from 'vuex';
import { AppletMixin } from "../services/mixins/AppletMixin";
import { AccountMixin } from "../services/mixins/AccountMixin";

export default {
  name: 'LibrarySearch',
  mixins: [AccountMixin, AppletMixin],
  components: {

  },
  data() {
    return {
      isLoading: true,
      searchText: "",
      baskets: [],
    };
  },
  /**
   * Define here all computed properties.
   */
  computed: {
    ...mapState([
      'publishedApplets',
      'appletsTree',
      'appletContents',
      'appletSelections',
      'cartSelections',
    ]),
    ...mapGetters([
      'isLoggedIn',
    ]),
    filteredApplets() {
      if (!this.searchText) {
        return this.publishedApplets;
      }
      return this.publishedApplets.filter((applet) =>
        applet.keywords.find(keyword => keyword.toLowerCase() === this.searchText.toLowerCase())
      );
    },
  },
  async beforeMount() {
    const { from, token } = this.$route.query;
    if (from == 'builder' && token) {
      try {
        const resp = await api.getUserDetails({
          apiHost: this.$store.state.backend,
          token,
        });
        if (resp.data) {
          this.setAuth({
            auth: {
              authToken: {
                token
              }
            }
          });
          this.$store.commit("setFromBuilder", true);
        }
      } catch (e) {
        console.log('token error', e.response.data.message);
      }
    }
    try {
      this.isLoading = true;
      await this.fetchPublishedApplets();
      this.isLoading = false;
    } catch(err) {
      console.log(err);
    }
  },
  methods: {
    onAddBasket (appletId) {
      if (this.isLoggedIn) {  // add to basket
        const form = new FormData();
        const formData = this.parseAppletCartItem(appletId, this.appletSelections[appletId])

        form.set("selection", JSON.stringify(formData));
        api.updateAppletBasket({
          apiHost: this.$store.state.backend,
          token: this.$store.state.auth.authToken.token,
          appletId,
          data: form,
        }).then(() => {
          if (!this.baskets.includes(appletId)) {
            this.baskets.push(appletId);
          }
        });
      } else {  // add to cart
        this.$store.commit("setCartSelections", {
          ...this.cartSelections,
          [appletId]: this.appletSelections[appletId]
        });
      }
    },
    onAppletDetail(applet) {
      this.$router.push({
        name: 'AppletDetail',
        params: { appletId: applet.id },
      });
    },
    /*
     * Change appletTreeData format to basket data 
     */
    onSearchText () {

    },
    onViewBasket () {
      this.$router.push({
        name: 'Cart',
      });
    },
  },
};
</script>
