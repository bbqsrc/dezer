#!/usr/bin/env -S deno run --allow-read --allow-write

import { parseArgs } from "jsr:@std/cli/parse-args"
import {
  findSourceFiles,
  generateCentralDezer,
  getOutputPath,
  isFileNewer,
  processFile,
  writeGeneratedFile,
} from "./src/compiler/utils.ts"

interface CliOptions {
  help?: boolean
  watch?: boolean
  dir?: string
  verbose?: boolean
}

async function main() {
  const args = parseArgs(Deno.args, {
    boolean: ["help", "watch", "verbose"],
    string: ["dir"],
    alias: {
      h: "help",
      w: "watch",
      d: "dir",
      v: "verbose",
    },
    default: {
      dir: ".",
    },
  }) as CliOptions

  if (args.help) {
    printHelp()
    return
  }

  if (args.watch) {
    await runWatchMode(args)
  } else {
    await runOnce(args)
  }
}

async function runOnce(options: CliOptions) {
  const startTime = Date.now()
  let processedCount = 0
  let generatedCount = 0

  try {
    const sourceFiles = await findSourceFiles(options.dir!)

    if (options.verbose) {
      console.log(`Found ${sourceFiles.length} TypeScript files`)
    }

    for (const sourceFile of sourceFiles) {
      processedCount++
      const outputPath = getOutputPath(sourceFile)

      if (!await isFileNewer(sourceFile, outputPath)) {
        if (options.verbose) {
          console.log(`Skipping ${sourceFile} (up to date)`)
        }
        continue
      }

      if (options.verbose) {
        console.log(`Processing ${sourceFile}...`)
      }

      const generatedCode = await processFile(sourceFile)

      if (generatedCode) {
        await writeGeneratedFile(outputPath, generatedCode)
        generatedCount++

        if (options.verbose) {
          console.log(`Generated ${outputPath}`)
        }
      }
    }

    // Generate central dezer.ts file
    if (generatedCount > 0) {
      await generateCentralDezer(options.dir!)
      if (options.verbose) {
        console.log("Generated central dezer.ts")
      }
    }

    const duration = Date.now() - startTime
    console.log(
      `✅ Processed ${processedCount} files, generated ${generatedCount} serialization files in ${duration}ms`,
    )
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Error:", error.message)
    } else {
      console.error("❌ Error:", String(error))
    }
    Deno.exit(1)
  }
}

async function runWatchMode(options: CliOptions) {
  console.log("🔄 Starting watch mode...")
  console.log("Press Ctrl+C to stop")

  await runOnce(options)

  const watcher = Deno.watchFs(options.dir!, { recursive: true })

  for await (const event of watcher) {
    if (event.kind === "modify" || event.kind === "create") {
      for (const path of event.paths) {
        if (path.endsWith(".ts") && !path.endsWith(".dezer.ts")) {
          console.log(`\n📝 File changed: ${path}`)

          try {
            const generatedCode = await processFile(path)

            if (generatedCode) {
              const outputPath = getOutputPath(path)
              await writeGeneratedFile(outputPath, generatedCode)
              console.log(`✅ Generated ${outputPath}`)
            }
          } catch (error) {
            if (error instanceof Error) {
              console.error(`❌ Error processing ${path}:`, error.message)
            } else {
              console.error(`❌ Error processing ${path}:`, String(error))
            }
          }
        }
      }
    }
  }
}

function printHelp() {
  console.log(`
Dezer Code Generator

USAGE:
    deno run --allow-read --allow-write cli.ts [OPTIONS]

OPTIONS:
    -h, --help      Show this help message
    -w, --watch     Watch for file changes and regenerate automatically
    -d, --dir       Directory to process (default: current directory)
    -v, --verbose   Enable verbose output

EXAMPLES:
    # Generate serialization code for current directory
    deno task generate

    # Watch for changes and regenerate automatically
    deno task generate:watch

    # Process specific directory with verbose output
    deno run --allow-read --allow-write cli.ts --dir src --verbose

    # Watch specific directory
    deno run --allow-read --allow-write cli.ts --watch --dir examples
`)
}

if (import.meta.main) {
  await main()
}
