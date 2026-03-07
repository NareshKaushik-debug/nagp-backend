const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const dotenv = require("dotenv");
const { createProxyMiddleware } = require("http-proxy-middleware");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const app = express();
const port = process.env.PORT || 4000;

const corsOrigin = process.env.CORS_ORIGIN || "*";

app.use(helmet());
const corsOptions =
  corsOrigin === "*"
    ? { origin: true }
    : { origin: corsOrigin, credentials: true };

app.use(cors(corsOptions));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "gateway" });
});

const authTarget = process.env.AUTH_SERVICE_URL || "http://localhost:4001";
const userTarget = process.env.USER_SERVICE_URL || "http://localhost:4002";
const catalogTarget =
  process.env.CATALOG_SERVICE_URL || "http://localhost:4003";

app.use(
  "/auth",
  createProxyMiddleware({
    target: authTarget,
    changeOrigin: true,
    pathRewrite: (path) => `/auth${path}`
  })
);

app.use(
  "/users",
  createProxyMiddleware({
    target: userTarget,
    changeOrigin: true,
    pathRewrite: (path) => `/users${path}`
  })
);

app.use(
  "/catalog",
  createProxyMiddleware({
    target: catalogTarget,
    changeOrigin: true,
    pathRewrite: (path) => `/catalog${path}`
  })
);

app.listen(port, () => {
  console.log(`API Gateway listening on ${port}`);
});
