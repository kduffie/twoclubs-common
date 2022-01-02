import { Bid, BidWithSeat } from "./bid";
import { Card } from "./card";
import { BidContext, getCardsInSuit, getPartnerBySeat, PlayContext, randomlySelect, Range, Seat, Strain, Suit, SUITS } from "./common";
import { ConventionCard, SimpleConventionCard } from "./convention-card";
import { Hand } from "./hand";
import { PlayerBase } from "./player";
import * as assert from 'assert';

export interface RobotStrategy {
  bidding?: {

  }
  play?: {
    leadingSuit?: RobotPlayLeadSuitStrategy;
    leadingRank?: RobotPlayLeadStrategy;
    secondHand?: RobotPlaySecondHandStrategy;
    thirdHand?: RobotPlayThirdHandStrategy;
    fourthHand?: RobotPlayFourthHandStrategy;
  }
}

export type RobotPlayLeadSuitStrategy = 'random';
export type RobotPlayLeadStrategy = 'random' | 'low';
export type RobotPlaySecondHandStrategy = 'random' | 'low' | 'cover';
export type RobotPlayThirdHandStrategy = 'random' | 'cover' | 'high';
export type RobotPlayFourthHandStrategy = 'random' | 'cover';

export class Robot extends PlayerBase {
  private _strategy: RobotStrategy;

  constructor(strategies?: RobotStrategy) {
    super();
    this._conventionCard = new SimpleConventionCard('dbs');
    this._strategy = strategies || {};
  }

  get conventionCard(): ConventionCard {
    return this.conventionCard;
  }

  async bid(context: BidContext, hand: Hand): Promise<Bid> {
    if (context.auction.openingBid) {
      return this.getFollowingBid(context, hand);
    } else {
      return this.getOpeningBid(context, hand);
    }
  }

  async playFromDummy(context: PlayContext, dummy: Hand, hand: Hand): Promise<Card> {
    return this.play(context, dummy, dummy);
  }

  async play(context: PlayContext, hand: Hand, dummy: Hand | null): Promise<Card> {
    const cards = hand.getEligibleToPlay(context.playCurrentTrick.getLeadSuit());
    switch (context.playCurrentTrick.plays.length) {
      case 0: {
        let suit: Suit = 'C';
        switch (this._strategy.play?.leadingSuit || 'random') {
          case 'random':
            const card = randomlySelect(cards);
            suit = card.suit;
        }
        const suitCards = getCardsInSuit(cards, suit);
        switch (this._strategy.play?.leadingRank || 'random') {
          case 'random':
            return randomlySelect(suitCards);
          case 'low':
            return suitCards[suitCards.length - 1];
        }
      }
      case 1: {
        switch (this._strategy.play?.secondHand || 'random') {
          case 'random':
            return randomlySelect(cards);
          case 'low':
            return this.getLowestCard(cards, context.playContract.strain);
          case 'cover':
            const currentBest = context.playCurrentTrick.getCurrentBest();
            assert(currentBest);
            if (currentBest.by === this.seat || currentBest.by === getPartnerBySeat(this.seat)) {
              return this.getLowestCard(cards, context.playContract.strain);
            } else {
              return this.coverOrGetLowest(currentBest.card, cards, context.playContract.strain);
            }
        }
      }
      case 2: {
        switch (this._strategy.play?.thirdHand || 'random') {
          case 'random':
            return randomlySelect(cards);
          case 'cover': {
            const currentBest = context.playCurrentTrick.getCurrentBest();
            assert(currentBest);
            if (currentBest.by === this.seat || currentBest.by === getPartnerBySeat(this.seat)) {
              return this.getLowestCard(cards, context.playContract.strain);
            } else {
              return this.coverOrGetLowest(currentBest.card, cards, context.playContract.strain);
            }
          }
          case 'high': {
            const currentBest = context.playCurrentTrick.getCurrentBest();
            assert(currentBest);
            if (currentBest.by === this.seat || currentBest.by === getPartnerBySeat(this.seat)) {
              return this.getLowestCard(cards, context.playContract.strain);
            } else {
              return this.getHighestOrTrumpToCover(currentBest.card, cards, context.playContract.strain);
            }
          }
        }
      }
      case 3:
        switch (this._strategy.play?.fourthHand || 'random') {
          case 'random':
            return randomlySelect(cards);
          case 'cover': {
            const currentBest = context.playCurrentTrick.getCurrentBest();
            assert(currentBest);
            if (currentBest.by === this.seat || currentBest.by === getPartnerBySeat(this.seat)) {
              return this.getLowestCard(cards, context.playContract.strain);
            } else {
              return this.coverOrGetLowest(currentBest.card, cards, context.playContract.strain);
            }
          }
        }
      default:
        throw new Error("Unexpected number of plays on current trick");
    }
  }

