
import express from "express";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;

const db = new pg.Client({
    user: "books_owner",
    host: "ep-fancy-cake-a1ft9kx1.ap-southeast-1.aws.neon.tech",
    database: "books",
    password: "a19CpbKHocxM",
    ssl: true,
    port: 5432,
});
db.connect()
    .then(() => {
        console.log('Connected to the database');

        const createTableQuery = `
        CREATE TABLE IF NOT EXISTS booksNew (
            id SERIAL PRIMARY KEY,
            book_name TEXT,
            author TEXT,
            serial_number TEXT,
            rating INT
        );
    `;

        return db.query(createTableQuery);
    })
    ;

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.render("index.ejs");
});
app.get("/new", (req, res) => {
    res.render("new.ejs");
});

app.get("/books", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM booksNew");
        const books = result.rows;

        res.render("books.ejs", { books });
    } catch (error) {
        console.error("Error fetching books:", error);
        res.status(500).send("Error fetching books");
    }
});

app.post("/search", async (req, res) => {
    let bookName = req.body.book_name;

    const API_URL = `https://openlibrary.org/search.json?q=${bookName}&limit=10`;
    try {

        let result = await axios.get(API_URL);
        let data = result.data;

        const books = data.docs.map((book) => {
            const isbn = book.isbn && book.isbn[0];
            return {
                title: book.title,
                author: book.author_name,
                isbn,
                rating: book.average_rating !== null ? book.average_rating : 0,
                cover: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : "no-cover.jpg",
            };
        });
        res.render("search.ejs", {
            books

        });
    } catch (error) {
        console.error("Error fetching book data:", error);
        res.redirect("index.ejs", {
            content: null,
            error: "Error fetching book data",
        });
    }
});



app.post("/addFromSearch", (req, res) => {
    const title = req.body.newTitle
    const author = req.body.newAuthor
    const rating = req.body.rating
    const serial_number = req.body.newISBN


    try {
        db.query(`INSERT INTO booksNew (book_name, author,rating ,serial_number )
        VALUES ($1, $2, $3, $4)`, [title, author, rating, serial_number], (error, result) => {
            if (error) {
                console.error("Error inserting book:", error);
                res.status(500).send("Error inserting book");
                res.redirect("/")
            } else {
                console.log("Book inserted successfully");
                res.redirect("/books");
            }
        })



    } catch (error) {
        console.error(error);
        res.status(500)
        res.redirect("/new")
    }
})
app.post("/add", (req, res) => {
    const title = req.body.book_name
    const author = req.body.author
    const rating = req.body.rating
    const serial_number = req.body.serial_number


    try {
        db.query(`INSERT INTO booksNew (book_name, author,rating ,serial_number )
        VALUES ($1, $2, $3, $4)`, [title, author, rating, serial_number], (error, result) => {
            if (error) {
                console.error("Error inserting book:", error);
                res.status(500).send("Error inserting book");
                res.redirect("/")
            } else {
                console.log("Book inserted successfully");
                res.redirect("/books");
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500)
        res.redirect("/new")
    }
})

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});