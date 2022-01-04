import { Hand } from "../core/hand";
import { FinalBoardContext, getCardsInSuit, PlayContext, randomlySelect, Seat } from "../core/common";
import { BridgeCardPlayer } from "../core/player";
import { Card } from "../core/card";
import * as assert from 'assert';

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
    const cards = hand.getEligibleToPlay(null);
    const suitCards = this.selectSuit(context, cards);
    assert(suitCards.length > 0);
    // lead low
    return suitCards[suitCards.length - 1];
  }

  private selectSuit(context: PlayContext, cards: Card[]): Card[] {
    const card = randomlySelect(cards)
    return getCardsInSuit(cards, card.suit);
  }

  private playSecondSeat(context: PlayContext, hand: Hand): Card {
    const cards = hand.getEligibleToPlay(context.playCurrentTrick.getLeadSuit());
    if (cards.length > 0) {
      return cards[cards.length - 1];
    }
    const allAvailable = hand.getEligibleToPlay(null);
    allAvailable.sort((a, b) => {
      if (a.isEqual(b)) {
        return 0;
      } else if (a.isBetter(b, context.playContract.strain)) {
        return -1;
      } else {
        return 1;
      }
    });
    return allAvailable[allAvailable.length - 1];
  }
  private playThirdSeat(context: PlayContext, hand: Hand): Card {
    // If cards in suit, play highest if it will win, or lowest in that suit
    // But if no cards in that suit, play lowest trump that will win.
    const cards = hand.getEligibleToPlay(context.playCurrentTrick.getLeadSuit());
    const currentBest = context.playCurrentTrick.getCurrentBest()?.card;
    assert(currentBest);
    if (cards.length > 0) {
      if (cards[0].isBetter(currentBest, context.playContract.strain)) {
        return cards[0];
      }
      return cards[cards.length - 1];
    }
    const trumps = context.playContract.strain === 'N' ? [] : hand.getUnplayedCardsInSuit(context.playContract.strain);
    if (trumps.length > 0) {
      if (currentBest.suit === trumps[0].suit) {
        for (let i = 0; i < trumps.length; i++) {
          const candidate = trumps[trumps.length - 1 - i];
          if (candidate.isBetter(currentBest, context.playContract.strain)) {
            return candidate;
          }
        }
      }
    }
    const allAvailable = hand.getEligibleToPlay(null);
    allAvailable.sort((a, b) => {
      if (a.isEqual(b)) {
        return 0;
      } else if (a.isBetter(b, context.playContract.strain)) {
        return -1;
      } else {
        return 1;
      }
    });
    return allAvailable[allAvailable.length - 1];
  }
  private playFourthSeat(context: PlayContext, hand: Hand): Card {
    const cards = hand.getEligibleToPlay(context.playCurrentTrick.getLeadSuit());
    const currentBest = context.playCurrentTrick.getCurrentBest()?.card;
    assert(currentBest);
    if (cards.length > 0) {
      for (let i = 0; i < cards.length; i++) {
        if (cards[cards.length - 1 - i].isBetter(currentBest, context.playContract.strain)) {
          return cards[cards.length - 1 - i];
        }
      }
      return cards[cards.length - 1];
    }
    const trumps = context.playContract.strain === 'N' ? [] : hand.getUnplayedCardsInSuit(context.playContract.strain);
    if (trumps.length > 0) {
      if (currentBest.suit === trumps[0].suit) {
        for (let i = 0; i < trumps.length; i++) {
          const candidate = trumps[trumps.length - 1 - i];
          if (candidate.isBetter(currentBest, context.playContract.strain)) {
            return candidate;
          }
        }
      }
    }
    const allAvailable = hand.getEligibleToPlay(null);
    allAvailable.sort((a, b) => {
      if (a.isEqual(b)) {
        return 0;
      } else if (a.isBetter(b, context.playContract.strain)) {
        return -1;
      } else {
        return 1;
      }
    });
    return allAvailable[allAvailable.length - 1];
  }
}