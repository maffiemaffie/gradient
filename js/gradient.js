/**
 * Represents a gradient between a variable number of colors. Provides functionality for adding, (re)moving around, and changing colors.
 * @class
 */
export class Gradient {
    /**
     * Create a new gradient
     * @constructor
     */
    constructor() {
        /**
         * The colors of the gradient.
         * @type {StopList}
         */
        this.stops = new StopList();

        /**
         * The interpolation function to interpolate between stops.
         * @type {function({r:number,g:number,b:number,a:number},{r:number,g:number,b:number,a:number},number):{r:number,g:number,b:number,a:number}}
         */
        this.interpolator = lerper;
    }

    /**
     * Adds a new stop to the gradient.
     * @param {number} position - The position at which to add the new stop (0-1).
     * @param {Object} color - The color of the new stop.
     * @param {number} color.r - The red component (0-255).
     * @param {number} color.g - The green component (0-255).
     * @param {number} color.b - The blue component (0-255).
     * @param {number} [color.a=1] - The alpha component (0-1, defaults to 1).
     */
    addStop(position, color) {
        this.stops.add(position, color);
    }

    /**
     * Replaces a stop with a new color.
     * @param {number} position - The position of the stop to be replaced (0-1).
     * @param {Object} color - The new color of the existing stop.
     * @param {number} color.r - The red component (0-255).
     * @param {number} color.g - The green component (0-255).
     * @param {number} color.b - The blue component (0-255).
     * @param {number} [color.a=1] - The alpha component (0-1, defaults to 1).
     */
    replaceStop(position, color) { 
        this.stops.replace(position, color);
    }

    /**
     * Changes the position of an existing stop and resorts the list.
     * @param {number} position - The position of the stop to be moved (0-1).
     * @param {number} to - The new position of the existing stop (0-1).
     */
    move(position, to) {
        this.stops.move(position, to);
    }

    /**
     * Removes an existing stop from the list and resorts the list.
     * @param {number} position - The position of the stop to be removed (0-1).
     */
    remove(position) {
        this.stops.remove(position);
    }

    /**
     * Gets the color at a position along the gradient.
     * @param {number} position - The position at which to get the color (0, 1).
     * @returns {{r:number,g:number,b:number,a:number}} The color at the specified position.
     */
    getColor(position) {
        const neighborIndices = this.stops.getIndexPair(position);
        // no stops in gradient
        if (neighborIndices[0] === null && neighborIndices[1] === null) {
            throw new Error(`Can't get color from an empty array.`);
        }

        // position is at a stop
        if (neighborIndices[0] === neighborIndices[1]) {
            const stop = this.stops.get(neighborIndices[0]);
            return {...stop.color};
        }

        // position is before the first stop        
        if (neighborIndices[0] === null) {
            const stop = this.stops.get(neighborIndices[1])
            return {...stop.color};
        }
        
        // position is past the last stop
        if (neighborIndices[1] === null) {
            const stop = this.stops.get(neighborIndices[0])
            return {...stop.color};
        }

        // 99% of the time lol
        const stop1 = this.stops.get(neighborIndices[0]);
        const stop2 = this.stops.get(neighborIndices[1]);
        const factor = (position - stop1.position) / (stop2.position - stop1.position);

        return this.interpolator(stop1.color, stop2.color, factor);
    }
}

/**
 * Sorted array for adding, removing, moving, replacing, and getting stops.
 * @class 
 */
class StopList {
    #stops;

    constructor() {
        this.#stops = [];
    }

