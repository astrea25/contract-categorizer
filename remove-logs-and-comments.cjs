const recast = require('recast');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const parser = require('@babel/parser');

// Configure Babel parser with TypeScript and React presets
const removeLogsAndComments = (code) => {
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: [
      'jsx',           // For JSX syntax
      'typescript'     // For TypeScript syntax
    ]
  });

  recast.types.visit(ast, {
    visitExpressionStatement(path) {
      const expr = path.node.expression;
      if (expr?.type === 'CallExpression' && expr.callee?.object?.name === 'console') {
        path.prune();
      }
      this.traverse(path);
    }
  });

  return recast.print(ast, { comments: false }).code;
};

const files = glob.sync("src/**/*.{js,jsx,ts,tsx}");

files.forEach(file => {
  const code = fs.readFileSync(file, 'utf8');
  const cleaned = removeLogsAndComments(code);
  fs.writeFileSync(file, cleaned, 'utf8');
  console.log(`Cleaned: ${file}`);
});
