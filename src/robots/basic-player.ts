import { Hand } from "../core/hand";
import { FinalBoardContext, getPartnerBySeat, PlayContext, randomlySelect, Seat } from "../core/common";
import { BridgeCardPlayer } from "../core/player";
import { Card } from "../core/card";
import * as assert from 'assert';

// This player will randomly select a suit to lead and then lead the lowest card in that suit.
// In second seat, it will always play low. 
// In third seat, it will play high to win the trick, trump if appropriate (to cover), or play low.
// In fourth seat, it will cover if needed to win the trick.

export class BasicCardPlayer implements BridgeCardPlayer {
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
  }
  async playFromDummy(context: PlayContext, dummy: Hand, hand: Hand): Promise<Card> {
    return this.playFromAHand(context, dummy);
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
    const suits = hand.unplayed.getAvailableSuits();
    const suit = randomlySelect(suits, context.randomGenerator);
    const card = hand.unplayed.getSuit(suit).lowestCard;
    assert(card);
    return card;
  }

  private playSecondSeat(context: PlayContext, hand: Hand): Card {
    const suit = context.playCurrentTrick.getLeadSuit();
    assert(suit);
    const result = hand.unplayed.getSuit(suit).lowestCard;
    if (result) {
      return result;
    }
    const lowest = hand.unplayed.getLowestCard(context.playContract.strain === 'N' ? undefined : context.playContract.strain);
    if (lowest) {
      return lowest;
    }
    const lowestAll = hand.unplayed.getLowestCard();
    assert(lowestAll);
    return lowestAll;
  }

  private playThirdSeat(context: PlayContext, hand: Hand): Card {
    const currentBest = context.playCurrentTrick.getCurrentBest();
    assert(currentBest);
    const leadSuit = context.playCurrentTrick.getLeadSuit();
    assert(leadSuit);
    if (currentBest.by === getPartnerBySeat(this.seat)) {
      const lowest = hand.unplayed.getSuit(leadSuit).lowestCard;
      if (lowest) {
        return lowest;
      }
    } else {
      const highest = hand.unplayed.getSuit(leadSuit).highestCard;
      if (highest) {
        if (highest.isBetter(currentBest.card, context.playContract.strain)) {
          return highest;
        } else {
          const lowest = hand.unplayed.getSuit(leadSuit).lowestCard;
          assert(lowest);
          return lowest;
        }
      }
      if (currentBest.card.suit === context.playContract.strain) {
        const coverTrump = hand.unplayed.getSuit(context.playContract.strain).getMinimumCardtToCover(currentBest.card);
        if (coverTrump) {
          return coverTrump;
        }
      } else if (context.playContract.strain !== 'N') {
        const lowTrump = hand.unplayed.getSuit(context.playContract.strain).lowestCard
        if (lowTrump) {
          return lowTrump;
        }
      }
    }
    const lowest = hand.unplayed.getLowestCard(context.playContract.strain === 'N' ? undefined : context.playContract.strain);
    if (lowest) {
      return lowest;
    }
    const lowestAll = hand.unplayed.getLowestCard();
    assert(lowestAll);
    return lowestAll;
  }

  private playFourthSeat(context: PlayContext, hand: Hand): Card {
    const currentBest = context.playCurrentTrick.getCurrentBest();
    assert(currentBest);
    const leadSuit = context.playCurrentTrick.getLeadSuit();
    assert(leadSuit);
    if (currentBest.by === getPartnerBySeat(this.seat)) {
      const lowest = hand.unplayed.getSuit(leadSuit).lowestCard;
      if (lowest) {
        return lowest;
      }
    } else {
      if (currentBest.card.suit === leadSuit) {
        const cover = hand.unplayed.getSuit(currentBest.card.suit).getMinimumCardtToCover(currentBest.card);
        if (cover) {
          return cover;
        }
        if (context.playContract.strain !== 'N') {
          const trump = hand.unplayed.getSuit(context.playContract.strain).lowestCard;
          if (trump) {
            return trump;
          }
        }
      } else if (context.playContract.strain !== 'N' && hand.unplayed.getSuit(leadSuit).length === 0) {
        const trump = hand.unplayed.getSuit(context.playContract.strain).lowestCard;
        if (trump) {
          return trump;
        }
      }
    }
    const lowest = hand.unplayed.getLowestCard(context.playContract.strain === 'N' ? undefined : context.playContract.strain);
    if (lowest) {
      return lowest;
    }
    const lowestAll = hand.unplayed.getLowestCard();
    assert(lowestAll);
    return lowestAll;
  }
}