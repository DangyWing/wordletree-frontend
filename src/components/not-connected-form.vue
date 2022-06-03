<script setup>
import { usePlayerStore } from '../store/usePlayer';

const player = usePlayerStore();
</script>
<template>
  <div className="connect-wallet-container">
    <img src="../assets/DangyCustomDoug.png" width="100" alt="connecting gif" />
    <button
      @click="player.connectWallet"
      className="cta-button connect-wallet-button"
    >
      Connect Wallet
    </button>
  </div>
</template>
