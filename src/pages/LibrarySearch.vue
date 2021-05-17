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

      <v-tooltip left>
        <template v-slot:activator="{ on, attrs }">
          <v-badge
            color="primary"
            :content="numberOfCartItems"
            bottom
            offset-x="35"
            offset-y="37"
          >
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
          </v-badge>
        </template>
        <span>Go to basket</span>
      </v-tooltip>
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
        <div class="ds-main-layout ml-2">
          <v-card-title class="text-decoration-underline text-h6" v-html="highlight(applet.name)" />
          <v-card-subtitle 
            v-if="applet.description"
            class="mx-6 black--text text-body-1 ds-subtitle"
            v-html="highlight(applet.description)"
          />

          <v-card-actions class="d-block mx-5 px-2 py-0">
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
              @click="searchText = keyword"
            >
              <span v-html="highlight(keyword)" />
            </v-btn>
          </v-card-actions>

          <div class="ds-tree-layout ml-2">
            <v-treeview
              class="ds-tree-view"
              v-model="appletSelections[applet.appletId]"
              :items="[appletsTree[applet.appletId]]"
              selection-type="leaf"
              selected-color="darkgrey"
              open-on-click
              selectable
              return-object
            >
              <template v-slot:prepend="{ item }">
                <v-icon 
                  v-if="item.selected === true"
                  class="mr-1"
                  color="dark-grey"
                  @click="item.selected = !item.selected"
                >
                  mdi-menu-down
                </v-icon>
                <v-icon 
                  v-if="item.selected === false"
                  class="mr-1"
                  color="dark-grey" 
                  @click="item.selected = !item.selected"
                >
                  mdi-menu-right
                </v-icon>
              </template>
              <template v-slot:append="{ item }">
                <span v-html="highlight(item.title)" />
                <div v-if="item.selected === true">
                  <div 
                    v-if="item.inputType === 'radio' || item.inputType === 'checkbox'"
                    v-for="option in item.options"
                    :key="option.name"
                    class="d-flex align-center pt-2"
                  >
                    <img
                      class="mr-2"
                      width="15"
                      :src="itemTypes.find(({ text }) => text === item.inputType).icon"
                    />
                    <v-img
                      v-if="option.image"
                      class="ds-avatar mr-2"
                      :src="option.image"
                      max-width="27px"
                      height="27px"
                    />
                    <span v-html="highlight(option.name)" />
                  </div>
                  <div 
                    v-if="item.inputType !== 'radio' && item.inputType !== 'checkbox'"
                    class="d-flex align-center pt-2"
                  >
                    <img
                      class="mr-2"
                      width="15"
                      :src="itemTypes.find(({ text }) => text === item.inputType).icon"
                    />
                    <span v-html="highlight(item.inputType)" />
                  </div>
                </div>
              </template>
            </v-treeview>
          </div>
        </div>
        <div class="d-flex align-baseline">
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                class="mx-2 mt-2"
                v-bind="attrs"
                v-on="on"
                fab
                small
                @click="onAddBasket(applet.appletId)"
                :disabled="!appletSelections[applet.appletId] || appletSelections[applet.appletId].length == 0"
              >
                <v-icon color="grey darken-3" >
                  mdi-basket-plus-outline
                </v-icon>
              </v-btn>
            </template>
            <span>Add to basket</span>
          </v-tooltip>

          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                class="ml-2 mt-2 mr-6"
                v-bind="attrs"
                v-on="on"
                fab
                small
                @click="onAppletDetail(applet)"
              >
                <v-icon color="grey darken-3">
                  mdi-information-outline
                </v-icon>
              </v-btn>
            </template>
            <span>See applet detail</span>
          </v-tooltip>
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

.ds-main-layout {
  width: calc(100% - 300px);
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
      'itemTypes',
    ]),
    filteredApplets() {
      if (!this.searchText) {
        return this.publishedApplets.filter(applet => applet);;
      }
      return this.publishedApplets.filter((applet) => {
        const regex = new RegExp(this.searchText, 'ig');
        const appletData = this.appletsTree[applet.appletId];

        if (applet.name.match(regex)
          || applet.description.match(regex)
          || appletData.title.match(regex)) {
          return true;
        }

        for (const keyword of applet.keywords) {
          if (keyword.match(regex)) {
            return true;
          }
        }

        for (const activityData of appletData.children) {
          if (activityData.title.match(regex)) {
            return true;
          }
          for (const itemData of activityData.children) {
            if (itemData.title.match(regex)) {
              return true;
            }
            if (itemData.inputType === "radio" || itemData.inputType === "checkbox") {
              for (const optionData of itemData.options) {
                if (optionData.name.match(regex)) {
                  return true;
                }
              }
            } else if (itemData.inputType.match(regex)) {
              return true;
            }
          }
        }

        return false;
      });
    },
    numberOfCartItems() {
      if (this.isLoggedIn) {  // basket
        return this.baskets.length.toString();
      } else {  // cart
        return Object.keys(this.cartSelections).length.toString();
      }
    }
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
      if (this.isLoggedIn) {
        const basketApplets = (await api.getBasketContent({
          apiHost: this.$store.state.backend,
          token: this.$store.state.auth.authToken.token,
        })).data;

        Object.keys(basketApplets).forEach((appletId) => {
          const publishedApplet = this.publishedApplets.find((applet) => applet.appletId === appletId);
          
          if (publishedApplet) {
            this.baskets.push(publishedApplet);
          }
        });
        this.$store.commit("setBasketContent", [...this.baskets]);
      }
      this.isLoading = false;
    } catch(err) {
      console.log(err);
    }
  },
  methods: {
    highlight (rawString) {
      if (this.searchText) {
        const searchRegex = new RegExp('(' + this.searchText + ')' , 'ig');

        return rawString
          .replace(searchRegex, '<b><i>$1</i></b>')
          .replaceAll(" ", "&nbsp;");
      } else {
        return rawString;
      }
    },
    onAddBasket (appletId) {
      if (this.isLoggedIn) {  // add to basket
        const form = new FormData();
        const currentApplet = this.filteredApplets.find(applet => applet.appletId === appletId);
        const currentId = this.baskets.findIndex(applet => applet.appletId === appletId);
        const formData = this.parseAppletCartItem(appletId, this.appletSelections[appletId])

        if (currentId !== -1) {
          this.baskets[currentId] = currentApplet;
        } else {
          this.baskets.push(currentApplet);
        }

        this.$store.commit("setBasketContent", [...this.baskets]);
        form.set("selection", JSON.stringify(formData));
        api.updateAppletBasket({
          apiHost: this.$store.state.backend,
          token: this.$store.state.auth.authToken.token,
          appletId,
          data: form,
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
