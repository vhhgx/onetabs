import { createStore } from 'vuex'

export default createStore({
  state: {
    tabGroups: []
  },
  getters: {
  },
  mutations: {
    setTabGroups(state, tabGroups) {
      state.tabGroups = tabGroups
    },
    addTabGroup(state, tabGroup) {
      state.tabGroups.unshift(tabGroup)
    },
    removeTabGroup(state, index) {
      state.tabGroups.splice(index, 1)
    }
  },
  actions: {
    loadTabGroups({ commit }) {
      chrome.storage.local.get(['tabGroups'], (result) => {
        if (result.tabGroups) {
          commit('setTabGroups', result.tabGroups)
        }
      })
    },
    saveTabGroups({ state }) {
      chrome.storage.local.set({ tabGroups: state.tabGroups })
    }
  },
  modules: {
  }
})
