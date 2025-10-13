import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = process.env.APP_PORT;

// Init Database

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_URL,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
try {
  db.connect();
  console.log("Database connected successfully.");
} catch (err) {
  console.error("Database connection error:", err.stack);
  process.exit(1); // Exit the application if the database connection fails
}

app.use(bodyParser.urlencoded({ extended: true })); // Allows us to pass webpage information to the server
app.use(express.static("public")); // Allows use of static files with expressjs

/*
  This is the function to pull all the information from the server
  and push it to a list that the ejs files can read from to display
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
  const classList = await getPlayerClasses();
  const skillList = await getSkills();
  try {
    res.render("index.ejs", {
        classList: classList,
        skillItems: skillList,
    });
    } catch (error) {
        console.error("Error rendering page:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});