import { Hand } from "../core/hand";
import { FinalBoardContext, getCardsInSuit, PlayContext, randomlySelect, Seat } from "../core/common";
import { BridgeCardPlayer } from "../core/player";
import { Card } from "../core/card";
import * as assert from 'assert';
import { CardSet } from "../core/card-set";

export class DuffieCardPlayer implements BridgeCardPlayer {
  private _mseat: Seat = 'N';

  get seat(): Seat {
    return this._mseat;
  }
  set seat(value: Seat) {
    this._mseat = value;
  }

  async startPlay(context: PlayContext): Promise<void> {
    // noop
  }

  async play(context: PlayContext, hand: Hand, dummy: Hand | null): Promise<Card> {
    return this.playFromAHand(context, hand);
    // return randomlySelect(hand.getEligibleToPlay(context.playCurrentTrick.getLeadSuit()));
  }
  async playFromDummy(context: PlayContext, dummy: Hand, hand: Hand): Promise<Card> {
    return this.playFromAHand(context, dummy);
    // return randomlySelect(dummy.getEligibleToPlay(context.playCurrentTrick.getLeadSuit()));
  }
  async finishPlay(context: FinalBoardContext): Promise<void> {
    // noop
  }

  private playFromAHand(context: PlayContext, hand: Hand): Card {
    switch (context.playCurrentTrick.plays.length) {
      case 0:
        return this.lead(context, hand);
      case 1:
        return this.playSecondSeat(context, hand);
      case 2:
        return this.playThirdSeat(context, hand);
      case 3:
        return this.playFourthSeat(context, hand);
      default:
        throw new Error("Unexpected play position");
    }
  }

  private lead(context: PlayContext, hand: Hand): Card {
    const suits = context.playContract.strain === 'N' ? hand.unplayedCards.suits : hand.unplayedCards.getSuitsExcept(context.playContract.strain);
    const suit = randomlySelect(suits);
    return hand.unplayedCards.getLowestCardInSuit(suit)!;
  }

  private playSecondSeat(context: PlayContext, hand: Hand): Card {
    const suit = context.playCurrentTrick.getLeadSuit();
    assert(suit);
    const result = hand.unplayedCards.getLowestCardInSuit(suit);
    if (result) {
      return result;
    }
    const lowest = context.playContract.strain === 'N' ? hand.unplayedCards.getLowestCardInAnySuit() : hand.unplayedCards.getLowestCardInAnySuitExcept(context.playContract.strain);
    if (lowest) {
      return lowest;
    }
    const lowestAll = hand.unplayedCards.getLowestCardInAnySuit();
    assert(lowestAll);
    return lowestAll;
  }

  private playThirdSeat(context: PlayContext, hand: Hand): Card {
    const currentBest = context.playCurrentTrick.getCurrentBest()?.card;
    assert(currentBest);
    const leadSuit = context.playCurrentTrick.getLeadSuit();
    assert(leadSuit);
    const highest = hand.unplayedCards.getHighestCardInSuit(leadSuit);
    if (highest) {
      if (highest.isBetter(currentBest, context.playContract.strain)) {
        return highest;
      } else {
        const lowest = hand.unplayedCards.getLowestCardInSuit(leadSuit);
        assert(lowest);
        return lowest;
      }
    }
    if (currentBest.suit === context.playContract.strain) {
      const coverTrump = hand.unplayedCards.getMinimumCardtToCover(currentBest);
      if (coverTrump) {
        return coverTrump;
      }
    } else if (context.playContract.strain !== 'N') {
      const lowTrump = hand.unplayedCards.getLowestCardInSuit(context.playContract.strain)
      if (lowTrump) {
        return lowTrump;
      }
    }
    const lowest = context.playContract.strain === 'N' ? hand.unplayedCards.getLowestCardInAnySuit() : hand.unplayedCards.getLowestCardInAnySuitExcept(context.playContract.strain);
    if (lowest) {
      return lowest;
    }
    const lowestAll = hand.unplayedCards.getLowestCardInAnySuit();
    assert(lowestAll);
    return lowestAll;
  }

  private playFourthSeat(context: PlayContext, hand: Hand): Card {
    const currentBest = context.playCurrentTrick.getCurrentBest()?.card;
    assert(currentBest);
    const leadSuit = context.playCurrentTrick.getLeadSuit();
    assert(leadSuit);
    if (currentBest.suit === leadSuit) {
      const cover = hand.unplayedCards.getMinimumCardtToCover(currentBest);
      if (cover) {
        return cover;
      }
      if (context.playContract.strain !== 'N') {
        const trump = hand.unplayedCards.getLowestCardInSuit(context.playContract.strain);
        if (trump) {
          return trump;
        }
      }
    } else if (context.playContract.strain !== 'N' && hand.unplayedCards.isVoid(leadSuit)) {
      const trump = hand.unplayedCards.getLowestCardInSuit(context.playContract.strain);
      if (trump) {
        return trump;
      }
    }
    const lowest = context.playContract.strain === 'N' ? hand.unplayedCards.getLowestCardInAnySuit() : hand.unplayedCards.getLowestCardInAnySuitExcept(context.playContract.strain);
    if (lowest) {
      return lowest;
    }
    const lowestAll = hand.unplayedCards.getLowestCardInAnySuit();
    assert(lowestAll);
    return lowestAll;
  }
}