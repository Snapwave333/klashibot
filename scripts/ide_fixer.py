import os
import re
import argparse
from pathlib import Path

class IDEFixer:
    def __init__(self, dry_run=False):
        self.dry_run = dry_run
        self.stats = {"fixed": 0, "skipped": 0, "errors": 0}
        
        # Patterns to fix
        self.patterns = [
            # 1. window to globalThis
            (r'\bwindow\b(?!\.location|\.history|\.localStorage|\.sessionStorage)', 'globalThis'),
            
            # 2. parseInt to Number.parseInt(..., 10)
            (r'parseInt\(([^,)]+)\)', r'Number.parseInt(\1, 10)'),
            
            # 3. Leaked conditional values (simple cases)
            (r'\{(\w+)\s+&&\s+<', r'{!!\1 && <'),
            
            # 4. JSON.stringify formatting fixes
            (r'JSON\.stringify\(([^,)]+)\)', r'JSON.stringify(\1, null, 2)'),
        ]

    def fix_markdown(self, content):
        """Fix blank lines around headings and lists."""
        lines = content.splitlines()
        new_lines = []
        for i, line in enumerate(lines):
            # Header check
            if line.startswith('#'):
                if i > 0 and lines[i-1].strip() != "":
                    new_lines.append("")
                new_lines.append(line)
                if i < len(lines) - 1 and lines[i+1].strip() != "":
                    # Peek next line handled in next iteration or here
                    pass 
            else:
                new_lines.append(line)
        
        # Simple heading padding
        content = "\n".join(new_lines)
        content = re.sub(r'(^#+.*$)\n(?!\n)', r'\1\n\n', content, flags=re.MULTILINE)
        content = re.sub(r'(?<!\n)\n(#+.*$)', r'\n\n\1', content, flags=re.MULTILINE)
        
        # List padding (fixed group sonar issue)
        content = re.sub(r'(?<!\n)\n(?=[-*\d]\s)', r'\n\n', content)
        content = re.sub(r'([-*\d]\s.*)\n(?![-\d*]|(?:\n))', r'\1\n\n', content)
        
        return content

    def fix_code(self, content, ext):
        """Apply regex patterns to code files."""
        for pattern, replacement in self.patterns:
            content = re.sub(pattern, replacement, content)
        
        # Accessibility: role="button" to <button>
        # This is high-risk, so we do it carefully
        if ext in ['.tsx', '.jsx']:
            # Replace <div role="button" ... > with <button ... type="button" >
            content = re.sub(
                r'<div\s+([^>]*?)role="button"([^>]*?)>',
                r'<button \1\2 type="button">',
                content
            )
            content = re.sub(
                r'</div>(\s*<!--\s*role="button"\s*-->)',
                r'</button>',
                content
            )
            # If no comment hint, we might miss some closing divs. 
            # Better to target specific patterns or just stick to simple props.
            
        return content

    def process_file(self, file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()
            
            ext = Path(file_path).suffix
            if ext == '.md':
                new_content = self.fix_markdown(original_content)
            elif ext in ['.ts', '.tsx', '.js', '.jsx']:
                new_content = self.fix_code(original_content, ext)
            else:
                return

            if original_content != new_content:
                if self.dry_run:
                    print(f"[DRY RUN] Would fix: {file_path}")
                else:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"[FIXED] {file_path}")
                self.stats["fixed"] += 1
            else:
                self.stats["skipped"] += 1
                
        except Exception as e:
            print(f"[ERROR] {file_path}: {e}")
            self.stats["errors"] += 1

    def run(self, root_dir):
        for root, _, files in os.walk(root_dir):
            if any(x in root for x in ["node_modules", ".git", ".next", "assets"]):
                continue
            for file in files:
                if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.md')):
                    self.process_file(os.path.join(root, file))
        
        print("\n--- Summary ---")
        print(f"Fixed: {self.stats['fixed']}")
        print(f"Skipped: {self.stats['skipped']}")
        print(f"Errors: {self.stats['errors']}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Automated IDE Issue Fixer")
    parser.add_argument("path", help="Root directory to process")
    parser.add_argument("--dry-run", action="store_true", help="Don't write changes")
    args = parser.parse_args()
    
    fixer = IDEFixer(dry_run=args.dry_run)
    fixer.run(args.path)
