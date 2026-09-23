/** `true` when `A` and `B` hold the same members, `false` otherwise. */
export type SameMembers<A, B> = [A] extends [B]
	? [B] extends [A]
		? true
		: false
	: false;

/** Fails the type check unless `T` is `true`. */
export type Assert<T extends true> = T;
