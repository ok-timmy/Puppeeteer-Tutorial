const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch();

  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto("https://books.toscrape.com/index.html", {
    timeout: 60000,
  });

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });
  //   await page.screenshot({ path: "homepage.png" });


  const booksArray = await page.$$eval(
    "#default > div > div > div > div > section > div:nth-child(2) > ol> li",
    (elements) =>
      elements.map((el) => {
        const bookTitle = el.querySelector("h3> a").getAttribute("title");
        const bookPrice = el.querySelector("p.price_color").innerText;
        const imageLink = el.querySelector("img").getAttribute("src");
        const inStock = el.querySelector("p.availability").innerText;

        return {
          title: `${bookTitle}`,
          price: `${bookPrice}`,
          image: `https://books.toscrape.com/${imageLink}`,
          availability: `${inStock}`,
        };
      })
  );
  console.log(booksArray);
})();
