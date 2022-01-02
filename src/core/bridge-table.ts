import { BidWithSeat } from "./bid";
import { Board } from "./board";
import { BoardContext, FinalBoardContext, getPartnerBySeat, getSeatFollowing, Partnership, randomlySelect, Seat, SEATS, VULNERABILITIES } from "./common";
import { ContractAssigner, defaultContractAssigner } from "./contract-assigner";
import { Player } from "./player";
import * as assert from 'assert';
import { Play } from "./play";
import { TableStats } from "./table-stats";
import { Robot, RobotStrategy } from "./robot";

export interface TableOptions {
  assignContract?: boolean;
  robotStrategy?: RobotStrategy;
}

export class BridgeTable {
  private _options: TableOptions;
  private _players = new Map<Seat, Player>();
  private _boardNumber = 1;
  private _currentBoard: Board | null = null;
  private _contractAssigner: ContractAssigner;
  private _tableStats = new TableStats();

  constructor(options?: TableOptions) {
    this._options = options || {};
    for (const seat of SEATS) {
      const player = new Robot(this._options.robotStrategy);
      player.seat = seat;
      this._players.set(seat, player);
    }
    this._contractAssigner = defaultContractAssigner;
  }

  get players(): Map<Seat, Player> {
    return this._players
  }

  get board(): BoardContext | null {
    return this._currentBoard;
  }

  get tableStats(): TableStats {
    return this._tableStats;
  }

  get contractAssigner(): ContractAssigner {
    return this._contractAssigner;
  }

  set contractAssigner(value: ContractAssigner) {
    this._contractAssigner = value;
  }

  assignPlayer(seat: Seat, player: Player): void {
    const partner = this._players.get(getPartnerBySeat(seat))!;
    if (!player.acceptConventions(partner.conventionCard)) {
      throw new Error("Player is unwilling to accept partner conventions.  Try assignTeam?");
    }
    this._players.set(seat, player);
    player.seat = seat;
  }

  assignTeam(partnership: Partnership, players: Player[]): void {
    assert(players.length === 2);
    switch (partnership) {
      case 'NS':
        this._players.set('N', players[0]);
        players[0].seat = 'N';
        this._players.set('S', players[1]);
        players[1].seat = 'N';
        break;
      case 'EW':
        this._players.set('E', players[0]);
        players[0].seat = 'E';
        this._players.set('W', players[1]);
        players[1].seat = 'W';
        break;
    }
  }

  async startBoard(copyFrom?: BoardContext): Promise<BoardContext> {
    assert(!this._currentBoard || this._currentBoard.status === 'complete');
    if (copyFrom) {
      this._currentBoard = Board.copyFrom(copyFrom);
    } else {
      const boardId = this._boardNumber.toString();
      this._boardNumber++;
      this._currentBoard = Board.deal(boardId, randomlySelect(VULNERABILITIES), randomlySelect(SEATS));
    }
    return this._currentBoard;
  }

  async playBoard(): Promise<FinalBoardContext> {
    assert(this._currentBoard && this._currentBoard.status === 'created');
    const board = this._currentBoard;
    for (const seat of SEATS) {
      this._players.get(seat)!.startBoard(this._currentBoard);
    }
    board.start();
    if (this._options.assignContract) {
      const contract = await this._contractAssigner(board);
      if (contract) {
        board.setContract(contract);
      } else {
        board.passOut();
      }
    } else {
      let bidderSeat = board.dealer;
      while (board.status === 'bidding') {
        bidderSeat = getSeatFollowing(bidderSeat);
        const bidder = this._players.get(bidderSeat)!;
        const bid = await bidder.bid(board, board.getHand(bidderSeat));
        const fullBid = new BidWithSeat(bidderSeat, bid.type, bid.type === 'normal' ? bid.count : undefined, bid.type === 'normal' ? bid.strain : undefined);
        assert(board.isLegalFollowing(fullBid), "Illegal bid: " + fullBid.toString());
        board.bid(fullBid);
      }
    }
    if (board.status === 'play') {
      assert(board.contract);
      const declarer = this.players.get(board.contract.declarer);
      assert(declarer);
      const dummy = this.players.get(getPartnerBySeat(declarer.seat));
      assert(dummy);
      let seat = getSeatFollowing(declarer.seat);
      while (true) {
        const player = this.players.get(seat);
        assert(player);
        const trick = board.currentTrick;
        if (!trick) {
          break;
        }
        const card = player.seat === dummy.seat ? await declarer.playFromDummy(board, board.getHand(seat), board.getHand(declarer.seat)) : await player.play(board, board.getHand(seat), board.getHand(dummy.seat));
        const actualCard = board.getHand(seat).ensureEligibleToPlay(card, trick.getLeadSuit());
        board.getHand(seat).playCard(actualCard)
        board.playCard(new Play(seat, actualCard));
        const next = board.getNextPlayer();
        if (!next) {
          break;
        }
        seat = next;
      }
    }
    this._tableStats.processBoard(board);
    return board;
  }
}