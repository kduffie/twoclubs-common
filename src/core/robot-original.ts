import { Bid, BidWithSeat } from "./bid";
import { Card } from "./card";
import { BidContext, CardRank, CARD_RANKS, getCardsInSuit, getPartnerBySeat, getSuitsFromCardsExcept, PlayContext, randomlySelect, Range, Seat, Strain, Suit, SUITS, Partnership, getSeatsByPartnership, getPartnershipBySeat } from "./common";
import { ConventionCard, SimpleConventionCard } from "./convention-card";
import { Hand } from "./hand";
import { BridgePlayerBase } from "./player";
import * as assert from 'assert';
import { Trick } from "./trick";

export interface OriginalRobotStrategy {
  bidding?: {

  }
  play?: {
    leadingSuitInNt?: RobotPlayLeadSuitStrategy[];
    leadingSuitInSuit?: RobotPlayLeadSuitStrategy[];
    leadingRank?: RobotPlayLeadRankStrategy[];
    secondHand?: RobotPlayLeadRankStrategy[];
    thirdHand?: RobotPlayLeadRankStrategy[];
    fourthHand?: RobotPlayLeadRankStrategy[];
  }
}

const DEFAULT_LEADING_SUIT_IN_NT: RobotPlayLeadSuitStrategy[] = ['sticky', 'longest-except-trump-if-defender', 'longest-and-best', 'random'];
const DEFAULT_LEADING_SUIT_IN_SUIT: RobotPlayLeadSuitStrategy[] = ['trump-if-declarer-until-exhausted', 'sticky', 'singleton', 'doubleton', 'random-except-trump', 'random'];

export type RobotPlayLeadSuitStrategy = 'random' | 'random-except-trump' | 'longest-and-best' | 'longest-except-trump-if-defender' | 'trump-if-declarer-until-exhausted' | 'singleton' | 'doubleton' | 'sticky';
export type RobotPlayLeadRankStrategy = 'random' | 'low' | 'fourth' | 'cover' | 'high-if-above' | 'top-of-honor-sequence';

const DEFAULT_RANK_LEAD: RobotPlayLeadRankStrategy[] = ['top-of-honor-sequence', 'fourth', 'low'];
const DEFAULT_RANK_SECOND_HAND: RobotPlayLeadRankStrategy[] = ['low'];
const DEFAULT_RANK_THIRD_HAND: RobotPlayLeadRankStrategy[] = ['high-if-above', 'low']; //['high'];
const DEFAULT_RANK_FOURTH_HAND: RobotPlayLeadRankStrategy[] = ['cover', 'low'];

export class RobotOriginal extends BridgePlayerBase {
  private _strategy: OriginalRobotStrategy;

  constructor(strategies?: OriginalRobotStrategy) {
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
    return this.play(context, dummy, hand);
  }

  async play(context: PlayContext, hand: Hand, dummy: Hand | null): Promise<Card> {
    const eligibleCards = hand.getEligibleToPlay(context.playCurrentTrick.getLeadSuit());
    const suit = this.selectSuit(context, dummy, eligibleCards);
    const suitCards = getCardsInSuit(eligibleCards, suit);
    assert(suitCards.length > 0);
    let rankStrategies: RobotPlayLeadRankStrategy[] = [];
    switch (context.playCurrentTrick.plays.length) {
      case 0:
        rankStrategies = this._strategy.play?.leadingRank && this._strategy.play.leadingRank.length > 0 ? this._strategy.play.leadingRank : DEFAULT_RANK_LEAD;
        break;
      case 1:
        rankStrategies = this._strategy.play?.secondHand && this._strategy.play.secondHand.length > 0 ? this._strategy.play.secondHand : DEFAULT_RANK_SECOND_HAND;
        break;
      case 2:
        rankStrategies = this._strategy.play?.thirdHand && this._strategy.play.thirdHand.length > 0 ? this._strategy.play.thirdHand : DEFAULT_RANK_THIRD_HAND;
        break;
      case 3:
        rankStrategies = this._strategy.play?.fourthHand && this._strategy.play.fourthHand.length > 0 ? this._strategy.play.fourthHand : DEFAULT_RANK_FOURTH_HAND;
        break;
      default:
        throw new Error("Unexpected number of plays");
    }
    for (const strategy of rankStrategies) {
      switch (strategy) {
        case 'cover': {
          const currentBest = context.playCurrentTrick.getCurrentBest();
          assert(currentBest);
          if (currentBest.by === this.seat || currentBest.by === getPartnerBySeat(this.seat)) {
            return this.getLowestCard(suitCards, context.playContract.strain);
          } else {
            return this.coverOrGetLowest(currentBest.card, suitCards, context.playContract.strain);
          }
        }
        case 'fourth': {
          if (suitCards.length >= 4) {
            return suitCards[3];
          }
          break;
        }
        case 'high-if-above':
          return this.highestOrGetLowest(context, suitCards, context.playContract.strain)
        case 'low':
          return this.getLowestCard(suitCards, context.playContract.strain);
        case 'random':
          return randomlySelect(suitCards);
        case 'top-of-honor-sequence': {
          const sequence = this.getHonorSequence(suitCards);
          if (sequence && sequence.length > 0) {
            return sequence[0];
          }
          break;
        }
        default:
          throw new Error("Unhandled rank strategy " + strategy);
      }
    }
    return randomlySelect(suitCards);
  }

