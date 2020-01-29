// Modules to control application life and create native browser window
const { app, BrowserWindow } = require("electron");
const path = require("path");
const $ = require("cheerio");
const puppeteer = require("puppeteer");
const { ipcMain } = require("electron");
const url = require("url");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minHeight: 600,
    minWidth: 800,
    icon: path.join(__dirname, "public/assets/icons/wpa.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  //mainWindow.removeMenu();

  // and load the index.html of the app.
  mainWindow.loadFile("./public/index.html");

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on("closed", function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  //autoUpdater.checkForUpdatesAndNotify();
  createWindow();
});

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on("test-script", async (event, arg) => {
  const script = JSON.parse(arg); //[{"func":"goTo","url":"http://google.com"},{"func":"type","selector":"input[name='q']", "text":"gandalf sax video"},{"func":"click"}]

  console.log(script, script.length);

  const browser = await puppeteer.launch({
    //executablePath: chromium_path,
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"]
  });

  const page = (await browser.pages())[0];

  await page.goto("https://google.com");

  let dataArrays = [];

  for (let i = 0; i < script.length; i++) {
    const actionData = await execAction(script[i], page);
    if (actionData) {
      //console.log(actionData);
      dataArrays.push(actionData);
    }
  }

  let jsonData = [];

  if (dataArrays.length) {
    if (checkArraysLength(dataArrays)) {
      for (let i0 = 0; i0 < dataArrays[0].length; i0++) {
        let obj = {};
        for (let i1 = 0; i1 < dataArrays.length; i1++) {
          obj = { ...obj, ...dataArrays[i1][i0] };
        }
        jsonData.push(obj);
      }
      console.log(jsonData)
      event.sender.send("data", jsonData);
    }
  }

  browser.close();
});

async function execAction(action, page) {
  // I know that big switch is a bad solution just made it so because of time lack
  const func = action.func;
  const selector = action.selector;
  switch (func) {
    case "goTo":
      const url = action.url;
      await page.goto(url, { waitUntil: "networkidle2" });
      break;
    case "click":
      await page.click(selector);
      break;
    case "waitFor":
      await page.waitForSelector(selector);
      break;
    case "waitTime":
      const time = action.time;
      await delay(time);
      break;
    case "type":
      const text = action.text;
      await page.type(selector, text);
      break;
    case "press":
      const key = action.key;
      await page.keyboard.press(key);
      break;
    case "getAttribute":
      const attribute = action.attribute;
      const attributes = await getAttributes(attribute, selector, page);
      if (attribute.length) {
        return attributes;
      }
      break;
    case "getInnerText":
      const innerText = await getInnerText(selector, page);
      if (innerText.length) {
        return innerText;
      }
      break;
    default:
      console.log("wrong func");
      break;
  }
}

function delay(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
}

async function getAttributes(attribute, selector, page) {
  return await page.evaluate(
    async (attribute, selector) => {
      const elArr = document.querySelectorAll(selector);
      let attributesVal = [];
      for (let i = 0; i < elArr.length; i++) {
        attributesVal.push({ [attribute]: elArr[i].getAttribute(attribute) });
      }
      return attributesVal;
    },
    attribute,
    selector
  );
}

async function getInnerText(selector, page) {
  return await page.evaluate(async selector => {
    const elArr = document.querySelectorAll(selector);
    let textArr = [];
    for (let i = 0; i < elArr.length; i++) {
      textArr.push({ text: elArr[i].textContent });
    }
    return textArr;
  }, selector);
}

function checkArraysLength(arr) {
  const firstArrLength = arr[0].length;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].length != firstArrLength) {
      return false;
    }
  }
  return true;
}
