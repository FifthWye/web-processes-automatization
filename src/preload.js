// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { ipcRenderer } = require("electron");
const mongoose = require("mongoose");
const Script = require("./models/script");
const Action = require("./models/action");
const User = require("./models/user");
const Store = require("electron-store");
const store = new Store();
const mongodbConnectionString =
  "mongodb+srv://wpaUser:" +
  encodeURI("62956438") +
  "@cluster0-adjxu.mongodb.net/web-processes-automatization?retryWrites=true&w=majority";

mongoose.connect(mongodbConnectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const ownerId = store.get("userId");

window.addEventListener("DOMContentLoaded", () => {
  changeView();
  setUpNavbar();
  store.set("userId", "5e2f972590197c424cc96d33");
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
      routeHome();
      break;
    case "catalog":
      routerView.innerHTML = await fetchHtmlAsText("routes/catalog.html");
      routeCatalog();
      break;
    case "create":
      routerView.innerHTML = await fetchHtmlAsText("routes/create.html");
      routeCreate();
      break;
    case "run":
      routerView.innerHTML = await fetchHtmlAsText("routes/run.html");
      break;
    default:
      routerView.innerHTML = await fetchHtmlAsText("routes/home.html");
      routeHome();
      break;
  }
}

function routeHome() {
  const query = { _id: mongoose.Types.ObjectId(ownerId) };
  User.collection.findOne(query, function(err, user) {
    if (err) return console.error(err);
    console.log(user);
    const userScripts = user.scripts;
    const query = { _id: userScripts };
    Script.find(query, function(err, scripts) {
      if (err) return console.error(err);
      console.log(scripts);
    });
  });
}

function routeCatalog() {
  Script.find(function(err, scripts) {
    if (err) return console.error(err);
    console.log(scripts);
  });
}

function routeCreate() {
  document.querySelector("#test").addEventListener("click", function() {
    let script = document.querySelector("#script").value;
    ipcRenderer.send("test-script", script);
    ipcRenderer.on("data", (event, arg) => {
      const dataArr = arg;
      let dataTable = document.querySelector(".script-output");
      dataTable.innerHTML = "";
      let tableEl = document.createElement("table");
      let theadEl = document.createElement("thead");
      let theadTr = document.createElement("tr");
      let numTh = document.createElement("th");
      numTh.innerHTML = "#";
      theadTr.appendChild(numTh);

      for (var attr in dataArr[0]) {
        let thEl = document.createElement("th");
        thEl.innerHTML = attr[0].toUpperCase() + attr.slice(1);
        theadTr.appendChild(thEl);
      }

      let tbodyEl = document.createElement("tbody");
      for (let i = 0; i < dataArr.length; i++) {
        let trEl = document.createElement("tr");
        let numTd = document.createElement("td");
        numTd.innerHTML = i + 1;
        trEl.appendChild(numTd);
        for (var attr in dataArr[0]) {
          let tdEl = document.createElement("td");
          tdEl.innerHTML = dataArr[i][attr];
          trEl.appendChild(tdEl);
        }
        tbodyEl.appendChild(trEl);
      }

      theadEl.appendChild(theadTr);
      tableEl.appendChild(theadEl);
      tableEl.appendChild(tbodyEl);
      dataTable.appendChild(tableEl);
    });
  });

  document.querySelector("#publish").addEventListener("click", function() {
    let scriptTitleEl = document.querySelector("#title");
    let scriptDescEl = document.querySelector("#desc");
    let scriptContentEl = document.querySelector("#script");

    if (
      scriptValidation(
        scriptTitleEl.value,
        scriptDescEl.value,
        scriptContentEl.value
      )
    ) {
      const actionsArr = JSON.parse(scriptContentEl.value);
      let actionsIdArr = [];

      //TODO: check if there is the same action in database if yes then get it's id and remove it from insert array

      Action.collection.insertMany(actionsArr, function(err, actions) {
        if (err) {
          return console.error(err);
        } else {
          actionsIdArr = actions.insertedIds;
          console.log(actions);
          const script = {
            title: scriptTitleEl.value,
            desc: scriptDescEl.value,
            users: [mongoose.Types.ObjectId(ownerId)],
            actions: actionsIdArr
          };

          Script.collection.insertOne(script, function(err, script) {
            if (err) {
              return console.error(err);
            } else {
              console.log(script);
              const query = { _id: mongoose.Types.ObjectId(ownerId) };
              User.collection.findOneAndUpdate(
                query,
                { $push: { scripts: script.insertedId } },
                function(err, user) {
                  if (err) {
                    return console.error(err);
                  } else {
                    console.log(user);
                  }
                }
              );
            }
          });
        }
      });
    }
  });
}

function routeRun() {}

function scriptValidation(title, description, script) {
  const titleRegEx = /^[a-zA-Z]+$/;

  if (!regExTest(titleRegEx, title)) {
    return false;
  }

  if (description.length > 350) {
    return false;
  }

  if (!isJSON(script)) {
    return false;
  }
  return true;
}

function regExTest(regex, string) {
  return regex.test(string);
}

function isJSON(text) {
  if (typeof text !== "string") {
    return false;
  }
  try {
    JSON.parse(text);
    return true;
  } catch (error) {
    return false;
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
