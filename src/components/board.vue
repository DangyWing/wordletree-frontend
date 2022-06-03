<script setup>
import { ref, onUnmounted } from 'vue';
import { LetterState } from './types';
import Keyboard from './keyboard.vue';
import { usePlayerStore } from '../store/usePlayer';
import { ethers } from 'ethers';
import contractAbi from '../../artifacts/contracts/wordle.json';
import { allWords } from './words';
import { storeToRefs } from 'pinia';

const player = usePlayerStore();
const keyboardKey = ref(0);

let {
  playerBoard,
  playerCurrentRow,
  shakeRowIndex,
  playerGameId,
  playerGameStatus,
  playerAccount,
} = storeToRefs(player);

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

let message = ref('');
let success = ref(false);

const onKeyup = (e) => onKey(e.key);

window.addEventListener('keyup', onKeyup);

onUnmounted(() => {
  window.removeEventListener('keyup', onKeyup);
});

let board = playerBoard;

async function returnBoard() {
  const m = 6;
  const n = 5;
  let currentBoard = new Array(m);

  for (let i = 0; i < m; i++) {
    let currentRowContract = await getRowValues(i);
    currentBoard[i] = new Array(n);

    for (let j = 0; j < n; j++) {
      let letter = currentRowContract[0][j];

      let letterStatus = ethers.BigNumber.from(
        currentRowContract[1][j]
      ).toNumber();

      let letterObj = {};

      if (letterStatus === 0) {
        letterObj.letter = letter;
        letterObj.state = LetterState.ABSENT;
        letterObj.revealed = 'unrevealed';
      } else if (letterStatus === 1) {
        letterObj.letter = letter;
        letterObj.state = LetterState.ABSENT;
        letterObj.revealed = 'revealed';
      } else if (letterStatus === 2) {
        letterObj.letter = letter;
        letterObj.state = LetterState.PRESENT;
        letterObj.revealed = 'revealed';
      } else if (letterStatus === 3) {
        letterObj.letter = letter;
        letterObj.state = LetterState.CORRECT;
        letterObj.revealed = 'revealed';
      } else {
        letterObj.letter = letter;
        letterObj.state = LetterState.PRESENT;
        letterObj.revealed = 'unrevealed';
      }
      currentBoard[i][j] = letterObj;
    }
  }
  playerBoard.value = currentBoard;
}

function onKey(key) {
  if (playerGameStatus.value != 'Active' || playerAccount.value == null) return;
  if (/^[a-zA-Z]$/.test(key)) {
    fillTile(key.toLowerCase());
  } else if (key === 'Backspace') {
    clearTile();
  } else if (key === 'Enter') {
    completeRow();
  }
}

async function completeRow() {
  const currentRowBrowser = playerBoard.value[playerCurrentRow.value];
  if (currentRowBrowser.every((tile) => tile.letter)) {
    const guess = currentRowBrowser.map((tile) => tile.letter).join('');

    if (!allWords.includes(guess)) {
      shake();
      showMessage(`Not in word list`);
      return;
    }

    await makeGuess(guess);

    keyboardKey.value++;
  } else {
    shake();
    showMessage('Not enough letters');
  }
}

function fillTile(letter) {
  const currentRowBrowser = playerBoard.value[playerCurrentRow.value];
  for (let tile of currentRowBrowser) {
    if (!tile.letter) {
      tile.letter = letter;
      break;
    }
  }
}

async function getRowValues(rowNumber) {
  const { ethereum } = window;
  if (ethereum) {
    const provider = new ethers.providers.Web3Provider(ethereum);

    const signer = provider.getSigner();

    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer);

    const address = await signer.getAddress();

    const gameId = playerGameId.value;

    const currentRowValues = await contract.getRowValues(
      address,
      // gameId,
      rowNumber
    );

    return currentRowValues;
  }
}

function clearTile() {
  const currentRowBrowser = playerBoard.value[playerCurrentRow.value];
  for (const tile of [...currentRowBrowser].reverse()) {
    if (tile.letter) {
      tile.letter = '';
      break;
    }
  }
}

function showMessage(msg, time = 1000) {
  message.value = msg;
  if (time > 0) {
    setTimeout(() => {
      message.value = '';
    }, time);
  }
}
function shake() {
  player.$patch({
    shakeRowIndex: playerCurrentRow.value,
  });

  setTimeout(() => {
    player.$patch({
      shakeRowIndex: -1,
    });
  }, 900);
}

