const express = require("express");
const { join } = require("path");
const { magenta, yellow } = require("kleur");

const functionName = process.argv[2];

if (!functionName) {
  console.error("please provide your function's name!");
  process.exit(1);
}

const functionSource = require(join('../functions', process.argv[2]));

const cloudFunction = Object.values(functionSource)[0];

const leftPad = value => String(value).padStart(2, '0');

const getDate = () => {
  const now = new Date();
  const date = [now.getFullYear(), now.getMonth(), now.getDate()].map(leftPad).join('-');
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(leftPad).join(':');
  return `[${date} ${time}]`;
};

const log = (req, res, next) => {
  const parts = [
    yellow(getDate()),
    magenta(req.method),
    req.path,
  ];

  if (Object.keys(req.query).length) {
    parts.push("query: " + JSON.stringify(req.query));
  }

  if (Object.keys(req.body).length) {
    parts.push("body: " + JSON.stringify(req.body));
  }

  console.log(parts.join(" "));
  next();
}

const app = express();

app.use(express.json());
app.use(log);
app.use(cloudFunction);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`listening on port ${PORT}`));
