<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-space></q-space>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label
          header
        >
          Apps
        </q-item-label>

        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import EssentialLink from 'components/EssentialLink.vue'

const linksList = [
  {
    title: 'Device',
    icon: 'memory',
    link: '/'
  },
  {
    title: 'Archive',
    icon: 'inventory',
    link: '/archive'
  },
  {
    title: 'IDE',
    icon: 'code',
    link: '/ide'
  },
  {
    title: 'NFC',
    icon: 'nfc',
    link: '/nfc'
  },
  {
    title: 'Sub GHz',
    icon: 'cell_tower',
    link: '/subghz'
  },
  {
    title: 'Tools',
    icon: 'apps',
    link: '/tools'
  },
  {
    title: 'Settings',
    icon: 'settings',
    link: '/settings'
  }
]

import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'MainLayout',

  components: {
    EssentialLink
  },

  setup () {
    const leftDrawerOpen = ref(false)

    return {
      essentialLinks: linksList,
      leftDrawerOpen,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      }
    }
  }
})
</script>
