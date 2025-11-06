import { defineStepRegistry } from "../step"
import { Bundle } from "./compile"
import { Dts } from "./dts"

export const N = defineStepRegistry({
    steps: [Bundle, Dts]
})

