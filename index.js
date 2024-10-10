const express = require("express");
const path = require("path");
const fs = require("fs");
const { scrapeLogic } = require("./scrapeLogic");

const app = express();
app.use("/files", express.static("/tmp"));
const PORT = process.env.PORT || 4000;

app.get("/scrape", (req, res) => {
  scrapeLogic(res);
});

app.get("/download-pdf/:vin/:auth", async (req, res) => {
  const vin = req.params.vin;
  const auth = req.params.auth;
  const fullUrl = req.protocol + "://" + req.get("host");
  console.log(fullUrl);

  const url = `https://dealers.carfax.com/api/vhr/${vin}`;

  const options = {
    method: "GET",
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en-GB;q=0.9,en;q=0.8",
      authorization: `Bearer ${auth}`,
      priority: "u=1, i",
      "sec-ch-ua":
        '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      Referer: "https://www.carfaxonline.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    
    if (!data || !data.vhrHtml) {
      return res.status(400).send({status: false, message: data?.message});
    }

    // Use /tmp directory for storing the HTML file
    const filePath = path.join("/tmp", `${vin}.html`);
    fs.writeFile(filePath, data.vhrHtml, (err) => {
      if (err) {
        console.error("Error writing file", err);
        return res.status(500).send({status: false, message: "Error writing file. try again!"});
        
      }
      console.log("HTML file created successfully!");
    });

   const reName =  await scrapeLogic(`${fullUrl}/files/${vin}.html`, vin);

    return res
      .status(200)
      .send({ file_path: `${fullUrl}/files/${vin}.pdf`, status: true, name: reName });
  } catch (err) {
    console.error("Error generating PDF:", err);
    res.status(500).send({status: false, message: "System Error. Try Again!"});
  }
});

app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
