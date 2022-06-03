<script setup>
import { usePlayerStore } from '../store/usePlayer';

const player = usePlayerStore();
</script>

<template>
  <div className="form-container">
    <div>Wins: {{ player.playerWins }}</div>
    <div>Game: {{ player.playerGameId }}</div>
    <div>{{ player.playerAccount }}</div>
  </div>
</template>
