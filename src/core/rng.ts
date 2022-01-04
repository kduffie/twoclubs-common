import * as random from 'random-seed'

export class RandomGenerator {

  private _rand: random.RandomSeed | null = null;

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

export const randomGenerator = new RandomGenerator();

export function rng(): number {
  return randomGenerator.random;
}