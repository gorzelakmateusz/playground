# manual
mkdir express-ts-api
cd express-ts-api
pnpm init -y
pnpm add express
pnpm add -D typescript ts-node-dev @types/node @types/express
pnpm exec tsc --init --target es2022 --module commonjs --outDir dist --esModuleInterop --forceConsistentCasingInFileNames true --strict true


# generator
## Use pnpm dlx for clean, temporary execution of generators. (pnpm dlx = pnpx)
pnpm dlx express-generator-typescript express-ts-api
