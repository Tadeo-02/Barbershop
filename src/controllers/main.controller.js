const path = require("path");

//const index = (req, res) => {
//  res.render("index");
//};

const privated = (req, res) => {
  // console.log(__dirname)
  res.sendFile(path.resolve(__dirname, "../../index.html"));
};

module.exports = {
  // index,
  privated,
};
