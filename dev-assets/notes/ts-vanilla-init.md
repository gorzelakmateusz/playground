# TypeScript Project Setup (Manual Steps)

## 1. Create and navigate to project directory:

```bash
mkdir my-ts-app
cd my-ts-app
```

## 2. Initialize `package.json`:

```bash
pnpm init -y
```

## 3. Install TypeScript and development tools:

```bash
pnpm add -D typescript tsx @types/node nodemon
```

## 4. Generate `tsconfig.json`:

```bash
npx tsc --init
```

## 5. Update `tsconfig.json` content:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "sourceMap": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## 6. Create source directory and main file:

```bash
mkdir src
echo 'console.log("Hello TypeScript!");' > src/index.ts
```

```bash
mkdir src
echo 'console.log("Hello TypeScript!");' > src/index.ts
```

## 7. Update `package.json` with scripts and module type:

```json
{
  "name": "my-ts-app",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon --exec tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "clean": "rm -rf dist",
    "lint": "echo 'Add ESLint for production setup'",
    "test": "echo 'Add Jest for production setup'"
  },
  "devDependencies": {
    "typescript": "^5.x.x",
    "tsx": "^4.x.x",
    "@types/node": "^20.x.x",
    "nodemon": "^3.x.x"
  }
}
```

## 8. Create .gitignore file:

```bash
cat > .gitignore << 'EOF'
node_modules/
dist/
*.log
.DS_Store
.env
.env.local
coverage/
*.tsbuildinfo
EOF
```

## 9. Create nodemon configuration (optional):

```bash
cat > nodemon.json << 'EOF'
{
  "watch": ["src"],
  "ext": "ts,js",
  "ignore": ["dist", "node_modules"],
  "exec": "tsx src/index.ts"
}
EOF
```

## 10. Run in development mode:

```bash
pnpm run dev
```

## 11. Build and run production version:

```bash
pnpm run build
pnpm run start
```
