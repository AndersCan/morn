const http = require("http");

const requestListener = function (req, res) {
  res.writeHead(200);
  res.end("Hello, World!");
  console.log("handled request for ", req.url);
};

const server = http.createServer(requestListener);
server.listen(8080);
console.log("listening to http://localhost:8080");
