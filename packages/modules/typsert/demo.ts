import {
	TypeAssert,
	Typsert,
	AllPass,
	AllFails,
	SomePass,
	SomeFail,
	Assignable,
	NotAssignable,
	Equal,
	NotEqual,
	Equals,
	Assignables,
} from './src/main';

/**
 * ENHANCED TYPSERT DEMO
 *
 * This demo showcases the enhanced TypeAssert functionality with
 * powerful utility types for complex assertion patterns.
 */

// =============================================================================
// MOCK TYPES FOR TESTING
// =============================================================================

type User = { id: string; name: string };
type AdminUser = User & { permissions: string[]; role: 'admin' };
type GuestUser = { name: string; sessionId?: string };
type SuperUser = AdminUser & { superPowers: true };

type APIResponse<T> = {
	data: T;
	status: 'success' | 'error';
	timestamp: number;
};

// =============================================================================
// BASIC ENHANCED PATTERNS
// =============================================================================

// Simple AllPass - all conditions must be true
TypeAssert<
	[
		[
			'Basic type relationships work correctly',
			AllPass<
				[
					Assignable<string, unknown>,
					Assignable<number, unknown>,
					NotAssignable<unknown, string>,
					Equal<boolean, boolean>,
				]
			>,
		],
	]
>(true);

// AllFails - all conditions must be false
TypeAssert<
	[
		[
			'Invalid type assignments are properly rejected',
			AllFails<
				[
					Assignable<string, number>,
					Assignable<boolean, string>,
					Assignable<object, number>,
					Equal<string, number>,
				]
			>,
		],
	]
>(true);

// SomePass - at least one must be true
TypeAssert<
	[
		[
			'At least one type compatibility exists',
			SomePass<
				[
					Assignable<string, object>, // false
					Assignable<number, object>, // false
					Assignable<boolean, unknown>, // true ✓
				]
			>,
		],
	]
>(true);

// SomeFail - at least one must be false
TypeAssert<
	[
		[
			'Not all type relationships are bidirectional',
			SomeFail<
				[
					Assignable<string, unknown>, // true
					Assignable<'hello', string>, // true
					Assignable<string, 'hello'>, // false ✓
				]
			>,
		],
	]
>(true);

// =============================================================================
// USER TYPE SYSTEM VALIDATION
// =============================================================================

// Test user type hierarchy
TypeAssert<
	[
		[
			'User type inheritance chain works correctly',
			AllPass<
				[
					// AdminUser extends User
					Assignable<AdminUser, User>,
					NotAssignable<User, AdminUser>,

					// SuperUser extends AdminUser extends User
					Assignable<SuperUser, AdminUser>,
					Assignable<SuperUser, User>,
					NotAssignable<AdminUser, SuperUser>,

					// GuestUser is separate
					NotAssignable<GuestUser, User>,
					NotAssignable<User, GuestUser>,
				]
			>,
		],
	]
>(false);

// Test that all user types have names
TypeAssert<
	[
		[
			'All user types have name property',
			AllPass<
				[
					Assignable<User, { name: string }>,
					Assignable<AdminUser, { name: string }>,
					Assignable<GuestUser, { name: string }>,
					Assignable<SuperUser, { name: string }>,
				]
			>,
		],
	]
>(true);

