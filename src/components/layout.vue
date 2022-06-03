<script setup>
import confetti from './confetti.vue';

import { usePlayerStore } from '../store/usePlayer';
import { storeToRefs } from 'pinia';

const TWITTER_HANDLE = 'dangywing';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const player = usePlayerStore();

let { playerGameStatus } = storeToRefs(player);
</script>
<template>
  <div className="confettiContainer">
    <confetti v-if="playerGameStatus == 'Winner'" />
  </div>
  <div className="MainContainer">
    <header>
      <div className="left">
        <p className="title">WordleTree</p>
        <p className="subtitle">On-chain fork of Wordle</p>
      </div>
    </header>

    <slot></slot>

    <div className="footer-container">
      <img
        alt="Twitter Logo"
        className="twitter-logo"
        src="../assets/twitter-logo.svg"
      />
      <a
        className="footer-text"
        :href="TWITTER_LINK"
        target="_blank"
        rel="noreferrer"
      >
        {{ `built by @${TWITTER_HANDLE}` }}</a
      >
    </div>
  </div>
</template>
