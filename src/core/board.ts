
import { CARDS_PER_HAND, CARD_RANKS, Doubling, Seat, SEATS, SUITS, Vulnerability, getSeatFollowing, getPartnerBySeat, TRICKS_PER_BOARD, getPartnershipBySeat, Partnership, BoardContext, FinalBoardContext, BoardStatus, BidContext, PlayContext } from "./common";
import { Hand } from "./hand";
import * as assert from 'assert';
import { Card } from "./card";
import * as shuffle from 'shuffle-array';
import { Contract } from "./contract";
import { Bid, BidWithSeat } from "./bid";
import { Trick } from "./trick";
import { Play } from "./play";
import { Auction } from "./auction";
import { RandomGenerator } from "./random-generator";

export class Board implements FinalBoardContext, BidContext, PlayContext {
  private _id: string;
  private _vulnerability: Vulnerability;
  private _dealer: Seat;
  private _handsBySeat: Map<Seat, Hand>;
  private _bids: BidWithSeat[] = [];
  private _contract: Contract | null = null;
  private _passedOut = false;
  private _nextExpectedBidder: Seat;
  private _tricks: Trick[] = [];
  private _declarerTricks = 0;
  private _defenseTricks = 0;
  private _status: BoardStatus = 'created';
  private _randomGenerator: RandomGenerator;

  private constructor(id: string, vulnerability: Vulnerability, dealer: Seat, hands: Map<Seat, Hand>, randomGenerator: RandomGenerator) {
    this._id = id;
    this._vulnerability = vulnerability;
    this._dealer = dealer;
    this._nextExpectedBidder = dealer;
    assert(hands.size === 4);
    this._handsBySeat = hands;
    this._randomGenerator = randomGenerator;
  }

  static deal(id: string, vulnerability: Vulnerability, dealer: Seat, randomGenerator: RandomGenerator): Board {
    const cardIndexes: number[] = [];
    for (let i = 0; i < CARD_RANKS.length * SUITS.length; i++) {
      cardIndexes.push(i);
    }
    shuffle(cardIndexes, { rng: () => randomGenerator.random });
    const hands = new Map<Seat, Hand>();
    for (const seat of SEATS) {
      hands.set(seat, new Hand());
    }
    let seat = getSeatFollowing(dealer);
    for (const index of cardIndexes) {
      hands.get(seat)!.dealCard(new Card(CARD_RANKS[index % CARD_RANKS.length], SUITS[Math.floor(index / CARD_RANKS.length)]))
      seat = getSeatFollowing(seat);
    }
    return new Board(id, vulnerability, dealer, hands, randomGenerator);
  }

  static copyFrom(other: BoardContext): Board {
    return new Board(other.boardId, other.vulnerability, other.dealer, other.hands, other.randomGenerator);
  }

  get boardId(): string {
    return this._id;
  }

  get randomGenerator(): RandomGenerator {
    return this._randomGenerator;
  }

  get hands(): Map<Seat, Hand> {
    const result = new Map<Seat, Hand>();
    this._handsBySeat.forEach((hand: Hand, seat: Seat) => {
      result.set(seat, hand);
    });
    return result;
  }

  get status(): BoardStatus {
    return this._status;
  }

  get passedOut(): boolean {
    return this._passedOut;
  }

  get vulnerability(): Vulnerability {
    return this._vulnerability;
  }

  get board(): BoardContext {
    return this;
  }

  get auction(): Auction {
    return new Auction(this._bids);
  }

  get completedTricks(): Trick[] {
    const result: Trick[] = [];
    for (const t of this.tricks) {
      if (t.winner) {
        result.push(t);
      }
    }
    return result;
  }

  get vulnerablePartnership(): Partnership {
    assert(this.contract);
    return this.contract.partnership;
  }

  get dealer(): Seat {
    return this._dealer;
  }

  get contract(): Contract | null {
    return this._contract;
  }

  get dummySeat(): Seat | null {
    if (!this.contract) {
      return null;
    }
    return getPartnerBySeat(this.contract.declarer);
  }

  get playContract(): Contract {
    assert(this.status === 'play');
    assert(this.contract);
    return this.contract;
  }

