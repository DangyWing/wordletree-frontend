<script setup>
import { onMounted, ref } from 'vue';
import Layout from './components/layout.vue';
import NotConnectedForm from './components/not-connected-form.vue';
import inputForm from './components/input-form.vue';
import Loader from './components/loader.vue';
import { storeToRefs } from 'pinia';
import { usePlayerStore } from './store/usePlayer';
import board from './components/board.vue';

const player = usePlayerStore();
const keyboardKey = ref(0);

let { playerAccount, loading } = storeToRefs(player);

async function checkIfWalletIsConnected() {
  const { ethereum } = window;

  if (!ethereum) {
    console.log('error');
    return;
  }

  const accounts = await ethereum.request({ method: 'eth_accounts' });

  if (accounts.length === 0) {
    console.log('no accounts');
    return;
  } else {
    const account = accounts[0];
  }
}

onMounted(() => {
  checkIfWalletIsConnected();
});
</script>

<template>
  <layout>
    <Suspense>
      <board v-if="!loading" :key="keyboardKey" />
    </Suspense>
    <not-connected-form
      v-model="playerAccount"
      v-if="!playerAccount && !loading"
    />
    <input-form v-if="playerAccount && !loading" />
    <Loader v-if="loading" />
  </layout>
</template>

<style>
@import './assets/base.css';
</style>
