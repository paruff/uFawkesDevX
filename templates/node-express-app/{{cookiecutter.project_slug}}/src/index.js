const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "{{ cookiecutter.project_name }} is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

if (require.main === module) {
  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log(`listening on ${port}`));
}

module.exports = app;
