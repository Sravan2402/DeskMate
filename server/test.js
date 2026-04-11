// test.js
const {
  mouse,
  keyboard,
  Point,
  Button,
  screen,
} = require("@nut-tree-fork/nut-js");

async function test() {
  console.log("Screen width:", await screen.width());
  console.log("Screen height:", await screen.height());
  await mouse.setPosition(new Point(500, 500));
  console.log("Mouse moved!");
  await mouse.click(Button.LEFT);
  console.log("Clicked!");
}

test().catch(console.error);
