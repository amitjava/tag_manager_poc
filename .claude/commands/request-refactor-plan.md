t consider them necessary.

1. Ask the user for a long, detailed description of the problem they want to solve and any potential ideas for solutions.

2. Explore the repo to verify their assertions and understand the current state of the codebase.

3. Ask whether they have considered other options, and present other options to them.

4. Interview the user about the implementation. Be extremely detailed and thorough.

5. Hammer out the exact scope of the implementation. Work out what you plan to change and what you plan not to change.

6. Look in the codebase to check for test coverage of this area of the codebase. If the code being refactored has no tests: write tests for the current behavior before creating the refactor plan. Do not proceed with the plan until tests exist — refactoring without tests means you cannot verify behavior is preserved.

7. Break the implementation into a plan of tiny commits. Remember Martin Fowler
