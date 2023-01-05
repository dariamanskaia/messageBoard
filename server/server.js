const express = require("express");
const app = express();
const cors = require("cors");
const { connectToDB } = require("./src/db");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const bodyParser = require("body-parser");
const { ObjectId } = require("mongodb");
require("dotenv").config();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(cors());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.get("/", (req, res) => {
  const counter = parseInt(req.query.counter);

  console.log(req.params);
  res.send({ data: counter + 1 });
});

// Create
app.post("/sendMessage", async (req, res) => {
  try {
    const { userId, label, labelDropdown, body, severity, acknowledge } = req.body;

    if (!userId || !label || !body) {
      throw "Undefined variables";
    }
    console.log("TRIGGERED sendMessage");

    const dbConnection = await connectToDB();
    const dbMessagesCollection = dbConnection.db.collection("messages");

    await dbMessagesCollection.insertOne({
      userId,
      label,
      labelDropdown,
      body,
      severity,
      acknowledge,
      createdAt: new Date(),
    });
    console.log("Database row inserted!");

    await dbConnection.client.close();
    console.log("Database closed");

    res.status(200).json({
      data: "Database row inserted",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error });
  }
});

// Read
app.get("/getMessages", async (req, res) => {
  try {
    console.log("TRIGGERED getMessages");
    const dbConnection = await connectToDB();

    const dbMessagesCollection = dbConnection.db.collection("messages");
    const data = await dbMessagesCollection.find({}).toArray();

    await dbConnection.client.close();
    console.log("Database closed");

    res
      .json({
        data,
      })
      .status(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error });
  }
});

// Delete
app.delete("/deleteMessage", async (req, res) => {
  const dbConnection = await connectToDB();

  try {
    const { data } = req.body;

    if (!dbConnection){ throw("Error while connecting to database.") }
    if (!data) { throw "Undefined data"; }

    console.log("TRIGGERED deleteMessage", data);
    const dbMessagesCollection = dbConnection.db.collection("messages");

    const mongoDbReadyData = {
      _id: {
        $in: data.map(v => ObjectId(v))
      }
    };

    console.log(mongoDbReadyData)
    const deleteRow = process.env.MODE === "dev" ? {
      acknowledged: true,
      deletedCount: 1
    } : await dbMessagesCollection.deleteMany(mongoDbReadyData);

    if (!deleteRow.acknowledged || deleteRow.deletedCount !== data.length){
      throw "An error occurred while deleting the row from DB."
    }
    console.log("Database rows deleted", deleteRow, data.length);

    await dbConnection.client.close();
    console.log("Database closed");
    res
      .status(200).json({
        data: "Database rows deleted",
      })
  } catch (error) {
    console.error(error);
    res.status(500).json({ error });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
