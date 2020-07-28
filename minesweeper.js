import Grid from './grid.js'

let field = new Grid(16, 16);
let mineTotal = 40;

let minesPlaced = 0;
let spacesCovered = 0;

function mineProbability() {
	return 1 / ((field.width * field.height - spacesCovered) / (mineTotal - minesPlaced));
}

field.fill(function() {
	let value = 'empty';
	if (minesPlaced < mineTotal) {
		if (Math.random() <= mineProbability()) {
			minesPlaced++;
			value = 'mine'
		}
	}
	spacesCovered++;
	return value;
});