const fs = require("fs");
const $ = require("cheerio");
const puppeteer = require("puppeteer");
const slugify = require("slugify");
const inquirer = require("inquirer");

// const url = "https://www.codewars.com/collections/python-8kyu-1";
// const folder_name = "8kyu";

inquirer
  .prompt([
    {
      type: "input",
      name: "url",
      message: "Codewars collection url?",
      validate: function (value) {
        if (value !== "") {
          return true;
        }
        return "URL is required";
      },
    },
    {
      type: "input",
      name: "folder_name",
      message: "Folder name for problems?",
      validate: function (value) {
        if (value !== "") {
          return true;
        }
        return "Folder name is required";
      },
    },
  ])
  .then((answers) => {
    app(answers.url, answers.folder_name);
  });

function create_folfer(folder) {
  let readme = "\n\n## " + folder + "\n";

  fs.appendFileSync("readme.md", readme);

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
}

function write_file(folder, kata, index) {
  let slug = slugify(kata.title, { remove: /[\/:*?"<>|]/g, lower: true });
  let template = `\n${index + 1}. [${kata.title}](${
    kata.url
  }) - [Solution](${folder}/${index + 1}-${slug}.md)`;
  fs.appendFileSync("readme.md", template);

  let problemTemplate = "## " + kata.title + ":\n";
  problemTemplate += "\n### Problem:\n";
  problemTemplate += kata.description;
  problemTemplate += "\n### Solution";

  try {
    fs.writeFileSync(`${folder}/${index + 1}-${slug}.md`, problemTemplate);
  } catch (error) {
    console.log(`ERROR --- ${folder}/${index + 1}-${slug}.md`);
  }
}

function app(url, folder) {
  puppeteer.launch().then(async (browser) => {
    const page = await browser.newPage();
    await page.goto(url);
    let list_page_content = await page.content();
    let katas = [];

    $(".collection-items .item-title a", list_page_content).each(function () {
      katas.push({
        url: "https://www.codewars.com" + $(this).attr("href"),
        title: $(this).text(),
      });
    });

    create_folfer(folder);

    for (let i = 0; i < katas.length; i++) {
      const kata = katas[i];
      await page.goto(kata.url);
      await page.waitFor(
        () =>
          document.querySelector("#description").innerText !==
          "Loading description..."
      );
      let content = await page.content();
      const description = $("#description", content);
      kata.description = description.html();

      console.log(i + 1, kata);

      write_file(folder, kata, i);
    }

    await browser.close();
  });
}
