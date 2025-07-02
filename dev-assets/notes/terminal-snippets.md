# 📄 Terminal Command Snippets

## 📦 Package Management (pnpm/npm)

pnpm install <package> # Install specified package  
pnpm install -D <package> # Install as dev dependency  
pnpm install # Install all dependencies  
pnpm update # Update all packages  
pnpm remove <package> # Remove package  
pnpm list # List installed packages  
pnpm outdated # Show outdated packages

## 🧑‍💻 TypeScript & JavaScript Development

# Building & Running

pnpm build # Build project (compile, bundle)  
pnpm dev # Run project in dev mode (hot reload)  
pnpm start # Start production build  
pnpm test # Run tests

# TypeScript Compilation

npx tsc # Compile TypeScript files  
npx tsc --watch # Watch mode compilation  
pnpm tsc # Compile TS via pnpm (if set up)

# Direct TypeScript Execution

npx tsx <file.ts> # Run TS files directly  
pnpm tsx <file.ts> # Run TS via pnpm  
node <file.js> # Run JS file

## 🎨 Code Quality & Formatting

npx prettier --write . # Format code in current folder  
npx prettier --check . # Check if code is formatted  
npx eslint . # Lint code  
npx eslint --fix . # Auto-fix linting issues

## 🔧 Git Commands (Essential)

# Basic Operations

git status # Show working directory status  
git add . # Stage all changes  
git add <file> # Stage specific file  
git commit -m "message" # Commit with message  
git push # Push to remote  
git pull # Pull from remote  
git fetch # Fetch without merging

# Branching

git branch # List branches  
git branch <name> # Create new branch  
git checkout <branch> # Switch to branch  
git checkout -b <branch> # Create and switch to new branch  
git merge <branch> # Merge branch into current  
git branch -d <branch> # Delete branch

# History & Info

git log --oneline # Compact commit history  
git log --graph --oneline # Visual branch history  
git diff # Show unstaged changes  
git diff --cached # Show staged changes  
git show <commit> # Show specific commit

# Remote Management

git remote -v # Show remote URLs  
git remote add <name> <url> # Add remote  
git remote remove <name> # Remove remote

# Undoing Changes

git reset HEAD <file> # Unstage file  
git checkout -- <file> # Discard file changes  
git reset --hard HEAD # Reset to last commit (dangerous)  
git revert <commit> # Create commit that undoes changes

## 🧠 Advanced Git

# Stashing

git stash # Stash current changes  
git stash pop # Apply and remove latest stash  
git stash list # List all stashes  
git stash apply # Apply stash without removing

# Rebasing & Rewriting

git rebase -i HEAD~3 # Interactive rebase last 3 commits  
git rebase <branch> # Rebase current onto another  
git commit --amend # Modify last commit

# Subtree

git subtree add --prefix=<dir> <remote> <branch>  
git subtree pull --prefix=<dir> <remote> <branch>  
git subtree push --prefix=<dir> <remote> <branch>

## 📁 File System & Navigation

ls -la # List with details  
tree -L <depth> # Folder tree up to depth  
tree -I "node_modules" # Exclude node_modules  
find . -name "\*.js" # Find JS files  
find . -type f -name "pattern" # Pattern search

cp -r <src> <dst> # Copy dir  
mv <old> <new> # Move/rename  
rm -rf <dir> # Remove recursively  
mkdir -p <path> # Make dirs with parents  
touch <file> # Create empty file

chmod +x <file> # Executable  
chmod 755 <file> # Standard permissions  
chown <user>:<group> <file> # Ownership

## 💻 System & Process Management

pwd # Current dir  
whoami # Username  
ps aux # List all processes  
top # Live process monitor  
df -h # Disk usage  
du -sh <dir> # Dir size  
free -h # Memory usage

kill <pid> # Kill process  
killall <name> # Kill by name  
nohup <cmd> & # Background command  
jobs # List background jobs  
fg %<job> # Foreground job

## 🌐 Network & Transfer

curl <url> # Request URL  
wget <url> # Download  
ping <host> # Ping  
netstat -tulpn # Net connections

scp <file> <user>@<host>:<path> # Secure copy  
rsync -av <source> <dest> # Sync dirs

## 📄 Text Tools

cat <file> # Print file  
less <file> # View page-by-page  
head -n 10 <file> # First 10 lines  
tail -n 10 <file> # Last 10 lines  
tail -f <file> # Follow file

grep "pattern" <file> # Search  
grep -r "pattern" . # Recursive search  
sed 's/old/new/g' <file> # Replace  
awk '{print $1}' <file> # Print first col  
sort <file> # Sort  
uniq <file> # Remove duplicates

## 🌱 Env & Variables

env # All env vars  
echo $PATH # Show PATH  
export VAR=value # Set var  
source ~/.bashrc # Reload config  
which <cmd> # Command path  
alias ll='ls -la' # Create alias

## 🪟 WSL2 & Windows Integration

wsl --list --verbose # List WSL distros  
wsl --shutdown # Shutdown WSL  
wsl --set-default <distro> # Set default distro

# Access WSL files in Windows: \\wsl$\Ubuntu\

# Access Windows files in WSL: /mnt/c/Users/

# Access WSL services from Windows: localhost:<port>

## 🔗 Useful Combos

mkdir project && cd project && git init && pnpm init  
rm -rf node*modules package-lock.json && pnpm install  
npx prettier --write . && npx eslint --fix .  
git add . && git commit -m "Update" && git push  
find . -name "*.js" -exec sed -i 's/old/new/g' {} +  
du -sh \_ | sort -hr  
tail -f /var/log/app.log | grep ERROR

## 📜 package.json scripts

{
"scripts": {
"dev": "tsx watch src/index.ts",
"build": "tsc",
"start": "node dist/index.js",
"test": "jest",
"lint": "eslint . --fix",
"format": "prettier --write .",
"clean": "rm -rf dist"
}
}
