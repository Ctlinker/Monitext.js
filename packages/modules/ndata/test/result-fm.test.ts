import { describe, expect, test } from 'vitest';
import { createResult, createResultableFn } from '../src/lib/result-factory';

describe('Result Factory', () => {
	test('createResult - creates success result for non-error values', () => {
		const result = createResult(42);
		expect(result.value).toBe(42);
		expect(result.error).toBeUndefined();
	});

	test('createResult - creates failure result for Error instances', () => {
		const error = new Error('test error');
		const result = createResult(error);
		expect(result.value).toBeUndefined();
		expect(result.error).toBe(error);
	});

	describe('createResultableFn - Synchronous', () => {
		test('should wrap successful function execution', async () => {
			const add = createResultableFn((a: number, b: number) => a + b) as any;
			const result = await add(2, 3);
			expect(result.value).toBe(5);
			expect(result.error).toBeUndefined();
		});

		test('should catch and wrap thrown errors', async () => {
			const throwingFn = createResultableFn(() => {
				throw new Error('test error');
			}) as any;
			const result = await throwingFn();
			expect(result.value).toBeUndefined();
			expect(
				result.error instanceof Error
					? result.error.message
					: String(result.error),
			).toBe('test error');
		});

		test('should handle multiple arguments', async () => {
			const concat = createResultableFn((...args: string[]) =>
				args.join(''),
			) as any;
			const result = await concat('a', 'b', 'c');
			expect(result.value).toBe('abc');
			expect(result.error).toBeUndefined();
		});

		test('should preserve function return type', async () => {
			interface TestType {
				id: number;
				name: string;
			}
			const createObject = createResultableFn(
				(id: number): TestType => ({
					id,
					name: `Test ${id}`,
				}),
			) as any;
			const result = await createObject(1);
			expect(result.value).toEqual({ id: 1, name: 'Test 1' });
			expect(result.error).toBeUndefined();
		});
	});

	describe('createResultableFn - Asynchronous', () => {
		test('should wrap successful async function execution', async () => {
			const asyncAdd = createResultableFn(async (a: number, b: number) => {
				return a + b;
			});
			const result = await asyncAdd(2, 3);
			expect(result.value).toBe(5);
			expect(result.error).toBeUndefined();
		});

		test('should catch and wrap async errors', async () => {
			const asyncThrowingFn = createResultableFn(async () => {
				throw new Error('async error');
			});
			const result = await asyncThrowingFn();
			expect(result.value).toBeUndefined();
			expect(
				result.error instanceof Error
					? result.error.message
					: String(result.error),
			).toBe('async error');
		});

		test('should handle rejected promises', async () => {
			const rejectingFn = createResultableFn(async () => {
				return Promise.reject(new Error('rejection error'));
			});
			const result = await rejectingFn();
			expect(result.value).toBeUndefined();
			expect(
				result.error instanceof Error
					? result.error.message
					: String(result.error),
			).toBe('rejection error');
		});

		test('should handle async functions with complex return types', async () => {
			type Payload = { data: { id: number; name: string } };
			const mockApi = createResultableFn(
				async (id: number): Promise<Payload> => {
					return Promise.resolve({ data: { id, name: `name-${id}` } });
				},
			);
			const result = await mockApi(1);
			expect(result.value).toEqual({ data: { id: 1, name: 'name-1' } });
			expect(result.error).toBeUndefined();
		});

		test('should maintain promise chain error handling', async () => {
			const chainedFn = createResultableFn(async () => {
				return Promise.resolve(42).then(() => {
					throw new Error('chain error');
				});
			});

			const result = await chainedFn();
			expect(result.value).toBeUndefined();
			expect(
				result.error instanceof Error
					? result.error.message
					: String(result.error),
			).toBe('chain error');
		});
	});

	describe('Edge cases', () => {
		test('should handle undefined returns', async () => {
			const returnUndefined = createResultableFn(() => undefined) as any;
			const result = await returnUndefined();
			expect(result.value).toBeUndefined();
			expect(result.error).toBeUndefined();
		});

		test('should handle null returns', async () => {
			const returnNull = createResultableFn(() => null) as any;
			const result = await returnNull();
			expect(result.value).toBeNull();
			expect(result.error).toBeUndefined();
		});

		test('should handle empty parameter lists', async () => {
			const noParams = createResultableFn(() => 'success') as any;
			const result = await noParams();
			expect(result.value).toBe('success');
			expect(result.error).toBeUndefined();
		});

		test('should handle optional parameters', async () => {
			const optionalParam = createResultableFn(
				(a: number, b?: number) => a + (b ?? 0),
			) as any;
			const result1 = await optionalParam(5);
			const result2 = await optionalParam(5, 3);
			expect(result1.value).toBe(5);
			expect(result2.value).toBe(8);
		});
	});
});
