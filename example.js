const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  let flattenedArray;
  const bookDataArray = [];
  for (let index = 1; index <= 5; index++) {
    console.log(index);
    if (index === 1) {
      // Navigate the page to a URL
      await page.goto(`https://books.toscrape.com/index.html`, {
        timeout: 60000,
      });

      // Set screen size
      // await page.setViewport({ width: 1080, height: 1024 });
      await page.screenshot({ path: `images/page-${index}.png` });
    } else {
      // Navigate the page to a URL
      await page.goto(
        `https://books.toscrape.com/catalogue/page-${index}.html`,
        {
          timeout: 60000,
        }
      );

      // Set screen size
      // await page.setViewport({ width: 1080, height: 1024 });
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
          i: index == 1? e.i + 1 : (index - 1) * 20 + e.i + 1,
        };
      });

      bookDataArray.push(updatedBookNoInDataArray);

      //Flatten out the array here
      flattenedArray = [].concat(...bookDataArray);
    
  }

  await browser.close();


})();
