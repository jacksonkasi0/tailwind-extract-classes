const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

class TailwindExtractorWebpackPlugin {
  constructor(options = {}) {
    // Options: { output: "extracted-tailwind.css" }
    this.options = options;
    this.extractedMapping = {}; // Mapping from sorted Tailwind class string to generated class name
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync(
      "TailwindExtractorWebpackPlugin",
      (compilation, callback) => {
        console.log("[TailwindExtractor] Processing assets...");

        // Process JS and HTML assets
        Object.keys(compilation.assets).forEach((filename) => {
          if (/\.(js|jsx|tsx|html)$/.test(filename)) {
            let source = compilation.assets[filename].source();
            console.log(`[TailwindExtractor] Processing ${filename}`);

            // Use a regex to match both `className="..."` and `class="..."`
            const newSource = source.replace(
              /((?:className|class))=["']([^"']+)["']/g,
              (match, attr, classes) => {
                console.log(`[TailwindExtractor] Found ${attr}: ${classes}`);
                // Split, filter, sort the classes to generate a stable hash.
                const sorted = classes.split(/\s+/).filter(Boolean).sort().join(" ");
                const hash = crypto
                  .createHash("md5")
                  .update(sorted)
                  .digest("hex")
                  .slice(0, 6);
                const newClass = `extracted-${hash}`;
                if (!this.extractedMapping[sorted]) {
                  this.extractedMapping[sorted] = newClass;
                }
                // Replace the original attribute with the new class
                return `${attr}="${newClass}"`;
              }
            );
            // Replace the asset content
            compilation.assets[filename] = {
              source: () => newSource,
              size: () => newSource.length,
            };
          }
        });

        // Build the CSS content from the extracted mappings.
        let cssContent = "";
        for (const originalClasses in this.extractedMapping) {
          const generated = this.extractedMapping[originalClasses];
          cssContent += `.${generated} {\n  @apply ${originalClasses};\n}\n\n`;
        }
        console.log("[TailwindExtractor] Generated CSS content:\n", cssContent);

        // Use the provided output filename (default if not provided)
        const outputFilename = this.options.output || "extracted-tailwind.css";
        // Add the new asset to the compilation assets
        compilation.assets[outputFilename] = {
          source: () => cssContent,
          size: () => cssContent.length,
        };

        // Also write the CSS file to disk (for easier verification)
        const outPath = path.resolve(
          process.cwd(),
          this.options.output || "public/extracted-tailwind.css"
        );
        fs.writeFileSync(outPath, cssContent, "utf8");
        console.log(`[TailwindExtractor] File written to ${outPath}`);

        callback();
      }
    );
  }
}

module.exports = TailwindExtractorWebpackPlugin;