  private getHonorSequence(cards: Card[]): Card[] | null {
    const ranks: number[] = [];
    for (let i = 0; i < cards.length - 1; i++) {
      ranks.push(CARD_RANKS.indexOf(cards[i].rank));
    }
    for (let i = 0; i < cards.length - 3; i++) {
      if (ranks[i] < 9) {
        return null;
      }
      if (ranks[i] === ranks[i + 1] + 1 &&
        ranks[i + 1] === ranks[i + 2] + 1) {
        return [cards[i], cards[i + 1], cards[i + 2]];
      }
    }
    return null;
  }

  private selectSuit(context: PlayContext, dummy: Hand | null, cards: Card[]): Suit {
    const strategies: RobotPlayLeadSuitStrategy[] = context.playContract.strain === 'N' ? (this._strategy.play?.leadingSuitInNt && this._strategy.play?.leadingSuitInNt.length > 0 ? this._strategy.play?.leadingSuitInNt : DEFAULT_LEADING_SUIT_IN_NT) :
      (this._strategy.play?.leadingSuitInSuit && this._strategy.play?.leadingSuitInSuit.length > 0 ? this._strategy.play?.leadingSuitInSuit : DEFAULT_LEADING_SUIT_IN_SUIT)
    const allSuits = getSuitsFromCardsExcept(cards, null);
    const suitsExceptTrump = context.playContract.strain === 'N' ? allSuits : getSuitsFromCardsExcept(cards, context.playContract.strain);
    const trumpCards = context.playContract.strain !== 'N' ? getCardsInSuit(cards, context.playContract.strain) : [];
    for (const strategy of strategies) {
      switch (strategy) {
        case 'doubleton': {
          for (const suit of suitsExceptTrump) {
            const suitCards = getCardsInSuit(cards, suit);
            if (suitCards.length === 2) {
              return suit;
            }
          }
          break;
        }
        case 'longest-and-best': {
          let bestSuit: Suit | null = null;
          let highestRank: CardRank = '2';
          let length = 0;
          for (const suit of suitsExceptTrump) {
            const suitCards = getCardsInSuit(cards, suit);
            if (suitCards.length > length) {
              bestSuit = suit;
              highestRank = suitCards[0].rank;
            } else if (suitCards.length === length && CARD_RANKS.indexOf(suitCards[0].rank) > CARD_RANKS.indexOf(highestRank)) {
              bestSuit = suit;
              highestRank = suitCards[0].rank;
            }
          }
          if (bestSuit) {
            return bestSuit;
          }
        }
        case 'longest-except-trump-if-defender': {
          if (context.playContract.declarer === this.seat || getPartnerBySeat(context.playContract.declarer) === this.seat) {
            let bestSuit: Suit | null = null;
            let highestRank: CardRank = '2';
            let length = 0;
            for (const suit of suitsExceptTrump) {
              const suitCards = getCardsInSuit(cards, suit);
              if (suitCards.length > length) {
                bestSuit = suit;
                highestRank = suitCards[0].rank;
              } else if (suitCards.length === length && CARD_RANKS.indexOf(suitCards[0].rank) > CARD_RANKS.indexOf(highestRank)) {
                bestSuit = suit;
                highestRank = suitCards[0].rank;
              }
            }
            if (bestSuit) {
              return bestSuit;
            }
          }
          break;
        }
        case 'random':
          return randomlySelect(allSuits);
        case 'random-except-trump': {
          if (suitsExceptTrump.length > 0) {
            return randomlySelect(suitsExceptTrump);
          }
        }
        case 'singleton': {
          for (const suit of suitsExceptTrump) {
            const suitCards = getCardsInSuit(cards, suit);
            if (suitCards.length === 1) {
              return suit;
            }
          }
          break;
        }
        case 'sticky': {
          const suits = this.getSuitLeadsByPartnership(context.completedTricks, getPartnershipBySeat(this.seat));
          for (const suit of suits) {
            const suitCards = getCardsInSuit(cards, suit);
            if (suitCards.length > 0) {
              return suit;
            }
          }
          break;
        }
        case 'trump-if-declarer-until-exhausted': {
          if (trumpCards.length > 0 && context.playContract.strain !== 'N' && context.playContract.declarer !== this.seat && getPartnerBySeat(context.playContract.declarer) !== this.seat) {
            let trumpsPlayed = 0;
            for (const trick of context.completedTricks) {
              for (const play of trick.plays) {
                if (play.card.suit === context.playContract.strain) {
                  trumpsPlayed++;
                }
              }
            }
            if (dummy) {
              let ourTrumps = trumpCards.length + dummy.getUnplayedCardsInSuit(context.playContract.strain).length;
              if (trumpsPlayed + ourTrumps < CARD_RANKS.length) {
                return context.playContract.strain;
              }
            }
          }
          break;
        }
        default:
          throw new Error("Unhandled lead strategy " + strategy);
      }
    }
    if (context.playContract.strain !== 'N' && trumpCards.length > 0) {
      return context.playContract.strain;
    }
    return randomlySelect(cards).suit;
  }