  private getHighestOrTrumpToCover(currentBest: Card, cards: Card[], trump: Strain): Card {
    assert(cards.length > 0);
    let lowestCard: Card = cards[0];
    let highestInSuit: Card | null = null;
    let lowestCoveringTrump: Card | null = null;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (lowestCard.isBetter(card, trump)) {
        lowestCard = card;
      }
      if (card.suit === currentBest.suit) {
        if (!highestInSuit || card.isBetter(highestInSuit, trump)) {
          highestInSuit = card;
        }
      } if (card.suit === trump && card.isBetter(currentBest, trump) && (!lowestCoveringTrump || lowestCoveringTrump.isBetter(card, trump))) {
        lowestCoveringTrump = card;
      }
    }
    return highestInSuit && highestInSuit.isBetter(currentBest, trump) ? highestInSuit : lowestCoveringTrump || lowestCard;

  }

  private getLowestCard(cards: Card[], trump: Strain): Card {
    assert(cards.length > 0);
    let lowestCard: Card = cards[0];
    for (let i = 1; i < cards.length; i++) {
      const card = cards[i];
      if (lowestCard.isBetter(card, trump)) {
        lowestCard = card;
      }
    }
    return lowestCard;
  }

  private coverOrGetLowest(bestSoFar: Card, cards: Card[], trump: Strain): Card {
    assert(cards.length > 0);
    let lowestCard: Card = cards[0];
    let lowestCover: Card | null = null;
    for (let i = 1; i < cards.length; i++) {
      const card = cards[i];
      if (lowestCard.isBetter(card, trump)) {
        lowestCard = card;
      }
      if (card.isBetter(bestSoFar, trump) && (!lowestCover || lowestCover.isBetter(card, trump))) {
        lowestCover = card;
      }
    }
    return lowestCover || lowestCard;
  }

  private getOpeningBid(context: BidContext, hand: Hand): Bid {
    const preemptSuit = hand.getBestPreemptSuit();
    const bestMajor = hand.getLongestMajorSuit();
    const bestMinor = hand.getLongestMinorSuit();
    if (hand.totalPoints < 6) {
      return new Bid('pass');
    } else if (hand.highCardPoints >= 22) {
      return new Bid('normal', 2, 'C');
    } else if (hand.highCardPoints >= 20 && hand.highCardPoints <= 21 && hand.hasNtDistribution()) {
      return new Bid('normal', 2, 'N');
    } else if (hand.highCardPoints >= 15 && hand.highCardPoints <= 17 && hand.hasNtDistribution()) {
      return new Bid('normal', 1, 'N');
    } else if (hand.totalPoints <= 10 && preemptSuit.length > 0 && (preemptSuit[0].suit !== 'C' || preemptSuit.length > 6)) {
      return new Bid('normal', preemptSuit.length === 6 ? 2 : 3, preemptSuit[0].suit);
    } else if (hand.totalPoints >= 13 && bestMajor.length >= 5) {
      return new Bid('normal', 1, bestMajor[0].suit);
    } else if (hand.totalPoints >= 13) {
      return new Bid('normal', 1, bestMinor[0].suit);
    } else {
      return new Bid('pass');
    }
  }

  private getFollowingBid(context: BidContext, hand: Hand): Bid {
    const partnerBids = context.auction.getPartnerBids(this.seat);
    const longestMajor = hand.getLongestMajorSuit();
    const longestMinor = hand.getLongestMinorSuit();
    const longestSuit = longestMajor.length >= longestMinor.length ? longestMajor : longestMinor;
    if (partnerBids.length > 0 && partnerBids[0].is(2, 'C')) {
      if (context.auction.lastBid) {
        // interference.  Bid anyway? Not yet.
        return new Bid('pass');
      } else if (hand.highCardPoints < 5 || longestSuit.length < 5) {
        return new Bid('normal', 2, 'D');
      } else {
        const suit = longestSuit[0].suit;
        return new Bid('normal', ['H', 'S'].indexOf(suit) >= 0 ? 2 : 3, suit);
      }
    } else {
      const partnerEvaluation = this.evaluateBids(context, partnerBids[0].by, partnerBids);
      const highestBid = this.chooseHighestAvailableBid(context, hand, partnerEvaluation);
      if (highestBid && context.auction.lastNormalBid && highestBid.isLarger(context.auction.lastNormalBid)) {
        return highestBid;
      } else {
        return new Bid('pass');
      }
    }
  }

  private chooseHighestAvailableBid(context: BidContext, hand: Hand, partnerEvaluation: HandEvalution): Bid | null {
    // Currently, this just combines what we've heard from partner and will only bid
    // if there is likely to be a feasible game somewhere.
    if (hand.totalPoints + partnerEvaluation.points.min >= 25) {
      const major = this.isMajorSuitFeasible(hand, partnerEvaluation);
      const minor = this.isMinorSuitFeasible(hand, partnerEvaluation);
      if (this.isNoTrumpFeasible(hand, partnerEvaluation)) {
        return new Bid('normal', 1, 'N');
      } else if (major) {
        return new Bid('normal', 4, major);
      } else if (minor) {
        return new Bid('normal', 5, minor);
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  private isNoTrumpFeasible(hand: Hand, partnerEvaluation: HandEvalution): boolean {
    for (const suit of SUITS) {
      const cards = hand.getCardsBySuit(suit, false);
      if (cards.length < 4 && partnerEvaluation.distribution.get(suit)!.min < 4) {
        return false;
      }
    }
    return true;
  }

  private isMajorSuitFeasible(hand: Hand, partnerEvaluation: HandEvalution): Suit | null {
    const suits: Suit[] = ['S', 'H'];
    for (const suit of suits) {
      const cards = hand.getCardsBySuit(suit, false);
      if (cards.length + Math.max(2, partnerEvaluation.distribution.get(suit)!.min) >= 8) {
        return suit;
      }
    }
    return null;
  }

  private isMinorSuitFeasible(hand: Hand, partnerEvaluation: HandEvalution): Suit | null {
    const suits: Suit[] = ['C', 'D'];
    for (const suit of suits) {
      const cards = hand.getCardsBySuit(suit, false);
      if (cards.length + Math.max(2, partnerEvaluation.distribution.get(suit)!.min) >= 9) {
        return suit;
      }
    }
    return null;
  }

  private evaluateBids(context: BidContext, seat: Seat, bids: BidWithSeat[]): HandEvalution {
    const result: HandEvalution = {
      points: new Range(0, 40),
      distribution: new Map<Suit, Range>()
    };
    result.distribution.set('S', new Range(0, 13));
    result.distribution.set('H', new Range(0, 13));
    result.distribution.set('D', new Range(0, 13));
    result.distribution.set('C', new Range(0, 13));
    if (context.auction.openingBid && context.auction.openingBid.by === seat) {
      const bid = context.auction.openingBid;
      if (bid.count === 2 && bid.strain === 'C') {
        result.points.min = 22;
      } else if (bid.count === 2 && bid.strain === 'N') {
        result.points.min = 20;
        result.points.max = 21;
        for (const suit of SUITS) {
          result.distribution.get(suit)!.min = 2;
          result.distribution.get(suit)!.max = 6;
        }
      } else if (bid.count === 1 && bid.strain === 'N') {
        result.points.min = 15;
        result.points.max = 17;
        for (const suit of SUITS) {
          result.distribution.get(suit)!.min = 2;
          result.distribution.get(suit)!.max = 6;
        }
      } else if (bid.count === 3 && bid.strain !== 'N') {
        result.points.min = 6;
        result.points.max = 10;
        result.distribution.get(bid.strain)!.min = 7;
        for (const suit of SUITS) {
          if (suit !== bid.strain) {
            result.distribution.get(suit)!.max = 5;
          }
        }
      } else if (bid.count === 2 && bid.strain !== 'N') {
        result.points.min = 6;
        result.points.max = 10;
        result.distribution.get(bid.strain)!.min = 6;
        result.distribution.get(bid.strain)!.max = 6;
      } else if (bid.count === 1 && ['S', 'H'].indexOf(bid.strain) >= 0 && bid.strain !== 'N') {
        result.points.min = 13;
        result.points.max = 21;
        result.distribution.get(bid.strain)!.min = 5;
        for (const suit of SUITS) {
          if (suit !== bid.strain) {
            result.distribution.get(suit)!.max = 6;
          }
        }
      } else if (bid.count === 1 && ['C', 'D'].indexOf(bid.strain) >= 0 && bid.strain !== 'N') {
        result.points.min = 13;
        result.points.max = 21;
        result.distribution.get(bid.strain)!.min = 3;
        result.distribution.get('S')!.max = 4;
        result.distribution.get('H')!.max = 4;
        for (const suit of SUITS) {
          if (suit !== bid.strain) {
            result.distribution.get(suit)!.max = 6;
          }
        }
      }
    } else {
      let first = true;
      for (const bid of bids) {
        switch (bid.type) {
          case 'pass':
            if (first) {
              result.points.max = 12;
            }
            break;
          case 'normal':
            result.points.min = 6;
            if (bid.strain === 'N') {
              result.points.min = bid.count === 2 ? 20 : 15;
              result.points.max = bid.count === 2 ? 21 : 17;
              for (const suit of SUITS) {
                result.distribution.get(suit)!.min = 2;
                result.distribution.get(suit)!.max = 6;
              }
            } else {
              result.distribution.get(bid.strain)!.min = 5;
            }
            break;
          case 'double':
            result.points.min = Math.max(result.points.min, 13);
            break;
          case 'redouble':
            result.points.min = Math.max(result.points.min, 10);
            break;
        }
        first = false;
      }
    }
    return result;
  }
}

interface HandEvalution {
  points: Range;
  distribution: Map<Suit, Range>;
}