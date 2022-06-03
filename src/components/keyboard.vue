<script setup>
import { LetterState } from './types';
import { usePlayerStore } from '../store/usePlayer';
import { storeToRefs } from 'pinia';
import { ethers } from 'ethers';
import contractAbi from '../../artifacts/contracts/wordle.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const player = usePlayerStore();

let { playerAccount, playerGameStatus } = storeToRefs(player);

const rows = [
  'qwertyuiop'.split(''),
  'asdfghjkl'.split(''),
  ['Enter', ...'zxcvbnm'.split(''), 'Backspace'],
];

const letterStates = await getLetterStates();

async function getLetterStates() {
  try {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);

      const signer = provider.getSigner();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractAbi,
        signer
      );

      const address = playerAccount.value;

      const letterStates = await contract.getAlphabetStatus(address);

      return letterStates;
    }
  } catch (e) {
    console.log('e', e);
  }
}

function convertStatusNumberToString(statusNumber) {
  switch (statusNumber) {
    case 1:
      return LetterState.ABSENT;
    case 2:
      return LetterState.PRESENT;
    case 3:
      return LetterState.CORRECT;
    default:
      return '';
  }
}

function findALetterStatus(letter) {
  if (letter.length === 1 && letter.match(/[a-z]/i)) {
    let letterIndex = letterStates[0].indexOf(letter);
    return convertStatusNumberToString(
      ethers.BigNumber.from(letterStates[1][letterIndex]).toNumber()
    );
  } else {
    return '';
  }
}

const emit = defineEmits(['key', 'key']);
</script>

<template>
  <div id="keyboard">
    <div class="row" v-for="(row, i) in rows">
      <div class="spacer" v-if="i === 1"></div>
      <button
        v-for="key in row"
        :class="[key.length > 1 && 'big', findALetterStatus(key)]"
        :enabled="playerGameStatus.value == 'Active'"
        @click="emit('key', key)"
      >
        <span v-if="key !== 'Backspace'">{{ key }}</span>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          height="24"
          viewBox="0 0 24 24"
          width="24"
        >
          <path
            fill="currentColor"
            d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z"
          ></path>
        </svg>
      </button>
      <div class="spacer" v-if="i === 1"></div>
    </div>
  </div>
</template>

<style scoped>
#keyboard {
  margin: 30px 8px 0;
  user-select: none;
  overflow: visible;
}
.row {
  display: flex;
  width: 100%;
  margin: 0 auto 8px;
  touch-action: manipulation;
}
.spacer {
  flex: 0.5;
}
button {
  font-family: inherit;
  font-weight: bold;
  border: 0;
  padding: 0;
  margin: 0 6px 0 0;
  height: 58px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  background-color: #d3d6da;
  color: #1a1a1b;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  text-transform: uppercase;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0.3);
  transition: all 0.2s 1.5s;
}
button:last-of-type {
  margin: 0;
}
button.big {
  flex: 1.5;
}
</style>