  get bids(): BidWithSeat[] {
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

  get declarerScore(): number {
    if (!this.contract) {
      return 0;
    }
    return this.contract.getScore(this.declarerTricks);
  }

  getNextBidder(): Seat {
    return this._nextExpectedBidder;
  }

  start(): void {
    this._status = 'bidding';
  }

  passOut(): void {
    this._passedOut = true;
    this._status = 'complete';
  }

  getNextPlayer(): Seat | null {
    assert(this.contract);
    if (this._tricks.length === 0 || this._tricks.length === 1 && this.tricks[0].plays.length === 0) {
      return getSeatFollowing(this.contract.declarer);
    } else if (this.tricks.length === TRICKS_PER_BOARD && this.tricks[this.tricks.length - 1].winner) {
      return null;
    } else if (this.tricks.length > 1 && this.tricks[this.tricks.length - 1].plays.length === 0) {
      return this.tricks[this.tricks.length - 2].getNextPlayer();
    } else {
      const lastTrick = this.tricks[this.tricks.length - 1];
      if (lastTrick.winner) {
        return lastTrick.winner.by;
      } else if (lastTrick.plays.length > 0) {
        return lastTrick.getNextPlayer()
      } else {
        return getSeatFollowing(this.contract.declarer);
      }
    }
  }

  getHand(seat: Seat): Hand {
    const result = this._handsBySeat.get(seat);
    assert(result);
    return result;
  }

  bid(bid: BidWithSeat): boolean {
    assert(this._contract === null);
    assert(this.status === 'bidding');
    assert(this.isLegalFollowing(bid));
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
          this._contract = new Contract(declarer, lastNormal.count, lastNormal.strain, this.isPartnershipVulnerable(partnership), lastDouble);
          this._status = 'play';
        } else {
          this._passedOut = true;
          this._status = 'complete';
        }
        return true;
      }
    }
    return false;
  }

  isLegalFollowing(bid: BidWithSeat): boolean {
    switch (bid.type) {
      case 'pass':
        return true;
      case 'normal': {
        const lastNormal = this.getLastNormalBid();
        return (!lastNormal || lastNormal && bid.isLarger(lastNormal)) ? true : false;
      }
      case 'double': {
        if (this.bids.length === 0) {
          return false;
        } else {
          switch (this.bids[this.bids.length - 1].type) {
            case 'pass': {
              if (this.bids.length < 3) {
                return false;
              }
              if (this.bids[this.bids.length - 2].type !== 'pass') {
                return false;
              }
              return this.bids[this.bids.length - 3].type === 'normal';
            }
            case 'normal':
              return true;
            case 'double':
            case 'redouble':
              return false;
            default:
              throw new Error("Unexpected type");
          }
        }
      }
      case 'redouble': {
        if (this.bids.length < 2) {
          return false;
        }
        switch (this.bids[this.bids.length - 1].type) {
          case 'pass': {
            if (this.bids.length < 3) {
              return false;
            }
            if (this.bids[this.bids.length - 2].type !== 'pass') {
              return false;
            }
            return this.bids[this.bids.length - 3].type === 'double';
          }
          case 'normal':
            return false;
          case 'double':
            return true;
          case 'redouble':
            return false;
          default:
            throw new Error("Unexpected type");
        }
      }
      default:
        throw new Error("Unexpected type " + bid.type);
    }
  }

  setContract(contract: Contract): void {
    this._contract = contract;
    this._status = 'play';
  }

  isPartnershipVulnerable(partnership: Partnership): boolean {
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

  private isPlayerVulnerable(seat: Seat): boolean {
    switch (this.vulnerability) {
      case 'none':
        return false;
      case 'both':
        return true;
      case 'NS':
        return ['N', 'S'].indexOf(seat) >= 0;
      case 'EW':
        return ['E', 'W'].indexOf(seat) >= 0;
    }
  }

  get playCurrentTrick(): Trick {
    assert(this.status === 'play');
    assert(this.tricks.length > 0);
    return this.tricks[this.tricks.length - 1];
  }

  get currentTrick(): Trick | null {
    if (!this.contract) {
      return null;
    }
    if (this.tricks.length === TRICKS_PER_BOARD && this.tricks[this.tricks.length - 1].winner) {
      return null;
    }
    if (this.tricks.length === 0) {
      this.tricks.push(new Trick(this, getSeatFollowing(this.contract.declarer)));
    } else if (this.tricks[this.tricks.length - 1].winner) {
      this.tricks.push(new Trick(this, this.tricks[this.tricks.length - 1].winner!.by));
    }
    return this.tricks[this.tricks.length - 1];
  }

  playCard(p: Play): boolean {
    assert(this.contract);
    assert(this.status === 'play');
    this._status = 'play';
    const nextPlayer = this.getNextPlayer();
    if (!nextPlayer) {
      throw new Error("Unable to play at this time");
    }
    if (p.by !== nextPlayer) {
      throw new Error("Incorrect person trying to play");
    }
    this.currentTrick;
    const hand = this.getHand(p.by);
    assert(hand);
    hand.playCard(p.card);
    const trick = this.tricks[this.tricks.length - 1];
    trick.playCard(p);
    if (trick.winner) {
      if (trick.winningPartnership === this.contract.partnership) {
        this._declarerTricks++;
      } else {
        this._defenseTricks++;
      }
      if (this.tricks.length === TRICKS_PER_BOARD) {
        this._status = 'complete';
        return true;
      }
    }
    return false;
  }


  private getLastNormalBid(): BidWithSeat | null {
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

  private getDeclarer(lastNormal: BidWithSeat): Seat {
    for (let i = 0; i < this.bids.length; i++) {
      const bid = this.bids[i];
      const partner = getPartnerBySeat(bid.by);
      if (bid.type === 'normal' && bid.strain === lastNormal.strain && (bid.by === lastNormal.by || bid.by === partner)) {
        return bid.by;
      }
    }
    throw new Error("Unexpectedly did not find suitable first bid");
  }

  toString(): string {
    const result: string[] = [];
    result.push(`Board ${this._id} VUL:${this._vulnerability} Dealer:${this._dealer}`);
    result.push(`  Hands: North: ${this._handsBySeat.get('N')!.toString()}`);
    result.push(`         South: ${this._handsBySeat.get('S')!.toString()}`);
    result.push(`         East:  ${this._handsBySeat.get('E')!.toString()}`);
    result.push(`         West:  ${this._handsBySeat.get('W')!.toString()}`);
    if (this._contract) {
      result.push(`  Contract: ${this._contract.toString()}`);
      if (this.auction && this.auction.bids.length > 0) {
        result.push(`  Auction:\n${this.auction.toString()}`);
      }
    } else if (this._passedOut) {
      result.push(`  Passed out`);
    }
    if (this.tricks.length > 0) {
      result.push(`  Tricks:`);
      for (const t of this.tricks) {
        result.push(`     ${t.toString()}`);
      }
    }
    if (this._declarerTricks + this._defenseTricks > 0) {
      result.push(`  Tricks:  Declarer:${this._declarerTricks}  Defense:${this._defenseTricks}`);
    }
    const score = this.contract?.getScore(this.declarerTricks) || 0;
    if (score !== 0) {
      result.push(`  Score: ${score}`);
    }
    return result.join('\n');
  }
}
