import { Hand } from "../core/hand";
import { BidContext, BoardContext, getPartnerBySeat, getSeatPreceding, Seat, STRAINS, SUITS } from "../core/common";
import { ConventionCard, SimpleConventionCard } from "../core/convention-card";
import { BridgeBidder } from "../core/player";
import { Bid, BidWithSeat } from "../core/bid";
import * as assert from 'assert';
import { Card } from "../core/card";
import { CardSet } from "../core/card-set";
import { CardSuit } from "../core/card-suit";
import { Contract } from "../core/contract";

export class DuffieBidder implements BridgeBidder {
  private _seat: Seat = 'N';
  private _conventionCard: ConventionCard = new SimpleConventionCard('dbs');

  get conventionCard(): ConventionCard {
    return this._conventionCard;
  }

  get seat(): Seat {
    return this._seat;
  }

  set seat(value: Seat) {
    this._seat = value;
  }

  acceptConventions(conventionCard: ConventionCard): boolean {
    if (conventionCard.approach === 'dbs') {
      this._conventionCard = conventionCard;
      return true;
    }
    return false;
  }

  async finalizeContract(context: BidContext, contract: Contract | null): Promise<void> {
    // noop
  }

  async startBoard(context: BoardContext): Promise<void> {
    // noop
  }

  async bid(context: BidContext, hand: Hand): Promise<Bid> {

    const myFirstBid = context.auction.getFirstBidBySeat(this.seat);


    const openingBid = context.auction.getOpeningBid();
    if (!openingBid) {
      return this.getOpeningBid(context, hand);
    }
    const myBids = context.auction.getBidsBySeat(this.seat, true);
    const lastBid = context.auction.getLastBid();
    const partnerBids = context.auction.getBidsBySeat(getPartnerBySeat(this.seat), false);
    const ourOpeningBid = openingBid.by === getPartnerBySeat(this.seat);
    if (myBids.length === 0 || myBids.length === 1 && myBids[0].type === 'pass') {
      assert(lastBid);
      if (ourOpeningBid) {
        return this.respondToOpeningBidByPartner(context, hand, openingBid, myBids.length > 0, lastBid);
      } else if (openingBid.by === getSeatPreceding(this.seat)) {
        return this.firstOvercallRhoOpen(context, hand, openingBid, myBids.length > 0, partnerBids);
      } else {
        return this.firstOvercallLhoOpen(context, hand, openingBid, myBids.length > 0, partnerBids);
      }
    } else if (ourOpeningBid) {
      return this.subsequentResponse(context, hand, openingBid, myBids, partnerBids);
    } else {
      return this.subsequentOvercall(context, hand, openingBid, myBids, partnerBids);
    }
  }
  private getOpeningBid(context: BidContext, hand: Hand): Bid {
    // const preemptSuit = hand.getBestPreemptSuit();
    const bestMajor = hand.allCards.getBestMajorSuit();
    const bestMinor = hand.allCards.getBestMinorSuit();
    if (hand.allCards.totalPoints < 6) {
      return new Bid('pass');
    } else if (hand.allCards.highCardPoints >= 22) {
      return new Bid('normal', 2, 'C');
    } else if (hand.allCards.highCardPoints >= 20 && hand.allCards.highCardPoints <= 21 && hand.allCards.hasNtDistribution()) {
      return new Bid('normal', 2, 'N');
    } else if (hand.allCards.highCardPoints >= 15 && hand.allCards.highCardPoints <= 17 && hand.allCards.hasNtDistribution()) {
      return new Bid('normal', 1, 'N');
      // } else if (hand.totalPoints <= 10 && preemptSuit.length > 0 && (preemptSuit[0].suit !== 'C' || preemptSuit.length > 6)) {
      //   return new Bid('normal', preemptSuit.length === 6 ? 2 : 3, preemptSuit[0].suit);
    } else if (hand.allCards.totalPoints >= 13 && bestMajor.length >= 5) {
      return new Bid('normal', 1, bestMajor.suit);
    } else if (hand.allCards.totalPoints >= 13) {
      return new Bid('normal', 1, bestMinor.suit);
    } else {
      return new Bid('pass');
    }
  }

