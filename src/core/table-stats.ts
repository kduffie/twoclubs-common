
import { FinalBoardContext, getOpposingPartnership, Partnership } from "./common";
import * as assert from 'assert';
import { sprintf } from 'sprintf-js';

export class TableStats {
  private _partnershipStats = new Map<Partnership, PartnershipStats>();

  constructor() {
    this._partnershipStats.set('NS', new PartnershipStats('NS'));
    this._partnershipStats.set('EW', new PartnershipStats('EW'));
  }
  async processBoard(board: FinalBoardContext): Promise<void> {
    if (board.contract) {
      await this._partnershipStats.get(board.contract.partnership)!.processDeclarerBoard(board);
      await this._partnershipStats.get(getOpposingPartnership(board.contract.partnership))!.processDefenderBoard(board);
    } else {
      await this._partnershipStats.get('NS')!.processPassedBoard(board);
      await this._partnershipStats.get('EW')!.processPassedBoard(board);
    }
  }

  toString() {
    const rows: string[] = [];
    rows.push(this._partnershipStats.get('NS')!.toString());
    rows.push(this._partnershipStats.get('EW')!.toString());
    return rows.join('\n\n');
  }
}

export class PartnershipStats {
  private _partnership: Partnership;
  private _allBoards = new SituationalStats('all', 'All boards');
  private _passedBoards = new SituationalStats('passed-out', 'Passed out boards');
  private _declarerBoards = new SituationalStats('declarer', 'When declarer');
  private _defenderBoards = new SituationalStats('defender', 'When defending');
  private _vulDeclarerBoards = new SituationalStats('declarer-vul', 'When declarer and vulnerable');
  private _nonVulDeclarerBoards = new SituationalStats('declarer', 'When declarer and non-vulnerable');
  private _vulDefenderBoards = new SituationalStats('declarer', 'When defender and declarer is vulnerable');
  private _nonVulDefenderBoards = new SituationalStats('declarer', 'When defender and declarer is non-vulnerable');
  private _ntDeclarerBoards = new SituationalStats('declarer-nt', 'When declarer in NT');
  private _ntDefenderBoards = new SituationalStats('defender-nt', 'When defender in NT');
  private _suitDeclarerBoards = new SituationalStats('declarer-suit', 'When declarer in suit contract');
  private _suitDefenderBoards = new SituationalStats('defender-suit', 'When defender in suit contract');
  private _slamDeclarerBoards = new SituationalStats('declarer-slam', 'When declarer in slam');
  private _slamDefenderBoards = new SituationalStats('defender-slam', 'When defender against slam');
  private _gameDeclarerBoards = new SituationalStats('declarer-game', 'When declarer in game');
  private _gameDefenderBoards = new SituationalStats('defender-game', 'When defender in game');
  private _partScoreDeclarerBoards = new SituationalStats('declarer-part-score', 'When declarer in part-score contract');
  private _partScoreDefenderBoards = new SituationalStats('defender-part-score', 'When defender in part-score contract');
  private _ntGameDeclarerBoards = new SituationalStats('declarer-game-nt', 'When declarer in NT game');
  private _majorGameDeclarerBoards = new SituationalStats('declarer-game-major', 'When declarer in major-suit game');
  private _minorGameDeclarerBoards = new SituationalStats('declarer-game-minor', 'When declarer in minor-suit game');
  private _ntGameDefenderBoards = new SituationalStats('defender-game-nt', 'When defender in NT game');
  private _majorGameDefenderBoards = new SituationalStats('defender-game-major', 'When defender in major-suit game');
  private _minorGameDefenderBoards = new SituationalStats('defender-game-minor', 'When defender in minor-suit game');

  constructor(partnership: Partnership) {
    this._partnership = partnership;
  }

  get partnership(): Partnership {
    return this._partnership;
  }

  getSituations(): SituationalStats[] {
    const result: SituationalStats[] = [];
    result.push(this._allBoards);
    result.push(this._passedBoards);

    result.push(this._declarerBoards);
    result.push(this._vulDeclarerBoards);
    result.push(this._nonVulDeclarerBoards);
    result.push(this._ntDeclarerBoards);
    result.push(this._suitDeclarerBoards);
    result.push(this._slamDeclarerBoards);
    result.push(this._gameDeclarerBoards);
    result.push(this._partScoreDeclarerBoards);

    result.push(this._ntGameDeclarerBoards);
    result.push(this._majorGameDeclarerBoards);
    result.push(this._minorGameDeclarerBoards);

    result.push(this._defenderBoards);
    result.push(this._vulDefenderBoards);
    result.push(this._nonVulDefenderBoards);

    result.push(this._ntDefenderBoards);
    result.push(this._suitDefenderBoards);
    result.push(this._slamDefenderBoards);
    result.push(this._gameDefenderBoards);
    result.push(this._partScoreDefenderBoards);

    result.push(this._ntGameDefenderBoards);
    result.push(this._majorGameDefenderBoards);
    result.push(this._minorGameDefenderBoards);
    return result;
  }

