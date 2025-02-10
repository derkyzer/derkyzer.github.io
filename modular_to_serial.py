import os
import json
import argparse
from pathlib import Path
from typing import List, Dict, Union

class Mod2Ser:
    def __init__(self, file_types: List[str] = None):
        """Initialize with supported file types."""
        self.file_types = file_types or ['.py', '.json', '.txt', '.bak']
        
    def serialize_directory(self, directory: str, output_file: str = 'serialized_module.json') -> None:
        """Convert all matching files in directory to a single serialized file."""
        base_path = Path(directory).resolve()
        
        if not base_path.exists():
            raise FileNotFoundError(f"Directory not found: {directory}")
            
        file_data = {}
        
        # Walk through directory and collect file contents
        for root, _, files in os.walk(base_path):
            for file in files:
                file_path = Path(root) / file
                if file_path.suffix.lower() in self.file_types:
                    # Get relative path for reconstruction
                    rel_path = str(file_path.relative_to(base_path))
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            file_data[rel_path] = f.read()
                    except Exception as e:
                        print(f"Error reading {file_path}: {e}")
        
        # Save serialized data
        if file_data:
            try:
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump({
                        'file_types': self.file_types,
                        'files': file_data
                    }, f, indent=2)
                print(f"Successfully serialized {len(file_data)} files to {output_file}")
            except Exception as e:
                print(f"Error writing serialized file: {e}")
        else:
            print(f"No matching files found in {directory}")
    
    def deserialize_file(self, serial_file: str, output_dir: str = 'deserialized_module') -> None:
        """Convert serialized file back to original directory structure."""
        try:
            with open(serial_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            raise ValueError(f"Error reading serialized file: {e}")
        
        if not isinstance(data, dict) or 'files' not in data:
            raise ValueError("Invalid serialized file format")
            
        output_path = Path(output_dir)
        
        # Create files from serialized data
        for rel_path, content in data['files'].items():
            file_path = output_path / rel_path
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Created: {file_path}")
            except Exception as e:
                print(f"Error writing {file_path}: {e}")
        
        print(f"\nSuccessfully deserialized {len(data['files'])} files to {output_dir}")

def main():
    parser = argparse.ArgumentParser(description='Convert between module files and serialized format')
    parser.add_argument('mode', choices=['pack', 'unpack'], 
                       help='pack: module->serial, unpack: serial->module')
    parser.add_argument('input', help='Input directory (pack) or serialized file (unpack)')
    parser.add_argument('output', nargs='?', 
                       help='Output file (pack) or directory (unpack)')
    parser.add_argument('--types', nargs='+', 
                       help='File extensions to include (e.g., .py .json .txt)')
    
    args = parser.parse_args()
    
    # Initialize converter with custom file types if provided
    file_types = args.types if args.types else None
    converter = Mod2Ser(file_types)
    
    try:
        if args.mode == 'pack':
            output = args.output or 'serialized_module.json'
            converter.serialize_directory(args.input, output)
        else:  # unpack
            output = args.output or 'deserialized_module'
            converter.deserialize_file(args.input, output)
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0

if __name__ == '__main__':
    exit(main())