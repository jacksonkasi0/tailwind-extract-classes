// babel-plugin-tailwind-extract.js
module.exports = function ({ types: t }) {
    // A simple hash function to generate a numeric hash from a string.
    function simpleHash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      return Math.abs(hash);
    }
  
    return {
      // Initialize an object to keep track of mappings (original classes → new class names)
      pre() {
        this.extractedMapping = {};
      },
      visitor: {
        // Visit all JSX attributes
        JSXAttribute(path) {
          // Only process attributes named "className" (you could also support "class" for HTML)
          if (path.node.name.name !== 'className') return;
          const valueNode = path.node.value;
          // Only process static string values (ignore dynamic expressions)
          if (!t.isStringLiteral(valueNode)) return;
          
          // Get an array of classes, filter out any extra whitespace
          let classList = valueNode.value.split(/\s+/).filter(Boolean);
          if (classList.length === 0) return;
          
          // Sort the classes to ensure consistent ordering (so the same set always produces the same hash)
          let sortedClasses = classList.sort().join(' ');
          
          // Generate a unique class name using the simple hash
          const hash = simpleHash(sortedClasses);
          const newClassName = `extracted-${hash}`;
  
          // Save the mapping if not already done
          if (!this.extractedMapping[sortedClasses]) {
            this.extractedMapping[sortedClasses] = newClassName;
          }
  
          // Replace the original className with the new class name
          path.node.value = t.stringLiteral(newClassName);
        }
      },
      // When Babel finishes processing a file (or set of files), output the CSS file.
      post() {
        const fs = require('fs');
        const path = require('path');
        let cssContent = '';
  
        // Create a CSS rule for each unique set of Tailwind classes
        for (const originalClasses in this.extractedMapping) {
          const newClassName = this.extractedMapping[originalClasses];
          cssContent += `.${newClassName} {\n  @apply ${originalClasses};\n}\n\n`;
        }
  
        // Write the CSS file to your project's root (or change the output path as needed)
        const outputPath = path.resolve(process.cwd(), 'extracted-tailwind.css');
        fs.writeFileSync(outputPath, cssContent, 'utf8');
        console.log(`Extracted CSS written to ${outputPath}`);
      }
    };
  };
  