import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 3000;
const URL = "https://openlibrary.org";
const imgURL = "https://covers.openlibrary.org/b/id/";

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "library",
    password: "xxxxxx",
    port: 5432
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/" , async(req, res) => {
    const result = await db.query("SELECT * FROM book");
    let books = result.rows;
    
    const result0 = await db.query("SELECT * FROM author");
    let author = result0.rows;

    res.render("index.ejs", {books: books , author: author});
});

app.post("/submit" , async(req, res) => {
    let bookName = req.body["bookName"];

    const titleArray = bookName.split(" ");
    let searchURL = "";
    for(let i = 0; i < titleArray.length ; i++){
        if(i === (titleArray.length - 1)){
            searchURL = searchURL + titleArray[i];
        } else {
            searchURL = searchURL + titleArray[i] + "+";
        }
    }
    
    const response1 = await axios.get(URL + "/search.json?title=" + searchURL);
    const result1 = response1.data;
    const api_id = result1.docs[0].key;
    const title = result1.docs[0].title;

    const response2 = await axios.get(URL + api_id);
    const result2 = response2.data;
    const author_id = result2.authors[0].author.key;
    
    const response3 = await axios.get(URL + author_id);
    const result3 = response3.data;
    const author_name = result3.name;
    const author_bio = result3.bio;
    const photo_id = result3.photos[0];
    const photo_URL = imgURL + photo_id + ".jpg";

    const result5 = await db.query("SELECT * from author WHERE name = $1 AND bio = $2;" ,
    [author_name, author_bio]);
    let author1 = result5.rows;

    if(author1.length === 0){
        await db.query("INSERT INTO author (name, bio, photo_id, photo_url) VALUES ($1, $2, $3, $4) RETURNING id;",
        [author_name, author_bio, photo_id, photo_URL]);
    }

    const result4 = await db.query("SELECT id FROM author WHERE name = $1",
    [author_name]);
    const authorID = result4.rows[0].id;

    const rating = req.body["rating"];
    const review = req.body["review"];

    const result6 = await db.query("SELECT * from book WHERE title = $1;" ,
    [title]);
    let books1 = result6.rows;

    if(books1.length === 0){
        await db.query("INSERT INTO book (title, rating, review, author_id) VALUES($1, $2, $3, $4);",
    [title, rating, review, authorID]);
    }

    const result = await db.query("SELECT * FROM book");
    let books = result.rows;
    
    const result0 = await db.query("SELECT * FROM author");
    let author = result0.rows;

    res.render("index.ejs", {books: books , author: author});
    
});

app.post("/" , async(req, res) => {
    res.redirect("/");
});

app.post("/contact" , async(req, res) => {
    res.render("contact.ejs");
});

app.post("/about" , async(req, res) => {
    res.render("about.ejs");
});

app.post("/add" , async(req, res) => {
    res.render("new.ejs");
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});