  private getSuitLeadsByPartnership(tricks: Trick[], partnership: Partnership): Suit[] {
    const result: Suit[] = [];
    const seats = getSeatsByPartnership(partnership);
    for (const trick of tricks) {
      if (seats.indexOf(trick.leader) >= 0) {
        if (result.indexOf(trick.plays[0].card.suit)) {
          result.push(trick.plays[0].card.suit);
        }
      }
    }
    return result;
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

  private highestOrGetLowest(context: PlayContext, cards: Card[], trump: Strain): Card {
    assert(cards.length > 0);
    const bestPlay = context.playCurrentTrick.getCurrentBest();
    const bestSoFar = bestPlay ? bestPlay.card : null;
    let lowestCard: Card | null = null;
    let highestCard: Card | null = null;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (!lowestCard || lowestCard.isBetter(card, trump)) {
        lowestCard = card;
      }
      if (card.suit === trump && bestSoFar && bestSoFar.suit !== trump) {
        if (card.isBetter(bestSoFar, trump) && (!highestCard || highestCard.isBetter(card, trump))) {
          highestCard = card;
        }
      } else if (bestSoFar) {
        if (card.isBetter(bestSoFar, trump) && (!highestCard || card.isBetter(highestCard, trump))) {
          highestCard = card;
        }
      }
    }
    return highestCard || lowestCard || cards[0];
  }

  private coverOrGetLowest(bestSoFar: Card, cards: Card[], trump: Strain): Card {
    assert(cards.length > 0);
    let lowestCard: Card | null = null;
    let lowestCover: Card | null = null;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (!lowestCard || lowestCard.isBetter(card, trump)) {
        lowestCard = card;
      }
      if (card.isBetter(bestSoFar, trump) && (!lowestCover || lowestCover.isBetter(card, trump))) {
        lowestCover = card;
      }
    }
    return lowestCover || lowestCard || cards[0];
  }

  private getOpeningBid(context: BidContext, hand: Hand): Bid {
    const preemptSuit = hand.getBestPreemptSuit();
    const bestMajor = hand.getBestMajorSuit();
    const bestMinor = hand.getBestMinorSuit();
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
    const partnerBids = context.auction.getPartnerBids(this.seat, false);
    const longestMajor = hand.getBestMajorSuit();
    const longestMinor = hand.getBestMinorSuit();
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
      const cards = hand.getAllCardsInSuit(suit);
      if (cards.length < 4 && partnerEvaluation.distribution.get(suit)!.min < 4) {
        return false;
      }
    }
    return true;
  }

  private isMajorSuitFeasible(hand: Hand, partnerEvaluation: HandEvalution): Suit | null {
    const suits: Suit[] = ['S', 'H'];
    for (const suit of suits) {
      const cards = hand.getAllCardsInSuit(suit);
      if (cards.length + Math.max(2, partnerEvaluation.distribution.get(suit)!.min) >= 8) {
        return suit;
      }
    }
    return null;
  }

  private isMinorSuitFeasible(hand: Hand, partnerEvaluation: HandEvalution): Suit | null {
    const suits: Suit[] = ['C', 'D'];
    for (const suit of suits) {
      const cards = hand.getAllCardsInSuit(suit);
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