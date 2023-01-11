# analyze-files

A simple Node app to collect and analyze files in a directory.

- Works with nested directory structure.
- Allows for exclude patterns
- Allows for specified file types
- Excludes binary files always!
- Effort quotient calculated in a rudimentary fashion based off lines of code and byte size

To run:

```
npm start --dir='../path/to/source' --exclude_patterns='node_modules,dist' --include_extensions='.dummy,.coffee'
```

Columns generated: `['path', 'bytes', 'loc', 'effort']`

Output saved to: `/dist/output.csv` and `/dist/output.txt`