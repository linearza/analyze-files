const args = process.argv.slice(2);
const DIRECTORY = args[0];
const EXCLUDE_PATTERNS = args.slice(1);

const fs = require("fs");
const path = require("path");
var columnify = require("columnify");

function* walkSync(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(path.join(dir, file.name));
    } else {
      const extension = path.extname(file.name);
      if (extension !== ".coffee") continue;

      yield {
        path: path.join(dir, file.name),
        source: file,
        extension: extension,
      };
    }
  }
}

let fileCount = 0;
let processedFileData = [];
let fileContent = "";

async function processFiles() {
  fileContent += "/* \n";
  fileContent += `\t File stats for all Coffeescript files in ${DIRECTORY} \n`;
  fileContent += "*/ \n\n";

  for (const file of walkSync(DIRECTORY)) {
    if (EXCLUDE_PATTERNS.some((pattern) => file.path.includes(pattern)))
      continue;

    fileCount += 1;
    try {
      processFile(file);
    } catch (e) {
      console.log(e);
    }
  }
}

function processFile(file) {
  const fileData = fs.readFileSync(file.path, "utf8");
  const fileStats = fs.statSync(file.path);
  const fileSizeInBytes = fileStats["size"];

  //Convert the file size to megabytes (optional)
  const fileSizeInMegabytes = fileSizeInBytes / 1000000.0;
  const linesOfCode = fileData.split("\n").length;

  processedFileData = [
    ...processedFileData,
    {
      path: file.path,
      bytes: fileSizeInBytes,
      mb: fileSizeInMegabytes,
      loc: linesOfCode,
    },
  ];
}

function compare(a, b) {
  if (a.loc > b.loc) {
    return -1;
  }
  if (a.loc < b.loc) {
    return 1;
  }
  return 0;
}

async function run() {
  if (!DIRECTORY) {
    return console.error("Please provide a directory: npm start [directory]");
  }

  await processFiles();

  const sortedFileData = processedFileData.sort(compare);

  fileContent += columnify(sortedFileData);
  fileContent += `\n\n Total files: ${fileCount}`;

  fs.writeFile("./dist/output.txt", fileContent, (err) => {
    if (err) {
      console.error(err);
    }
    // file written successfully
  });

  console.log(`Done!`);
}

run();
