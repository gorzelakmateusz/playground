#!/bin/bash

# TypeScript Project Init Script
# Usage: ./init-ts-project.sh [project-name]

PROJECT_NAME=${1:-"my-ts-app"}

echo "🚀 Initializing TypeScript project: $PROJECT_NAME"

# 1. Create and navigate to project directory
echo "📁 Creating project directory..."
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# 2. Initialize package.json
echo "📦 Initializing package.json..."
pnpm init -y

# 3. Install typescript and ts-node
echo "⚙️ Installing TypeScript and ts-node..."
pnpm add -D typescript ts-node @types/node

# 4. Create tsconfig.json
echo "🔧 Creating tsconfig.json..."
cat > tsconfig.json << 'EOF'
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
EOF

# 5. Create src directory and index.ts
echo "📝 Creating src/index.ts..."
mkdir -p src
cat > src/index.ts << 'EOF'
console.log("Hello TypeScript! 🎉");

// Example of a simple function
function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet("TypeScript"));
EOF

# 6. Update package.json with scripts and type module
echo "📋 Updating package.json..."
# Tworzymy tymczasowy plik z aktualizowanym package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.type = 'module';
pkg.main = 'dist/index.js';
pkg.scripts = {
  'build': 'tsc',
  'start': 'node dist/index.js',
  'dev': 'ts-node --loader ts-node/esm src/index.ts',
  'clean': 'rm -rf dist'
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

# 7. Create .gitignore
echo "🚫 Creating .gitignore..."
cat > .gitignore << 'EOF'
node_modules/
dist/
*.log
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
EOF

# 8. Create README.md
echo "📖 Creating README.md..."
cat > README.md << EOF
# $PROJECT_NAME

TypeScript project created automatically.

## Available commands

\`\`\`bash
# Run in development mode
pnpm run dev

# Build project
pnpm run build

# Run built project
pnpm run start

# Clean dist folder
pnpm run clean
\`\`\`

## Project structure

\`\`\`
$PROJECT_NAME/
├── src/
│   └── index.ts
├── dist/           # Compiled files
├── package.json
├── tsconfig.json
└── README.md
\`\`\`
EOF

echo "✅ TypeScript project created successfully!"
echo ""
echo "Next steps:"
echo "1. cd $PROJECT_NAME"
echo "2. pnpm run dev    # Run in development mode"
echo ""
echo "Or:"
echo "1. pnpm run build  # Build project"
echo "2. pnpm run start  # Run built project"