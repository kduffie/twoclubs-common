import * as assert from 'assert';
import { Board } from './board';
import { getSeatsByPartnership, Partnership, PARTNERSHIPS, randomlySelect, Strain, Suit, union } from './common';
import { Contract } from './contract';
import { Hand } from './hand';

export type ContractAssigner = (board: Board) => Promise<Contract | null>;

export async function defaultContractAssigner(board: Board): Promise<Contract | null> {
  const nHand = board.getHand('N');
  const sHand = board.getHand('S');
  const eHand = board.getHand('E');
  const wHand = board.getHand('W');
  assert(nHand && sHand && eHand && wHand);
  if (nHand.totalPoints <= 12 && sHand.totalPoints <= 12 && eHand.totalPoints <= 12 && wHand.totalPoints <= 12) {
    return null;
  }
  const nsTotal = nHand.totalPoints + sHand.totalPoints;
  const ewTotal = eHand.totalPoints + wHand.totalPoints;
  let partnership: Partnership = nsTotal === ewTotal ? randomlySelect(PARTNERSHIPS) : (nsTotal > ewTotal ? 'NS' : 'EW');
  switch (partnership) {
    case 'NS':
      return chooseContract('NS', board.isPartnershipVulnerable('NS'), nHand, sHand, board);
    case 'EW':
      return chooseContract('EW', board.isPartnershipVulnerable('EW'), eHand, wHand, board);
  }
}

function chooseContract(partnership: Partnership, vulnerable: boolean, hand1: Hand, hand2: Hand, board: Board): Contract {
  const totalPoints = hand1.totalPoints + hand2.totalPoints;
  const totalHCP = hand1.highCardPoints + hand2.highCardPoints;
  const spades = hand1.getCardsBySuit('S', false).length + hand2.getCardsBySuit('S', false).length;
  const hearts = hand1.getCardsBySuit('H', false).length + hand2.getCardsBySuit('H', false).length;
  const diamonds = hand1.getCardsBySuit('D', false).length + hand2.getCardsBySuit('D', false).length;
  const clubs = hand1.getCardsBySuit('C', false).length + hand2.getCardsBySuit('C', false).length;
  const longestMajorSuitFit = Math.max(spades, hearts);
  const longestMinorSuitFit = Math.max(diamonds, clubs);
  const longestFit = Math.max(spades, hearts, diamonds, clubs);
  const stoppedSuitsInNT = union(hand1.getStoppedSuits(false), hand2.getStoppedSuits(false));
  const wellStoppedSuitsInNT = union(hand1.getWellStoppedSuits(false), hand2.getWellStoppedSuits(false));
  const slamStoppedSuitsInNT = union(hand1.getFirstOrSecondRoundStoppedSuits(false), hand2.getFirstOrSecondRoundStoppedSuits(false));
  const slamStoppedSuitsInSuit = union(hand1.getFirstOrSecondRoundStoppedSuits(true), hand2.getFirstOrSecondRoundStoppedSuits(true));
  const bestFit: Suit = spades === longestFit ? 'S' : (hearts === longestFit ? 'H' : (diamonds === longestFit ? 'D' : 'C'));
  const bestMajorSuitFit: Suit = spades >= hearts ? 'S' : 'H';
  const bestMinorSuitFit: Suit = diamonds > clubs ? 'D' : 'C';

  let strain: Strain = 'N';
  let count = 1;
  const partners = getSeatsByPartnership(partnership);
  let declarer = hand1.totalPoints >= hand2.totalPoints ? partners[0] : partners[1];
  if (slamStoppedSuitsInSuit.size === 4 && totalPoints >= 32 && totalHCP >= 30 && longestFit >= 8) {
    strain = bestFit;
    count = 6;
  } else if (slamStoppedSuitsInNT.size === 4 && totalHCP >= 32) {
    count = 6;
  } else if (totalHCP >= 25 && stoppedSuitsInNT.size === 4 || totalPoints >= 25 && wellStoppedSuitsInNT.size === 4) {
    count = 3;
  } else if (totalPoints >= 25 && longestMajorSuitFit >= 8) {
    strain = bestMajorSuitFit;
    count = 4;
  } else if (totalPoints >= 27 && longestMinorSuitFit >= 8) {
    strain = bestMinorSuitFit;
    count = 5;
  } else if (longestFit >= 8) {
    strain = bestFit;
  }
  return new Contract(declarer, count, strain, vulnerable, 'none');
}
