import {
	HandleBoolean,
	HandleEnum,
	HandleNull,
	HandleNumber,
	HandleSchema,
	HandleString,
} from '../../src/main';

import { Equals, TypeAssert } from '@monitext/typsert';

TypeAssert<
	[
		[
			'Null should be property handled',
			Equals<
				[null, HandleSchema<{ type: 'null' }>, HandleNull<{ type: 'null' }>]
			>,
		],
	]
>(true);

TypeAssert<
	[
		[
			'Enum should be property handled',
			Equals<
				[
					'test' | 2 | true | null,
					HandleSchema<{ enum: ['test', true, 2, null] }>,
					HandleEnum<{ enum: ['test', true, 2, null] }>,
				]
			>,
		],
	]
>(true);

TypeAssert<
	[
		[
			'String should be property handled',
			Equals<
				[
					string,
					HandleSchema<{ type: 'string' }>,
					HandleString<{ type: 'string' }>,
				]
			>,
		],
		[
			'String should be property enumerated',
			Equals<
				[
					'some-string' | 'another-str',
					HandleSchema<{
						type: 'string';
						enum: ['some-string', 'another-str'];
					}>,
					HandleString<{
						type: 'string';
						enum: ['some-string', 'another-str'];
					}>,
				]
			>,
		],
	]
>(true);

TypeAssert<
	[
		[
			'Number should be property handled',
			Equals<
				[
					number,
					HandleSchema<{ type: 'number' }>,
					HandleNumber<{ type: 'number' }>,
				]
			>,
		],
		[
			'Number should be property enumerated',
			Equals<
				[
					1 | 2 | 3,
					HandleSchema<{ type: 'number'; enum: [1, 2, 3] }>,
					HandleNumber<{ type: 'number'; enum: [1, 2, 3] }>,
				]
			>,
		],
	]
>(true);

TypeAssert<
	[
		[
			'Boolean should be property handled',
			Equals<
				[
					boolean,
					HandleSchema<{ type: 'boolean' }>,
					HandleBoolean<{ type: 'boolean' }>,
				]
			>,
		],
		[
			'Boolean should be property enumerated',
			Equals<
				[
					true,
					HandleSchema<{ type: 'boolean'; enum: [true] }>,
					HandleBoolean<{ type: 'boolean'; enum: [true] }>,
				]
			>,
		],
		[
			'Boolean should properly be enumerated on both true & false',
			Equals<
				[
					boolean,
					HandleSchema<{ type: 'boolean'; enum: [true, false] }>,
					HandleBoolean<{ type: 'boolean'; enum: [true, false] }>,
				]
			>,
		],
	]
>(true);
