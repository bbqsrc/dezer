import { parseSourceFile } from "./parser.ts"
import { generateAugmentationFile, generateCentralDezerFile } from "./generator.ts"
import type { ParsedClass } from "../types.ts"

export async function processFile(filePath: string): Promise<string | null> {
  const content = await Deno.readTextFile(filePath)
  const parsedClasses = parseSourceFile(filePath, content)

  if (parsedClasses.length === 0) {
    return null
  }

  return generateAugmentationFile(parsedClasses, filePath)
}

export async function findSourceFiles(directory: string): Promise<string[]> {
  const files: string[] = []

  for await (const entry of Deno.readDir(directory)) {
    if (entry.isFile && entry.name.endsWith(".ts") && !entry.name.endsWith(".dezer.ts")) {
      files.push(`${directory}/${entry.name}`)
    } else if (entry.isDirectory && !entry.name.startsWith(".")) {
      const subFiles = await findSourceFiles(`${directory}/${entry.name}`)
      files.push(...subFiles)
    }
  }

  return files
}

export function getOutputPath(sourceFilePath: string): string {
  return sourceFilePath.replace(/\.ts$/, ".dezer.ts")
}

export async function writeGeneratedFile(outputPath: string, content: string): Promise<void> {
  const dir = outputPath.substring(0, outputPath.lastIndexOf("/"))
  await Deno.mkdir(dir, { recursive: true })
  await Deno.writeTextFile(outputPath, content)
}

export async function isFileNewer(sourcePath: string, outputPath: string): Promise<boolean> {
  try {
    const [sourceStats, outputStats] = await Promise.all([
      Deno.stat(sourcePath),
      Deno.stat(outputPath),
    ])

    return sourceStats.mtime! > outputStats.mtime!
  } catch {
    return true
  }
}

export async function findDezerFiles(directory: string): Promise<string[]> {
  const files: string[] = []

  for await (const entry of Deno.readDir(directory)) {
    if (entry.isFile && entry.name.endsWith(".dezer.ts")) {
      files.push(`${directory}/${entry.name}`)
    } else if (entry.isDirectory && !entry.name.startsWith(".")) {
      const subFiles = await findDezerFiles(`${directory}/${entry.name}`)
      files.push(...subFiles)
    }
  }

  return files
}

export async function generateCentralDezer(rootDir: string): Promise<void> {
  const dezerFiles = await findDezerFiles(rootDir)
  const relativePaths = dezerFiles.map((file) => file.replace(rootDir + "/", ""))

  const content = generateCentralDezerFile(relativePaths)
  await writeGeneratedFile(`${rootDir}/dezer.ts`, content)
}
