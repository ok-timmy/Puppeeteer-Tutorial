const puppeteer = require("puppeteer");
const { Cluster } = require("puppeteer-cluster");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({ protocolTimeout: 600000 });

  const page = await browser.newPage();

  let flattenedArray;
  const bookDataArray = [];
  for (let index = 1; index <= 5; index++) {
    if (index === 1) {
      // Navigate the page to a URL
      await page.goto(`https://books.toscrape.com/index.html`, {
        timeout: 60000,
      });
      
      await page.screenshot({ path: `images/page-${index}.png` });
    } else {
      // Navigate the page to a URL
      await page.goto(
        `https://books.toscrape.com/catalogue/page-${index}.html`,
        {
          timeout: 60000,
        }
      );

      await page.screenshot({ path: `images/page-${index}.png` });
    }

    const booksArray = await page.$$eval(
      "#default > div > div > div > div > section > div:nth-child(2) > ol> li",
      (elements) =>
        elements.map((el, i) => {
          const bookTitle = el.querySelector("h3> a").getAttribute("title");
          const bookPrice = el.querySelector("p.price_color").innerText;
          const imageLink = el.querySelector("img").getAttribute("src");
          const inStock = el.querySelector("p.availability").innerText;

          const bookDetailsLink = el
            .querySelector("h3> a")
            .getAttribute("href");

          const data = {
            i,
            title: `${bookTitle}`,
            detailsLink: `${bookDetailsLink}`,
            price: `${bookPrice}`,
            image: `https://books.toscrape.com/${imageLink}`,
            availability: `${inStock}`,
          };

          return data;
        })
    );

    //Add an index number to each book detail.
    const updatedBookNoInDataArray = booksArray.map((e) => {
      return {
        ...e,
        i: index == 1 ? e.i + 1 : (index - 1) * 20 + e.i + 1,
      };
    });

    bookDataArray.push(updatedBookNoInDataArray);

    //Flatten out the array here
    flattenedArray = [].concat(...bookDataArray);
  }

  const addedData = [];

  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 100,
    timeout: 10000000,
  });

  //Catch any error that occurs when you scrape a particular page and log it to the console.
  cluster.on("taskerror", (err, data) => {
    console.log(`Error Crawling ${data}: ${err.message}`);
  });

  //Describe what you want the scraper to do on each page here
  await cluster.task(async ({ page, data: url }) => {
    await page.goto(url, { timeout: 100000 });
    const details = await page.$eval("#content_inner > article > p", (el) => {
      if (el === undefined) {
        return "";
      } else {
        return el.innerText;
      }
    });

    const tax = await page.$eval(
      "#content_inner > article > table > tbody > tr:nth-child(5) > td",
      (el) => {
        if (el === undefined) {
          return "";
        } else {
          return el.innerText;
        }
      }
    );
    const noOfleftInStock = await page.$eval(
      "#content_inner > article > table > tbody > tr:nth-child(6) > td",
      (el) => {
        if (el === undefined) {
          return "";
        } else {
          return el.innerText;
        }
      }
    );

    // console.log({details, noOfleftInStock, tax})
    addedData.push({ details, noOfleftInStock, tax });
  });

  for (const url of flattenedArray) {
    if (url.detailsLink.startsWith("catalogue/")) {
      await cluster.queue(`https://books.toscrape.com/${url.detailsLink}`);
    } else {
      await cluster.queue(
        `https://books.toscrape.com/catalogue/${url.detailsLink}`
      );
    }
  }

  await cluster.idle();
  await cluster.close();

  const finalbookDataArray = flattenedArray.map((e, i) => {
    return {
      ...e,
      bookDescription: addedData[i].details,
      tax: addedData[i].tax,
      noOfleftInStock: addedData[i].noOfleftInStock,
    };
  });

  const bookDataArrayJson = JSON.stringify(finalbookDataArray, null, 2);
  fs.writeFileSync("scraped-data.json", bookDataArrayJson);

  await browser.close();
})();
