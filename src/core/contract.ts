import { assert } from 'console';
import { Bid } from './bid';
import { Seat, Strain, Doubling, MAX_CONTRACT_SIZE, Partnership, getPartnershipBySeat, SlamType } from './common';

export class Contract {
  private _count: number;
  private _strain: Strain;
  private _declarer: Seat;
  private _vulnerable: boolean;
  private _doubling: Doubling;

  constructor(declarer: Seat, count: number, strain: Strain, vulnerable: boolean, doubling: Doubling) {
    assert(count > 0 && count <= MAX_CONTRACT_SIZE);
    this._declarer = declarer;
    this._count = count;
    this._strain = strain;
    this._vulnerable = vulnerable;
    this._doubling = doubling;
  }

  get declarer(): Seat {
    return this._declarer;
  }

  get vulnerable(): boolean {
    return this._vulnerable;
  }

  isGameBonusApplicable(): boolean {
    switch (this._strain) {
      case 'C':
      case 'D':
        return this.count >= 5;
      case 'H':
      case 'S':
        return this.count >= 4;
      case 'N':
        return this.count >= 3;
      default:
        throw new Error("Unexpected strain " + this._strain);
    }
  }

  getGameBonus(tricksMade: number): number {
    if (!this.isGameBonusApplicable()) {
      return 50;
    }
    let minCount = 6;
    switch (this._strain) {
      case 'C':
      case 'D':
        minCount += 5;
        break;
      case 'H':
      case 'S':
        minCount += 4;
        break;
      case 'N':
        minCount += 3;
        break;
      default:
        throw new Error("Unexpected strain " + this._strain);
    }
    return tricksMade >= minCount ? (this.vulnerable ? 500 : 300) : 0;
  }

  getApplicableSlam(): SlamType {
    if (this.count === 7) {
      return 'grand';
    } else if (this.count === 6) {
      return 'small';
    } else {
      return 'none';
    }
  }

  getSlamBonus(tricksMade: number): number {
    const slamType = this.getApplicableSlam();
    switch (slamType) {
      case 'none':
        return 0;
      case 'small':
        return tricksMade >= 12 ? (this.vulnerable ? 750 : 500) : 0;
      case 'grand':
        return tricksMade >= 13 ? (this.vulnerable ? 1500 : 1000) : 0;
    }
  }

  getAdditionalTrickScore(): number {
    return this.strain === 'N' ? 10 : 0;
  }

  getPerTrickScore(): number {
    switch (this.strain) {
      case 'C':
      case 'D':
        return 20;
      case 'H':
      case 'S':
      case 'N':
        return 30;
      default:
        throw new Error("Unexpected strain");
    }
  }

  getOverTrickScore(overtricks: number): number {
    if (overtricks === 0) {
      return 0;
    }
    switch (this.doubling) {
      case 'none':
        return this.getPerTrickScore() * overtricks;
      case 'doubled':
        return (this.vulnerable ? 200 : 100) * overtricks;
      case 'redoubled':
        return (this.vulnerable ? 400 : 200) * overtricks;
    }
  }

  getUnderTrickScore(undertricks: number): number {
    if (undertricks === 0) {
      return 0;
    }
    // see https://en.wikipedia.org/wiki/Bridge_scoring
    if (this.vulnerable) {
      switch (this._doubling) {
        case 'none':
          return 100 * undertricks;
        case 'doubled':
          return 200 + (undertricks > 1 ? 300 : 0) + (undertricks > 2 ? 300 : 0) + (undertricks > 3 ? (undertricks - 3) * 300 : 0);
        case 'redoubled':
          return 400 + (undertricks > 1 ? 600 : 0) + (undertricks > 2 ? 600 : 0) + (undertricks > 3 ? (undertricks - 3) * 600 : 0);
      }
    } else {
      switch (this._doubling) {
        case 'none':
          return 50 * undertricks;
        case 'doubled':
          return 100 + (undertricks > 1 ? 200 : 0) + (undertricks > 2 ? 200 : 0) + (undertricks > 3 ? (undertricks - 3) * 300 : 0);
        case 'redoubled':
          return 200 + (undertricks > 1 ? 400 : 0) + (undertricks > 2 ? 400 : 0) + (undertricks > 3 ? (undertricks - 3) * 600 : 0);
      }
    }
  }

  get partnership(): Partnership {
    return getPartnershipBySeat(this.declarer);
  }

  get count(): number {
    return this._count;
  }

  get strain(): Strain {
    return this._strain;
  }

  get doubling(): Doubling {
    return this._doubling;
  }

  toString(): string {
    return `${this._count}${this._strain}${this.doubling === 'doubled' ? '*' : (this.doubling === 'redoubled' ? '**' : '')} by ${this._declarer} ${this._vulnerable ? 'VUL' : 'nonVUL'}`;
  }
}