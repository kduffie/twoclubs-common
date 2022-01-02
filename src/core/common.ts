import { BidWithSeat } from "./bid";
import { Card } from "./card";
import { Contract } from "./contract";
import { Trick } from "./trick";
import * as shuffle from 'shuffle-array';
import { assert } from "console";
import { Auction } from "./auction";
import { Hand } from "./hand";


export type Seat = 'N' | 'E' | 'S' | 'W';
export const SEATS: Seat[] = ['N', 'E', 'S', 'W'];

export type Partnership = 'NS' | 'EW';
export const PARTNERSHIPS: Partnership[] = ['NS', 'EW'];
export type Vulnerability = Partnership | 'none' | 'both';
export const VULNERABILITIES: Vulnerability[] = ['NS', 'EW', 'none', 'both'];

export type CardRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
export const CARD_RANKS: CardRank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
export type Suit = 'C' | 'D' | 'H' | 'S';
export const SUITS: Suit[] = ['C', 'D', 'H', 'S'];
export type Strain = Suit | 'N';
export const STRAINS: Strain[] = ['C', 'D', 'H', 'S', 'N'];

export const CARDS_PER_HAND = 13;
export const MAX_CONTRACT_SIZE = 7;
export const TRICKS_PER_BOARD = 13;

export type BidType = 'pass' | 'normal' | 'double' | 'redouble';
export type Doubling = 'none' | 'doubled' | 'redoubled';
export type SlamType = 'none' | 'small' | 'grand';

export function getPartnerBySeat(seat: Seat): Seat {
  switch (seat) {
    case 'N':
      return 'S';
    case 'E':
      return 'W';
    case 'S':
      return 'N';
    case 'W':
      return 'E';
    default:
      throw new Error("Unexpected seat " + seat);
  }
}

export function getSeatFollowing(seat: Seat): Seat {
  switch (seat) {
    case 'N':
      return 'E';
    case 'E':
      return 'S';
    case 'S':
      return 'W';
    case 'W':
      return 'N';
    default:
      throw new Error("Unexpected seat " + seat);
  }
}

export function getPartnershipBySeat(seat: Seat): Partnership {
  switch (seat) {
    case 'N':
    case 'S':
      return 'NS';
    case 'E':
    case 'W':
      return 'EW';
    default:
      throw new Error("Unexpected seat " + seat);
  }
}

export function getOpposingPartnership(partnership: Partnership): Partnership {
  switch (partnership) {
    case 'NS':
      return 'EW';
    case 'EW':
      return 'NS';
  }
}

export function getSeatName(seat: Seat): string {
  switch (seat) {
    case 'N':
      return 'North';
    case 'E':
      return 'East';
    case 'S':
      return 'South';
    case 'W':
      return 'West';
  }
}

export function getSeatsByPartnership(partnership: Partnership): Seat[] {
  switch (partnership) {
    case 'NS':
      return ['N', 'S'];
    case 'EW':
      return ['E', 'W'];
  }
}

export function getCardsInSuit(cards: Card[], suit: Suit): Card[] {
  const result: Card[] = [];
  for (const c of cards) {
    if (c.suit === suit) {
      result.push(c);
    }
  }
  result.sort((a, b) => {
    return CARD_RANKS.indexOf(b.rank) - CARD_RANKS.indexOf(a.rank);
  })
  return result;
}

export interface BoardContext {
  boardId: string;
  vulnerability: Vulnerability;
  dealer: Seat;
  hands: Map<Seat, Hand>;
  status: BoardStatus;
  toString(): string;
}

export type BoardStatus = 'created' | 'bidding' | 'play' | 'complete';

export interface FinalBoardContext extends BoardContext {
  bids: BidWithSeat[];
  contract: Contract | null;
  passedOut: boolean;
  tricks: Trick[];
  defenseTricks: number;
  declarerTricks: number;
  declarerScore: number;
}

export interface BidContext {
  board: BoardContext;
  vulnerablePartnership: Partnership;
  auction: Auction;
}

export interface PlayContext {
  board: BoardContext;
  playContract: Contract;
  defenseTricks: number;
  declarerTricks: number;
  completedTricks: Trick[];
  playCurrentTrick: Trick;
}

export function randomlySelect<T>(candidates: T[]): T {
  assert(candidates.length > 0);
  const result = shuffle.pick(candidates);
  return Array.isArray(result) ? result[0] : result;
}

export function union<T>(set1: Set<T>, set2: Set<T>): Set<T> {
  const result = new Set<T>();
  for (const value of set1) {
    result.add(value);
  }
  for (const value of set2) {
    result.add(value);
  }
  return result;
}

export class Range {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }
}

export function getSuitsFromCardsExcept(cards: Card[], omitSuit: Suit | null): Suit[] {
  const result = new Set<Suit>();
  for (const card of cards) {
    if (!omitSuit || omitSuit === card.suit) {
      result.add(card.suit);
    }
  }
  const suits = Array.from(result);
  suits.sort((a, b) => {
    return SUITS.indexOf(b) - SUITS.indexOf(a);
  });
  return suits;
}

export function sortCards(cards: Card[]): void {
  cards.sort((a, b) => {
    if (a.suit === b.suit) {
      return CARD_RANKS.indexOf(b.rank) - CARD_RANKS.indexOf(a.rank);
    } else {
      return SUITS.indexOf(b.suit) - SUITS.indexOf(a.suit);
    }
  });
}

export function cardsInclude(cards: Card[], card: Card): Card | null {
  for (const c of cards) {
    if (c.isEqual(card)) {
      return c;
    }
  }
  return null;
}