    /**
     * Adds a new stop and resorts the list.
     * @param {number} position - The position at which to add the new stop (0-1).
     * @param {Object} color - The color of the new stop.
     * @param {number} color.r - The red component (0-255).
     * @param {number} color.g - The green component (0-255).
     * @param {number} color.b - The blue component (0-255).
     * @param {number} [color.a=1] - The alpha component (0-1, defaults to 1).
     */
    add(position, color) {
        if (position < 0 || position > 1) throw new RangeError(`Stop position must be between 0 and 1.`);
        const stop = {
            position,
            color: {
                r: color.r,
                g: color.g,
                b: color.b,
                a: color.a
            }
        };

        if (this.#stops.length === 0) {
            this.#stops.push(stop);
            return;
        }

        const neighbors = this.getIndexPair(position);
        if (neighbors[0] === neighbors[1]) throw new RangeError(`Stop already exists at position ${position}. Stop was not added.`);
        if (neighbors[0] === null) { // insert stop at the beginning
            this.#stops.unshift(stop);
            return;
        }
        if (neighbors[1] === null) { // insert stop at the end
            this.#stops.push(stop);
            return;
        }
        this.#stops.splice(neighbors[1], 0, stop); // insert stop in the middle
        return;
    }

    /**
     * Replaces a stop with a new color.
     * @param {number} position - The position of the stop to be replaced (0-1).
     * @param {Object} color - The new color of the existing stop.
     * @param {number} color.r - The red component (0-255).
     * @param {number} color.g - The green component (0-255).
     * @param {number} color.b - The blue component (0-255).
     * @param {number} [color.a=1] - The alpha component (0-1, defaults to 1).
     */
    replace(position, color) {
        if (position < 0 || position > 1 || this.#stops.length === 0) throw new RangeError(`No stop with position ${position} was found.`);

        const index = this.getIndex(position);
        if (index === -1) throw new RangeError(`No stop with position ${position} was found.`);
        const stop = this.#stops[index];

        stop.color = {
            r: color.r,
            g: color.g,
            b: color.b,
            a: color.a,
        };
    }

    /**
     * Changes the position of an existing stop and resorts the list.
     * @param {number} position - The position of the stop to be moved (0-1).
     * @param {number} to - The new position of the existing stop (0-1).
     */
    move(position, to) {
        if (position < 0 || position > 1 || this.#stops.length === 0) throw new RangeError(`No stop with position ${position} was found.`);
        if (to < 0 || to > 1) throw new RangeError(`Stop position must be between 0 and 1.`);

        const index = this.getIndex(position);
        if (index === -1) throw new RangeError(`No stop with position ${position} was found.`);
        const stop = this.#stops.splice(index, 1);

        try {
            this.add(to, stop.color);
        } catch (error) {
            if (error.name === 'RangeError') {
                this.#stops.splice(index, 0, stop);
                throw new RangeError(`Stop already exists at position ${to}. Stop was not moved.`);
            }
        }
    }

    /**
     * Removes an existing stop from the list and resorts the list.
     * @param {number} position - The position of the stop to be removed (0-1).
     */
    remove(position) {
        if (position < 0 || position > 1 || this.#stops.length === 0) throw new RangeError(`No stop with position ${position} was found.`);

        const index = this.getIndex(position);
        if (index === -1) throw new RangeError(`No stop with position ${position} was found.`);
        this.#stops.splice(index, 1);
    }

    /**
     * Returns an existing stop.
     * @param {number} index - The index of the desired stop.
     * @returns {{position:number,color:{r:number,g:number,b:number,a:number}}} The stop at the specified index.
     */
    get(index) {
        return this.#stops[index];
    }

    /**
     * Returns the index of an existing stop at a specified position.
     * @param {number} position - The position of the desired stop (0-1).
     * @returns {number} The index of the stop at the specified position (returns -1 if no stop exists).
     */
    getIndex(position) {
        if (position < 0 || position > 1 || this.#stops.length === 0) return -1;
        return this.#getIndexRecursive(position, this.#stops);
    }

    /**
     * Returns the pair of indices on either side of a specified position.
     * @param {number} position - The position to search around (0-1).
     * @returns {[lowerIndex:number|null, upperIndex:number|null]} The index of the first stop located below the specified position and the first stop located above the specified position. If no stop exists either above or below, the corresponding index is null. If a stop exists at the specified point, its index is returned twice.
     */
    getIndexPair(position) {
        if (this.#stops.length === 0) return [null, null];
        if (position < 0) return [null, 0];
        if (position > 1) return [this.#stops.length - 1, null];
        return this.#getIndexPairRecursive(position, this.#stops);
    }

    /**
     * Performs a binary search to get the index of an existing stop at a specified position.
     * @param {number} position - The position of the desired stop (0-1).
     * @param {Array<{position:number}} arr - An array of stops.
     * @param {number} indexOffset 
     * @returns {number} The index of the stop at the specified position (returns -1 if no stop exists).
     */
    #getIndexRecursive(position, arr, indexOffset = 0) {
        if (arr.length === 0) return -1;

        const middle = arr.length >> 1; // half the array, round down
        if (position > arr[middle].position) {
            return this.#getIndexRecursive(
                position,
                arr.slice(middle + 1), // top half, exclude middle
                indexOffset + middle + 1 // fix offset
            );
        }
        if (position < arr[middle].position) {
            return this.#getIndexRecursive(
                position,
                arr.slice(0, middle), // bottom half, exclude middle
                indexOffset + 0
            );
        }
        return indexOffset + middle;
    }

    /**
     * Recursively performs a binary search to get the pair of indices on either side of a specified position.
     * @param {number} position - The position to search around (0-1).
     * @param {Array<{position:number}>} arr - An array of stops.
     * @param {number} indexOffset - The original index of the first value in the array.
     * @returns {[lowerIndex:number|null, upperIndex:number|null]} The index of the first stop located below the specified position and the first stop located above the specified position. If no stop exists either above or below, the corresponding index is null. If a stop exists at the specified point, its index is returned twice. 
     */
    #getIndexPairRecursive(position, arr, indexOffset = 0) {
        if (arr.length === 1) {
            if (position > arr[0].position) return [indexOffset + 0, null];
            if (position < arr[0].position) return [null, indexOffset + 0];
            return [indexOffset + 0, indexOffset + 0];
        }

        if (arr.length === 2) {
            if (position === arr[0].position) return [indexOffset + 0, indexOffset + 0];
            if (position === arr[1].position) return [indexOffset + 1, indexOffset + 1];
            if (position > arr[1].position) return [indexOffset + 1, null];
            if (position < arr[0].position) return [null, indexOffset + 0];
            return [indexOffset + 0, indexOffset + 1];
        }

        const middle = arr.length >> 1; // half the array, round down
        if (position > arr[middle].position) {
            return this.#getIndexPairRecursive(
                position,
                arr.slice(middle), // top half, include middle
                indexOffset + middle // fix offset
            );
        }
        if (position < arr[middle].position) {
            return this.#getIndexPairRecursive(
                position,
                arr.slice(0, middle + 1), // bottom half, include middle
                indexOffset + 0
            );
        }
        return [indexOffset + middle, indexOffset + middle];
    }
}

/**
 * Interpolates between two colors using linear interpolation.
 * @param {Object} color1 - The new color of the existing stop.
 * @param {number} color1.r - The red component (0-255).
 * @param {number} color1.g - The green component (0-255).
 * @param {number} color1.b - The blue component (0-255).
 * @param {number} color1.a - The alpha component (0-1).
 * @param {Object} color2 - The new color of the existing stop.
 * @param {number} color2.r - The red component (0-255).
 * @param {number} color2.g - The green component (0-255).
 * @param {number} color2.b - The blue component (0-255).
 * @param {number} color2.a - The alpha component (0-1).
 * @param {number} factor - The bias to mix each color (0-1, 0 is full {@link color1}, 1 is full {@link color2}).
 * @returns {{r:number,g:number,b:number,a:number}} The interpolated color.
 */
const lerper = (color1, color2, factor) => {
    return {
        r: factor * color2.r + (1 - factor) * color1.r,
        g: factor * color2.g + (1 - factor) * color1.g,
        b: factor * color2.b + (1 - factor) * color1.b,
        a: factor * color2.a + (1 - factor) * color1.a,
    }
}