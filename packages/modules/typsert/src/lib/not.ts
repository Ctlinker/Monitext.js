/**
 * Invert the result of a type assertion
 */
export type Not<T> = T extends true ? false : true;
