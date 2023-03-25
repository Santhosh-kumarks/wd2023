// const request = require("supertest");

// const db = require("../models/index");
// const app = require("../app");
// let server;
// let agent;

// describe("Test case for database", () => {
//   beforeAll(async () => {
//     await db.sequelize.sync({ force: true });
//     server = app.listen(3000, () => {});
//     agent = request.agent(server);
//   });

//   afterAll(async () => {
//     try {
//       await db.sequelize.close();
//       await server.close();
//     } catch (error) {
//       console.log(error);
//     }
//   });

//   test("Creates a todo and responds with json at /todos POST endpoint", async () => {
//     const response = await agent.post("/todos").send({
//       title: "Buy a car",
//       dueDate: new Date().toISOString(),
//       completed: false,
//     });
//     expect(response.statusCode).toBe(200);
//     expect(response.header["content-type"]).toBe(
//       "application/json; charset=utf-8"
//     );
//     const parsedResponse = JSON.parse(response.text);
//     expect(parsedResponse.id).toBeDefined();
//   });

//   test("Mark todo as a completed", async () => {
//     const res = await agent.post("/todos").send({
//       title: "Do HomeWork",
//       dueDate: new Date().toISOString(),
//       completed: false,
//     });
//     const parseResponse = JSON.parse(res.text);
//     const todoID = parseResponse.id;
//     expect(parseResponse.completed).toBe(false);

//     const changeTodo = await agent
//       .put(`/todos/${todoID}/markAsCompleted`)
//       .send();
//     const parseUpadteTodo = JSON.parse(changeTodo.text);
//     expect(parseUpadteTodo.completed).toBe(true);
//   });

//   test("Fetches all todos in the database using /todos endpoint", async () => {
//     await agent.post("/todos").send({
//       title: "Buy xbox",
//       dueDate: new Date().toISOString(),
//       completed: false,
//     });
//     await agent.post("/todos").send({
//       title: "Buy ps3",
//       dueDate: new Date().toISOString(),
//       completed: false,
//     });
//     const response = await agent.get("/todos");
//     const parsedResponse = JSON.parse(response.text);

//     expect(parsedResponse.length).toBe(4);
//     expect(parsedResponse[3]["title"]).toBe("Buy ps3");
//   });

//   test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
//     // FILL IN YOUR CODE HERE
//     const response = await agent.post("/todos").send({
//       title: "Buy viedo",
//       dueDate: new Date().toISOString(),
//       completed: false,
//     });
//     const parsedResponse = JSON.parse(response.text);
//     const todoID = parsedResponse.id;

//     const res = await agent.delete(`/todos/${todoID}`).send();
//     const boole = Boolean(res.text);
//     expect(boole).toBe(true);
//   });
// });








const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;

const extractCSRFToken = (html) => {
  const $ = cheerio.load(html);
  return $("[name=_csrf]").val();
};

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(5000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Creates a  new todo", async () => {
    const { text } = await agent.get("/");
    const csrfToken = extractCSRFToken(text);

    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Marks a todo complete with the given ID", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCSRFToken(res.text);
    await agent.post("/todos").send({
      title: "Wash Dishes",
      dueDate: new Date().toISOString(),
      _csrf: csrfToken,
    });

    const groupTodo = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedResponses = JSON.parse(groupTodo.text);
    const lastItem = parsedResponses[parsedResponses.length - 1];

    res = await agent.get("/");
    csrfToken = extractCSRFToken(res.text);

    const mark_as_Completed = await agent.put(`/todos/${lastItem.id}`).send({
      _csrf: csrfToken,
      completed: true,
    });

    const parsedUpdateResponse = JSON.parse(mark_as_Completed.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });

  test("Deletes a todo with the given ID", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCSRFToken(res.text);

    await agent.post("/todos").send({
      title: "Complete levels",
      dueDate: new Date().toISOString(),
      _csrf: csrfToken,
    });

    const response = await agent.get("/todos");
    const parsedResponses = JSON.parse(response.text);
    const todoID = parsedResponses[parsedResponses.length - 1].id;

    res = await agent.get("/");
    csrfToken = extractCSRFToken(res.text);

    const deleteitem = await agent.delete(`/todos/${todoID}`).send({
      _csrf: csrfToken,
    });
    expect(deleteitem.statusCode).toBe(200);
  });
});









