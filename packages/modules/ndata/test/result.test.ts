import { describe, expect, test } from 'vitest';
import { Result } from '../src/lib/result';

describe('Result', () => {
	test('ok creates a success result with provided value', () => {
		const r = Result.ok(42);
		expect(r.value).toBe(42);
		expect(r.error).toBeUndefined();
		expect(r).toBeInstanceOf(Result);
	});

	test('fail creates a failure result with provided error', () => {
		const err = new Error('something went wrong');
		const r = Result.fail(err);
		expect(r.value).toBeUndefined();
		expect(r.error).toBe(err);
		expect(r).toBeInstanceOf(Result);
	});

	test('ok with undefined should still be a success (error undefined)', () => {
		const r = Result.ok(undefined);
		expect(r.value).toBeUndefined();
		expect(r.error).toBeUndefined();
	});
});

describe('PrimitiveResult', () => {
	test('ok creates a primitive success result', () => {
		const r = Result.primitives.ok('hello');
		expect(r.value).toBe('hello');
		expect(r.error).toBeUndefined();
		expect(r).toBeInstanceOf(Result.primitives);
	});

	test('fail creates a primitive failure result', () => {
		const err = new Error('primitive-fail');
		const r = Result.primitives.fail(err);
		expect(r.value).toBeUndefined();
		expect(r.error).toBe(err);
		expect(r).toBeInstanceOf(Result.primitives);
	});

	test('ok accepts primitive objects/arrays', () => {
		const arr = [1, 'two', true];
		const obj = { a: 1, b: 'two' };
		const r1 = Result.primitives.ok(arr as any);
		const r2 = Result.primitives.ok(obj as any);

		expect(r1.value).toEqual(arr);
		expect(r1.error).toBeUndefined();

		expect(r2.value).toEqual(obj);
		expect(r2.error).toBeUndefined();
	});
});
