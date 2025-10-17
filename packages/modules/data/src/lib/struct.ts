import { PrimitiveArray, PrimitiveObject } from "./data-types";

export class Struct<const D> {
    constructor(private d: D) {
    }
}

export class PrimitiveStruct<const D extends PrimitiveObject | PrimitiveArray>
    extends Struct<D> {
    constructor(d: D) {
        super(d);
    }
}
