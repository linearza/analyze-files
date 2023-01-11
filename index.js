const env = process.env
const DIRECTORY = env.npm_config_dir;
const EXCLUDE_PATTERNS = env.npm_config_exclude_patterns ? env.npm_config_exclude_patterns.split(',') : [];
const INCLUDE_EXTENSIONS = env.npm_config_include_extensions ? env.npm_config_include_extensions.split(',') : [];

const fs = require("fs");
const path = require("path");
var columnify = require("columnify");
const csv = require("fast-csv");
const isBinaryFileSync = require("isbinaryfile").isBinaryFileSync;

class CsvFile {
  static write(filestream, rows, options) {
    return new Promise((res, rej) => {
      csv
        .writeToStream(filestream, rows, options)
        .on("error", (err) => rej(err))
        .on("finish", () => res());
    });
  }

  constructor(opts) {
    this.headers = opts.headers;
    this.path = opts.path;
    this.writeOpts = { headers: this.headers, includeEndRowDelimiter: true };
  }

  create(rows) {
    return CsvFile.write(fs.createWriteStream(this.path), rows, {
      ...this.writeOpts,
    });
  }
}

function* walkSync(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(path.join(dir, file.name));
    } else {
      const extension = path.extname(file.name);

      if (!INCLUDE_EXTENSIONS.includes(extension)) continue;

      yield {
        path: path.join(dir, file.name),
        source: file,
        extension: extension,
      };
    }
  }
}

async function processFiles() {
  let fileCount = 0;
  let processedFileData = [];

  for (const file of walkSync(DIRECTORY)) {
    if (EXCLUDE_PATTERNS.some((pattern) => file.path.includes(pattern)))
      continue;
    if (isBinaryFileSync(file)) continue;

    fileCount += 1;
    try {
      processedFileData = processFile(file, processedFileData);
    } catch (e) {
      console.log(e);
    }
  }

  return { processedFileData, fileCount };
}

function processFile(file, processedFileData) {
  const fileData = fs.readFileSync(file.path, "utf8");
  const fileStats = fs.statSync(file.path);
  const fileSizeInBytes = fileStats["size"];

  const linesOfCodeArray = fileData.split("\n");
  const filteredLinesOfCode = linesOfCodeArray.filter((elm) => elm);
  const linesOfCode = filteredLinesOfCode.length;

  const multiplier = linesOfCode / 100;
  const effort = (fileSizeInBytes / linesOfCode) * multiplier;
  const effortRounded = Math.round(effort * 100) / 100;

  const relativeFilePath = file.path.replace(DIRECTORY, "");

  processedFileData = [
    ...processedFileData,
    {
      path: relativeFilePath,
      bytes: fileSizeInBytes,
      loc: linesOfCode,
      effort: effortRounded,
    },
  ];

  return processedFileData;
}

function compare(a, b) {
  if (a.effort > b.effort) {
    return -1;
  }
  if (a.effort < b.effort) {
    return 1;
  }
  return 0;
}

function generateCsv(sortedData) {
  const csvFile = new CsvFile({
    path: path.resolve(__dirname, "./dist/output.csv"),
    headers: Object.keys(sortedData[0]),
  });

  csvFile.create(sortedData);
}

function generateTxt(sortedData, fileCount) {
  let fileContent = '';
  fileContent += "/* \n";
  fileContent += `\t File stats for all ${fileCount} files in ${DIRECTORY} \n`;
  fileContent += "*/ \n\n";
  fileContent += columnify(sortedData);

  fs.writeFile("./dist/output.txt", fileContent, (err) => {
    if (err) {
      console.error(err);
    }
  });
}

async function run() {
  if (!DIRECTORY) {
    return console.error("Please provide a directory, eg: --dir='../path/to/dir'");
  }

  if (!INCLUDE_EXTENSIONS.length) {
    return console.error("Please provide at least one file extension type, eg: --include_extensions='.coffee'");
  }

  const { processedFileData, fileCount } = await processFiles();

  if (processedFileData.length) {
    const sortedFileData = processedFileData.sort(compare);

    if (!fs.existsSync("./dist")){
      fs.mkdirSync("./dist");
    }

    await generateCsv(sortedFileData);
    await generateTxt(sortedFileData, fileCount);
  }

  console.log(`Done! ${fileCount} files processed`);
}

run();
