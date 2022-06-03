import { acceptHMRUpdate, defineStore } from 'pinia';
import { ethers } from 'ethers';
import contractAbi from '../../artifacts/contracts/wordle.json';
import { ref } from 'vue';
import { LetterState } from '../components/types';
import Web3Modal from 'web3modal';
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';
import WalletConnect from '@walletconnect/web3-provider';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export const usePlayerStore = defineStore('player', () => {
  const playerAccount = ref(null);
  const loading = ref(false);
  const playerCurrentRow = ref(1);
  const playerGameId = ref(0);
  const playerWins = ref(0);
  const playerLetterStates = ref(null);
  const playerBoard = ref(null);
  const shakeRowIndex = ref(-1);
  const playerGameStatus = ref('');

  async function connectWallet() {
    try {
      const providerRPC = {
        goerli: {
          name: 'goerli',
          rpc: 'https://rpc.goerli.mudit.blog/', // Insert your RPC URL here
          chainId: 5, // 0x504 in hex,
          explorer: 'https://goerli.etherscan.io',
        },
      };

      const providerOptions = {
        coinbasewallet: {
          package: CoinbaseWalletSDK,
          options: {
            rpc: providerRPC.goerli.rpc,
          },
        },
        walletconnect: {
          package: WalletConnect,
          options: {
            rpc: providerRPC.goerli.rpc,
          },
        },
      };

      const web3Modal = new Web3Modal({
        network: 'goerli',
        cacheProvider: true,
        providerOptions,
        theme: 'dark',
      });

      web3Modal.clearCachedProvider();

      const instance = await web3Modal.connect();

      const provider = new ethers.providers.Web3Provider(instance);

      const switchNetwork = async () => {
        try {
          await web3.currentProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [
              { chainId: ethers.utils.hexValue(providerRPC.goerli.chainId) },
            ],
          });
        } catch (error) {
          if (error.code === 4902) {
            try {
              await web3.currentProvider.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: ethers.utils.hexValue(providerRPC.goerli.chainId),
                    chainName: 'goerli',
                    rpcUrls: [providerRPC.goerli.rpc],
                    nativeCurrency: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18,
                    },
                    blockExplorerUrls: [providerRPC.goerli.explorer],
                  },
                ],
              });
            } catch (error) {
              alert(error.message);
            }
          }
        }
      };

      let network = await provider.getNetwork();

      if (network.chainId != 5) {
        await switchNetwork();
      } else {
        const myAccounts = await provider.getSigner().getAddress();

        playerAccount.value = myAccounts;
        await getGameId();
        await returnBoard();
        await getWins(playerAccount.value);
        await getCurrentRow(playerAccount.value);
        await getLetterStates();
        await getPlayerGameStatus(playerAccount.value);
      }
    } catch (error) {
      console.log(error);
    }
  }
  async function getWins(accountAddress) {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wordleContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi,
          signer
        );
        const winCount = await wordleContract.getWins(accountAddress);
        playerWins.value = ethers.BigNumber.from(winCount).toNumber();
      }
    } catch (e) {
      console.log('e', e);
    }
  }

  async function getGameId() {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);

        const signer = provider.getSigner();

        const wordleContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi,
          signer
        );

        const gameId = await wordleContract.gameId();

        const gameIdClean = ethers.BigNumber.from(gameId).toNumber();

        playerGameId.value = gameIdClean;

        return gameIdClean;
      }
    } catch (e) {
      console.log('e', e);
    }
  }

  async function getPlayerGameStatus(playerAccount) {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const wordleContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi,
          signer
        );

        const gameStatus = await wordleContract.getGameStatus(
          playerAccount,
          playerGameId.value
        );

        const gameStatusNumber = ethers.BigNumber.from(gameStatus).toNumber();

        switch (gameStatusNumber) {
          case 0:
            playerGameStatus.value = 'Active';
            break;
          case 1:
            playerGameStatus.value = 'Winner';
            break;
          case 2:
            playerGameStatus.value = 'Loser';
            break;
          default:
            playerGameStatus.value = '';
            break;
        }
        return gameStatusNumber;
      }
    } catch (e) {
      console.log('e', e);
    }
  }

  async function getCurrentRow(playerAccount) {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wordleContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi,
          signer
        );
        const currentRow = await wordleContract.getCurrentRow(
          playerAccount
          // ,gameId
        );
        playerCurrentRow.value = ethers.BigNumber.from(currentRow).toNumber();
      }
    } catch (e) {
      console.log('e', e);
    }
  }

  async function getRowValues(rowNumber) {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);

      const signer = provider.getSigner();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractAbi,
        signer
      );

      const address = await signer.getAddress();

      // const gameId = playerGameId.value;

      const currentRowValues = await contract.getRowValues(
        address,
        // gameId,
        rowNumber
      );

      return currentRowValues;
    }
  }

  // Keep track of revealed letters for the virtual keyboard
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
        // const gameId = playerGameId.value;
        const letterStates = await contract.getAlphabetStatus(
          address
          // , gameId
        );

        playerLetterStates.value = letterStates;
      }
    } catch (e) {
      console.log('e', e);
    }
  }

  async function returnBoard() {
    const m = 6;
    const n = 5;
    let currentBoard = new Array(m);

    await getLetterStates();

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
    await getPlayerGameStatus(playerAccount.value);
    playerBoard.value = currentBoard;
  }

  function setLoader(value) {
    // console.log('setloader', value);
    loading.value = value;
  }

  return {
    setLoader,
    loading,
    connectWallet,
    playerAccount,
    playerGameId,
    playerCurrentRow,
    playerLetterStates,
    playerBoard,
    playerWins,
    playerGameStatus,
    shakeRowIndex,
  };
});

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(usePlayerStore, import.meta.hot));
