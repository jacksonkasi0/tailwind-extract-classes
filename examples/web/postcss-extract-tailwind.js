// postcss-extract-tailwind.js
const fs = require("fs");
const path = require("path");

function postcssExtractTailwind(opts = {}) {
  const outFile = opts.output || "public/extracted-tailwind.css";

  return {
    postcssPlugin: "postcss-extract-tailwind",
    Once(root) {
      const extractedRules = [];

      // Walk all rules
      root.walkRules(rule => {
        // Find a preceding comment with "extract"
        const siblings = rule.parent?.nodes || [];
        const ruleIndex = siblings.indexOf(rule);
        let hasExtractComment = false;
        if (ruleIndex > 0 && siblings[ruleIndex - 1]?.type === "comment") {
          if (siblings[ruleIndex - 1].text.includes("extract")) {
            hasExtractComment = true;
          }
        }
        if (!hasExtractComment) return;

        // Find a declaration named "--tw-extract"
        let twDecl;
        rule.walkDecls(decl => {
          if (decl.prop === "--tw-extract") {
            twDecl = decl;
          }
        });
        if (!twDecl) return;

        // The tailwind classes to be extracted
        const tailwindClasses = twDecl.value.trim();

        // Create a new rule that uses @apply
        const newRule = rule.clone();
        newRule.removeAll();
        newRule.append({
          prop: "@apply",
          value: tailwindClasses,
        });

        // Push this new rule to our array
        extractedRules.push(newRule);

        // Remove the original from the main CSS
        rule.remove();
      });

      // If we extracted rules, write them to a separate file
      if (extractedRules.length > 0) {
        const outRoot = root.clone({ nodes: extractedRules });
        const cssOutput = outRoot.toResult().css;
        const outPath = path.resolve(process.cwd(), outFile);

        fs.writeFileSync(outPath, cssOutput, "utf8");
        console.log(`Extracted Tailwind CSS written to: ${outPath}`);
      }
    },
  };
}

// **Required** so PostCSS recognizes it as a plugin
postcssExtractTailwind.postcss = true;

module.exports = postcssExtractTailwind;
