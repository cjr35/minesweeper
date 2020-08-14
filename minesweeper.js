import Grid from './grid.js';

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

	let game = document.getElementById("game");

	game.addEventListener("contextmenu", event => event.preventDefault());

	game.style.setProperty("--rows", gridHeight);
	game.style.setProperty("--cols", gridWidth);

	let squareWidth = 600 / gridWidth;

	game.style.setProperty("--square-size", `${squareWidth}px`);
	game.style.setProperty("--gap", `${squareWidth * 0.1}px`);
	game.style.setProperty("--font-size", `${squareWidth * 0.55}px`);

	let grid = document.getElementById("minefield-container");

	for (let i = 0; i < gridWidth; i++) {
		for (let j = 0; j < gridHeight; j++) {
			let div = document.createElement("div");
			div.className = "hidden";
			div.id = `pos-${j}-${i}`;
			div.setAttribute("data-x", j);
			div.setAttribute("data-y", i);
			div.addEventListener("click", gridLeftClick);
			div.addEventListener("auxclick", gridRightClick);
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

let newGame = true;

function gridLeftClick(event) {
	let square = event.target;
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

function gridRightClick(event) {
	let square = event.target;
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
		img.src = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 79.4 79.4'%3E%3Cstyle%3E.a%7Bstroke-width:0.3;%7D%3C/style%3E%3Cdefs%3E%3CradialGradient cx='0.1' cy='56.9' r='10.2' gradientTransform='matrix(-1.95 0 0 -1.916 .2849 165.2)' gradientUnits='userSpaceOnUse'%3E%3Cstop stop-color='%23ff4155' offset='0'/%3E%3Cstop stop-color='%23ff4155' offset='1'/%3E%3Cstop offset='1' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Cg style='fill:none;stroke-width:0.3'%3E%3Cellipse cx='13.6' cy='7.3' rx='8.3' ry='2.4'/%3E%3Cellipse cx='31.9' cy='20.3' rx='8.1' ry='7.6'/%3E%3C/g%3E%3Cg class='a'%3E%3Cpath d='m39.7 19.8a19.8 19.8 0 0 0-19.8 19.8 19.8 19.8 0 0 0 19.8 19.8 19.8 19.8 0 0 0 19.8-19.8 19.8 19.8 0 0 0-19.8-19.8z' paint-order='markers stroke fill'/%3E%3Crect x='6.6' y='37' width='66.2' height='5.3' rx='2.6' ry='2.6'/%3E%3Crect transform='rotate(90)' x='6.6' y='-42.3' width='66.2' height='5.3' rx='2.6' ry='2.6'/%3E%3Crect transform='rotate(45)' x='25.4' y='-2.6' width='19.8' height='5.3' rx='2.6' ry='2.6'/%3E%3C/g%3E%3Crect transform='rotate(225)' x='-86.4' y='-2.6' width='19.8' height='5.3' rx='2.6' ry='2.6'/%3E%3Crect transform='rotate(-45)' x='-30.5' y='53.7' width='19.8' height='5.3' rx='2.6' ry='2.6' style='mix-blend-mode:normal;paint-order:markers stroke fill;stroke-linejoin:round;stroke-width:0.5;stroke:url(%23radialGradient954)'/%3E%3Crect transform='rotate(-45)' x='10.7' y='53.3' width='19.8' height='5.3' rx='2.6' ry='2.6' class='a'/%3E%3Cellipse transform='rotate(45)' cx='56.1' cy='-13.1' rx='7.1' ry='2.4' style='fill:%23ff4155;stroke-width:0.3'/%3E%3C/svg%3E";

		let angle = (Math.random() * 30) - 15;
		img.style.setProperty("--angle", `${angle}deg`);

		img.style.opacity = 0;

		square.appendChild(img);

		setTimeout(() => img.style.opacity = 100, 100);
	}
	else {
		square.className = "lost-number";

		if (!square.firstChild) {
			let adjMineCount = neighbors.reduce((acc, nbr) => acc + field.get(nbr.getAttribute("data-x"), nbr.getAttribute("data-y")), 0);

			let span = document.createElement("span");
			span.className = `adjacent-mines-${adjMineCount}`;
			span.innerHTML = `${adjMineCount}`;
			
			let angle = (Math.random() * 15) - 7.5;
			span.style.setProperty("--angle", `${angle}deg`);

			span.style.opacity = 0;

			square.appendChild(span);

			setTimeout(() => span.style.opacity = 100, 100);
		}
	}
	
	await sleep(50);

	neighbors.filter(nbr => !nbr.className.startsWith("lost"))
			 .forEach(nbr => loseFrom(nbr));
	
	reset(square);
}

async function reset(square) {
	await sleep(2000);
	let bg = window.getComputedStyle(square).backgroundColor;
	square.style.setProperty("--bg-color", bg);
	square.className = square.className.concat(" reset");
	square.addEventListener("animationend",
		() => {
			square.innerHTML = "";
			square.className = "hidden";},
		{ once: true });
	newGame = true;
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}