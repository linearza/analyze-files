# analyze-files

A simple Node app to collect and analyze files in a directory.

- Works with nested directory structure.
- Allows for exclude patterns
- Allows for specified file types
- Effort quotient calculated in a rudimentary fashion based off lines of code and byte size

To run:

```
npm start --dir='../dentally/app/ember-frontend' --exclude_patterns='node_modules,dist' --include_extensions='.dummy,.coffee'
```

Columns generated: `['path', 'bytes', 'loc', 'effort']`

Files generated: `/dist/output.csv` and `/dist/output.txt`