  private respondToOpeningBidByPartner(context: BidContext, hand: Hand, openingBid: BidWithSeat, afterMyPass: boolean, interveningBid: BidWithSeat): Bid {
    const bestSuit = hand.allCards.getBestSuit();
    const bestMajor = hand.allCards.getBestMajorSuit();
    if (openingBid.count === 2 && openingBid.strain === 'C') {
      return this.respondTo2COpen(context, hand, interveningBid, bestSuit);
    } else if (openingBid.count === 3 && openingBid.strain === 'N') {
      return this.respondTo3NT(context, hand, interveningBid, bestMajor, bestSuit);
    } else if (openingBid.count === 2 && openingBid.strain === 'N') {
      return this.respondTo2NT(context, hand, interveningBid, bestMajor, bestSuit);
    }
    if (openingBid.count === 1 && openingBid.strain === 'N') {
      if (interveningBid.type === 'pass') {
        return this.respondTo1NTWithoutInterference(context, hand, bestMajor, bestSuit);
      } else {
        return this.respondTo1NTWithInterference(context, hand, bestMajor, bestSuit, interveningBid);
      }
    }
    if (openingBid.count >= 3) {

    }
    if (openingBid.count === 2) {

    }
    // TODO
    return new Bid('pass');
  }

  private respondTo2COpen(context: BidContext, hand: Hand, interveningBid: BidWithSeat, bestSuit: CardSuit): Bid {
    if (hand.allCards.totalPoints < 8 && interveningBid.type !== 'pass') {
      return new Bid('pass');
    }
    if (hand.allCards.totalPoints < 8 || bestSuit.length < 5) {
      return new Bid('normal', 2, 'D');
    }
    if (interveningBid.type === 'normal') {
      if (interveningBid.strain == bestSuit.suit && hand.allCards.totalPoints >= 5 || hand.allCards.totalPoints >= 8) {
        return new Bid('double');
      }
      if (interveningBid.count === 2) {
        return new Bid('normal', interveningBid.strain === 'N' || ['C', 'D'].indexOf(bestSuit.suit) >= 0 || SUITS.indexOf(interveningBid.strain) < SUITS.indexOf(bestSuit.suit) ? 3 : 2, bestSuit.suit);
      }
      return new Bid('pass');
    } else if (interveningBid.type === 'double' && hand.allCards.totalPoints >= 10) {
      return new Bid('redouble');
    }
    return new Bid('normal', ['C', 'D'].indexOf(bestSuit.suit) >= 0 ? 3 : 2, bestSuit.suit);
  }

  private respondTo3NT(context: BidContext, hand: Hand, interveningBid: BidWithSeat, bestMajor: CardSuit, bestSuit: CardSuit): Bid {
    const cardsInInterveningSuit = interveningBid.type === 'normal' && interveningBid.strain !== 'N' ? hand.allCards.getSuit(interveningBid.strain) : null;
    switch (interveningBid.type) {
      case 'pass': {
        if (hand.allCards.totalPoints >= 15) {
          if (bestSuit.length >= 6) {
            return new Bid('normal', 6, bestSuit.suit);
          }
          if (hand.allCards.totalPoints >= 17) {
            return new Bid('normal', 6, 'N');
          }
          return new Bid('normal', 4, 'N');
        } else if (bestMajor.length >= 6) {
          return new Bid('normal', 4, bestMajor.suit);
        }
        return new Bid('pass');
      }
      case 'double': {
        if (hand.allCards.totalPoints >= 7) {
          return new Bid('redouble');
        }
        if (bestMajor.length >= 6) {
          return new Bid('normal', 4, bestMajor.suit);
        }
        if (bestSuit.length >= 7) {
          return new Bid('normal', 5, bestSuit.suit);
        }
        return new Bid('pass');
      }
      case 'normal': {
        if ((cardsInInterveningSuit && cardsInInterveningSuit.length >= 5) || hand.allCards.totalPoints >= 8) {
          return new Bid('double');
        }
        if (bestMajor.length >= 6 && interveningBid.count < 5 && STRAINS.indexOf(interveningBid.strain) < STRAINS.indexOf(bestMajor.suit)) {
          return new Bid('normal', 4, bestMajor.suit);
        }
        if (bestSuit.length >= 7 && interveningBid.count < 5) {
          return new Bid('normal', 5, bestSuit.suit);
        }
        return new Bid('pass');
      }
      default:
        throw new Error("Unexpected intervening type");
    }
  }

