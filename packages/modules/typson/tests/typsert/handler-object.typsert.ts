import { HandleObject, HandleSchema } from '../../src/main';

import {
	Assignables,
	Equal,
	NotAssignables,
	TypeAssert,
} from '@monitext/typsert';

type T0 = {
	type: 'object';
	properties: {
		pass: { type: 'boolean' };
		fail: { type: 'boolean' };
	};
};

TypeAssert<
	[
		[
			"Object's handler & schema handler should not differ",
			Equal<HandleSchema<T0>, HandleObject<T0>>,
		],
		[
			'Object should be properly handled',
			Assignables<
				[{ fail: false }, { pass: true }, { pass: false; fail: true }],
				HandleSchema<T0>
			>,
		],
		[
			'Object should not allow additional props properly handled',
			Assignables<
				[{ fail: false }, { pass: true }, { pass: false; fail: true }],
				HandleSchema<T0>
			>,
		],
		[
			'Object should allow additional props as long that they match the shape enough',
			Assignables<
				[
					{ fail: true; test: 'pass' },
					{ pass: true; test: 'pass' },
					{ pass: true; fail: true; test: 'pass' },
				],
				HandleSchema<T0>
			>,
		],
		[
			'Object should allow not additional props if they do not match the shape enough',
			NotAssignables<
				[
					{ test: 'pass' },
					{ fail: ''; test: 'pass' },
					{ pass: ''; test: 'pass' },
					{ pass: ''; fail: ''; test: 'pass' },
				],
				HandleSchema<T0>
			>,
		],
	]
>(true);

type T1 = {
	type: 'object';
	properties: {
		pass: { type: 'boolean' };
		fail: { type: 'boolean' };
	};
	required: ['pass'];
};

TypeAssert<
	[
		[
			'Object should properly reflect required keys',
			Assignables<
				[
					{ pass: true },
					{ pass: true; fail: true },
					{ pass: true; fail: true; test: 'pass' },
				],
				HandleSchema<T1>
			>,
		],
		[
			'Object should properly reject when required keys absent',
			NotAssignables<
				[{ fail: true }, { fail: true; test: 'pass' }],
				HandleSchema<T1>
			>,
		],
	]
>(true);
