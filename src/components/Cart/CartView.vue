<template>
  <div>
    <div class="d-flex justify-center align-content-ceneter">
      <v-text-field
        v-model="searchText"
        @input="updateFilter"
        light
        solo
        prepend-inner-icon="search"
        placeholder="Type keyword..."
      >
      </v-text-field>

      <v-btn
        rounded
        color="primary"
        class="ml-2"
        height="50"
        dark
        @click="$emit('addToBasket')"
        :disabled="this.cartApplets.length == 0"
      >
        <div class="py-2">
          Add to
          <br />
          Applet Builder
          <v-icon small> mdi-chevron-right </v-icon>
        </div>
      </v-btn>
    </div>

    <div class="mt-0">
      <h4 class="mb-4 ml-8" v-if="!cartApplets.length">
        You have not added anything to your basket yet.
        Start searching above.
      </h4>
      <h4 class="mb-4 ml-8" v-else-if="!filteredApplets.length">
        No results found
      </h4>
      <v-card
        v-else
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

          <v-avatar v-else tile class="ma-2 ds-avatar" color="blue" size="150">
            <span class="white--text text-h3">
              {{ applet.name[0] }}
            </span>
          </v-avatar>
        </div>
        <div class="ds-main-layout ml-2">
          <v-card-title
            class="text-decoration-underline text-h6"
            v-html="highlight(applet.name)"
          />
          <v-card-subtitle
            v-if="applet.description"
            class="mx-6 black--text text-body-1 ds-subtitle"
          >
            <span v-html="highlight(applet.description)" />
          </v-card-subtitle>

          <v-card-actions class="mx-5 px-2 py-0">
            <span v-if="applet.keywords.length" class="text-body-1">
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
              <span v-html="highlight(keyword)" />
            </v-btn>
          </v-card-actions>

          <div class="ds-tree-layout ml-2">
            <v-treeview
              class="ds-tree-view"
              :key="treeKeys[applet.appletId] || 0"
              :value="cartSelections[applet.appletId]"
              :items="applets[applet.appletId]"
              :open.sync="cardOpens[applet.appletId]"
              @input="updateCart($event, applet)"
              selection-type="leaf"
              selected-color="primary"
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
                  v-else-if="item.selected === false"
                  class="mr-1"
                  color="dark-grey"
                  @click="item.selected = !item.selected"
                >
                  mdi-menu-right
                </v-icon>
              </template>
              <template v-slot:append="{ item, leaf }">
                <markdown
                  :source="highlight(getItemtitle(item.title), true) + (item.activityId && item.selectedCount ? ` ( ${item.selectedCount} entries found ) ` : '')"
                />
                <template v-if="leaf">
                  <div v-show="item.selected">
                    <div v-if="item.inputType == 'radio' || item.inputType == 'checkbox' || item.inputType == 'pastBehaviorTracker' || item.inputType == 'futureBehaviorTracker'">
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
                    <div v-else class="d-flex align-center pt-2">
                      <img
                        class="mr-2"
                        width="15"
                        :src="itemTypes.find(({ text }) => text === item.inputType).icon"
                      />
                      {{ item.inputType }}
                    </div>
                  </div>
                </template>
              </template>
            </v-treeview>
          </div>
        </div>
        <div class="d-flex align-baseline">
          <v-btn
            class="mx-8 mt-2"
            fab
            small
            @click="onDeleteApplet(applet)"
          >
            <v-icon color="grey darken-3"> mdi-trash-can-outline </v-icon>
          </v-btn>
        </div>
      </v-card>
    </div>

    <ConfirmationDialog
      v-model="deleteCartItemDialog"
      :dialogText="
        $t('deleteAppletFromCartConfirmation', {
          appletName: deleteApplet ? deleteApplet.name : ''
        })
      "
      :title="$t('deleteApplet')"
      @onCancel="onCancelConfirmation"
      @onOK="onDeleteAppletFromCart"
    />
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

.v-treeview-node__label {
  max-width: 600px;
}

.ds-cursor {
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
import { mapState } from "vuex";
import { AppletMixin } from "../../services/mixins/AppletMixin";
import ConfirmationDialog from "../dialogs/ConfirmationDialog";
import Markdown from "../Markdown";

export default {
  name: "CartView",
  mixins: [AppletMixin],
  components: {
    ConfirmationDialog,
    Markdown
  },
  data() {
    return {
      searchText: "",
      deleteCartItemDialog: false,
      deleteApplet: null,
      applets: {},
      treeKeys: {},
      filteredApplets: []
    };
  },
  async beforeMount() {
    this.applets = this.appletsTree;
    this.updateFilter();
  },
  computed: {
    ...mapState([
      "itemTypes",
      "appletsTree",
      "appletContents",
      "cartApplets",
      "cartSelections"
    ]),
    cardOpens() {
      const open = [];

      for (const applet of this.filteredApplets) {
        if (this.searchText) {
          open[applet.appletId] = this.getOpenNodes(this.appletsTree[applet.appletId][0], this.searchText);
        }
      }

      return open;
    }
  },
  methods: {
    updateFilter() {
      const filteredApplets = this.getFilteredApplets(
        this.cartApplets,
        this.appletsTree,
        this.searchText
      );

      for (const applet of filteredApplets) {
        const appletData = this.appletsTree[applet.appletId][0];

        appletData.children.forEach((activity) => {
          let count = 0;

          if (this.searchText) {
            activity.children.forEach((item) => {
              item.selected = false;
              item.options && item.options.forEach((option) => {
                if (option.name.toLowerCase().includes(this.searchText.toLowerCase())) {
                  item.selected = true;
                }
              });

              if (item.selected) {
                count++;
              }
            });
          }

          this.$set(activity, 'selectedCount', count);
        });
      }

      this.filteredApplets = filteredApplets;
    },
    updateCart(selections, applet) {
      if (!selections.length) {
        this.onDeleteApplet(applet);
      } else {
        this.$store.commit("setCartSelections", {
          ...this.cartSelections,
          [applet.appletId]: [...selections]
        });
      }
    },
    onDeleteApplet(applet) {
      this.deleteApplet = applet;
      this.deleteCartItemDialog = true;
    },
    onCancelConfirmation() {
      this.deleteCartItemDialog = false;

      if (this.deleteApplet) {
        const appletId = this.deleteApplet.appletId;

        this.$set(this.treeKeys, appletId, (this.treeKeys[appletId] || 0) + 1);
        this.deleteApplet = null;
      }
    },
    onDeleteAppletFromCart() {
      this.deleteCartItemDialog = false;
      const { appletId } = this.deleteApplet;
      const newCartApplets = this.cartApplets.filter(applet => applet.appletId != appletId);
      this.$store.commit("setCartApplets", newCartApplets);
      delete this.cartSelections[appletId]
      this.$store.commit("setCartSelections", this.cartSelections);

      this.updateFilter();
    }
  }
};
</script>
