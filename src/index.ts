import { PrismaClient } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

app.post(`/post`, async (req, res) => {
  const { title, content, authorEmail } = req.body;

  try {
    const result = await prisma.post.create({
      data: {
        title,
        content,
        author: {
          connect: { email: authorEmail },
        },
      },
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: "Error creating post" });
  }
});

app.put("/post/:id/views", async (req, res) => {
  const { id } = req.params;

  try {
    const post = await prisma.post.update({
      where: { id: Number(id) },
      data: { viewCount: { increment: 1 } },
    });
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: `Post with ID ${id} does not exist in the database` });
  }
});

app.put("/publish/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const updatedPost = await prisma.post.update({
      where: { id: Number(id) },
      data: { published: true },
    });
    res.json(updatedPost);
  } catch (error) {
    res.status(400).json({ error: `Post with ID ${id} does not exist in the database` });
  }
});

app.delete(`/post/:id`, async (req, res) => {
  const { id } = req.params;

  try {
    const post = await prisma.post.delete({
      where: { id: Number(id) },
    });
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: `Post with ID ${id} does not exist in the database` });
  }
});

app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.get("/user/:id/drafts", async (req, res) => {
  const { id } = req.params;

  try {
    const drafts = await prisma.post.findMany({
      where: {
        authorId: Number(id),
        published: false,
      },
    });
    res.json(drafts);
  } catch (error) {
    res.status(400).json({ error: `User with ID ${id} does not exist in the database` });
  }
});

app.get(`/post/:id`, async (req, res) => {
  const { id } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
    });
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: `Post with ID ${id} does not exist in the database` });
  }
});

app.get('/feed', async (req, res) => {
  const { searchString, skip, take, orderBy } = req.query;

  try {
    
    const search = searchString ? String(searchString) : undefined;

    const where = {
      published: true,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const posts = await prisma.post.findMany({
      where,
      include: { author: true },
      skip: skip ? Number(skip) : 0,
      take: take ? Number(take) : 10,
      orderBy: {
        updatedAt: orderBy === 'asc' ? 'asc' : 'desc',
      },
    });

    res.json(posts);
  } catch (error) {
    res.status(400).json({ error: 'Error fetching feed' });
  }
});

const server = app.listen(3000, () => {
  console.log(`🚀 Server ready at: http://localhost:3000`);
});