async function makeGuess(guess) {
  setLoader(true);
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

      const tx = await contract.makeGuess(guess);

      const txReceipt = await tx.wait();

      if (txReceipt.status === 1) {
        // console.log('guess submitted https://etherscan.io/tx/' + tx.hash);
      }

      await returnBoard();
      keyboardKey.value++;
      playerCurrentRow.value++;

      setLoader(false);
      return txReceipt;
    }
  } catch (e) {
    if (e.code == 4001) {
      setLoader(false);
      shake();
      showMessage(`User denied transaction signature.`);
    } else {
      console.log(e);
    }
  }
}

function setLoader(value) {
  player.loading = value;
}
</script>

<template>
  <Transition>
    <div class="message" v-if="message">
      {{ message }}
    </div>
  </Transition>
  <div class="board">
    <div
      v-for="(row, index) in board"
      :key="player.componentKey"
      :class="[
        'row',
        shakeRowIndex === index && 'shake',
        success && player.playerCurrentRow == index && 'jump',
      ]"
    >
      <div
        v-for="(tile, index) in row"
        :class="['tile', tile.letter && 'filled', tile.state, tile.revealed]"
      >
        <div class="front" :style="{ transitionDelay: `${index * 300}ms` }">
          {{ tile.letter }}
        </div>
        <div
          :class="['back', tile.state]"
          :style="{
            transitionDelay: `${index * 300}ms`,
            animationDelay: `${index * 100}ms`,
          }"
        >
          {{ tile.letter }}
        </div>
      </div>
    </div>
  </div>
  <Keyboard @key="onKey" v-if="player.playerAccount" :key="keyboardKey" />
</template>

<style scoped>
.board {
  display: grid;
  grid-template-rows: repeat(6, 1fr);
  grid-gap: 5px;
  padding: 10px;
  box-sizing: border-box;
  --height: min(420px, calc(var(--vh, 100vh) - 310px));
  height: var(--height);
  width: min(350px, calc(var(--height) / 6 * 5));
  margin: 0px auto;
}
.message {
  position: absolute;
  left: 50%;
  top: 80px;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.85);
  padding: 16px 20px;
  z-index: 2;
  border-radius: 4px;
  transform: translateX(-50%);
  transition: opacity 0.3s ease-out;
  font-weight: 600;
}
.message.v-leave-to {
  opacity: 0;
}
.row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-gap: 5px;
}
.tile {
  width: 100%;
  font-size: 2rem;
  line-height: 2rem;
  font-weight: bold;
  vertical-align: middle;
  text-transform: uppercase;
  user-select: none;
  position: relative;
}

.tile.filled {
  animation: zoom 0.2s;
}
.tile .front,
.tile .back {
  box-sizing: border-box;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.tile .front {
  border: 2px solid #3a3a3c;
}
.tile .filled .front {
  border-color: #999;
}
.tile .back {
  transform: rotateX(180deg);
}
.tile .revealed .front {
  transform: rotateX(180deg);
}
.tile .revealed .back {
  transform: rotateX(0deg);
}
@keyframes zoom {
  0% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
.shake {
  animation: shake 0.5s;
}
@keyframes shake {
  0% {
    transform: translate(1px);
  }
  10% {
    transform: translate(-2px);
  }
  20% {
    transform: translate(2px);
  }
  30% {
    transform: translate(-2px);
  }
  40% {
    transform: translate(2px);
  }
  50% {
    transform: translate(-2px);
  }
  60% {
    transform: translate(2px);
  }
  70% {
    transform: translate(-2px);
  }
  80% {
    transform: translate(2px);
  }
  90% {
    transform: translate(-2px);
  }
  100% {
    transform: translate(1px);
  }
}
.jump .tile .back {
  animation: jump 0.5s;
}
@keyframes jump {
  0% {
    transform: translateY(0px);
  }
  20% {
    transform: translateY(5px);
  }
  60% {
    transform: translateY(-25px);
  }
  90% {
    transform: translateY(3px);
  }
  100% {
    transform: translateY(0px);
  }
}
@media (max-height: 680px) {
  .tile {
    font-size: 3vh;
  }
}
</style>
