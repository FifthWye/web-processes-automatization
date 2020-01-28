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
  const navLinks = document.querySelectorAll("nav > ul > li");
  for (let i = 0; i < navLinks.length; i++) {
    navLinks[i].classList.remove("active");
  }
  if (el) {
    route = el.dataset.route;
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
  loadHomePageTable();
}

function routeCatalog() {
  loadCatalog();
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
            description: scriptDescEl.value,
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
                    changeView();
                  }
                }
              );
            }
          });
        }
      });
    }else{
      console.log("Validation error")
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

function loadHomePageTable() {
  const query = { _id: mongoose.Types.ObjectId(ownerId) };
  User.collection.findOne(query, function(err, user) {
    if (err) return console.error(err);
    if (user) {
      const userScripts = user.scripts;
      const query = { _id: { $in: userScripts } };
      Script.collection.find(query, function(err, cursor) {
        if (err) return console.error(err);
        cursor.toArray().then(scripts => {
          console.log(scripts);
          let dataTable = document.querySelector("table");
          dataTable.innerHTML = "";
          if (scripts.length) {
            let theadEl = document.createElement("thead");
            let theadTr = document.createElement("tr");
            let numTh = document.createElement("th");
            numTh.innerHTML = "#";
            theadTr.appendChild(numTh);
            let titleTh = document.createElement("th");
            titleTh.innerHTML = "Title";
            theadTr.appendChild(titleTh);
            let descTh = document.createElement("th");
            descTh.innerHTML = "Description";
            theadTr.appendChild(descTh);
            let actionsTh = document.createElement("th");
            actionsTh.innerHTML = "Actions";
            theadTr.appendChild(actionsTh);
            theadEl.appendChild(theadTr);

            let tbodyEl = document.createElement("tbody");
            for (let i = 0; i < scripts.length; i++) {
              let trEl = document.createElement("tr");
              let numTd = document.createElement("td");
              numTd.innerHTML = i + 1;
              trEl.appendChild(numTd);
              for (var attr in scripts[i]) {
                if (attr != "_id" && attr != "users" && attr != "actions") {
                  let tdEl = document.createElement("td");
                  tdEl.innerHTML = scripts[i][attr];
                  trEl.appendChild(tdEl);
                }
              }

              let actionsTd = document.createElement("td");
              let removeButton = document.createElement("button");
              let editButton = document.createElement("button");
              removeButton.innerHTML = "&#10006;";
              editButton.innerHTML = "<i class='fas fa-pencil-alt'></i>";
              removeButton.addEventListener("click", () => {
                deleteScript(scripts[i]._id);
              });

              actionsTd.appendChild(editButton);
              actionsTd.appendChild(removeButton);
              trEl.appendChild(actionsTd);

              tbodyEl.appendChild(trEl);
            }
            dataTable.appendChild(theadEl);
            dataTable.appendChild(tbodyEl);
          } else {
            console.log("there is no scripts yet");
            //TODO: show user that there is no scripts he\she owns yet
          }
        });
      });
    } else {
      //TODO: here it shoud clean app storage and send user to log in page
    }
  });
}

function deleteScript(scriptId) {
  console.log(scriptId);
  const query = { scripts: scriptId };
  User.collection.updateMany(query, { $pull: { scripts: scriptId } }, function(
    err
  ) {
    if (err) return console.error(err);
    loadHomePageTable();
    Script.collection.findOneAndDelete({ _id: scriptId }, function(
      err,
      script
    ) {
      if (err) return console.log(err);
      const actions = script.actions;
      Action.collection.deleteMany(actions);
    });
  });
}

function loadCatalog() {
  Script.find(function(err, scripts) {
    if (err) return console.error(err);
    let dataTable = document.querySelector("#scripts-catalog");
    dataTable.innerHTML = "";
    if (scripts.length) {
      for (let i = 0; i < scripts.length; i++) {
        let card = document.createElement("div");
        card.classList.add("card");
        let cardHeader = document.createElement("header");
        let headerH4 = document.createElement("h4");
        headerH4.innerHTML = scripts[i].title;
        cardHeader.appendChild(headerH4);
        card.appendChild(cardHeader);
        let cardBody = document.createElement("div");
        cardBody.classList.add("card-body");
        let bodyP = document.createElement("p");
        bodyP.innerHTML = scripts[i].description;
        cardBody.appendChild(bodyP);
        card.appendChild(cardBody);
        let cardFooter = document.createElement("footer");
        let footerSteps = document.createElement("span");
        let footerUsers = document.createElement("span");
        footerSteps.innerHTML = "Steps: " + scripts[i].actions.length;
        footerUsers.innerHTML = "Users: " + scripts[i].users.length;
        cardFooter.appendChild(footerSteps);
        cardFooter.appendChild(footerUsers);
        card.appendChild(cardFooter);
        dataTable.appendChild(card);
      }
    }
  });
}
