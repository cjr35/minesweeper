import Grid from './grid.js'

class Minefield extends Grid {
	// override fill method
	fill(xInit, yInit, callback) {
		for (let i = 0; i < this.width; i++) {
			for (let j = 0; j < this.height; j++) {
				let xProtected = Math.abs(xInit - i) <= 1;
				let yProtected = Math.abs(yInit - j) <= 1;
				this.set(i, j, callback(xProtected && yProtected));
			}
		}
	}
}

let game = document.getElementById("game-section");

let gridWidth = 16;
let gridHeight = 16;

game.style.setProperty("--rows", gridHeight);
game.style.setProperty("--cols", gridWidth);

let cellWidth = 600 / gridWidth;

game.style.setProperty("--cell-size", `${cellWidth}px`);
game.style.setProperty("--gap", `${cellWidth * 0.1}px`);

let grid = document.getElementById("minefield-container");

for (let i = 0; i < gridWidth; i++) {
	for (let j = 0; j < gridHeight; j++) {
		let div = document.createElement("div");
		div.className = "minefield-item unclicked";
		div.id = `pos-${i}-${j}`;
		grid.appendChild(div);
	}
}

let field = new Minefield(gridWidth, gridHeight);
let mineTotal = 40;

let minesPlaced = 0;
let spacesCovered = 0;

function pToPlaceMine() {
	return 1 / ((field.width * field.height - spacesCovered) / (mineTotal - minesPlaced));
}

field.fill(12, 3, function(forceEmpty) {
	let value = 0;
	if (minesPlaced < mineTotal && !forceEmpty) {
		if (Math.random() <= pToPlaceMine()) {
			minesPlaced++;
			value = -1;
		}
	}
	spacesCovered++;
	return value;
});

console.log(field);