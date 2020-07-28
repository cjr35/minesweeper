class Grid {
	constructor(width, height) {
		this.width = width;
		this.height = height;

		this.cells = new Array(width);
		for (let i = 0; i < width; i++) {
			cells[i] = new Array(height);
		}
	}

	hasCell(x, y) {
		return (0 <= x && x < width) && (0 <= y && y < height);
	}

	get(x, y) {
		return cells[x][y];
	}
}