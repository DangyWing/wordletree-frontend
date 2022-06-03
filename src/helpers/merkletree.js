import { MerkleTree } from 'merkletreejs';

export default function generateProofs(guess) {
  const guesses = new String(guess).toLowerCase();

  const leaves = [...guesses].map((address) => keccak256(address));

  const tree = new MerkleTree(leaves, keccak256, {
    sortLeaves: true,
    sortPairs: true,
  });

  const root = '0x' + tree.getRoot().toString('hex');

  let proof = [];

  for (let i = 0; i < leaves.length; i++) {
    const hexproof = tree.getHexProof(leaves[i]);

    proof.push(hexproof);
    let verify = tree.verify(hexproof, leaves[i], root);

    if (verify == false) {
      return `Verification failed for ${leaves[i]}`;
    }
  }

  // console.log('=== root ===');
  // console.log(root);
  // console.log('=== proof ===');
  // console.log(proof);
  return [root, proof];
}
