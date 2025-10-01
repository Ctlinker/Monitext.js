# Usage Guide for @monitext/typsert Claude Test Suite

This document provides comprehensive instructions for using the Claude Test Suite to validate the type-level functionality of `@monitext/typsert`.

## Quick Start

### Running All Tests

```bash
# Navigate to the typsert directory
cd packages/modules/typsert

# Run all tests using TypeScript compiler
npx tsc --noEmit claude-test/index.ts

# Or run individual test files
npx tsc --noEmit claude-test/assignable.test.ts
npx tsc --noEmit claude-test/equal.test.ts
npx tsc --noEmit claude-test/assert.test.ts
npx tsc --noEmit claude-test/not.test.ts
npx tsc --noEmit claude-test/integration.test.ts
```

### Using the Test Runner (Optional)

If you have `tsx` installed:

```bash
# Install tsx if needed
npm install -g tsx

# Run the interactive test runner
npx tsx claude-test/run-tests.ts

# Run with verbose output
npx tsx claude-test/run-tests.ts --verbose

# Stop on first failure
npx tsx claude-test/run-tests.ts --bail
```

## Test Suite Structure

### Core Test Files

| File | Purpose | Tests Count | Focus Area |
|------|---------|-------------|------------|
| `assignable.test.ts` | Type assignability testing | 50+ | `Assignable`, `NotAssignable`, `Assignables`, `NotAssignables` |
| `equal.test.ts` | Type equality testing | 80+ | `Equal`, `NotEqual`, `Equals`, `NotEquals` |
| `assert.test.ts` | Assertion infrastructure | 60+ | `Assert`, `AllPass`, `AllFails`, `SomePass`, `SomeFail`, `TypeAssert` |
| `not.test.ts` | Boolean negation | 40+ | `Not` utility and edge cases |
| `integration.test.ts` | Comprehensive integration | 200+ | Real-world scenarios combining all utilities |

### Supporting Files

- `index.ts` - Main entry point that imports all tests
- `README.md` - Detailed documentation about the test suite
- `USAGE.md` - This usage guide
- `run-tests.ts` - Interactive test runner with colored output

## Understanding Test Results

### Successful Tests ✅

When all type assertions pass, you'll see:

```bash
Command executed successfully.
```

No TypeScript errors means all type-level assertions are valid.

### Failed Tests ❌

When type assertions fail, you'll see TypeScript errors like:

```bash
claude-test/example.test.ts:42:8 - error TS2344: Type 'false' does not satisfy the constraint 'true'.

42 IsTrue<Equal<string, number>>;
          ~~~~~~~~~~~~~~~~~~~~
```

This indicates that the type assertion `Equal<string, number>` resolved to `false` when we expected `true`.

## Test Patterns and Examples

### Basic Type Testing

```typescript
import { Equal, Assignable, IsTrue, IsFalse } from '../test/TEST-UTILS';

// Test type equality
IsTrue<Equal<string, string>>;        // ✅ Pass
IsFalse<Equal<string, number>>;       // ✅ Pass

// Test type assignability  
IsTrue<Assignable<"hello", string>>;  // ✅ Pass - literal assignable to base
IsFalse<Assignable<string, "hello">>;  // ✅ Pass - base not assignable to literal
```

### Complex Assertion Testing

```typescript
import { Assert } from '../src/main';

type MyTests = Assert<[
  ["strings are equal", Equal<string, string>],
  ["numbers assignable to any", Assignable<number, any>],  
  ["booleans not equal to strings", NotEqual<boolean, string>]
]>;

IsTrue<MyTests>; // ✅ All assertions pass
```

### Array Operations Testing

```typescript
import { Assignables, Equals } from '../src/main';

// Test that all elements in array are assignable to target type
IsTrue<Assignables<[string, string, string], string>>;
IsFalse<Assignables<[string, number, boolean], string>>;

// Test that all elements in array are equal
IsTrue<Equals<[number, number, number]>>;
IsFalse<Equals<[string, number, boolean]>>;
```

## Writing Your Own Tests

### Basic Test Structure

```typescript
import { YourUtility } from "../src/main";
import { IsTrue, IsFalse } from "../test/TEST-UTILS";

// === Test Category Name ===

// Positive test cases
IsTrue<YourUtility<ValidInput>>;

// Negative test cases  
IsFalse<YourUtility<InvalidInput>>;

// Edge cases
IsTrue<YourUtility<EdgeCaseInput>>;
```

### Advanced Test Patterns

```typescript
// Test with type variables
type TestGeneric<T> = YourUtility<T> extends ExpectedPattern<T> ? true : false;
IsTrue<TestGeneric<string>>;
IsTrue<TestGeneric<number>>;

// Test complex combinations
type ComplexTest = Assert<[
  ["description 1", YourUtility<Input1>],
  ["description 2", AnotherUtility<Input2>],
  ["combination test", Equal<YourUtility<X>, AnotherUtility<Y>>]
]>;
IsTrue<ComplexTest>;
```

