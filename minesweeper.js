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

let resetbtn = document.getElementById("reset");
resetbtn.addEventListener("click", resetAll);
let resetbtnBlockerCount = 0;

function init() {
	createGrid();
}

let gridWidth, gridHeight, mineTotal, field, minesPlaced, squareWidth;

function createGrid() {
	gridWidth = 16;
	gridHeight = 16;

	let game = document.getElementById("game");

	game.addEventListener("contextmenu", event => event.preventDefault());

	game.style.setProperty("--rows", gridHeight);
	game.style.setProperty("--cols", gridWidth);

	squareWidth = 600 / gridWidth;

	game.style.setProperty("--square-size", `${squareWidth}px`);
	game.style.setProperty("--gap", `${squareWidth * 0.1}px`);
	game.style.setProperty("--font-size", `${squareWidth * 0.55}px`);

	let grid = document.getElementById("minefield-container");

	for (let i = 0; i < gridWidth; i++) {
		for (let j = 0; j < gridHeight; j++) {
			let div = document.createElement("div");
			div.className = "hidden";
			div.id = `pos-${i}-${j}`;
			div.setAttribute("data-x", i);
			div.setAttribute("data-y", j);
			div.addEventListener("click", gridLeftClick);
			div.addEventListener("auxclick", gridRightClick);
			grid.appendChild(div);
		}
	}
}

