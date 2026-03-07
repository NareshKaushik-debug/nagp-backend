const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const dotenv = require("dotenv");
const { connectMongo } = require("./db/mongo");
const catalogRoutes = require("./routes/catalog.routes");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const app = express();
const port = process.env.PORT || 4003;

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "catalog" });
});

app.use("/catalog", catalogRoutes);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Server error" });
});

connectMongo()
  .then(() => {
    app.listen(port, () => {
      console.log(`Catalog service listening on ${port}`);
    });
  })
  .catch((err) => {
    console.error("Mongo connection failed", err);
    process.exit(1);
  });
