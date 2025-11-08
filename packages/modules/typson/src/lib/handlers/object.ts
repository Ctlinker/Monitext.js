import { JSONSchema } from "../schema";
import { ToType } from "../to-types";

/**
 * Handles a JSON Schema object type.
 */
export type HandleObject<S> = S extends {
	type: "object";
	properties: infer P extends Record<string, JSONSchema>;
} ? CreateObjFromConstraint<S, P>
	: never;

/**
 * Constructs a TypeScript object type from a JSON Schema object definition.
 * - Required properties are enforced.
 * - Optional properties are marked optional.
 */
type CreateObjFromConstraint<
	Source extends { properties: any },
	Props extends Record<string, JSONSchema>,
> = Source extends { required: readonly string[] } ?
		& {
			// optional props (those not listed in "required")
			[K in Exclude<keyof Props, Source["required"][number]>]?:
				ToType<
					Props[K]
				>;
		}
		& {
			// required props
			[K in Extract<keyof Props, Source["required"][number]>]:
				ToType<
					Props[K]
				>;
		}
	: {
		// no "required": everything optional
		[K in keyof Props]?: ToType<Props[K]>;
	};
