import { Prisma, PrismaClient } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

app.post(`/post`, async (req, res) => {
  //create a new post and associate it with an author
  const { title, content, authorEmail } = req.body;
  console.error("look: ", req.body)
  try{
    const result = await prisma.post.create({
      data: {
        title: title,
        content: content,
        published:false,
        author: {
          connect:{
              email: authorEmail
          }
        },
      }
    })
    res.json(result);
  } catch (err){
    console.error("Look :", err)
  }
});

app.put("/post/:id/views", async (req, res) => {
  const { id } = req.params;
  //update the view count field for a specific post
  try {
    const post = await prisma.post.update({
      where:{
        id: Number(id)
      },
      data:{
        viewCount:3
      }
    });

    res.json(post);
  } catch (error) {
    res.json({ error: `Post with ID ${id} does not exist in the database` });
  }
});

app.put("/publish/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // toggle the `published` field on the specified post
    const updatedPost = await prisma;

    res.json(updatedPost);
  } catch (error) {
    res.json({ error: `Post with ID ${id} does not exist in the database` });
  }
});

app.delete(`/post/:id`, async (req, res) => {
  //delete the post
  const { id } = req.params;
  try{
    const post = await prisma.post.delete({
      where:{
        id: Number(id)
      }
    });
    res.json({message:`The row with ${id} was delete, ${post}`});
  }catch(err){
    console.error("look:", err)
  }
});

app.get("/users", async (req, res) => {
  //return all the users
  try{
    const users = await prisma.user.findMany();
    res.json(users);
  }catch(err){
    console.error("Something happened", err)
  }
});

app.get("/user/:id/drafts", async (req, res) => {
  const { id } = req.params;
  //return all posts where the published field equals false
  try{
    const drafts = await prisma.user.findMany({
      where:{
        authorId: Number(id)
      },posts:{
        some:{
          published:false
        }
      }
    })
   res.json(drafts);
  } catch(err){
    console.error("something wrong: ", err)
  }
});

app.get(`/post/:id`, async (req, res) => {
  const { id }: { id?: string } = req.params;
  //return the post
  try{
    const post = await prisma.post.findUnique({
      where:{
        id: Number(id)
      }
    });
    res.json(post);
  }catch(err){
    console.error(err)
  }

});

app.get("/feed", async (req, res) => {
  const { searchString, skip, take, orderBy } = req.query;
  // 1. return all posts where the published field is set to true.
  // 2. return the associated author with the post
  // 3. skip the amount of posts specified
  // 4. take the amount of posts specified
  // 5. order the posts by the field `updated_at` descending or ascending basesd on the parameter `orderBy`
  // 6. if the `searchString` parameter is not an empty, use the string to filter posts not matching the post titles or post content
  try{
    const posts = await prisma.post.findMany({
      where:{
        published: true
      }
    });
    res.json(posts);
  }catch(err){
    console.error("check this error: ", err)
  }
});

const server = app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000`)
);
