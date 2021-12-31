import { TotalRandomPlayer } from "../robots/total-random-player";
import { CoveringPlayer } from "../robots/covering-player";
import { Director } from "./director";
import { getPartnershipBySeat } from "../core/common";

let totalBoards = 0;
let totalDeclarerPoints = 0;
let totalDeclarerContractsMade = 0;
let totalPassed = 0;

let totalNSPoints = 0;
let totalEWPoints = 0;
let totalNSContracts = 0;
let totalEWContracts = 0;
let totalNSSuccesses = 0;
let totalEWSuccesses = 0;


const director = new Director();
director.seatPlayer('N', new CoveringPlayer('N'));
director.seatPlayer('S', new CoveringPlayer('S'));
director.seatPlayer('E', new TotalRandomPlayer('E'));
director.seatPlayer('W', new TotalRandomPlayer('W'));
let count = 0;
while (true) {
  const board = director.dealAndRunBoard();
  totalBoards++;
  if (board.passedOut) {
    totalPassed++;
  } else {
    const score = board.getDeclarerScore();
    totalDeclarerPoints += score;
    if (score > 0) {
      totalDeclarerContractsMade++;
    }
    if (getPartnershipBySeat(board.contract!.declarer) === 'NS') {
      totalNSContracts++;
      if (score > 0) {
        totalNSSuccesses++;
      }
      totalNSPoints += score;
      totalEWPoints -= score;
    } else {
      totalEWContracts++;
      if (score > 0) {
        totalEWSuccesses++;
      }
      totalEWPoints += score;
      totalNSPoints -= score;
    }
  }
  if (++count % 10000 === 0) {
    console.log(`\n\n> ${totalBoards} ${(100 * totalDeclarerContractsMade / totalBoards).toFixed(1)}% made, avg declarer score: ${(totalDeclarerPoints / totalBoards).toFixed(1)}\n\n`);
    console.log(`NS: avg points: ${(totalNSPoints / totalBoards).toFixed(1)} ${totalNSContracts} contracts, ${(100 * totalNSSuccesses / totalNSContracts).toFixed(1)}% success`);
    console.log(`EW: avg points: ${(totalEWPoints / totalBoards).toFixed(1)} ${totalEWContracts} contracts, ${(100 * totalEWSuccesses / totalEWContracts).toFixed(1)}% success`);
    console.log();
  }
}