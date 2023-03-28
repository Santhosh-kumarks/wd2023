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

    const groupTodos = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedResponses = JSON.parse(groupTodos.text);
    const lastItem = parsedResponses[parsedResponses.length - 1];

    res = await agent.get("/");
    csrfToken = extractCSRFToken(res.text);

    const markComplete = await agent.put(`/todos/${lastItem.id}`).send({
      _csrf: csrfToken,
      completed: true,
    });

    const parsedUpdateResponse = JSON.parse(markComplete.text);
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

    const getresponse = await agent.get("/todos");
    const parsedResponses = JSON.parse(getresponse.text);
    const todoID = parsedResponses[parsedResponses.length - 1].id;

    res = await agent.get("/");
    csrfToken = extractCSRFToken(res.text);

    const deleteTodo = await agent.delete(`/todos/${todoID}`).send({
      _csrf: csrfToken,
    });
    expect(deleteTodo.statusCode).toBe(200);
  });
});







