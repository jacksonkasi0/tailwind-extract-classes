// postcss-extract-tailwind.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = (opts = {}) => {
  // Default output path if not provided via options.
  opts.output = opts.output || 'extracted-tailwind.css';
  const extractedRules = [];

  return {
    postcssPlugin: 'postcss-extract-tailwind',
    // The Once callback runs once per CSS file.
    Once(root, { result }) {
      // Walk over every CSS rule
      root.walkRules(rule => {
        // Check if the immediately preceding node is a comment containing "extract"
        const parentNodes = rule.parent && rule.parent.nodes;
        let shouldExtract = false;
        if (parentNodes) {
          const ruleIndex = parentNodes.indexOf(rule);
          if (ruleIndex > 0) {
            const prevNode = parentNodes[ruleIndex - 1];
            if (prevNode.type === 'comment' && prevNode.text.trim().includes('extract')) {
              shouldExtract = true;
            }
          }
        }
        if (!shouldExtract) return;

        // Look for a declaration named "--tw-extract" in this rule.
        let extractDecl;
        rule.walkDecls(decl => {
          if (decl.prop === '--tw-extract') {
            extractDecl = decl;
          }
        });
        if (!extractDecl) return;

        // Get the space-separated list of Tailwind utility classes
        const utilities = extractDecl.value.trim();
        if (!utilities) return;

        // Compute a short hash so the same list always produces the same class name.
        const hash = crypto.createHash('md5').update(utilities).digest('hex').substr(0, 6);
        const newClassName = `extracted-${hash}`;

        // Create a new rule with the generated class name.
        // This new rule will use Tailwind's @apply to include all the utilities.
        const newRule = rule.clone({ selector: `.${newClassName}` });
        newRule.removeAll(); // Remove all original declarations.
        newRule.append({ prop: '@apply', value: utilities });

        // Save the new rule in our list.
        extractedRules.push(newRule);
        // Remove the original rule from the main CSS.
        rule.remove();
      });

      // After processing the file, create a new root for extracted rules.
      if (extractedRules.length) {
        const outputRoot = root.clone({ nodes: extractedRules });
        const cssOutput = outputRoot.toResult().css;
        const outputPath = path.resolve(process.cwd(), opts.output);
        fs.writeFileSync(outputPath, cssOutput, 'utf8');
        console.log(`Extracted Tailwind CSS written to ${outputPath}`);
      }
    }
  };
};

module.exports.postcss = true;
