import { Prisma, PrismaClient } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

app.post(`/post`, async (req, res) => {
  //create a new post and associate it with an author
  const { title, content, authorEmail } = req.body;
  const result = await prisma.post.create({
    data: {
      title: title,
      content: content,
      author: {
        connect: { email: authorEmail },
      },
    },
  });
  res.json(result);
});

app.put("/post/:id/views", async (req, res) => {
  const { id } = req.params;
  //update the view count field for a specific post
  try {
    const post = await prisma.post.update({
      where: { id: Number(id) },
      data: {
        viewCount: {
          increment: 1,
        },
      },
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
    const currentValue = await prisma.post.findUnique({
      where: { id: Number(id) },
    });

    const updatedPost = await prisma.post.update({
      where: { id: Number(id) },
      data: {
        published: !currentValue?.published,
      },
    });

    res.json(updatedPost);
  } catch (error) {
    res.json({ error: `Post with ID ${id} does not exist in the database` });
  }
});

app.delete(`/post/:id`, async (req, res) => {
  //delete the post
  const { id } = req.params;
  try {
    const post = await prisma.post.delete({
      where: { id: Number(id) },
    });
    res.json(post);
  } catch (error) {
    res
      .status(400)
      .json({ error: `Post with ID ${id} does not exist in the database` });
  }
});

app.get("/users", async (req, res) => {
  //return all the users
  const users = await prisma.user.findMany();
  res.json(users);
});

app.get("/user/:id/drafts", async (req, res) => {
  const { id } = req.params;
  //return all posts where the published field equals false
  try {
    const drafts = await prisma.post.findMany({
      where: {
        authorId: Number(id),
        published: false,
      },
    });
    res.json(drafts);
  } catch (error) {
    res.status(400).json({ error: `User with ID ${id} does not have drafts` });
  }
});

app.get(`/post/:id`, async (req, res) => {
  const { id }: { id?: string } = req.params;
  //return the post
  try {
    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
    });
    if (!post) {
      res
        .status(404)
        .json({ error: `Post with ID ${id} does not exist in the database` });
    } else {
      res.json(post);
    }
  } catch (error) {
    res.status(400).json({ error: "Unable to fetch post" });
  }
});

app.get("/feed", async (req, res) => {
  const { searchString, skip, take, orderBy } = req.query;
  // 1. return all posts where the published field is set to true.
  try {
    const posts = await prisma.post.findMany({
      where: {
        published: true,
        // 6. if the `searchString` parameter is not an empty, use the string to filter posts not matching the post titles or post content
        OR: [
          {
            title: { contains: searchString as string },
          },
          {
            content: { contains: searchString as string },
          },
        ],
      },
      // 2. return the associated author with the post
      include: { author: true },
      // 3. skip the amount of posts specified
      skip: Number(skip) || undefined,
      // 4. take the amount of posts specified
      take: Number(take) || undefined,
      // 5. order the posts by the field `updated_at` descending or ascending basesd on the parameter `orderBy`
      orderBy: {
        updatedAt: orderBy === "asc" ? "asc" : "desc",
      },
    });
    res.json(posts);
  } catch (error) {
    res.status(400).json({ error: "Unable to fetch feed" });
  }
});

const server = app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000`)
);
