<template>
  <div>
    <div class="d-flex align-center justify-center align-content-ceneter">
      <v-text-field
        v-model="searchText"
        light
        solo
        prepend-inner-icon="search"
        placeholder="Type keyword..."
        @keydown="onKeywordChange()"
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
      <v-progress-linear
        v-if="isLoading && searchTextChanged"
        indeterminate rounded height="3"
      />

      <template v-else>
        <h3 class="mb-4 ml-8" v-if="!publishedApplets.length">
          No results found
        </h3>
        <v-card
          v-else
          class="mx-auto mb-4 d-flex pa-md-2"
          v-for="applet in publishedApplets"
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

            <div class="ml-2">
              <v-treeview
                class="ds-tree-view"
                v-model="appletSelections[applet.appletId]"
                :items="appletsTree[applet.appletId] && [appletsTree[applet.appletId]]"
                :open-all="isOpenAll[applet.appletId]"
                item-key="id"
                selection-type="leaf"
                selected-color="darkgrey"
                open-on-click
                selectable
                return-object
              >
                <template v-slot:prepend="{ item, leaf }">
                  <template v-if="item.selected || item.selected === false">
                    <v-icon
                      v-if="item.selected === true"
                      class="mr-1"
                      color="dark-grey"
                      @click="item.selected = !item.selected"
                    >
                      mdi-menu-down
                    </v-icon>
                    <v-icon
                      v-else-if="item.selected === false"
                      class="mr-1"
                      color="dark-grey"
                      @click="item.selected = !item.selected"
                    >
                      mdi-menu-right
                    </v-icon>
                  </template>
                </template>
                <template v-slot:append="{ item, leaf }">
                  <span v-html="highlight(getItemtitle(item.title))" />
                  <template v-if="item.selected">
                    <div v-if="item.inputType === 'radio' || item.inputType === 'checkbox'">
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
                    </div>
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
                  </template>
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
                  @click="onAddBasket(applet)"
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
      </template>
    </div>

    <v-progress-linear
      v-if="isLoading && !searchTextChanged"
      indeterminate rounded height="3"
    />
    <div class="footer">
      <div class="text-center pagination">
        <v-pagination
          v-model="page"
          @input="onPageChange()"
          :length="Math.ceil(appletCount / recordsPerPage)"
          :total-visible="visiblePage"
        />
      </div>

      <div class="rows-per-page">
        <div class="rows-per-page-title">Rows per page:</div>
        <v-select
          v-model="recordsPerPage"
          class="rows-per-page-options"
          :items="options"
          solo
        ></v-select>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.footer {
  display: flex;

  .pagination {
    flex-grow: 1;
  }

  .rows-per-page {
    display: flex;
    align-items: baseline;

    .rows-per-page-title {
      margin-right: 20px;
    }

    .rows-per-page-options {
      width: 100px;
    }
  }
}

.ds-avatar {
  border-radius: 4px !important;
}

.ds-subtitle {
  padding: 4px !important;
  margin-top: 0 !important;
}

.ds-tree-view,
.ds-tree-layout {
  width: calc(100% - 300px);
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
import debounce from "debounce-promise";

export default {
  name: "LibrarySearch",
  mixins: [AccountMixin, AppletMixin],
  data() {
    return {
      visiblePage: 7,
      page: 1,
      recordsPerPage: 5,
      searchText: '',
      isLoading: true,
      isOpenAll: [],
      appletCount: 0,
      searchTextChanged: false,
      options: [
        5, 10, 25, 50, 100
      ]
    };
  },
  /**
   * Define here all computed properties.
   */
  computed: {
    ...mapState([
      "publishedApplets",
      "appletContents",
      "appletsTree",
      "appletSelections",
      "cartApplets",
      "cartSelections",
      "itemTypes"
    ]),
    ...mapGetters(["isLoggedIn", "numberOfCartItems"])
  },
  async beforeMount() {
    const { from, token } = this.$route.query;

    if (from == "builder" && token) {
      try {
        await this.signInWithToken(token);
      } catch (err) {
        console.log(err);
      }
    }
    if (this.isLoggedIn) {
      if (from == "builder") {
        this.$store.commit("setFromBuilder", true);
      }
      await this.fetchBasketApplets();
    }

    await this.getPublishedApplets();
  },
  methods: {
    async getPublishedApplets() {
      this.isLoading = true;  

      const { data: resp } = await api.getPublishedApplets({
        apiHost: this.apiHost,
        recordsPerPage: this.recordsPerPage,
        pageIndex: this.page - 1,
        searchText: this.searchText
      });
      let publishedApplets = resp.data;

      for (const applet of publishedApplets) {
        let tree = {
          id: 1,
          appletId: applet.appletId,
          title: applet.name,
          children: [],
          vnode: null
        };

        if (this.appletContents[applet.appletId]) {
          tree = this.buildAppletTree(this.appletContents[applet.appletId])
        }

        if (this.searchText) {
          // this.getOpenItems(publishedApplets, tree, this.searchText);
        }
        
        // publishedApplets.forEach(applet => {
        //   this.isOpenAll[applet.appletId] = true;
        // })

        this.$store.commit("setAppletTree", {
          tree,
          appletId: applet.appletId
        });
      }
      this.appletCount = resp.totalCount;
      this.$store.commit("setPublishedApplets", publishedApplets);
      this.isLoading = false;
    },
    async onPageChange() {
      this.searchTextChanged = false;
      this.onEntriesDebounced();
    },
    async fetchApplet(libraryId) {
      return api.getAppletContent({
        apiHost: this.apiHost,
        libraryId,
      }).then(({ data: appletContent }) => {
        const appletId = appletContent.applet._id.substring(7);

        const tree = this.buildAppletTree(appletContent);
        this.$store.commit("addTreeNodes", {
          children: tree.children,
          appletId
        });

        this.$store.commit("setAppletContent", {
          appletContent,
          appletId
        });
      });
    },

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
    async onAddBasket(applet) {
      const { appletId } = applet
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
        this.$store.commit("setCartApplets", [
          ...this.cartApplets,
          applet,
        ]);
        this.$store.commit("setCartSelections", {
          ...this.cartSelections,
          [appletId]: this.appletSelections[appletId]
        });
      }
    },
    onAppletDetail(applet) {
      this.$router.push({
        name: "AppletDetail",
        params: { id: applet.id }
      });
    },
    onViewBasket() {
      this.$router.push({
        name: "Cart"
      });
    },
    onKeywordChange() {
      if (this.page > 1) {
        this.page = 1;
      }
    },
    onEntriesDebounced() {
      // cancel pending call
      clearTimeout(this._timerId)

      // delay new call 500ms
      this._timerId = setTimeout(async () => {
        await this.getPublishedApplets();
      }, 500)
    }
  },
  watch: {
    async searchText() {
      this.page = 1;
      this.searchTextChanged = true;
      this.onEntriesDebounced();
    },
    async recordsPerPage() {
      this.page = 1;
      this.searchTextChanged = false;

      this.onEntriesDebounced();
    },
    async publishedApplets() {
      this.isLoading = true;

      for (const applet of this.publishedApplets) {
        await this.fetchAppletContent(applet.id, applet.appletId);
      }
      this.isLoading = false;
    }
  }
};
</script>
