import express from "express";
import parser from "body-parser";
import fs from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;

app.use(parser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("login.ejs", {
        method: "get"
    });
});

app.get("/home", (req, res) => {
    res.render("home.ejs");
});

app.post("/home", (req, res) => {
    // res.sendStatus(401);
    if(req.body["username"] == "Akash" && req.body["password"] == "1234"){
        res.render("home.ejs");
    } else {
        res.render("login.ejs", {
            message: "🚫 Bad Credentials",
            method: "post"
        }); 
    }
});

app.get("/home/view", (req, res) => {
    res.render("view.ejs");
});

app.get("/home/create", (req, res) => {
    fs.readdir(__dirname + '/views/posts', (err, files) => {
        if (err) throw err;
        const postIds = files.map(file => parseInt(file.match(/post(\d+)\.ejs/)[1]));
        const nextPostId = Math.max(...postIds) + 1;

        fs.open(__dirname + `/views/posts/post${nextPostId}.ejs`, 'w', function (err, file) {
            if (err) throw err;
            res.render("create.ejs", {str: "/home/create/post"+nextPostId });
        });
    });
    // postId++;
    // asynchronous nature of Node.js and how the post number is being incremented before the form is rendered
});

app.post("/home/create/:postId", (req, res) => {

    // console.log(req.params);
    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    const dateObj = new Date();
    const month   = dateObj.toLocaleString('default', { month: 'long' });;
    const year    = dateObj.getUTCFullYear();

    // console.log(req.body.content);
    const postBody1 = 
    `<%- include("../header.ejs"); %>

    <h1>${title}</h1>
    <h2>${month} ${year}</h2>
    <p>`;

    const postBody2 =
    `
    </p>

    <form action="/home/view/${postId}/edit" method="GET">
        <button type="submit" class="edit post">Edit Post</button>
    </form>

    <form action="/home/view/${postId}/delete" method="GET">
        <button type="submit" class="delete post">Delete Post</button>
    </form>

    <%- include("../footer.ejs") %>`;

    const updatedContent = postBody1 + content + postBody2;

    fs.writeFile(__dirname + `/views/posts/${postId}.ejs`, updatedContent, 'utf8', (err) => {
        if (err) {
            return res.status(500).send("Error writing file");
        }
        else{
            fs.readFile(__dirname + `/views/view.ejs`, 'utf8', (err, data) => {
                if (err) {
                    return res.status(500).send('Error reading view.ejs');
                }

                // Define the new post content to be added
                const newPostContent = `<div class="${postId}">
        <a href="view/${postId}">${title}</a>
    </div>
        `;

                // Find the position to insert the new post content
                const insertionPoint = data.indexOf('</div> <%- include("footer.ejs") %>');
                const updatedViewContent = data.slice(0, insertionPoint) + newPostContent + data.slice(insertionPoint);

                // Write the updated content back to view.ejs
                fs.writeFile(__dirname + `/views/view.ejs`, updatedViewContent, 'utf8', (err) => {
                    if (err) {
                        return res.status(500).send('Error writing view.ejs');
                    }
                });
            });
            res.redirect(`/home/view`);
        }
    });
});


app.get("/home/view/:postId", (req, res) => {
    const postId = req.params.postId;
    res.render(`./posts/${postId}.ejs`);
});

app.get("/home/view/:postId/edit", (req, res) => {
    const postId = req.params.postId;
    fs.readFile(__dirname + `/views/posts/${postId}.ejs`, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send("Error reading file");
        }
        else{
            const startPoint = data.indexOf('<p>') + 3;     //* to avoid <p>
            const endPoint = data.indexOf('</p>');
            const presentContent = data.slice(startPoint, endPoint);
            res.render("edit.ejs", { postContent: presentContent, str: "/home/view/"+postId+"/edit"});
        }
    });
});

app.post("/home/view/:postId/edit", (req, res) => {
    const postId = req.params.postId;
    // console.log(postId);
    // console.log(req.body.content);
    fs.readFile(__dirname + `/views/posts/${postId}.ejs`, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading view.ejs');
        }
        else{
            const newContent = req.body.content;
            const startPoint = data.indexOf('<p>') + 3;
            const insertionPoint = data.indexOf('</p>');
            const updatedContent = data.slice(0, startPoint) + newContent + data.slice(insertionPoint);
        
            fs.writeFile(__dirname + `/views/posts/${postId}.ejs`, updatedContent, 'utf8', (err) => {
                if (err) {
                    return res.status(500).send("Error writing file");
                }
            });
            res.redirect(`/home/view/${postId}`);
        }
    });
});

app.get("/home/view/:postId/delete", (req, res) => {
    const postId = req.params.postId;
    var filePath = __dirname + `/views/posts/${postId}.ejs`; 
    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).send("Error deleting file");
        }
        else {
            fs.readFile(__dirname + `/views/view.ejs`, 'utf8', (err, data) => {
                if (err) {
                    return res.status(500).send("Error reading view.ejs");
                }

                const postDivRegex = new RegExp(`<div class="${postId}">[\\s\\S]*?<\\/div>`, 'g');
                const updatedViewContent = data.replace(postDivRegex, '');

                fs.writeFile(__dirname + `/views/view.ejs`, updatedViewContent, 'utf8', (err) => {
                    if (err) {
                        return res.status(500).send("Error writing view.ejs");
                    }
                // res.render("view.ejs", { deleted: "yes"});
                });
            });
            res.redirect("/home/view");
        }
    });



//     fs.readFile(__dirname + `/views/view.ejs`, 'utf8', (err, data) => {
//         if (err) {
//             return res.status(500).send('Error reading view.ejs');
//         }

//         // Define the new post content to be added
//         const newPostContent = `    <div class="${postId}">
//     <% if(deleted == "yes") { %> 
                    
//     <% } else { %> 
//         <a href="view/${postId}">${title}</a>
//     <% } %>
// </div>
// `;

//         // Find the position to insert the new post content
//         const insertionPoint = data.indexOf('</div> <%- include("footer.ejs") %>');
//         const updatedViewContent = data.slice(0, insertionPoint) + newPostContent + data.slice(insertionPoint);

//         // Write the updated content back to view.ejs
//         fs.writeFile(__dirname + `/views/view.ejs`, updatedViewContent, 'utf8', (err) => {
//             if (err) {
//                 return res.status(500).send('Error writing view.ejs');
//             }
//             res.render(`view.ejs`, {deleted: "no"});
//         });
//     });
// });
// res.redirect(`/home/view`);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});