  private respondTo2NT(context: BidContext, hand: Hand, interveningBid: BidWithSeat, bestMajor: CardSuit, bestSuit: CardSuit): Bid {
    // First decide on response ignoring intervening bid...
    let bid: Bid | null = null;
    if (hand.allCards.totalPoints >= 17) {
      if (bestSuit.length >= 6) {
        bid = new Bid('normal', 7, bestSuit.suit);
      }
      bid = new Bid('normal', 7, 'N');
    }
    if (hand.allCards.totalPoints >= 12) {
      if (bestSuit.length >= 6) {
        bid = new Bid('normal', 6, bestSuit.suit);
      }
      bid = new Bid('normal', 6, 'N');
    }
    if (hand.allCards.totalPoints >= 10) {
      if (bestSuit.length >= 6) {
        bid = new Bid('normal', 5, bestSuit.suit);
      }
      bid = new Bid('normal', 4, 'N');
    }
    if (bestMajor.length >= 5) {
      bid = new Bid('normal', 3, SUITS[SUITS.indexOf(bestMajor.suit) - 1]);
    }
    if (hand.allCards.highCardPoints >= 4) {
      bid = new Bid('normal', 3, 'N');
    } else {
      bid = new Bid('pass');
    }
    const cardsInInterveningSuit = interveningBid.type === 'normal' && interveningBid.strain !== 'N' ? hand.allCards.getSuit(interveningBid.strain) : null;
    switch (interveningBid.type) {
      case 'pass':
        return bid;
      case 'double': {
        return bid;
      }
      case 'normal': {
        if (hand.allCards.totalPoints >= 8 || (cardsInInterveningSuit && cardsInInterveningSuit.length >= 5)) {
          return new Bid('redouble');
        }
        if (bid.type === 'pass') {
          return bid;
        }
        if (bid.type === 'normal' && (bid.count > interveningBid.count || (bid.count === interveningBid.count && STRAINS.indexOf(bid.strain) > STRAINS.indexOf(interveningBid.strain)))) {
          return bid;
        }
        return new Bid('pass');
      }
      default:
        throw new Error("Unexpected intervening type");
    }
  }

  private respondTo1NTWithoutInterference(context: BidContext, hand: Hand, bestMajor: CardSuit, bestSuit: CardSuit): Bid {
    if (hand.allCards.totalPoints < 8) {
      if (bestMajor.length >= 5) {
        return new Bid('normal', 2, SUITS[SUITS.indexOf(bestMajor.suit) - 1]);
      }
      return new Bid('pass');
    }
    if (bestMajor.length >= 5) {
      return new Bid('normal', 2, SUITS[SUITS.indexOf(bestMajor.suit) - 1]);
    }
    if (bestSuit.length >= 6) {
      return new Bid('normal', 2, 'S');
    }
    if (hand.allCards.totalPoints >= 17) {
      return new Bid('normal', 6, 'N');
    }
    if (hand.allCards.totalPoints >= 15) {
      return new Bid('normal', 4, 'N');
    }
    return new Bid('normal', 3, 'N');
  }

  private respondTo1NTWithInterference(context: BidContext, hand: Hand, bestMajor: CardSuit, bestSuit: CardSuit, interveningBid: BidWithSeat): Bid {
    const bid = this.respondTo1NTWithoutInterference(context, hand, bestMajor, bestSuit);
    switch (interveningBid.type) {
      case 'normal': {
        if (bid.strain === interveningBid.strain && bid.count === interveningBid.count) {
          return new Bid('double');
        }
        if (bid.count > interveningBid.count || (bid.count === interveningBid.count && STRAINS.indexOf(bid.strain) > STRAINS.indexOf(interveningBid.strain))) {
          return bid;
        }
        if (interveningBid.count > 4) {
          if (hand.allCards.totalPoints >= 10) {
            return new Bid('double');
          }
          return new Bid('pass');
        } else if (interveningBid.count === 4) {
          // TODO
          return new Bid('pass');
        }
      }
      case 'double': {
        if (hand.allCards.highCardPoints >= 10) {
          return new Bid('redouble');
        }
        return bid;
      }
      default:
        throw new Error("Unexpected intervening bid type");
    }
  }

  private firstOvercallRhoOpen(context: BidContext, hand: Hand, openingBid: BidWithSeat, afterMyPass: boolean, partnerBids: BidWithSeat[]): Bid {
    return new Bid('pass');
  }

  private firstOvercallLhoOpen(context: BidContext, hand: Hand, openingBid: BidWithSeat, afterMyPass: boolean, partnerBids: BidWithSeat[]): Bid {
    return new Bid('pass');
  }

  private subsequentResponse(context: BidContext, hand: Hand, openingBid: BidWithSeat, myBids: BidWithSeat[], partnerBids: BidWithSeat[]): Bid {
    return new Bid('pass');
  }

  private subsequentOvercall(context: BidContext, hand: Hand, openingBid: BidWithSeat, myBids: BidWithSeat[], partnerBids: BidWithSeat[]): Bid {
    return new Bid('pass');
  }
}