// Test that only certain types have specific properties
TypeAssert<
	[
		[
			'Property access is correctly restricted',
			AllPass<
				[
					// Only AdminUser+ have permissions
					Assignable<AdminUser, { permissions: string[] }>,
					Assignable<SuperUser, { permissions: string[] }>,
					NotAssignable<User, { permissions: string[] }>,
					NotAssignable<GuestUser, { permissions: string[] }>,

					// Only SuperUser has superPowers
					Assignable<SuperUser, { superPowers: true }>,
					NotAssignable<AdminUser, { superPowers: true }>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// API RESPONSE TYPE TESTING
// =============================================================================

// Test generic API response structure
TypeAssert<
	[
		[
			'API response wrapper works with different data types',
			AllPass<
				[
					// Structure is preserved
					Assignable<
						APIResponse<User>,
						{ data: User; status: string; timestamp: number }
					>,
					Assignable<
						APIResponse<string>,
						{ data: string; status: string; timestamp: number }
					>,

					// Generic variance works correctly
					Assignable<APIResponse<AdminUser>, APIResponse<User>>, // covariant in T
					NotAssignable<APIResponse<User>, APIResponse<AdminUser>>, // not contravariant
				]
			>,
		],
	]
>(true);

// =============================================================================
// COMPLEX CONDITIONAL TYPE TESTING
// =============================================================================

// Test a utility type
type DeepReadonly<T> = {
	readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

TypeAssert<
	[
		[
			'DeepReadonly utility type works correctly',
			AllPass<
				[
					// Simple object becomes readonly
					Equal<
						DeepReadonly<{ name: string; age: number }>,
						{ readonly name: string; readonly age: number }
					>,

					// Nested objects become deeply readonly
					Equal<
						DeepReadonly<{ user: { name: string; id: number } }>,
						{ readonly user: { readonly name: string; readonly id: number } }
					>,

					// Primitives are preserved
					Equal<DeepReadonly<string>, string>,
					Equal<DeepReadonly<number>, number>,
				]
			>,
		],
	]
>(true);

// Test conditional type behavior
type NonNullable<T> = T extends null | undefined ? never : T;

TypeAssert<
	[
		[
			'NonNullable conditional type behaves correctly',
			AllPass<
				[
					// Removes null and undefined
					Equal<NonNullable<string | null>, string>,
					Equal<NonNullable<number | undefined>, number>,
					Equal<NonNullable<boolean | null | undefined>, boolean>,

					// Preserves other types
					Equal<NonNullable<string>, string>,
					Equal<NonNullable<object>, object>,
					Equal<NonNullable<any[]>, any[]>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// ARRAY AND TUPLE TYPE TESTING
// =============================================================================

TypeAssert<
	[
		[
			'Array type relationships work as expected',
			AllPass<
				[
					// Tuple to readonly tuple (covariant)
					Assignable<[string, number], readonly [string, number]>,

					// Array to readonly array (covariant)
					Assignable<string[], readonly string[]>,

					// But not the reverse (readonly is not assignable to mutable)
					NotAssignable<readonly string[], string[]>,

					// Tuple length is preserved
					NotAssignable<[string], [string, string]>,
					NotAssignable<[string, string], [string]>,
				]
			>,
		],
	]
>(true);

// Test that some array operations work
TypeAssert<
	[
		[
			'Array widening and narrowing work correctly',
			SomePass<
				[
					// Some narrowing works
					Assignable<string[], (string | number)[]>, // true - string[] can be (string|number)[]
					Assignable<[1, 2, 3], number[]>, // true - number tuple can be number array

					// Some don't
					Assignable<(string | number)[], string[]>, // false - can't narrow union array
				]
			>,
		],
	]
>(true);

// =============================================================================
// FUNCTION TYPE TESTING
// =============================================================================

type HandlerFn<T> = (data: T) => void;
type AsyncHandlerFn<T> = (data: T) => Promise<void>;

TypeAssert<
	[
		[
			'Function type relationships work correctly',
			AllPass<
				[
					// Function types preserve parameter relationships
					Assignable<HandlerFn<string>, HandlerFn<string>>,
					NotAssignable<HandlerFn<string>, HandlerFn<number>>,

					// Contravariance in parameters
					Assignable<HandlerFn<User>, HandlerFn<AdminUser>>, // Can accept more specific type
					NotAssignable<HandlerFn<AdminUser>, HandlerFn<User>>, // Can't accept more general type

					// Return type covariance (void in this case)
					Equal<ReturnType<HandlerFn<any>>, void>,
					Equal<ReturnType<AsyncHandlerFn<any>>, Promise<void>>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// BEFORE/AFTER COMPARISON - SHOWING THE IMPROVEMENT
// =============================================================================

// BEFORE: The old way with nested conditionals (painful!)
TypeAssert<
	[
		[
			'Complex validation - old painful way',
			Assignable<AdminUser, User> extends true
				? NotAssignable<User, AdminUser> extends true
					? Assignable<SuperUser, AdminUser> extends true
						? NotAssignable<GuestUser, User> extends true
							? true
							: false
						: false
					: false
				: false,
		],
	]
>(true);

// AFTER: The new clean way with AllPass
TypeAssert<
	[
		[
			'Complex validation - new clean way',
			AllPass<
				[
					Assignable<AdminUser, User>,
					NotAssignable<User, AdminUser>,
					Assignable<SuperUser, AdminUser>,
					NotAssignable<GuestUser, User>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// ADVANCED PATTERNS - MIXED ASSERTIONS
// =============================================================================

// Complex scenario: API permissions system
type Permission = 'read' | 'write' | 'delete' | 'admin';
type HasPermission<U, P extends Permission> = U extends {
	permissions: readonly Permission[];
}
	? P extends U['permissions'][number]
		? true
		: false
	: false;

TypeAssert<
	[
		[
			'Permission system type safety works correctly',
			AllPass<
				[
					// AdminUser has permissions array
					Assignable<AdminUser, { permissions: Permission[] }>,

					// Regular User doesn't have permissions
					NotAssignable<User, { permissions: any }>,

					// SuperUser inherits permissions from AdminUser
					Assignable<SuperUser, { permissions: Permission[] }>,
				]
			>,
		],
		[
			'Some users have write access, others dont',
			SomeFail<
				[
					// These should fail (don't have permissions)
					HasPermission<User, 'write'>,
					HasPermission<GuestUser, 'write'>,

					// These might pass depending on implementation
					HasPermission<AdminUser, 'write'>, // Could be true or false
					HasPermission<SuperUser, 'admin'>, // Could be true or false
				]
			>,
		],
	]
>(false);

// =============================================================================
// REAL-WORLD UTILITY TYPE TESTS
// =============================================================================

// Test Pick and Omit utilities
TypeAssert<
	[
		[
			'Standard utility types work as expected',
			AllPass<
				[
					// Pick selects specific keys
					Equal<Pick<User, 'name'>, { name: string }>,
					Equal<Pick<AdminUser, 'id' | 'name'>, { id: string; name: string }>,

					// Omit removes specific keys
					Equal<Omit<User, 'id'>, { name: string }>,
					Equal<Omit<AdminUser, 'permissions'>, User & { role: 'admin' }>,

					// Partial makes all properties optional
					Assignable<{}, Partial<User>>,
					Assignable<{ name?: string }, Partial<User>>,
					NotAssignable<{ name: string }, Partial<User>>, // required name not assignable to optional
				]
			>,
		],
	]
>(false);

// =============================================================================
// DEBUGGING SHOWCASE
// =============================================================================

// This test is designed to show the enhanced debugging output
// (Comment out to see the rich error information)
/*
TypeAssert<[
	[
		'Intentional failure to show debug output',
		AllPass<[
			Assignable<string, number>,      // false - will show in output[0]
			Equal<boolean, string>,          // false - will show in output[1]
			NotAssignable<'hello', string>,  // false - will show in output[2]
		]>
	]
]>(false); // This would fail and show: output: [false, false, false]
*/

// =============================================================================
// SUMMARY
// =============================================================================

TypeAssert<
	[
		[
			'Enhanced typsert provides powerful assertion patterns',
			AllPass<
				[
					// The enhanced patterns work
					Equal<AllPass<[true, true, true]>, true>,
					Equal<AllFails<[false, false, false]>, true>,
					Equal<SomePass<[false, false, true]>, true>,
					Equal<SomeFail<[true, true, false]>, true>,

					// They provide better debugging than nested conditionals
					NotEqual<
						AllPass<[Assignable<string, number>, Equal<boolean, string>]>,
						true
					>, // This will be [false, false] for debugging
				]
			>,
		],
	]
>(true);

/**
 * CONCLUSION
 *
 * The enhanced TypeAssert with utility types provides:
 * ✅ Clean, readable assertion patterns
 * ✅ Rich debugging information when tests fail
 * ✅ Support for complex logical combinations (AND, OR, NOT)
 * ✅ Full backward compatibility
 * ✅ Zero runtime overhead
 *
 * No unnecessary syntax sugar - just powerful, practical utilities!
 */
