import { Player } from "./player";

export type Seat = 'N' | 'E' | 'S' | 'W';
export const SEATS: Seat[] = ['N', 'E', 'S', 'W'];
export type Partnership = 'NS' | 'EW';
export type Vulnerability = Partnership | 'none' | 'both';
export const VULNERABILITIES: Vulnerability[] = ['NS', 'EW', 'none', 'both'];

export type CardRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
export const CARD_RANKS: CardRank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
export type Suit = 'C' | 'D' | 'H' | 'S';
export const SUITS: Suit[] = ['C', 'D', 'H', 'S'];
export type Strain = Suit | 'N';
export const STRAINS: Strain[] = ['C', 'D', 'H', 'S', 'N'];

export const CARDS_PER_HAND = 13;
export type Doubling = 'none' | 'doubled' | 'redoubled';
export const MAX_CONTRACT_SIZE = 7;

export type BidType = 'pass' | 'normal' | 'double' | 'redouble';

export const TRICKS_PER_BOARD = 13;

export type SlamType = 'none' | 'small' | 'grand';

export const INSULT_BONUS = 50;

export type PlayerFactory = (seat: Seat) => Player;

export function getPartnerSeat(seat: Seat): Seat {
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

export function getFollowingSeat(seat: Seat): Seat {
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

export function getSeatsByPartnership(partnership: Partnership): Seat[] {
  switch (partnership) {
    case 'NS':
      return ['N', 'S'];
    case 'EW':
      return ['E', 'W'];
  }
}