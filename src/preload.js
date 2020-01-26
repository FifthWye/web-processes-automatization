// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { ipcRenderer } = require("electron");
const path = require("path");
const cheerio = require("cheerio");

window.addEventListener("DOMContentLoaded", () => {
  changeView();
  setUpNavbar();

  ipcRenderer.on("data", (event, arg) => {
    const dataArr = arg;
    for (let i = 0; i < dataArr.length; i++) {
      console.log(dataArr[i]);
    }
  });
});

async function changeView(el) {
  let route = "";
  if (el) {
    route = el.dataset.route;
    const navLinks = document.querySelectorAll("nav > ul > li");
    for (let i = 0; i < navLinks.length; i++) {
      navLinks[i].classList.remove("active");
    }
    el.classList.add("active");
  } else {
    document.querySelector("li[data-route='home']").classList.add("active");
  }

  const routerView = document.getElementById("router-view");
  switch (route) {
    case "home":
      routerView.innerHTML = await fetchHtmlAsText("routes/home.html");
      break;
    case "catalog":
      routerView.innerHTML = await fetchHtmlAsText("routes/catalog.html");
      break;
    case "create":
      routerView.innerHTML = await fetchHtmlAsText("routes/create.html");
      document.querySelector("#test").addEventListener("click", function() {
        let script = document.querySelector("#script").value;
        ipcRenderer.send("test-script", script);
      });
      break;
    case "run":
      routerView.innerHTML = await fetchHtmlAsText("routes/run.html");
      break;
    default:
      routerView.innerHTML = await fetchHtmlAsText("routes/create.html");
      break;
  }
}

function setUpNavbar() {
  const navLinks = document.querySelectorAll("nav > ul > li");
  for (let i = 0; i < navLinks.length; i++) {
    navLinks[i].onclick = function() {
      const el = this;
      changeView(el);
    };
  }
}

async function fetchHtmlAsText(url) {
  return await (await fetch(url)).text();
}
