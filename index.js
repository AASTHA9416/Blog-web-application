import express from "express";
import ejs from "ejs";
import fs from "fs";
import { error } from "console";
import { v4 as uuidv4 } from 'uuid';


const app=express();
const port=3000;

var arr=[];

app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));

app.get("/",(req,res)=>{
    res.render("home.ejs");
});

app.get("/create_blog",(req,res)=>{
  res.render("Create_blog.ejs");
});

app.get("/about",(req,res)=>{
res.render("about.ejs");
});


app.post("/create",(req,res)=>{
   const newblog={
    id:uuidv4(),
    name:req.body["name"],
    blogCategory:req.body["blogCategory"],
    blog:req.body["userBlog"]
} 
    arr.push(newblog);
    console.log(`arr ${arr.length}`);
    let filename;
    if(req.body["blogCategory"]==="web"){
      filename= "web_development.txt";
      
    }else{
        filename="cloud_computing.txt";
    }

    const blogDateString=JSON.stringify(newblog)+'\n';
    fs.appendFile(filename,blogDateString,(err) => {
  if (err) throw err;
  console.log("The file has been saved!");
  fs.appendFile("user_blogs.txt",blogDateString,(err)=>{
      if(err) throw err;
      console.log("successfully added a new blog");
      
          fs.readFile("user_blogs.txt","utf8",(err,data)=>{
              let posts=[];
              if(err){
                  console.log("there is no post");
              }
              else{
                  if (data) { // Check to make sure data is not empty
                      posts = data.trim().split('\n').map(line => JSON.parse(line));
                  }
              }
              console.log(`post ${posts}`);
              res.render("user_blog_stack.ejs",{
                  arr:posts
              });
          })
  })
} 
)
   
})

app.get("/your_blogs",(req,res)=>{
     let alertMessage = null; 
    if (req.query.status === "deleted") {
        alertMessage = "Post deleted successfully!";
    }
          fs.readFile("user_blogs.txt","utf8",(err,data)=>{
        let posts=[];
        if(err){
            console.log("there is no post");
        }
        else{
            if(data){

               posts = data.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
            }
        }
        res.render("user_blog_stack.ejs",{
            arr:posts,
            alertMessage:alertMessage
        });
    })
 

});

app.get("/contact",(req,res)=>{
    res.render("contact.ejs");
})

app.get("/web_development",(req,res)=>{

    fs.readFile("web_development.txt","utf8",(err,data)=>{
        let posts=[];
        if(err){
            console.log("there is no post");
        }
        else{
            if (data) { // Check to make sure data is not empty
                posts = data.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
            }
        }
        console.log(`post ${posts}`);
        res.render("./technologies_stack/web_development.ejs",{
            arr:posts
        });
    });
    
});

app.get("/cloud",(req,res)=>{
     fs.readFile("cloud_computing.txt","utf8",(err,data)=>{
        let posts=[];
        if(err){
            console.log("there is no post");
        }
        else{
            posts=data.trim().split('\n').filter(Boolean).map(line=>JSON.parse(line));
        }
        res.render("./technologies_stack/cloud_computing.ejs",{
            arr:posts,
        });
    })
 
})

app.get("/edit/:id",(req,res)=>{
  const blogId=req.params.id;
 
 fs.readFile("user_blogs.txt", "utf8", (err, data) => {
        if (err) {
            return res.status(500).send("Error reading blog data.");
        }
        
        const allPosts = data.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
        const postToEdit = allPosts.find(p => p.id === blogId);

        if (!postToEdit) {
            return res.status(404).send("Blog post not found");
        }
  res.render("edit.ejs",{
      
     id:blogId,
     blog:postToEdit
  }
  )})
});

app.post("/edit/:id", (req, res) => {
    const blogId = req.params.id;
    const updatedPost = {
        id: blogId,
        name: req.body.name,
        blogCategory: req.body.blogCategory,
        blog: req.body.userBlog
    };

    // Using sync functions here for simplicity in a learning project.
    
    try {
        const masterFilePath = "user_blogs.txt";
        const masterData = fs.readFileSync(masterFilePath, "utf8"); 
        let allPosts = masterData.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));

        const postIndex = allPosts.findIndex(p => p.id === blogId);

        if (postIndex === -1) {
            return res.status(404).send("Post to edit not found.");
        }
        
        // Update the post in the array
        allPosts[postIndex] = updatedPost;

        // Separate and write back to all files
        const webPosts = allPosts.filter(p => p.blogCategory === "web");
        const cloudPosts = allPosts.filter(p => p.blogCategory === "cloud");

        fs.writeFileSync("web_development.txt", webPosts.map(p => JSON.stringify(p)).join('\n') + '\n');
        fs.writeFileSync("cloud_computing.txt", cloudPosts.map(p => JSON.stringify(p)).join('\n') + '\n');
        fs.writeFileSync(masterFilePath, allPosts.map(p => JSON.stringify(p)).join('\n') + '\n');

        console.log("All post files updated successfully!");

        //redirect
        res.redirect("/your_blogs");

    } catch (err) {
        console.error("Error updating post:", err);
        res.status(500).send("Failed to update post.");
    }
});


app.get("/delete/:id", (req, res) => {
    const blogId = req.params.id;

    try {
       
        const masterFilePath = "user_blogs.txt";
        const masterData = fs.readFileSync(masterFilePath, "utf8");
        let allPosts = masterData.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));

        
        // Create a new array that includes every post EXCEPT the one with the matching ID.
        const remainingPosts = allPosts.filter(p => p.id !== blogId);

        // Optional: Check if a post was actually deleted
        if (allPosts.length === remainingPosts.length) {
            return res.status(404).json({ message: "Post to delete not found." });
        }

        // SEPARATE AND WRITE BACK 
        const webPosts = remainingPosts.filter(p => p.blogCategory === "web");
        const cloudPosts = remainingPosts.filter(p => p.blogCategory === "cloud");

        fs.writeFileSync("web_development.txt", webPosts.map(p => JSON.stringify(p)).join('\n') + '\n');
        fs.writeFileSync("cloud_computing.txt", cloudPosts.map(p => JSON.stringify(p)).join('\n') + '\n');
        fs.writeFileSync(masterFilePath, remainingPosts.map(p => JSON.stringify(p)).join('\n') + '\n');

      
        
        //  delete route
res.redirect("/your_blogs?status=deleted");
       

      

    } catch (err) {
        console.error("Error deleting post:", err);
        res.status(500).json({ message: "Failed to delete post." });
    }
});


app.listen(port,()=>{
    console.log(`server is running on port ${port}`);
});

