export type Pass = "✅";
export type Fail<Desc extends string> = `❌ ${Desc}`;

// AllPass takes a tuple of boolean types
export type AllPass<T extends readonly any[]> =
  T extends [infer Head, ...infer Rest]
    ? Head extends true
      ? AllPass<Rest>   // continue checking rest
      : false           // first failure stops here
    : true;             // empty array => all passed


export declare function TypeAssert<Desc extends string, Cases extends any[]>():
  AllPass<Cases> extends true ? Pass : Fail<Desc>;
