/**
 * Simplified BitField utility inspired by discord.js
 */

export default class BitField<FLAGS extends string = string> {
	// Raw Bitfield Data
	public bitfield: number;
	public readonly DefaultBit = 0;

	// BitField Flags
	public static Flags: Record<string, number> = {};

	constructor(bits: BitFieldResolvable<FLAGS> = 0) {
		/**
		 * Bitfield of the packed bits
		 * @type {number}
		 */
		this.bitfield = (this.constructor as typeof BitField).resolve(bits);
	}

	add(bit: BitFieldResolvable<FLAGS>): this {
		this.bitfield |= (this.constructor as typeof BitField).resolve(bit);
		return this;
	}

	remove(bit: BitFieldResolvable<FLAGS>): this {
		this.bitfield &= ~(this.constructor as typeof BitField).resolve(bit);
		return this;
	}

	//BitField must have all bits
	has(bit: BitFieldResolvable<FLAGS>): boolean {
		return (
			(this.bitfield & (this.constructor as typeof BitField).resolve(bit)) ===
			(this.constructor as typeof BitField).resolve(bit)
		);
	}

	any(bitsToCheck: BitFieldResolvable<FLAGS>): boolean {
		const bits = (this.constructor as typeof BitField).resolve(bitsToCheck);
		return (this.bitfield & bits) !== this.DefaultBit;
	}

	missing(bitsToCheck: BitFieldResolvable<FLAGS>) {
		return new (this.constructor as typeof BitField)(bitsToCheck)
			.remove(this.bitfield)
			.toArray();
	}

	toArray() {
		return Object.keys((this.constructor as typeof BitField).Flags).filter(
			(bit) => this.has(bit as FLAGS),
		);
	}

	static allFlagsToKeyValueArray() {
		return Object.entries(this.Flags);
	}

	static getHighestIntValue() {
		return Object.values(this.Flags).reduce((prev, curr) => prev | curr, 0);
	}

	equals(bit: BitFieldResolvable<FLAGS>): boolean {
		return this.bitfield === (this.constructor as typeof BitField).resolve(bit);
	}

	toJSON() {
		return this.bitfield;
	}

	valueOf() {
		return this.bitfield;
	}

	//Resolves everything to a number (bitfield)
	static resolve(bit: BitFieldResolvable): number {
		if (Array.isArray(bit)) {
			return bit.map((b) => this.resolve(b)).reduce((prev, b) => prev | b, 0);
		}

		if (bit instanceof BitField) return bit.bitfield;

		if (typeof bit === "string") {
			if (!isNaN(parseInt(bit))) return Number(bit);
			if (this.Flags[bit] !== undefined) return this.Flags[bit];
			else throw new Error("Invalid bitfield flag or number");
		}

		return bit;
	}
}

export type BitFieldResolvable<FLAG extends string = string> =
	| number
	| FLAG
	| BitField<FLAG>
	| BitFieldResolvable<FLAG>[];
