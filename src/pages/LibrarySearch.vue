<template>
  <div>
    <div class="d-flex align-center justify-center align-content-ceneter">
      <v-text-field
        v-model="searchText"
        light
        solo
        prepend-inner-icon="search"
        placeholder="Type keyword..."
      >
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
      <h3 class="mb-4 ml-8" v-if="!currentApplets.length && !isLoading">
        No results found
      </h4>
      <v-card
        v-else
        class="mx-auto mb-4 d-flex pa-md-2"
        v-for="applet in currentApplets"
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

          <v-avatar v-else tile class="ma-2 ds-avatar" color="blue" size="150">
            <span class="white--text text-h3">
              {{ applet.name[0] }}
            </span>
          </v-avatar>
        </div>
        <div class="ds-tree-layout ml-2">
          <v-card-title
            class="text-decoration-underline text-h6"
            v-html="highlight(applet.name)"
          />
          <v-card-subtitle
            v-if="applet.description"
            class="mx-6 black--text text-body-1 ds-subtitle"
            v-html="highlight(applet.description)"
          />

          <v-card-actions class="d-block mx-5 px-2 py-0">
            <span v-if="applet.keywords.length" class="text-body-1">
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
              :items="appletsTree[applet.appletId] && [appletsTree[applet.appletId]]"
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
                  <template v-if="item.inputType === 'radio' || item.inputType === 'checkbox'">
                    <div
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
                  </template>
                  <div
                    v-else
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
                <v-icon color="grey darken-3"> mdi-basket-plus-outline </v-icon>
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
                <v-icon color="grey darken-3"> mdi-information-outline </v-icon>
              </v-btn>
            </template>
            <span>See applet detail</span>
          </v-tooltip>
        </div>
      </v-card>
    </div>
    <div class="text-center">
      <v-pagination
        v-model="page"
        :length="Math.ceil(filteredApplets.length / 5)"
        :total-visible="visiblePage"
      />
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

.ds-tree-view,
.ds-tree-layout {
  width: 100%;
}

.ds-main-layout {
  width: calc(100% - 300px);
}

.ds-cursor {
  cursor: pointer;
}
</style>

<script>
import api from "../services/Api/api.vue";
import { mapState, mapGetters } from "vuex";
import { AppletMixin } from "../services/mixins/AppletMixin";
import { AccountMixin } from "../services/mixins/AccountMixin";

export default {
  name: "LibrarySearch",
  mixins: [AccountMixin, AppletMixin],
  data() {
    return {
      visiblePage: 7,
      page: 1,
      searchText: "",
      isLoading: true,
    };
  },
  /**
   * Define here all computed properties.
   */
  computed: {
    ...mapState([
      "publishedApplets",
      "appletsTree",
      "appletContents",
      "basketContents",
      "appletSelections",
      "cartSelections",
      "itemTypes"
    ]),
    ...mapGetters(["isLoggedIn", "numberOfCartItems", "basketApplets"]),
    filteredApplets() {
      return this.getFilteredApplets(
        this.publishedApplets,
        this.appletsTree,
        this.searchText
      );
    },
    currentApplets() {
      const applets = [...this.filteredApplets];

      return applets.splice(5 * (this.page - 1), 5);
    },
  },
  async beforeMount() {
    const { from, token } = this.$route.query;
    this.isLoading = true;

    this.$store.commit("initPublishedApplets");

    if (from == "builder" && token) {
      try {
        const resp = await api.getUserDetails({
          apiHost: this.$store.state.backend,
          token
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
        console.log("token error", e.response.data.message);
      }
    }

    if (this.isLoggedIn) {
        await this.fetchBasketApplets();
    }

    let publishedApplets = [];
    try {
      const resp = await api.getPublishedApplets({
        apiHost: this.apiHost,
      });

      publishedApplets = resp.data;
    } catch (err) {
      console.log(err);
      return ;
    }

    const process = publishedApplets.reduce((process, applet) => {
      return process.then(() => api.getAppletContent({
          apiHost: this.apiHost,
          libraryId: applet.id,
        }).then(({ data: appletContent }) => {
          this.$store.commit("setAppletTree", {
            tree: this.buildAppletTree(appletContent),
            appletId: applet.appletId
          });

          this.$store.commit("setAppletContent", {
            appletContent,
            appletId: applet.appletId
          });

          this.$store.commit("addPublishedApplet", applet);
        })
      );
    }, Promise.resolve());

    process.then(() => {
      this.isLoading = false;
    }).catch(err => {
      console.log(err);
    })
  },
  methods: {
    highlight(rawString) {
      if (this.searchText) {
        const searchRegex = new RegExp("(" + this.searchText + ")", "ig");

        return rawString
          .replace(searchRegex, "<b>$1</b>")
          .replaceAll(" ", "&nbsp;");
      } else {
        return rawString;
      }
    },
    async onAddBasket(appletId) {
      if (this.isLoggedIn) {
        // add to basket
        await this.updateAppletBasket(
          appletId,
          this.appletsTree[appletId],
          this.appletSelections[appletId]
        );
        this.fetchBasketApplets();
      } else {
        // add to cart
        this.$store.commit("setCartSelections", {
          ...this.cartSelections,
          [appletId]: this.appletSelections[appletId]
        });
      }
    },
    onAppletDetail(applet) {
      this.$router.push({
        name: "AppletDetail",
        params: { appletId: applet.id }
      });
    },
    onViewBasket() {
      this.$router.push({
        name: "Cart"
      });
    }
  }
};
</script>
