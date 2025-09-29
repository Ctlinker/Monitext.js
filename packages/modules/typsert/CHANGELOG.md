# @monitext/typsert

## 0.1.0

### Minor Changes

🚀 First upgrade to @monitext/typsert

New assertion patterns (AllPass, AllFails, SomePass, SomeFail) to replace messy
nested conditionals with clean, readable types.

Much richer debugging output: instead of just true/false, you now get arrays or
mapped results showing exactly where assertions passed or failed.

TypeAssert got smarter: stricter parameters, better inference, and actual
results included in the output.

README was rewritten from scratch with real-world examples, best practices, and
a migration guide.

Still zero runtime cost — all improvements are compile-time only, with cleaner
types that also boost IDE performance.

🔑 Backwards compatible: everything from v0.0.1 still works, you just get more
power and clarity when you need it.

## 0.0.1

### Patch Changes

🛠 Fixed Not type operator to behave correctly in deep type transformations:

Previously, NotEquals (and similar) could incorrectly consider a value true even
when its counterpart was itself true as well.

Now each positive assertion (Assignables, Equals, Equal, Assignable) has a
mirrored negative test to guarantee proper inversion.

Ensures Not<T> always flips the assertion result (true ↔ false) reliably and
limit it's use to bare minimum.