  async processDeclarerBoard(board: FinalBoardContext): Promise<void> {
    assert(board.contract);
    this._allBoards.processBoard(board, true);
    this._declarerBoards.processBoard(board, true);
    if (board.contract.strain === 'N') {
      this._ntDeclarerBoards.processBoard(board, true);
    } else {
      this._suitDeclarerBoards.processBoard(board, true);
    }
    if (board.contract.vulnerable) {
      this._vulDeclarerBoards.processBoard(board, true);
    } else {
      this._nonVulDeclarerBoards.processBoard(board, true);
    }
    if (board.contract.getApplicableSlam() !== 'none') {
      this._slamDeclarerBoards.processBoard(board, true);
    } else if (board.contract.isGameBonusApplicable()) {
      this._gameDeclarerBoards.processBoard(board, true);
      switch (board.contract.strain) {
        case 'N':
          this._ntGameDeclarerBoards.processBoard(board, true);
          break;
        case 'S':
        case 'H':
          this._majorGameDeclarerBoards.processBoard(board, true);
          break;
        case 'D':
        case 'C':
          this._minorGameDeclarerBoards.processBoard(board, true);
          break;
      }
    } else {
      this._partScoreDeclarerBoards.processBoard(board, true);
    }
  }

  async processDefenderBoard(board: FinalBoardContext): Promise<void> {
    assert(board.contract);
    this._allBoards.processBoard(board, false);
    this._defenderBoards.processBoard(board, false);
    if (board.contract.strain === 'N') {
      this._ntDefenderBoards.processBoard(board, false);
    } else {
      this._suitDefenderBoards.processBoard(board, false);
    }
    if (board.contract.vulnerable) {
      this._vulDefenderBoards.processBoard(board, false);
    } else {
      this._nonVulDefenderBoards.processBoard(board, false);
    }
    if (board.contract.getApplicableSlam() !== 'none') {
      this._slamDefenderBoards.processBoard(board, false);
    } else if (board.contract.isGameBonusApplicable()) {
      this._gameDefenderBoards.processBoard(board, false);
      switch (board.contract.strain) {
        case 'N':
          this._ntGameDefenderBoards.processBoard(board, false);
          break;
        case 'S':
        case 'H':
          this._majorGameDefenderBoards.processBoard(board, false);
          break;
        case 'D':
        case 'C':
          this._minorGameDefenderBoards.processBoard(board, false);
          break;
      }
    } else {
      this._partScoreDefenderBoards.processBoard(board, false);
    }
  }

  async processPassedBoard(board: FinalBoardContext): Promise<void> {
    this._allBoards.processBoard(board, false);
    this._passedBoards.processBoard(board, false);
  }

  toString(): string {
    const rows: string[] = [];
    rows.push('Partnership Stats: ' + this.partnership + '\n');
    rows.push(SituationalStats.headingString());
    for (const situation of this.getSituations()) {
      rows.push(situation.toString(this._allBoards.boards));
    }
    return rows.join('\n');
  }
}

export class SituationalStats {
  private _id: string;
  private _description: string;
  private _boards = 0;
  private _successes = 0;
  private _points = 0;

  constructor(id: string, description: string) {
    this._id = id;
    this._description = description;
  }

  async processBoard(board: FinalBoardContext, asDeclarer: boolean): Promise<void> {
    this._boards++;
    if (asDeclarer) {
      if (board.declarerScore > 0) {
        this._successes++;
      }
      this._points += board.declarerScore;
    } else {
      if (board.declarerScore < 0) {
        this._successes++;
      }
      this._points -= board.declarerScore;
    }
  }

  get id(): string {
    return this._id;
  }

  get description(): string {
    return this._description;
  }

  get boards(): number {
    return this._boards;
  }

  get successFraction(): number {
    return this._boards > 0 ? this._successes / this._boards : 0;
  }

  get avgPointsGained(): number {
    return this._boards > 0 ? this._points / this._boards : 0;
  }

  static headingString() {
    return sprintf('%-50s %6s %11s %11s %10s', "Scenario", 'Boards', '% Boards', 'Success', 'Avg score');
  }
  toString(totalBoards: number): string {
    return sprintf('%-50s %6i %10.1f%% %10.1f%% %10.1f', this.description, this.boards, totalBoards > 0 ? this.boards * 100 / totalBoards : 0, this.successFraction * 100, this.avgPointsGained);
  }
}