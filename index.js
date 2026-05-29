import "dotenv/config";
import express from "express";
import fs from "fs";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();

let isReady = false;
let db;

app.use(bodyParser.urlencoded({ extended: true })); // Allows us to pass webpage information to the server
app.use(express.static("public")); // Allows use of static files with expressjs

app.get("/health", async (req, res) => {
    res.status(200).json({ ok: true, });
});

app.get("/ready", (req, res) => {
  if (!isReady) {
    return res.status(503).json({
      ready: false,
    });
  }

  res.status(200).json({
    ready: true,
  });
});

// Init Database

async function initDb() {
  db = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
  });

  await db.query("SELECT 1");
  console.log("Database connected successfully.")
}

/*
  These are the functions to pull all the information from the server
  and push it to lists that the ejs files can read from to display
  it for us
*/

async function getPlayerClasses() {
  const result = await db.query("SELECT * FROM class_list ORDER BY id ASC");
  let player_class = [];
  result.rows.forEach((p_class) => {
    player_class.push(p_class);
  });
  return player_class;
}

async function getSkills() {
  const result = await db.query("SELECT * FROM skill_gems ORDER BY id ASC");
  let skills = [];
  result.rows.forEach((skill) => {
    skills.push(skill);
  });
  return skills;
}

// Initial call to display main page
app.get("/", async (req, res) => {
  try {
    res.render("index.ejs");
    } catch (error) {
        console.error("Error rendering page:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Post request to randomly select a class from the database
app.post("/player_class", async (req, res) => {
  const player_class = await getPlayerClasses();
  const randomChoice = player_class[Math.floor(Math.random() * player_class.length)]
  try {
    res.render("index.ejs", {
        player_class: randomChoice,
    });
    } catch (error) {
        console.error("Error rendering page:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Post request to randomly select a skill gem from the database based on tier selected
app.post("/skill-choice", async (req, res) => {
  const skill_tier = req.body.skill_tier;
  const skills = await getSkills();
  const filteredSkills = skills.filter(skill => skill.skill_tier == skill_tier);
  const randomChoice = filteredSkills[Math.floor(Math.random() * filteredSkills.length)];
  try {
    res.render("index.ejs", {
        skill: randomChoice,
    });
    } catch (error) {
        console.error("Error rendering page:", error);
        res.status(500).send("Internal Server Error");
    }
});

async function start() {
  try {
    console.log("Starting service...");

    console.log("Connecting database...");
    await initDb();

    console.log("Running startup tasks...");

    isReady = true;

    console.log("Service ready.");

    app.listen(3000, () => {
      console.log("Server listening on port 3000");
    });
  } catch (err){
    console.error("Startup failure: ", err);
    process.exit(1);
  }
}

start();
