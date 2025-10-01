# Claude Test Suite for @monitext/typsert

This directory contains a comprehensive type-testing suite for `@monitext/typsert`, designed to verify that the type-level testing utilities provided by the library behave correctly and reliably.

## Purpose

The goal of this test suite is to ensure that the type-testing infrastructure of `@monitext/typsert` itself works as expected. This is a meta-testing approach where we test the testing tools to build confidence in their correctness.

## Test Structure

### Test Files Overview

| File | Purpose | Key Areas |
|------|---------|-----------|
| `assignable.test.ts` | Tests `Assignable`, `NotAssignable`, `Assignables`, `NotAssignables` utilities | Type assignability relationships, array operations, complex generic types |
| `equal.test.ts` | Tests `Equal`, `NotEqual`, `Equals`, `NotEquals` utilities | Strict type equality, tuple operations, structural comparisons |
| `assert.test.ts` | Tests `Assert`, `AllPass`, `AllFails`, `SomePass`, `SomeFail`, `CheckAssertions`, `TypeAssert`, `Typsert` | Assertion infrastructure, batch testing, runtime integration |
| `not.test.ts` | Tests `Not` utility | Boolean negation, integration with other utilities, edge cases |
| `integration.test.ts` | Comprehensive integration tests combining all utilities | Real-world scenarios, complex type relationships, performance testing |

### Testing Approach

All tests use the `IsTrue<T>` and `IsFalse<T>` utilities from `test/TEST-UTILS.ts` to verify type-level assertions. These utilities:

- `IsTrue<T>` - Ensures that `T` extends `true`
- `IsFalse<T>` - Ensures that `T` extends `false`

## Test Categories

### 1. Basic Functionality Tests
- Primitive type operations
- Literal type handling
- Special type behaviors (`never`, `any`, `unknown`, `void`)

### 2. Object and Complex Type Tests
- Structural type relationships
- Generic type operations
- Union and intersection types
- Optional and readonly properties

### 3. Advanced Type System Features
- Conditional types
- Mapped types
- Template literal types
- Recursive types
- Index access types

### 4. Array and Tuple Operations
- Homogeneous array testing
- Heterogeneous array validation
- Tuple equality and assignability
- Empty array edge cases

### 5. Function Type Compatibility
- Parameter type variance
- Return type relationships
- Generic function types
- Overloaded function signatures

### 6. Real-World Integration Scenarios
- API response validation
- Database entity relationships
- Event system type safety
- Complex utility type composition

### 7. Edge Cases and Error Conditions
- Boundary conditions
- Type system limitations
- Performance considerations
- Nested operations

## Key Test Patterns

### Assignability vs Equality
```typescript
// These should pass
IsTrue<Assignable<"hello", string>>;  // Literals assignable to base types
IsFalse<Equal<"hello", string>>;      // But not equal to them

// Structural typing
IsTrue<Assignable<AdminUser, User>>;  // More specific assignable to less specific
IsFalse<Equal<AdminUser, User>>;      // But they're not equal types
```

### Boolean Logic with Not
```typescript
// Basic negation
IsTrue<Not<false>>;
IsFalse<Not<true>>;

// Integration with other utilities
IsTrue<Not<Equal<string, number>>>;   // Negating failed equality
IsFalse<Not<Assignable<string, string>>>; // Negating successful assignability
```

### Batch Operations
```typescript
// All operations
IsTrue<AllPass<[true, true, true]>>;
IsFalse<AllPass<[true, false, true]>>;

// Some operations  
IsTrue<SomePass<[false, true, false]>>;
IsFalse<SomePass<[false, false, false]>>;
```

### Comprehensive Assertions
```typescript
type MyTests = Assert<[
  ["strings are equal", Equal<string, string>],
  ["numbers assignable to any", Assignable<number, any>],
  ["literals not equal to base", NotEqual<"hello", string>]
]>;

IsTrue<MyTests>; // All assertions pass
```

## Running the Tests

Since these are type-level tests, they are validated at compile time by TypeScript. To run the tests:

1. **Via TypeScript Compiler:**
   ```bash
   npx tsc --noEmit claude-test/*.ts
   ```

2. **Via IDE Integration:**
   - Open any test file in VS Code or similar TypeScript-aware editor
   - Type errors will appear for failing assertions
   - Hover over type expressions to see resolved types

3. **Via Build Process:**
   - Tests are automatically validated when the project is built
   - Failed type assertions will cause compilation errors

## Test Validation

### Successful Tests
- ✅ `IsTrue<SomeValidTypeAssertion>` - No TypeScript errors
- ✅ `IsFalse<SomeInvalidTypeAssertion>` - No TypeScript errors

### Failed Tests
- ❌ `IsTrue<SomeInvalidTypeAssertion>` - TypeScript error: `Argument of type 'false' is not assignable to parameter of type 'true'`
- ❌ `IsFalse<SomeValidTypeAssertion>` - TypeScript error: `Argument of type 'true' is not assignable to parameter of type 'false'`

## Coverage Areas

### Core Type System Features
- [x] Type assignability relationships
- [x] Strict type equality comparisons  
- [x] Boolean logic operations
- [x] Assertion infrastructure
- [x] Batch testing utilities

### Advanced Type Operations
- [x] Generic type manipulation
- [x] Conditional type evaluation
- [x] Mapped type transformations
- [x] Template literal operations
- [x] Recursive type definitions

### Real-World Scenarios
- [x] API response validation
- [x] Database entity modeling
- [x] Event system type safety
- [x] Complex utility compositions
- [x] Performance and scalability

### Edge Cases
- [x] Empty collections
- [x] Null and undefined handling
- [x] Never and any type behaviors
- [x] Deeply nested operations
- [x] Self-referencing types

## Performance Considerations

The test suite includes performance and scalability tests to ensure that:

1. **Large Type Operations** - Complex unions and intersections are handled efficiently
2. **Deep Nesting** - Recursive type operations don't cause stack overflow
3. **Batch Processing** - Many simultaneous assertions complete successfully
4. **Memory Usage** - Type checking doesn't consume excessive compiler resources

## Contributing

When adding new tests:

1. **Follow Naming Conventions** - Use descriptive test names that explain what's being verified
2. **Group Related Tests** - Organize tests by functionality area
3. **Include Edge Cases** - Test boundary conditions and error scenarios  
4. **Add Documentation** - Comment complex type operations for clarity
5. **Verify Both Success and Failure** - Test that utilities correctly identify both passing and failing conditions

## Integration with CI/CD

These type-level tests integrate seamlessly with continuous integration:

```yaml
# Example CI configuration
- name: Run Type Tests
  run: |
    npx tsc --noEmit packages/modules/typsert/claude-test/*.ts
    echo "All type-level assertions passed!"
```

## Conclusion

This test suite provides comprehensive coverage of `@monitext/typsert`'s type-level testing capabilities, ensuring that developers can rely on these utilities for robust TypeScript type validation in their own projects.