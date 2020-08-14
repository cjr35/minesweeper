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
	game.style.setProperty("--font-size", `${cellWidth * 0.55}px`);

	let grid = document.getElementById("minefield-container");

	for (let i = 0; i < gridWidth; i++) {
		for (let j = 0; j < gridHeight; j++) {
			let div = document.createElement("div");
			div.className = "hidden";
			div.id = `pos-${j}-${i}`;
			div.setAttribute("data-x", j);
			div.setAttribute("data-y", i);
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
				value = 1; // mine
			}
		}
		spacesCovered++;
		return value;
	});
}

async function gridClick(event) {
	let code = event.button;
	let target = event.target;

	// let temp = target.className;
	// target.className = "just-clicked";
	// await sleep(40);
	// target.className = temp;

	if (code === 0) {
		gridLeftClick(target);
	}
	else if (code === 2) {
		gridRightClick(target);
	}
}

let newGame = true;

function gridLeftClick(square) {
	let x = square.getAttribute("data-x");
	let y = square.getAttribute("data-y");
	let className = square.className;

	if (newGame) {
		populateMinefield(x, y);
		newGame = false;
	}

	if (className === "hidden") {
		reveal(square);
	}
	else if (className === "auto-reveal-eligible") {
		getNeighbors(x, y).forEach(nbr => {
			if (nbr.className === "hidden") {
				reveal(nbr);
			}
		});
		checkAutoRevealEligibility(square);
	}
}

async function reveal(square) {
	await sleep(50);

	if (square.className !== "hidden") {
		return;
	}

	let x = square.getAttribute("data-x");
	let y = square.getAttribute("data-y");

	if (field.get(x, y) === 1) {
		loseFrom(square);
		console.log("you lose");
		return;
	}

	let neighbors = getNeighbors(x, y);
	let adjMineCount = neighbors.reduce((acc, nbr) => acc + field.get(nbr.getAttribute("data-x"), nbr.getAttribute("data-y")), 0);

	if (adjMineCount === 0) {
		square.className = "none-adjacent";
		neighbors.forEach(nbr => nbr.className === "hidden" ?
								 reveal(nbr) :
								 null);
	}
	else {
		square.className = "some-adjacent";
	}

	let span = document.createElement("span");
	span.className = `adjacent-mines-${adjMineCount}`;
	span.innerHTML = `${adjMineCount}`;
	span.style.opacity = 0;
	
	let angle = (Math.random() * 15) - 7.5;
	span.style.setProperty("--angle", `${angle}deg`);
	square.appendChild(span);

	checkAutoRevealEligibility(square);

	setTimeout(() => {
		span.style.opacity = 100;
		neighbors.forEach(nbr => nbr.className === "some-adjacent" ||
								 nbr.className === "auto-reveal-eligible" ?
								 checkAutoRevealEligibility(nbr) :
								 null);
	}, 100);
}

function gridRightClick(square) {
	let x = square.getAttribute("data-x");
	let y = square.getAttribute("data-y");

	if (square.className === "hidden") {
		square.className = "flagged";
	}
	else if (square.className === "flagged") {
		square.className = "hidden";
	}

	let neighbors = getNeighbors(x, y);

	neighbors.forEach(nbr => nbr.className === "some-adjacent" ||
							 nbr.className === "auto-reveal-eligible" ?
							 checkAutoRevealEligibility(nbr) :
							 null);
}

function checkAutoRevealEligibility(square) {
	if (square.firstChild) {
		let x = square.getAttribute("data-x");
		let y = square.getAttribute("data-y");
		let adjMineCount = Number(square.firstChild.innerHTML);
		if (adjMineCount === 0) {
			return;
		}
		let neighbors = getNeighbors(x, y);

		let adjFlaggedCount = 0;
		let adjHiddenCount = 0;

		neighbors.forEach(nbr => {
			if (nbr.className === "flagged") adjFlaggedCount++;
			else if (nbr.className === "hidden") adjHiddenCount ++;
		});

		square.className = (adjMineCount === adjFlaggedCount) &&
						   (adjHiddenCount > 0) ?
						   "auto-reveal-eligible" :
						   "some-adjacent";
	}
}

function getNeighbors(x, y) {
	let list = new Array();
	x = Number(x);
	y = Number(y);

	for (let i = x - 1; i <= x + 1; i++) {
		for (let j = y - 1; j <= y + 1; j++) {
			let neighbor = document.getElementById(`pos-${i}-${j}`);
			if (neighbor /* is not falsy */ && !(i === x && j === y)) {
				list.push(neighbor);
			}
		}
	}

	return list;
}

async function loseFrom(square) {

	let x = square.getAttribute("data-x");
	let y = square.getAttribute("data-y");

	let neighbors = getNeighbors(x, y);
	
	if (field.get(x, y) === 1) {
		square.className = "lost-mine";
		let img = document.createElement("img");
		img.src = "./resources/mine.svg";

		let angle = (Math.random() * 30) - 15;
		img.style.setProperty("--angle", `${angle}deg`);

		square.appendChild(img);
	}
	else {
		square.className = "lost-number";

		if (!square.firstChild) {
			let adjMineCount = neighbors.reduce((acc, nbr) => acc + field.get(nbr.getAttribute("data-x"), nbr.getAttribute("data-y")), 0);

			let span = document.createElement("span");
			span.className = `adjacent-mines-${adjMineCount}`;
			span.innerHTML = `${adjMineCount}`;
			span.style.opacity = 0;
			
			let angle = (Math.random() * 15) - 7.5;
			span.style.setProperty("--angle", `${angle}deg`);
			square.appendChild(span);

			setTimeout(() => span.style.opacity = 100, 100);
		}
	}
	
	await sleep(50);

	neighbors.filter(nbr => !nbr.className.startsWith("lost"))
			 .forEach(nbr => loseFrom(nbr));
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}