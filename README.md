Script to test programm

```json
[
  {
    "func": "goTo",
    "url": "http://google.com"
  },
  {
    "func": "waitTime",
    "time": "1000"
  },
  {
    "func": "type",
    "selector": "input[name='q']",
    "text": "gandalf sax video"
  },
  {
    "func": "press",
    "key": "Enter"
  },
  {
    "func": "waitTime",
    "time": "1000"
  },
  {
    "func": "click",
    "selector": "div.r > a"
  },
  {
    "func": "waitTime",
    "time": "3000"
  },
  {
    "func": "press",
    "key": "Space"
  }
]
```


Script with data scrapping

```json
[
  {
    "func": "goTo",
    "url": "http://google.com"
  },
  {
    "func": "waitTime",
    "time": "1000"
  },
  {
    "func": "type",
    "selector": "input[name='q']",
    "text": "gandalf sax video"
  },
  {
    "func": "press",
    "key": "Enter"
  },
  {
    "func": "waitTime",
    "time": "2000"
  },
  {
    "func": "getInnerText",
    "selector": "div.r > a > h3",
    "attribute": "href"
  },
  {
    "func": "getAttribute",
    "selector": "div.r > a",
    "attribute": "href"
  }
]
```