# manual
mkdir express-ts-api
cd express-ts-api
pnpm init
pnpm add express
pnpm add -D typescript ts-node-dev @types/node @types/express
pnpm exec tsc --init --target es2022 --module commonjs --outDir dist --esModuleInterop --forceConsistentCasingInFileNames true --strict true


# generator
## Use pnpm dlx for clean, temporary execution of generators. (pnpm dlx = pnpx)
pnpm dlx express-generator-typescript express-ts-api

# manual2
mkdir my-product-api-ts
cd my-product-api-ts
pnpm init
pnpm add express pg
pnpm add -D typescript @types/express @types/node @types/pg ts-node-dev
npx tsc --init
mkdir src
touch src/app.ts

## tsconfig.json
```
{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## src/app.ts
```
import express from 'express';

const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Witaj w Product API z TypeScriptem!');
});

app.listen(port, () => {
  console.log(`Serwer działa na http://localhost:${port}`);
});
```

## package.json
```
{
  "name": "my-product-api-ts",
  "version": "1.0.0",
  "description": "",
  "main": "dist/app.js",
  "scripts": {
    "start": "node dist/app.js",
    "dev": "ts-node-dev --respawn --transpile-only src/app.ts",
    "build": "tsc",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "express": "^4.19.2",
    "pg": "^8.12.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.14.9",
    "@types/pg": "^8.11.6",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.5.3"
  }
}
```

## run with pnpm dev