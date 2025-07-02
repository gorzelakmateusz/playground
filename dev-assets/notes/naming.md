# Naming Conventions: Project Best Practices

Clear and consistent naming is fundamental for project maintainability, readability, and collaborative efficiency. Adhering to established conventions ensures a professional and navigable codebase.

---

## 1. Project Names (Top-Level Repository Folders)

- **Rule:** Use **lowercase with words separated by hyphens (`kebab-case`)**.
- **Rationale:** This convention is universally compatible across operating systems and build tools, preventing issues related to case sensitivity or spaces.
- **Examples:** `spotify-organizer`, `typescript-projects`, `gui-calc-qt-widgets`

---

## 2. Folder Names Within a Project

- **Rule:** Employ either **`kebab-case`** or **`camelCase`** consistently throughout the project's directory structure.
- **Rationale:** Consistency in folder naming enhances navigability and predictability within the project hierarchy.
- **Examples:** `src`, `components`, `utils`, `draw`, `game-logic`

---

## 3. File Naming — General Principles

- **Rule:** Utilize **`camelCase`** or **`kebab-case`**, maintaining strict consistency within the project. Avoid spaces, special characters, and leading uppercase letters unless specifically applying `PascalCase` for classes or components.
- **Extensions:** Standard extensions like `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.md` must be used.

---

## 4. File Naming by Content

### 4.1. File Containing a Single Class or Component

- **Rule:** The filename must be in **`PascalCase`** and precisely match the name of the class or component it contains.
- **Examples:**
  - `DrawBall.ts` (for a `DrawBall` class)
  - `UserProfile.tsx` (for a `UserProfile` React component)

### 4.2. File Containing a Single Interface (TypeScript)

- **Rule:** The filename should be in **`PascalCase`**, matching the interface name (excluding any `I` prefix).
- **Note:** For smaller, less central interfaces, consider grouping them with related types or logic in a more broadly named file (e.g., `userTypes.ts`) to avoid excessive file fragmentation.
- **Example:** `User.ts` (for a `User` interface)

### 4.3. File Containing Functions, Types, or Constants (Non-Class Code)

- **Rule:** Filename should be in **`camelCase`** or **`kebab-case`** and clearly describe the primary functionality or purpose.
- **Examples:**
  - `drawBall.ts` (for a `drawBall` function)
  - `mathUtils.ts` (for mathematical utility functions)
  - `format-date.ts` (for a date formatting function)

### 4.4. File Containing Mixed Elements

- **Rule (Main Class + Helpers):** If the file primarily contains a main class along with its helper functions or types, use the class name in **`PascalCase`**.
  - **Example:** `UserService.ts`
- **Rule (Interfaces & Functions Only):** If the file predominantly contains interfaces and functions without a central class, use **`camelCase`** or **`kebab-case`** to describe the thematic content.
  - **Examples:** `userUtils.ts`, `user-types.ts`

### 4.5. File Containing Only Types and Interfaces

- **Rule:** Name it `types.ts` or `interfaces.ts`. For domain-specific types, a more descriptive name is preferred.
- **Example:** `userTypes.ts`

### 4.6. Configuration and Documentation Files

- **Rule:** Adhere to established standard filenames for these types of files.
- **Examples:** `package.json`, `tsconfig.json`, `README.md`, `LICENSE`

---

## 5. Test Files and Folders

- **Folders:** Use `__tests__` or `tests`.
- **Test Files:** Append `.test.ts` or `.spec.ts` to the name of the file being tested.
- **Examples:** `drawBall.test.ts`, `UserService.spec.ts`

---

## Summary of Naming Conventions

| Content of File                | Filename Format               | Example             |
| :----------------------------- | :---------------------------- | :------------------ |
| Single class/component         | `PascalCase`                  | `DrawBall.ts`       |
| Single interface               | `PascalCase`                  | `User.ts`           |
| Functions, constants, types    | `camelCase` or `kebab-case`   | `drawBall.ts`       |
| Mixed elements with main class | Class Name (`PascalCase`)     | `UserService.ts`    |
| Only interfaces and types      | `camelCase`/`kebab-case`      | `userTypes.ts`      |
| Test files                     | Filename + `.test` or `.spec` | `drawBall.test.ts`  |
| Folders                        | `kebab-case` or `camelCase`   | `game-logic`        |
| Projects (top-level folders)   | `kebab-case`                  | `spotify-organizer` |
