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
		let exists = (0 <= x && x < this.width) && (0 <= y && y < this.height);
		if (!exists) {
			console.error("Out of bounds cell accessed: ${x}, ${y}");
		}
		return exists;
	}

	get(x, y) {
		if (this.hasCell(x, y)) {
			return cells[x][y];
		}
	}

	set(x, y, value) {
		if (this.hasCell(x, y)) {
			cells[x][y] = value;
		}
	}
}