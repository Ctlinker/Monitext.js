import { ExtendedSchema, OneOfSchema, StringFormat } from "./schema";

export namespace T {
  
  type NonNullableIfPossible<S> = NonNullable<S> extends never
    ? S
    : NonNullable<S>;

  export function string<
    const Enum extends readonly string[],
    const Description extends string | undefined = undefined,
    const Format extends StringFormat | undefined = undefined
  >(param?: { enum?: [...Enum]; description?: Description; format?: Format }) {
    const result = {
      type: "string" as const,
      enum: (param?.enum ?? []) as [...Enum],
      format: param?.format as NonNullableIfPossible<Format>,
      description: param?.description as NonNullableIfPossible<Description>,
    };

    return result as { [K in keyof typeof result]: (typeof result)[K] };
  }

  export function number<
    const Enum extends readonly number[],
    const Description extends string | undefined = undefined
  >(param?: { enum?: [...Enum]; description?: Description }) {
    const result = {
      type: "number" as const,
      enum: (param?.enum ?? []) as [...Enum],
      description: param?.description as NonNullableIfPossible<Description>,
    };

    return result as { [K in keyof typeof result]: (typeof result)[K] };
  }

  export function boolean<
    const Enum extends readonly boolean[],
    const Description extends string | undefined = undefined
  >(param?: { enum?: [...Enum]; description?: Description }) {
    const result = {
      type: "boolean" as const,
      enum: (param?.enum ?? []) as [...Enum],
      description: param?.description as NonNullableIfPossible<Description>,
    };

    return result as { [K in keyof typeof result]: (typeof result)[K] };
  }

  export function object<
    const Props extends { [k: string]: ExtendedSchema },
    const Requirable extends [...(keyof Props)[]] | undefined = undefined,
    const AddProps extends boolean | undefined = undefined,
    const Description extends string | undefined = undefined
  >(
    properties: Props,
    params?: {
      required?: Requirable;
      description?: Description;
      additionalProperties?: AddProps;
    }
  ) {
    const result = {
      type: "object" as const,
      properties,
      required: (params?.required ?? []) as Requirable,
      description: params?.description as NonNullableIfPossible<Description>,
      additionalProperties: params?.additionalProperties as NonNullableIfPossible<AddProps>
    };

    return result as { [K in keyof typeof result]: (typeof result)[K] };
  }

  export function literals<
    const Enum extends [...(string | number | boolean | null)[]],
    const Description extends string | undefined = undefined
  >(literals: [...Enum], params?: { description?: Description }){
    const result = {
      enum: literals,
      description: params?.description as NonNullableIfPossible<Description>,
    }

    return result
  }

  export function literal<
    const Enum extends [string | number | boolean | null],
    const Description extends string | undefined = undefined
  >(literals: Enum, params?: { description?: Description }){
    const result = {
      enum: literals,
      description: params?.description as NonNullableIfPossible<Description>,
    }

    return result
  }

  export function union<
    const Enum extends [...(Exclude<ExtendedSchema, OneOfSchema>)[]],
    const Description extends string | undefined = undefined
  >(oneOf: [...Enum], params?: { description?: Description }){
    const result = {
      oneOf,
      description: params?.description as NonNullableIfPossible<Description>,
    }

    return result
  }

  export function intersection<
    const Enum extends [...(ExtendedSchema)[]],
    const Description extends string | undefined = undefined
  >(allOf: [...Enum], params?: { description?: Description }){
    const result = {
      allOf,
      description: params?.description as NonNullableIfPossible<Description>,
    }

    return result
  }
}

const S = T.string({ description: "some string", enum: ["string", "test"] });

const N = T.number({ description: "some num", enum: [1, 2] });

const B = T.boolean({ description: "some bool" });

const O = T.object({
  test: T.string({ description: "test"}),
  test2: T.number()
}, { required: ["test"] })

const O2 = T.object({
  test: T.string({ description: "test"}),
  test2: T.number()
})

const E = T.literals([1, 3, "test", "go"])

const O3 = T.union([
  T.string({ description: "test"}),
  T.number()
])

const O4 = T.intersection([
  T.string({ description: "test"}),
  T.number()
])