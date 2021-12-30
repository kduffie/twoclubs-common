
import { CARDS_PER_HAND, CARD_RANKS, Doubling, Seat, SEATS, SUITS, Vulnerability, getFollowingSeat, getPartnerSeat, TRICKS_PER_BOARD, getPartnershipBySeat, INSULT_BONUS, Partnership } from "./common";
import { Hand } from "./hand";
import * as assert from 'assert';
import { Card } from "./card";
import * as shuffle from 'shuffle-array';
import { Contract } from "./contract";
import { Bid } from "./bid";
import { Trick } from "./trick";
import { Play } from "./play";
import { threadId } from "worker_threads";

export class Board {
  private _number: number;
  private _vulnerability: Vulnerability;
  private _dealer: Seat;
  private _handsBySeat: Map<Seat, Hand>;
  private _bids: Bid[] = [];
  private _contract: Contract | null = null;
  private _passedOut = false;
  private _nextExpectedBidder: Seat;
  private _tricks: Trick[] = [];
  private _declarerTricks = 0;
  private _defenseTricks = 0;

  constructor(boardNumber: number, vulnerability: Vulnerability, dealer: Seat, hands: Map<Seat, Hand>) {
    this._number = Math.floor(boardNumber);
    this._vulnerability = vulnerability;
    this._dealer = dealer;
    this._nextExpectedBidder = dealer;
    assert(hands.size === SEATS.length);
    this._handsBySeat = hands;
  }

  static deal(boardNumber: number, vulnerability: Vulnerability, dealer: Seat): Board {
    const cardIndexes: number[] = [];
    for (let i = 0; i < CARD_RANKS.length * SUITS.length; i++) {
      cardIndexes.push(i);
    }
    shuffle(cardIndexes);
    let index = 0;
    const hands = new Map<Seat, Hand>();
    for (let handIndex = 0; handIndex < SEATS.length; handIndex++) {
      const hand = new Hand();
      hands.set(SEATS[handIndex], hand);
      for (let cardIndex = 0; cardIndex < CARDS_PER_HAND; cardIndex++) {
        hand.dealCard(new Card(cardIndexes[index++]));
      }
    }
    return new Board(boardNumber, vulnerability, dealer, hands);
  }

  get boardNumber(): number {
    return this._number;
  }

  get vulnerability(): Vulnerability {
    return this._vulnerability;
  }

  get dealer(): Seat {
    return this._dealer;
  }

  get contract(): Contract | null {
    return this._contract;
  }

  get bids(): Bid[] {
    return this._bids;
  }

  get tricks(): Trick[] {
    return this._tricks;
  }

  get declarerTricks(): number {
    return this._declarerTricks;
  }

  get defenseTricks(): number {
    return this._defenseTricks;
  }

  getNextBidder(): Seat {
    return this._nextExpectedBidder;
  }

  getNextPlayer(): Seat | null {
    assert(this.contract);
    if (this._tricks.length === 0) {
      return getFollowingSeat(this.contract.declarer);
    } else if (this.tricks.length === TRICKS_PER_BOARD && this.tricks[this.tricks.length - 1].winner) {
      return null;
    } else {
      const lastTrick = this.tricks[this.tricks.length - 1];
      if (lastTrick.winner) {
        return lastTrick.winner.by;
      } else {
        return getFollowingSeat(lastTrick.getNextPlayer());
      }
    }
  }

  getHand(seat: Seat): Hand {
    const result = this._handsBySeat.get(seat);
    assert(result);
    return result;
  }

  bid(bid: Bid): boolean {
    assert(this._contract === null);
    assert(bid.isLegalFollowing(this.bids));
    this.bids.push(bid);
    if (this.bids.length >= 4) {
      if (this.bids[this._bids.length - 1].type === 'pass' &&
        this.bids[this._bids.length - 2].type === 'pass' &&
        this.bids[this._bids.length - 3].type === 'pass'
      ) {
        const lastNormal = this.getLastNormalBid();
        const lastDouble = this.getLastDouble();
        if (lastNormal) {
          const declarer = this.getDeclarer(lastNormal);
          const partnership = getPartnershipBySeat(declarer);
          this._contract = new Contract(declarer, lastNormal.count, lastNormal.strain, this.isVulnerable(partnership), lastDouble);
        } else {
          this._passedOut = true;
        }
        return false;
      }
    }
    return true;
  }

  private isVulnerable(partnership: Partnership): boolean {
    switch (this.vulnerability) {
      case 'none':
        return false;
      case 'both':
        return true;
      case 'NS':
        return partnership === 'NS';
      case 'EW':
        return partnership === 'EW';
    }
  }

  play(p: Play): Trick {
    assert(this.contract);
    const nextPlayer = this.getNextPlayer();
    if (!nextPlayer) {
      throw new Error("Unable to play at this time");
    }
    if (p.by !== nextPlayer) {
      throw new Error("Incorrect person trying to play");
    }
    if (this.tricks.length === 0 || this.tricks[this.tricks.length - 1].winner) {
      this._tricks.push(new Trick(this));
    }
    const trick = this.tricks[this.tricks.length - 1];
    trick.playCard(p);
    if (trick.winner) {
      if (trick.winningPartnership === this.contract.partnership) {
        this._declarerTricks++;
      } else {
        this._defenseTricks++;
      }
    }
    return this.tricks[this.tricks.length - 1];
  }

  getDeclarerScore(): number {
    assert(this.contract && this.tricks.length === TRICKS_PER_BOARD && this.tricks[this.tricks.length - 1].winner);
    if (this.declarerTricks >= this.contract.count + 6) {
      let result = this.contract.getAdditionalTrickScore() + this.contract.count * this.contract.getPerTrickScore();
      const overtricks = this.declarerTricks - (this.contract.count + 6);
      result += this.contract.getOverTrickScore(overtricks);
      result += this.contract.getSlamBonus(this.declarerTricks);
      return result;
    } else {
      const undertricks = (this.contract.count + 6) - this.declarerTricks;
      const penalty = this.contract.getUnderTrickScore(undertricks);
      return -penalty;
    }
  }

  private getLastNormalBid(): Bid | null {
    let index = this.bids.length - 1;
    while (index >= 0) {
      if (this.bids[index].type === 'normal') {
        return this.bids[index];
      }
      index--;
    }
    return null;
  }

  private getLastDouble(): Doubling {
    let index = this.bids.length - 1;
    while (index >= 0) {
      switch (this.bids[index].type) {
        case 'pass':
          break;
        case 'normal':
          return 'none';
        case 'double':
          return 'doubled';
        case 'redouble':
          return 'redoubled';
        default:
          throw new Error("Unexpected type");
      }
      index--;
    }
    return 'none';
  }

  private getDeclarer(lastNormal: Bid): Seat {
    for (let i = 0; i < this.bids.length; i++) {
      const bid = this.bids[i];
      const partner = getPartnerSeat(bid.by);
      if (bid.type === 'normal' && bid.strain === lastNormal.strain && (bid.by === lastNormal.by || bid.by === partner)) {
        return bid.by;
      }
    }
    throw new Error("Unexpectedly did not find suitable first bid");
  }

}