#!/bin/bash
# Removed set -e to prevent script from stopping on errors

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to convert to kebab-case (consistent commercial convention)
to_kebab_case() {
    local input="$1"
    
    # Special cases for better results
    case "$input" in
        "hEat") echo "heat" && return ;;
        "SDiZO-lab1-2017") echo "sdizo-lab1-2017" && return ;;
    esac
    
    echo "$input" | \
        sed 's/\([a-z0-9]\)\([A-Z]\)/\1-\2/g' | \
        sed 's/\([A-Z]\+\)\([A-Z][a-z]\)/\1-\2/g' | \
        tr '[:upper:]' '[:lower:]' | \
        sed 's/_/-/g' | \
        sed 's/--*/-/g' | \
        sed 's/^-\|-$//g'
}

# Function to check if directory exists
check_dir_exists() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        echo -e "${YELLOW}⚠️  Directory $dir does not exist - skipping${NC}"
        return 1
    fi
    return 0
}

# Function to rename directories and files
rename_items_in() {
    local base_dir="$1"
    
    if ! check_dir_exists "$base_dir"; then
        return
    fi
    
    echo -e "${BLUE}🔍 Renaming items in: $base_dir${NC}"
    
    # Collect all items into array to avoid subshell issues
    local items=()
    while IFS= read -r -d '' item; do
        items+=("$item")
    done < <(find "$base_dir" -mindepth 1 -maxdepth 1 \( -type d -o -type f \) -print0 | sort -z)
    
    local changes=0
    for item in "${items[@]}"; do
        base="$(basename "$item")"
        dir="$(dirname "$item")"
        new_name="$(to_kebab_case "$base")"
        
        if [ "$base" != "$new_name" ]; then
            echo -e "  ${YELLOW}$base${NC} → ${GREEN}$new_name${NC}"
            
            # Handle case-insensitive filesystems (Windows/Mac)
            local target_path="$dir/$new_name"
            
            # If target exists and it's not the same file (case-insensitive check)
            if [ -e "$target_path" ] && [ "$(basename "$item")" != "$new_name" ]; then
                # Try using a temporary name first
                local temp_name="${new_name}_temp_$"
                echo -e "  ${YELLOW}🔄 Using temporary rename due to case-insensitive filesystem${NC}"
                
                if mv "$item" "$dir/$temp_name" 2>/dev/null && mv "$dir/$temp_name" "$target_path" 2>/dev/null; then
                    echo -e "  ${GREEN}✅ Renamed successfully (via temp)${NC}"
                    ((changes++))
                else
                    echo -e "  ${RED}❌ Error: Could not rename $base${NC}"
                fi
            else
                # Direct rename
                if mv "$item" "$target_path" 2>/dev/null; then
                    echo -e "  ${GREEN}✅ Renamed successfully${NC}"
                    ((changes++))
                else
                    echo -e "  ${RED}❌ Error renaming $base${NC}"
                fi
            fi
        fi
    done
    
    if [ $changes -eq 0 ]; then
        echo -e "  ${GREEN}✅ All names already in kebab-case${NC}"
    else
        echo -e "  ${GREEN}📊 Successfully renamed $changes items${NC}"
    fi
    
    echo "" # Add spacing between directories
}

# Function to preview all changes
preview_all() {
    echo -e "${BLUE}📋 PREVIEW OF ALL CHANGES:${NC}"
    echo ""
    
    local total_changes=0
    local dirs=("c_projects" "c_projects/shutters" "typescript_projects")
    
    for dir in "${dirs[@]}"; do
        if check_dir_exists "$dir"; then
            echo -e "${BLUE}In directory $dir:${NC}"
            
            local dir_changes=0
            while IFS= read -r -d '' item; do
                if [ -d "$item" ] || [ -f "$item" ]; then
                    base="$(basename "$item")"
                    new_name="$(to_kebab_case "$base")"
                    
                    if [ "$base" != "$new_name" ]; then
                        echo -e "  ${YELLOW}$base${NC} → ${GREEN}$new_name${NC}"
                        ((total_changes++))
                        ((dir_changes++))
                    fi
                fi
            done < <(find "$dir" -mindepth 1 -maxdepth 1 \( -type d -o -type f \) -print0 | sort -z)
            
            if [ $dir_changes -eq 0 ]; then
                echo -e "  ${GREEN}✅ All names already in kebab-case${NC}"
            fi
            
            echo ""
        fi
    done
    
    if [ $total_changes -eq 0 ]; then
        echo -e "${GREEN}✅ All names are already in kebab-case!${NC}"
        return 1
    else
        echo -e "${YELLOW}📊 Total items to be renamed: $total_changes${NC}"
        return 0
    fi
}

# Main function
main() {
    echo -e "${BLUE}🚀 Normalizing mono repo names to kebab-case${NC}"
    echo ""
    
    # Auto-detect main repo directory
    if [[ ! -d "c_projects" && ! -d "typescript_projects" ]]; then
        if [[ -d "../c_projects" || -d "../typescript_projects" ]]; then
            echo -e "${YELLOW}🔍 Detected script is running from subdirectory...${NC}"
            echo -e "${BLUE}📁 Moving to main repo directory${NC}"
            cd ..
            echo ""
        else
            echo -e "${RED}❌ Could not find c_projects or typescript_projects directories${NC}"
            echo -e "${YELLOW}💡 Make sure to run script from main repo directory${NC}"
            exit 1
        fi
    fi
    
    # Show preview
    if preview_all; then
        echo ""
        echo -e "${YELLOW}❓ Do you want to continue? (y/N)${NC}"
        read -r response
        
        if [[ "$response" =~ ^[Yy]$ ]]; then
            echo ""
            echo -e "${GREEN}🔄 Starting renaming process...${NC}"
            echo ""
            
            # Execute changes - process each directory completely
            rename_items_in "c_projects"
            rename_items_in "c_projects/shutters" 
            rename_items_in "typescript_projects"
            
            echo -e "${GREEN}✅ All renaming completed successfully!${NC}"
        else
            echo -e "${YELLOW}❌ Operation cancelled${NC}"
        fi
    fi
}

# Run if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi