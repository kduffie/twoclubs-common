import { getFollowingSeat, getSeatsByPartnership, Partnership, PlayerFactory, Seat, SEATS, Strain, Suit, union, VULNERABILITIES } from "../core/common";
import { Vulnerability } from "../core/common";
import { Board } from "../core/board";
import { Player } from "../core/player";
import * as assert from 'assert';
import { Hand } from "../core/hand";
import { Contract } from "../core/contract";
import { CoveringPlayer } from "../robots/covering-player";
import { TotalRandomPlayer } from "../robots/total-random-player";

export class Director {
  private boardNumber = 1;
  private players = new Map<Seat, Player>();

  constructor(playerFactory?: PlayerFactory) {
    if (!playerFactory) {
      playerFactory = (seat: Seat) => new CoveringPlayer(seat);
    }
    for (const seat of SEATS) {
      if (!this.players.get(seat)) {
        this.players.set(seat, playerFactory(seat));
      }
    }
  }

  seatPlayer(seat: Seat, player: Player): void {
    this.players.set(seat, player);
  }

  dealAndRunBoard(): Board {
    const board = Board.deal(this.boardNumber++, this.randomizeVulnerability(), this.randomizeSeat());
    this.assignAppropriateContract(board);
    assert(board.contract);
    let seat = getFollowingSeat(board.contract.declarer);
    while (true) {
      const player = this.players.get(seat);
      assert(player);
      const trick = board.getCurrentTrick();
      if (!trick) {
        break;
      }
      player.play(board, trick);
      const next = board.getNextPlayer();
      if (!next) {
        break;
      }
      seat = next;
    }
    console.log(board.toString());
    return board;
  }

  private assignAppropriateContract(board: Board): void {
    const nHand = board.getHand('N');
    const sHand = board.getHand('S');
    const eHand = board.getHand('E');
    const wHand = board.getHand('W');
    assert(nHand && sHand && eHand && wHand);
    const nsTotal = nHand.totalPoints + sHand.totalPoints;
    const ewTotal = eHand.totalPoints + wHand.totalPoints;
    if (nsTotal >= ewTotal) {
      this.chooseContract('NS', board.isPartnershipVulnerable('NS'), nHand, sHand, board);
    } else {
      this.chooseContract('EW', board.isPartnershipVulnerable('EW'), eHand, wHand, board);
    }
  }

  private chooseContract(partnership: Partnership, vulnerable: boolean, hand1: Hand, hand2: Hand, board: Board): void {
    const totalPoints = hand1.totalPoints + hand2.totalPoints;
    const totalHCP = hand1.highCardPoints + hand2.highCardPoints;
    const spades = hand1.getCardsBySuit('S').length + hand2.getCardsBySuit('S').length;
    const hearts = hand1.getCardsBySuit('H').length + hand2.getCardsBySuit('H').length;
    const diamonds = hand1.getCardsBySuit('D').length + hand2.getCardsBySuit('D').length;
    const clubs = hand1.getCardsBySuit('C').length + hand2.getCardsBySuit('C').length;
    const longestMajorSuitFit = Math.max(spades, hearts);
    const longestFit = Math.max(spades, hearts, diamonds, clubs);
    const stoppedSuitsInNT = union(hand1.getStoppedSuits(false), hand2.getStoppedSuits(false));
    const stoppedSuitsInSuit = union(hand1.getStoppedSuits(true), hand2.getStoppedSuits(true));
    const bestFit: Suit = spades === longestFit ? 'S' : (hearts === longestFit ? 'H' : (diamonds === longestFit ? 'D' : 'C'));
    const bestMajorSuitFit: Suit = spades >= hearts ? 'S' : 'H';

    let strain: Strain = 'N';
    let count = 1;
    const partners = getSeatsByPartnership(partnership);
    let declarer = hand1.totalPoints >= hand2.totalPoints ? partners[0] : partners[1];
    if (stoppedSuitsInSuit.size >= 3 && totalPoints >= 32 && totalHCP >= 30 && longestFit >= 8) {
      strain = bestFit;
      count = 6;
    } else if (stoppedSuitsInNT.size >= 4 && totalHCP >= 32) {
      count = 6;
    } else if (totalPoints >= 25 && longestMajorSuitFit >= 8) {
      strain = bestMajorSuitFit;
    } else if (totalHCP >= 25 && stoppedSuitsInNT.size === 4) {
      count = 3;
    } else if (longestFit >= 8) {
      strain = bestFit;
    }
    const contract = new Contract(declarer, count, strain, vulnerable, 'none');
    board.setContract(contract);
  }

  private randomizeVulnerability(): Vulnerability {
    return VULNERABILITIES[Math.floor(Math.random() * VULNERABILITIES.length)];
  }

  private randomizeSeat(): Seat {
    return SEATS[Math.floor(Math.random() * SEATS.length)];
  }
}