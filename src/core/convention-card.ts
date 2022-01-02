export interface ConventionCard {
  approach: OverallApproach;

  // TODO: add various conventions
}

export type OverallApproach = 'none' | 'dbs' | 'standard-american' | 'other';

export class SimpleConventionCard implements ConventionCard {
  private _approach: OverallApproach;
  constructor(approach: OverallApproach) {
    this._approach = approach;
  }
  get approach(): OverallApproach {
    return this._approach;
  }
}