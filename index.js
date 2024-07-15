const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wdiwjgo.mongodb.net`;

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
// Hi are you seeing this screen clearly:
//hi are you seeing this screen clearly 
// then let me check for this site view/
// hello i hope you are well by the grace of allah
// Can you give me some of foods i like this so much
// this is my video tutorial journey i love this session very much well and par 

const verfyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log(token);
  if (!token) {
    res.status(401).send({ message: "Not authorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: error.message });
    }
    req.user = decoded;
    next();
  });
};

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://book-haven-six.vercel.app",
      "book-haven-bba9e.firebaseapp.com",
    ],
    credentials: true,
  })
);

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};
async function run() {
  try {
    // await client.connect();
    const database = client.db("bookItem");
    const itemCollection = database.collection("Items");
    const bookCollection = database.collection("books");

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("user for token", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
      console.log(token);
      res
        .cookie("token", token, cookieOptions)
        .send({ success: true });
    });

    app.get("/logout", async (req, res) => {
      res
        .clearCookie("token", {...cookieOptions, 
          maxAge: 0,
        })
        .send({ success: true });
    });

    app.post("/items",  async (req, res) => {
      const newItem = req.body;
      const result = await itemCollection.insertOne(newItem);
      res.send(result);
    });


    app.get("/items",  async (req, res) => {
      const cursor = itemCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });


    app.get("/items/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await itemCollection.findOne(query);
      res.send(result);
    });

    app.get("/data/:category", async (req, res) => {
      const category = req.params.category;
      const query = { category: category };
      const result = await itemCollection.find(query).toArray();
      res.send(result);
    });

    app.put("/borrowedBook/:id", async (req, res) => {
      const borrowedBookId = req.params.id;
      const updateBorrewdBook = await itemCollection.updateOne(
        { _id: new ObjectId(borrowedBookId) },
        { $inc: { quantity: -1 } }
      );

      console.log(updateBorrewdBook);
    });

    app.put("/getreturn/:id", async (req, res) => {
      const returnBookId = req.params.id;

      const updateBorrowedBook = await itemCollection.findOneAndUpdate(
        { _id: new ObjectId(returnBookId) },
        { $inc: { quantity: 1 } },
        { returnOriginal: false }
      );
      res.send(updateBorrowedBook);
      console.log(updateBorrowedBook);
    });

    app.post("/borrowed", async (req, res) => {
      const newItem = req.body;
      console.log(newItem);
      const result = await bookCollection.insertOne(newItem);
      res.send(result);
    });

    app.get("/getbrrowedbook/:email", async (req, res) => {
      const email = req.params.email;
      const query = { user_email: email };
      const cursor = await bookCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.delete("/return/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollection.deleteOne(query);
      res.send(result);
    });

    // update
    app.get("/items/update/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await itemCollection.findOne(query);
      res.send(result);
    });
    app.put("/updateItem/:id", async (req, res) => {
      const id = req.params.id;
      const item = req.body;
      const query = { _id: new ObjectId(id) };
      const data = {
        $set: {
          image: item.image,
          name: item.name,
          // quantity: item.quantity,
          rating: item.rating,
          description: item.description,
          category: item.category,
        },
      };
      const result = await itemCollection.updateOne(query, data);
      
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Start Server ");
});

app.listen(port, () => {
  console.log(`Server is Runnig ${port}`);
});
