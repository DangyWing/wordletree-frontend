<script setup>
import ConfettiExplosion from 'vue-confetti-explosion';

let windowHeight = window.innerHeight;
</script>

<template>
  <ConfettiExplosion
    className="confetti"
    :force="0.04"
    :stageHeight="windowHeight"
    :stageWidth="1000"
    :particleCount="100"
  />
</template>
