import * as random from 'random-seed'

export interface RandomGenerator {
  seed: string;
  random: number; // 0 .. 1
}

export class RandomGeneratorImpl {

  private _seed?: string;
  private _rand: random.RandomSeed | null = null;

  get seed(): string {
    return this._seed || 'unspecified';
  }

  set seed(value: string) {
    this._rand = random.create(value);
  }
  get random(): number {
    if (!this._rand) {
      this._rand = random.create();
    }
    return this._rand.random();
  }
}
