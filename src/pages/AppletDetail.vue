<template>
  <div v-if="!isLoading">
    <div class="mt-0">
      <v-card class="mx-8 my-6 d-flex pa-md-2">
        <div class="text-center">
          <v-img
            v-if="applet.image"
            class="ma-2 ds-avatar"
            :src="applet.image"
            max-width="200px"
            height="200px"
          />

          <v-avatar v-else tile class="ma-2 ds-avatar" color="blue" size="200">
            <span class="white--text text-h3">
              {{ applet.name[0] }}
            </span>
          </v-avatar>
        </div>
        <div class="ds-main-layout ml-4">
          <v-card-title class="text-h6">
            {{ applet.name }}
          </v-card-title>

          <v-card-subtitle
            v-if="applet.description"
            class="mx-6 black--text text-body-1 ds-subtitle"
          >
            Description: {{ applet.description }}
          </v-card-subtitle>

          <v-card-subtitle
            v-if="applet.description"
            class="mx-6 black--text text-body-1 ds-subtitle"
          >
            Applet Version: {{ applet.version }}
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
            >
              {{ keyword }}
            </v-btn>
          </v-card-actions>

          <v-expand-transition>
            <v-menu v-if="hasContributions" offset-y>
              <template v-slot:activator="{ on }">
                <div
                  class="text-body-1 text-decoration-underline primary--text font-weight-medium ds-contribution"
                  v-on="on"
                >
                  View All Contributions
                </div>
              </template>

              <v-list>
                <v-list-item @click="onExportContributions">
                  <v-list-item-title>
                    {{ "Export" }}
                  </v-list-item-title>
                </v-list-item>
                <v-list-item @click="onViewContributions">
                  <v-list-item-title>
                    {{ "View" }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-expand-transition>
        </div>
        <div class="v-basket-position">
          <v-btn
            class="ds-basket"
            color="primary"
            fab
            :disabled="selectBasket"
            @click="onCloseBasketStatus"
          >
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-icon color="white" v-on="on" v-bind="attrs" medium>
                  mdi-basket-plus-outline
                </v-icon>
              </template>
              <span>Add to basket</span>
            </v-tooltip>
          </v-btn>
        </div>
      </v-card>

      <v-card
        v-if="selectBasket"
        class="mx-8 my-2 d-flex py-md-2 px-md-8 align-center"
      >
        <div
          class="text-body-1 text-decoration-underline primary--text font-weight-medium ds-pointer"
          @click="onSelectAll"
        >
          Select All
        </div>
        <div
          class="text-body-1 text-decoration-underline primary--text font-weight-medium ds-pointer ml-4"
          @click="onClearTree"
        >
          Cancel
        </div>
        <div
          class="text-body-2 black--text ds-pointer ml-10"
          @click="onViewContributions"
        >
          <div>Status: {{ activities }} / {{ items }} selected</div>
        </div>
        <div
          class="text-body-1 primary--text font-weight-medium ds-pointer ml-4"
        >
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-icon
                color="primary"
                v-bind="attrs"
                v-on="on"
                :disabled="!selectedActivities && !selectedItems"
                large
                @click="onUpdateBasket"
              >
                mdi-basket-fill
              </v-icon>
            </template>
            <span>Add items to basket</span>
          </v-tooltip>
        </div>
      </v-card>

      <v-card class="mx-8 d-flex pa-md-2">
        <div class="ds-main-layout ml-2">
          <v-treeview
            class="ds-tree-view"
            v-model="selection"
            :items="appletTree"
            selection-type="leaf"
            color="primary"
            selected-color="grey"
            @input="onAppletSelection"
            :selectable="selectable"
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
            <template v-slot:append="{ item }">
              <span v-html="highlight(getItemtitle(item.title))" />
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
                    {{ option.name }}
                  </div>
                </template>
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
          </v-treeview>
        </div>
      </v-card>
    </div>

    <ViewContributionsDialog
      v-if="hasContributions"
      v-model="viewContributionsDialog"
      :contributionsData="contributionsData"
      @close="viewContributionsDialog = false"
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

.v-treeview-node__content {
  flex-direction: column;
}

.ds-contribution {
  margin-left: 28px;
  position: absolute;
  bottom: 20px;

  cursor: pointer;
}

.ds-pointer {
  cursor: pointer;
}

.ds-basket {
  position: absolute !important;
  bottom: 50px;
  right: 50px;
}

.v-treeview-node__root {
  align-items: start !important;
  justify-content: start !important;
  padding-top: 4px;
  padding-bottom: 4px !important;
  min-height: 0 !important;
}

.v-treeview-node__prepend {
  position: absolute;
  left: 41px;
  margin-top: -1px;
}

.v-treeview-node {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.v-treeview-node__content {
  align-items: baseline !important;
}

.v-basket-position {
  position: absolute;
  top: 135px;
  right: 0px;
}
</style>

<script>
import api from "../services/Api/api.vue";
import { AppletMixin } from "../services/mixins/AppletMixin";
import { mapGetters, mapState } from "vuex";
import ViewContributionsDialog from "../components/dialogs/ViewContributionsDialog.vue";

export default {
  name: "AppletDetail",
  mixins: [AppletMixin],
  components: {
    ViewContributionsDialog
  },
  data() {
    return {
      applet: {},
      isLoading: true,
      selectedActs: {},
      appletTree: [],
      baskets: [],
      selection: [],
      selectBasket: false,
      selectable: false,
      selectedActivities: 0,
      selectedItems: 0,
      viewContributionsDialog: false,
      contributionsData: []
    };
  },
  computed: {
    ...mapState(["publishedApplets", "cartSelections", "itemTypes"]),
    ...mapGetters(["isLoggedIn"]),
    activities() {
      if (this.selectedActivities === 1) {
        return this.selectedActivities + " activity";
      } else {
        return this.selectedActivities + " activities";
      }
    },
    items() {
      if (this.selectedItems === 1) {
        return this.selectedItems + " item";
      } else {
        return this.selectedItems + " items";
      }
    },
    hasContributions() {
      return this.contributionsData.length > 0;
    }
  },
  async beforeMount() {
    const appletId = this.$route.params.id;

    try {
      this.applet = this.publishedApplets.find(({ id }) => id === appletId);

      const { data: appletContent } = await api.getAppletContent({
        apiHost: this.$store.state.backend,
        libraryId: appletId
      });

      this.appletTree = this.buildAppletTree(appletContent).children;
      this.applet.version = appletContent.applet["schema:version"][0]["@value"];

      this.contributionsData = await this.getAppletContributions(
        appletId,
        appletContent
      );

      this.isLoading = false;
    } catch (error) {
      console.log(error);
    }
  },
  methods: {
    onSelectAll() {
      this.selection = [];

      for (const activity of this.appletTree) {
        this.selection.push(...activity.children);
      }
    },
    onClearTree() {
      this.selection = [];
      this.selectBasket = false;
      this.selectable = false;
    },
    async onUpdateBasket() {
      const { appletId } = this.applet;

      if (this.isLoggedIn) {
        await this.updateAppletBasket(
          appletId,
          { children: this.appletTree },
          this.selection
        );
        this.fetchBasketApplets();
      } else {
        this.$store.commit("setCartSelections", {
          ...this.cartSelections,
          [appletId]: this.selection
        });
      }
    },
    onCloseBasketStatus() {
      this.selectBasket = true;
      this.selectable = true;
    },
    /*
     * Change appletTreeData format to basket data
     */
    onAppletSelection() {
      const selectedActs = this.parseAppletCartItem(
        { children: this.appletTree },
        this.selection
      );
      this.selectedItems = 0;
      this.selectedActivities = 0;
      selectedActs.map(activity => {
        if (activity.items) {
          this.selectedItems += activity.items.length;
        } else {
          this.selectedActivities += 1;
        }
      });
    },

    onViewContributions() {
      this.viewContributionsDialog = true;
    },
    onExportContributions() {
      this.exportContributions(this.contributionsData);
    }
  }
};
</script>