function populateMinefield(initX, initY) {
	field = new Minefield(gridWidth, gridHeight);
	mineTotal = 40;

	minesPlaced = 0;
	let spacesCovered = 0;

	function pToPlaceMine() {
		return 1 / ((field.area - spacesCovered) / (mineTotal - minesPlaced));
	}

	field.fill(initX, initY, forceEmpty => {
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

	if (minesPlaced < mineTotal) {
		let initNeighbors = getNeighbors(initX, initY);
		let squares = Array.from(document.querySelectorAll(".minefield-container > div"));
		squares = squares.filter(sqr => !initNeighbors.includes(sqr) && sqr.id !== `pos-${initX}-${initY}`);
		
		shuffle(squares);
		let sqr, x, y;
		for (let i = 0; i < squares.length; i++) {
			sqr = squares[i];
			x = sqr.getAttribute("data-x");
			y = sqr.getAttribute("data-y");
			if (field.get(x, y) === 0) {
				field.set(x, y, 1);
				minesPlaced++;
				if (minesPlaced === mineTotal) {
					break;
				}
			}
		}

		if (minesPlaced < mineTotal) {
			shuffle(initNeighbors);
			let nbr, x, y;
			for (let i = 0; i < initNeighbors.length; i++) {
				nbr = initNeighbors[i];
				x = nbr.getAttribute("data-x");
				y = nbr.getAttribute("data-y");
				if (field.get(x, y) === 0) {
					field.set(x, y, 1);
					minesPlaced++;
					if (minesPlaced === mineTotal) {
						break;
					}
				}
			}
		}
	}
}

let newGame = true;
let gameEnd = false;

async function gridLeftClick(event) {
	resetbtn.disabled = true;

	let square = event.target;
	let x = square.getAttribute("data-x");
	let y = square.getAttribute("data-y");
	let className = square.className;

	if (newGame) {
		populateMinefield(x, y);
		newGame = false;
		gameEnd = false;
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

	resetbtnBlockerCount++;

	let x = square.getAttribute("data-x");
	let y = square.getAttribute("data-y");

	if (field.get(x, y) === 1) {
		loseFrom(square);
		await sleep(800);
		resetbtnBlockerCount = 0;
		resetbtn.disabled = false;
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
		span.style.opacity = 1;

		if (document.querySelectorAll(".hidden, .flagged").length === mineTotal) {
			win();
			resetbtnBlockerCount = 0;
			return;
		}

		neighbors.forEach(nbr => nbr.className === "some-adjacent" ||
								nbr.className === "auto-reveal-eligible" ?
								checkAutoRevealEligibility(nbr) :
								null);

		if (!gameEnd) {
			resetbtnBlockerCount--;
			resetbtn.disabled = resetbtnBlockerCount !== 0;
		}
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
			else if (nbr.className === "hidden") adjHiddenCount++;
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
		if (square.className === "flagged") {
			square.className = "lost-flagged-mine";
		}
		else {
			square.className = "lost-missed-mine";
		}

		let img = document.createElement("img");
		{
			img.src = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 79.4 79.4'%3E%3Cstyle%3E.a%7Bstroke-width:0.3;%7D%3C/style%3E%3Cdefs%3E%3CradialGradient cx='0.1' cy='56.9' r='10.2' gradientTransform='matrix(-1.95 0 0 -1.916 .2849 165.2)' gradientUnits='userSpaceOnUse'%3E%3Cstop stop-color='%23ff4155' offset='0'/%3E%3Cstop stop-color='%23ff4155' offset='1'/%3E%3Cstop offset='1' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Cg style='fill:none;stroke-width:0.3'%3E%3Cellipse cx='13.6' cy='7.3' rx='8.3' ry='2.4'/%3E%3Cellipse cx='31.9' cy='20.3' rx='8.1' ry='7.6'/%3E%3C/g%3E%3Cg class='a'%3E%3Cpath d='m39.7 19.8a19.8 19.8 0 0 0-19.8 19.8 19.8 19.8 0 0 0 19.8 19.8 19.8 19.8 0 0 0 19.8-19.8 19.8 19.8 0 0 0-19.8-19.8z' paint-order='markers stroke fill'/%3E%3Crect x='6.6' y='37' width='66.2' height='5.3' rx='2.6' ry='2.6'/%3E%3Crect transform='rotate(90)' x='6.6' y='-42.3' width='66.2' height='5.3' rx='2.6' ry='2.6'/%3E%3Crect transform='rotate(45)' x='25.4' y='-2.6' width='19.8' height='5.3' rx='2.6' ry='2.6'/%3E%3C/g%3E%3Crect transform='rotate(225)' x='-86.4' y='-2.6' width='19.8' height='5.3' rx='2.6' ry='2.6'/%3E%3Crect transform='rotate(-45)' x='-30.5' y='53.7' width='19.8' height='5.3' rx='2.6' ry='2.6' style='mix-blend-mode:normal;paint-order:markers stroke fill;stroke-linejoin:round;stroke-width:0.5;stroke:url(%23radialGradient954)'/%3E%3Crect transform='rotate(-45)' x='10.7' y='53.3' width='19.8' height='5.3' rx='2.6' ry='2.6' class='a'/%3E%3Cellipse transform='rotate(45)' cx='56.1' cy='-13.1' rx='7.1' ry='2.4' style='fill:%23ff4155;stroke-width:0.3'/%3E%3C/svg%3E";
		} // inline svg
		let angle = (Math.random() * 30) - 15;
		img.style.setProperty("--angle", `${angle}deg`);

		img.style.opacity = 0;

		square.appendChild(img);

		setTimeout(() => img.style.opacity = 1, 100);
	}
	else {
		if (square.className === "flagged") {
			square.className = "lost-bad-flag";
		}
		else {
			square.className = "lost-number";
		}

		if (!square.firstChild) {
			let adjMineCount = neighbors.reduce((acc, nbr) => acc + field.get(nbr.getAttribute("data-x"), nbr.getAttribute("data-y")), 0);

			let span = document.createElement("span");
			span.className = `adjacent-mines-${adjMineCount}`;
			span.innerHTML = `${adjMineCount}`;
			
			let angle = (Math.random() * 15) - 7.5;
			span.style.setProperty("--angle", `${angle}deg`);

			span.style.opacity = 0;

			square.appendChild(span);

			setTimeout(() => span.style.opacity = 1, 100);
		}
	}
	
	await sleep(50);

	neighbors.filter(nbr => !nbr.className.startsWith("lost"))
			 .forEach(nbr => loseFrom(nbr));

	gameEnd = true;
}

async function win() {
	let confettiCounter = 0;
	let gameElement = document.getElementById("game");
	gameElement.style.pointerEvents = "none";
	resetbtn.disabled = true;
	document.querySelectorAll(".some-adjacent, .auto-reveal-eligible").forEach(async sqr => {
		sqr.className = "won-number";
	});
	let mines = Array.from(document.querySelectorAll(".hidden, .flagged"));
	mines.sort((a, b) => sortByDistance(a, b, Math.floor(gridWidth / 2), Math.floor(gridHeight / 2)));
	mines.forEach((mine) => {
		mine.className = "won-mine";
		let img = document.createElement("img");
		{
			img.src = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 79.4 79.4'%3E%3Cstyle%3E.a%7Bstroke-width:0.3;%7D%3C/style%3E%3Cdefs%3E%3CradialGradient cx='0.1' cy='56.9' r='10.2' gradientTransform='matrix(-1.95 0 0 -1.916 .2849 165.2)' gradientUnits='userSpaceOnUse'%3E%3Cstop stop-color='%23ff4155' offset='0'/%3E%3Cstop stop-color='%23ff4155' offset='1'/%3E%3Cstop offset='1' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Cg style='fill:none;stroke-width:0.3'%3E%3Cellipse cx='13.6' cy='7.3' rx='8.3' ry='2.4'/%3E%3Cellipse cx='31.9' cy='20.3' rx='8.1' ry='7.6'/%3E%3C/g%3E%3Cg class='a'%3E%3Cpath d='m39.7 19.8a19.8 19.8 0 0 0-19.8 19.8 19.8 19.8 0 0 0 19.8 19.8 19.8 19.8 0 0 0 19.8-19.8 19.8 19.8 0 0 0-19.8-19.8z' paint-order='markers stroke fill'/%3E%3Crect x='6.6' y='37' width='66.2' height='5.3' rx='2.6' ry='2.6'/%3E%3Crect transform='rotate(90)' x='6.6' y='-42.3' width='66.2' height='5.3' rx='2.6' ry='2.6'/%3E%3Crect transform='rotate(45)' x='25.4' y='-2.6' width='19.8' height='5.3' rx='2.6' ry='2.6'/%3E%3C/g%3E%3Crect transform='rotate(225)' x='-86.4' y='-2.6' width='19.8' height='5.3' rx='2.6' ry='2.6'/%3E%3Crect transform='rotate(-45)' x='-30.5' y='53.7' width='19.8' height='5.3' rx='2.6' ry='2.6' style='mix-blend-mode:normal;paint-order:markers stroke fill;stroke-linejoin:round;stroke-width:0.5;stroke:url(%23radialGradient954)'/%3E%3Crect transform='rotate(-45)' x='10.7' y='53.3' width='19.8' height='5.3' rx='2.6' ry='2.6' class='a'/%3E%3Cellipse transform='rotate(45)' cx='56.1' cy='-13.1' rx='7.1' ry='2.4' style='fill:%23dca0dc;stroke-width:0.3'/%3E%3C/svg%3E";
		} // inline svg
		let angle = (Math.random() * 30) - 15;
		img.style.setProperty("--angle", `${angle}deg`);
		mine.appendChild(img);
		setTimeout(() => img.style.opacity = 0.55, 200);
	});
	for (let i = 0; i < mines.length; i++) {
		await sleep(100);
		mines[i].firstChild.className = "shaking";
		setTimeout(() => {
			mines[i].innerHTML = "";
			let n = randRange(20, 30);
			confettiCounter += n;
			mines[i].style.zIndex = i + 1;
			for (let j = 0; j < n; j++) {
				let confetti = createConfetti();
				mines[i].appendChild(confetti);
			}
			setTimeout(() => {
				mines[i].style.zIndex = 0;
				mines[i].innerHTML = "";
				confettiCounter -= n;
				if (confettiCounter === 0) {
					resetbtn.disabled = false;
					gameElement.style.pointerEvents = "all";
				}
			}, 750);
		}, 750);
	
	}
	gameEnd = true;
}

function createConfetti() {
	let colors = ["var(--hidden-color)", "var(--hidden-accent)", "var(--some-accent)", "#faf0e6", "#5efc8d", "#50c5b7", "#b3eae2"];
	let confetti = document.createElement("div");
	confetti.className = "confetti";
	let size = randRange(Math.floor(squareWidth * 0.15), Math.floor(squareWidth * 0.25));
	confetti.style.width = `${size}px`;
	confetti.style.height = `${size}px`;
	confetti.style.borderRadius = `${size}px`;
	confetti.style.left = `${randRange(40, 50)}%`;
	confetti.style.top = `${randRange(40, 50)}%`;
	confetti.style.backgroundColor = colors[randRange(0, 6)];
	confetti.style.transformOrigin = `${randRange(-10, 10) * 1000}% ${randRange(-10, 10) * 1000}%`;
	return confetti;
}

function reset(square) {
	let bg = window.getComputedStyle(square).backgroundColor;
	square.style.setProperty("--bg-color", bg);
	square.className = square.className.concat(" flip");
	square.addEventListener("animationend",
		() => {
			square.innerHTML = "";
			square.className = "hidden";},
		{ once: true });
}

async function resetAll() {
	newGame = true;
	resetbtn.disabled = true;
	let squares = Array.from(document.querySelectorAll(".minefield-container > div"));
	let x = Math.floor(Math.random() * gridWidth);
	let y = Math.floor(Math.random() * gridHeight);
	squares.sort((a, b) => sortByDistance(a, b, x, y));
	let fieldElement = document.getElementById("minefield-container");
	fieldElement.style.pointerEvents = "none";
	for (let i = 0; i < squares.length; i++) {
		let sqr = squares[i];
		if (sqr.className !== "hidden") {
			await sleep(1);
			reset(sqr);
		}
	}
	setTimeout(() => fieldElement.style.pointerEvents = "all", 500);
}

function sortByDistance(a, b, x, y) {
	let ax = a.getAttribute("data-x") - x;
	let ay = a.getAttribute("data-y") - y;
	let bx = b.getAttribute("data-x") - x;
	let by = b.getAttribute("data-y") - y;

	let aDist = Math.sqrt(ax ** 2 + ay ** 2);
	let bDist = Math.sqrt(bx ** 2 + by ** 2);

	return aDist - bDist;
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function shuffle(array) {
	for (let i = array.length - 1; i > 0; i--) {
		let randSwap = Math.floor(Math.random() * i);
		let temp = array[i];
		array[i] = array[randSwap];
		array[randSwap] = temp;
	}
}

function randRange(a, b) {
	return a + Math.floor(Math.random() * (b - a + 1));
}

document.getElementById("test").addEventListener("click", testGeneration);

function testGeneration() {
	gridWidth = 16;
	gridHeight = 16;
	for (let i = 1; i < 256; i++) {
		mineTotal = i;
		let failedGenTotal = 0;
		let minesMissedTotal = 0;
		for (let j = 0; j < 10000; j++) {
			populateMinefield(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16));
			let minesMissed = mineTotal - minesPlaced;
			if (minesMissed !== 0) {
				failedGenTotal++;
				minesMissedTotal += minesMissed;
			}
		}
		console.log({
			mineTotal: mineTotal,
			failedGenPctg: (failedGenTotal / 10000) * 100,
			avgMinesMissed: minesMissedTotal / failedGenTotal
		});
	}
}