## IDE Integration

### VS Code

1. Open any test file in VS Code
2. Hover over type expressions to see resolved types
3. Type errors will be highlighted in red
4. Use "Problems" panel to see all type errors

### IntelliJ/WebStorm

1. Ensure TypeScript service is running
2. Type errors will appear as red underlines
3. Hover for detailed error messages
4. Use "TypeScript" tool window for error list

## CI/CD Integration

### GitHub Actions

```yaml
name: Type Tests
on: [push, pull_request]

jobs:
  type-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - name: Run Type Tests
        run: |
          cd packages/modules/typsert
          npx tsc --noEmit claude-test/index.ts
        env:
          CI: true
```

### Other CI Systems

```bash
# Jenkins, GitLab CI, etc.
cd packages/modules/typsert
npx tsc --noEmit claude-test/*.ts
if [ $? -eq 0 ]; then
  echo "✅ All type tests passed!"
else
  echo "❌ Type tests failed!"
  exit 1
fi
```

## Troubleshooting

### Common Issues

1. **"Module not found" errors**
   - Ensure you're in the correct directory (`packages/modules/typsert`)
   - Check that all imports use relative paths correctly

2. **TypeScript version conflicts**
   - Use the project's TypeScript version: `npx tsc` instead of global `tsc`
   - Check `package.json` for the correct TypeScript version

3. **Slow compilation**
   - Type-level tests can be computationally intensive
   - Consider running individual test files instead of all at once
   - Use `--incremental` flag for faster subsequent runs

4. **Memory issues**
   - Some complex type operations may hit Node.js memory limits
   - Increase memory: `NODE_OPTIONS="--max-old-space-size=4096" npx tsc ...`

### Performance Optimization

```bash
# Use incremental compilation
npx tsc --noEmit --incremental claude-test/index.ts

# Run specific test categories
npx tsc --noEmit claude-test/assignable.test.ts  # Fast
npx tsc --noEmit claude-test/integration.test.ts # Slower (comprehensive)

# Parallel execution (if supported)
npx tsc --noEmit claude-test/assignable.test.ts &
npx tsc --noEmit claude-test/equal.test.ts &
wait
```

## Best Practices

### 1. Test Organization

- Group related tests under descriptive comments
- Use consistent naming patterns
- Separate positive and negative test cases

### 2. Assertion Clarity

- Use descriptive labels in `Assert<>` calls
- Comment complex type expressions
- Test edge cases explicitly

### 3. Maintenance

- Keep tests updated with library changes
- Add tests for new features
- Remove obsolete tests

### 4. Performance

- Avoid overly complex nested types in tests
- Use simpler alternatives when possible
- Monitor compilation time

## Examples by Use Case

### API Response Validation

```typescript
type ApiResponse<T> = {
  data: T;
  status: 'success' | 'error';
  timestamp: number;
};

type ApiTests = Assert<[
  ["response has correct structure", 
   Equal<keyof ApiResponse<string>, 'data' | 'status' | 'timestamp'>],
  ["data type is preserved", 
   Equal<ApiResponse<User>['data'], User>],
  ["status is union type", 
   Assignable<ApiResponse<any>['status'], 'success' | 'error'>]
]>;

IsTrue<ApiTests>;
```

### Database Schema Validation

```typescript
type User = { id: number; name: string; email: string };
type CreateUser = Omit<User, 'id'>;
type UpdateUser = Partial<CreateUser>;

type DatabaseTests = Assert<[
  ["create user omits id", Equal<keyof CreateUser, 'name' | 'email'>],
  ["update user makes fields optional", 
   Assignable<UpdateUser, { name?: string; email?: string }>],
  ["user extends create user structure", 
   Assignable<User, CreateUser & { id: number }>]
]>;

IsTrue<DatabaseTests>;
```

## Contributing to the Test Suite

1. **Adding New Tests**
   - Follow existing patterns and structure
   - Add comprehensive coverage for new features
   - Include edge cases and error conditions

2. **Updating Existing Tests**
   - Maintain backward compatibility when possible
   - Update documentation to reflect changes
   - Test changes thoroughly before committing

3. **Reporting Issues**
   - Provide minimal reproduction cases
   - Include TypeScript version and environment details
   - Describe expected vs actual behavior

## Conclusion

This test suite provides comprehensive validation of `@monitext/typsert`'s type-level functionality. Use it to:

- ✅ Verify that type utilities work correctly
- ✅ Catch regressions during development
- ✅ Document expected behavior through tests
- ✅ Build confidence in type safety

For questions or issues, refer to the main README.md or create an issue in the project repository.
