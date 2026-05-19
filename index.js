import "dotenv/config";
import express from "express";
import fs from "fs";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();

// Init Database

const db = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: fs.readFileSync('/run/secrets/poe2_db_password', 'utf8').trim(),
});
try {
  await db.query("SELECT 1");
  console.log("Database connected successfully.");
} catch (err) {
  console.error("Database connection error:", err);
  process.exit(1);
}

app.use(bodyParser.urlencoded({ extended: true })); // Allows us to pass webpage information to the server
app.use(express.static("public")); // Allows use of static files with expressjs

app.get("/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.status(200).json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "down" });
  }
});

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

app.listen(3000);
