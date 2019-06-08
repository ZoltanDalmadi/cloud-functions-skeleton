const fs = require('fs-extra');
const path = require('path');
const cp = require('child_process');

const funcName = process.argv[2];

if (!funcName) {
  console.err("please provide your function's name!");
  process.exit(1);
}

const funcDir = path.join('functions', funcName);
const distDir = path.join(funcDir, 'dist');

const readFiles = funcDir => fs.readdirSync(funcDir).map(file => path.join(funcDir, file))
const skipUnnecessary = files => files
  .filter(file => !file.endsWith('package.json') || !file.endsWith('spec.js') || file !== ('.gcloud.json'));

const copyFiles = (filesToCopy, dest) => {
  filesToCopy.forEach(file => {
    const stream = fs.createReadStream(file);
    const outstream = fs.createWriteStream(path.join(dest, path.basename(file)));
    stream.pipe(outstream);
  });
};

const stripPackage = (functionDir, dest) => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(functionDir, 'package.json'), 'utf8'));

  delete packageJson.author;
  delete packageJson.scripts;
  delete packageJson.description;
  delete packageJson.devDependencies;

  fs.writeFileSync(path.join(dest, 'package.json'), JSON.stringify(packageJson, null, 2));
};

const ensureDistDir = distDir => {
  if (fs.existsSync(distDir)) {
    fs.removeSync(distDir);
  }

  fs.mkdirSync(distDir);
};

const deployArgs = (funcDir, funcName) => {
  const configFile = path.join(funcDir, '.gcloud.json');

  const {
    runtime = 'nodejs8',
    region = 'europe-west1',
    memory = '256MB',
    trigger = 'http'
  } = JSON.parse(fs.existsSync(configFile) ? fs.readFileSync(configFile, 'utf8') : '{}');

  return [
    'functions',
    'deploy', funcName,
    '--runtime', runtime,
    '--region', region,
    '--memory', memory,
    `--trigger-${trigger}`
  ];
};

const filesToCopy = skipUnnecessary(readFiles(funcDir));

ensureDistDir(distDir);
copyFiles(filesToCopy, distDir);
stripPackage(funcDir, distDir);

const args = deployArgs(funcDir, funcName);
const instance = cp.spawn('gcloud', args, { cwd: distDir, stdio: 'inherit' });

instance.on('exit', () => fs.removeSync(distDir));
