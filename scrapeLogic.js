const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const scrapeLogic = async (url, vin) => {
  const browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
  try {
    const page = await browser.newPage();
    let name = "";
    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    await page.evaluate(() => {
      const element = document.querySelector(".advantage-dealer-badge-info");
      if (element) {
        element.remove();
      }
      name = document.querySelector(
        ".sidebar-vehicle-information-year-Make-Model"
      )?.innerHTML;

      if (!name) {
        name = document.querySelector(
          ".vehicle-information-year-make-model"
        )?.innerHTML;
      }
    });

    await page.evaluate(() => {
      const element = document.querySelector(
        ".print-only-report-provided-by-snackbar"
      );
      if (element) {
        element.remove();
      }
    });

    await page.emulateMediaType("print");

    const pdfPath = path.join("/tmp", `${vin}.pdf`);
    await page.pdf({
      format: "A4",
      printBackground: true,
      path: pdfPath,
    });

    // await browser.close();

    return name;
  } catch (e) {
    console.error(e);
    return "error";
  } finally {
    await browser.close();
  }
};

module.exports = { scrapeLogic };
