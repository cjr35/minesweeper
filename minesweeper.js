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

document.addEventListener("DOMContentLoaded", init);

function init() {
	createGrid();
}

let gridWidth, gridHeight, mineTotal, field;

function createGrid() {
	gridWidth = 16;
	gridHeight = 16;

	let game = document.getElementById("game-section");

	game.style.setProperty("--rows", gridHeight);
	game.style.setProperty("--cols", gridWidth);

	let cellWidth = 600 / gridWidth;

	game.style.setProperty("--cell-size", `${cellWidth}px`);
	game.style.setProperty("--gap", `${cellWidth * 0.1}px`);

	let grid = document.getElementById("minefield-container");

	for (let i = 0; i < gridWidth; i++) {
		for (let j = 0; j < gridHeight; j++) {
			let div = document.createElement("div");
			div.className = "hidden";
			div.id = `pos-${j}-${i}`;
			div.addEventListener("mouseup", gridClick);
			div.addEventListener("contextmenu", (event) => {event.preventDefault();});
			grid.appendChild(div);
		}
	}
}

function populateMinefield(initX, initY) {
	field = new Minefield(gridWidth, gridHeight);
	mineTotal = 40;

	let minesPlaced = 0;
	let spacesCovered = 0;

	function pToPlaceMine() {
		return 1 / ((field.width * field.height - spacesCovered) / (mineTotal - minesPlaced));
	}

	field.fill(initX, initY, function(forceEmpty) {
		let value = 0; // empty space
		if (minesPlaced < mineTotal && !forceEmpty) {
			if (Math.random() <= pToPlaceMine()) {
				minesPlaced++;
				value = -1; // mine
			}
		}
		spacesCovered++;
		return value;
	});
}

function gridClick(event) {
	let code = event.button;
	let target = event.target;
	// let pos = target.id.match(/^pos-(?<x>\d+)-(?<y>\d+)$/).groups;
	// let x = Number(pos.x);
	// let y = Number(pos.y);

	if (code === 0) {
		gridLeftClick(target);
	}
	else if (code === 2) {
		gridRightClick(target);
	}
}

let newGame = true;

function gridLeftClick(square) {
	let pos = square.id.match(/^pos-(?<x>\d+)-(?<y>\d+)$/).groups;
	let x = Number(pos.x);
	let y = Number(pos.y);

	if (newGame) {
		populateMinefield(x, y);
		newGame = false;
	}

	if (square.className === "hidden") {
		let value = field.get(x, y);

		if (value === -1) {
			console.log("you lose");
		}
		else if (value === 0) {
			revealFrom(square, x, y);
		}
	}
}

function gridRightClick(square) {
	if (square.className === "hidden") {
		square.className = "flagged";
	}
	else if (square.className === "flagged") {
		square.className = "hidden";
	}
}

function revealFrom(square, x, y) {
	let adjacentMineCount = 0;
	for (let i = x - 1; i <= x + 1; i++) {
		for (let j = y - 1; j <= y + 1; j++) {
			if (field.get(i, j) == -1) {
				adjacentMineCount++;
			}
		}
	}

	if (adjacentMineCount == 0) {
		square.className = "none-adjacent";
		for (let i = x - 1; i <= x + 1; i++) {
			for (let j = y - 1; j <= y + 1; j++) {
				let neighbor = document.getElementById(`pos-${i}-${j}`);
				if (neighbor && neighbor.className === "hidden") {
					revealFrom(neighbor, i, j);
				}
			}
		}
	}
	else {
		square.className = "some-adjacent";
		square.innerHTML = adjacentMineCount;
	}
}