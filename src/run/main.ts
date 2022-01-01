import { Table } from "../core/table";

async function run() {
  const table = new Table({ assignContract: true });
  for (let i = 1; ; i++) {
    const board = await table.startBoard();
    await table.playBoard();
    console.log(board.toString());
    if (i % 10000 === 0) {
      console.log('\n\nTable Stats\n');
      console.log(table.tableStats.toString());
      console.log();
    }
  }
}

// setInterval(() => { }, 1 << 30);

run().then(() => { console.log("Finished") });