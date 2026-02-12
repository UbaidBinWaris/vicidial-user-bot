const puppeteer = require("puppeteer");

const domain = "lead4s.letsscall.com";
const admin_username = "6666";
const admin_password = "hjkasbxasjh4645";

const user_id_start = 1002;
const user_id_end = 1052;
const copy_from_user = "1001";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getFrameByContent(page, keyword) {
  for (const frame of page.frames()) {
    const content = await frame.content();
    if (content.includes(keyword)) {
      return frame;
    }
  }
  return null;
}

(async () => {
  console.log("🚀 Starting Advanced Phone Copy Bot...");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  await page.authenticate({
    username: admin_username,
    password: admin_password,
  });

  await page.goto(`http://${domain}/vicidial/admin.php`, {
    waitUntil: "domcontentloaded",
  });

  await delay(4000);

  // 🔍 Get left frame
  const leftFrame = await getFrameByContent(page, "Admin");

  console.log("➡ Clicking Admin...");
  await leftFrame.evaluate(() => {
    const link = Array.from(document.querySelectorAll("a")).find(
      (a) => a.innerText.trim() === "Admin",
    );
    if (link) link.click();
  });

  await delay(3000);

  console.log("➡ Clicking Phones...");
  await leftFrame.evaluate(() => {
    const link = Array.from(document.querySelectorAll("a")).find(
      (a) => a.innerText.trim() === "Phones",
    );
    if (link) link.click();
  });

  await delay(4000);

  console.log("➡ Clicking Copy an Existing Phone...");
  await leftFrame.evaluate(() => {
    const link = Array.from(document.querySelectorAll("a")).find((a) =>
      a.innerText.includes("Copy"),
    );
    if (link) link.click();
  });

  await delay(4000);

  // 🚀 LOOP
  for (let userId = user_id_start; userId <= user_id_end; userId++) {
    console.log(`\n📞 Creating Phone ${userId}`);

    // Re-detect frame every time
    const contentFrame = await getFrameByContent(page, "COPY A PHONE");

    await contentFrame.waitForSelector('input[name="new_extension"]', {
      timeout: 15000,
    });

    console.log("✏ Filling form...");

    // Clear ALL text inputs first
    await contentFrame.evaluate(() => {
      document.querySelectorAll("input[type='text']").forEach((el) => {
        el.value = "";
      });
    });

    await delay(1000);

    // Fill correct fields
    await contentFrame.type('input[name="new_extension"]', userId.toString(), {
      delay: 30,
    });
    await contentFrame.type(
      'input[name="new_dialplan_number"]',
      userId.toString(),
      { delay: 30 },
    );
    await contentFrame.type(
      'input[name="new_voicemail_id"]',
      userId.toString(),
      { delay: 30 },
    );
    await contentFrame.type(
      'input[name="new_outbound_cid"]',
      userId.toString(),
      { delay: 30 },
    );
    await contentFrame.type('input[name="new_login"]', userId.toString(), {
      delay: 30,
    });
    await contentFrame.type('input[name="new_fullname"]', `${userId}`, {
      delay: 30,
    });

    await contentFrame.type('input[name="new_pass"]', userId.toString(), {
      delay: 30,
    });
    await contentFrame.type(
      'input[name="new_conf_secret"]',
      userId.toString(),
      { delay: 30 },
    );

    // Select Source Phone = 1001|serverIP
    const sourceValue = `${copy_from_user}|162.55.236.185`;

    await contentFrame.select('select[name="source_phone"]', sourceValue);

    await delay(1500);

    console.log("🟢 Submitting...");

    await contentFrame.click('input[name="SUBMIT"]');

    await delay(5000);

    console.log(`✅ Phone ${userId} submitted`);

    // Click Copy Existing Phone again
    await leftFrame.evaluate(() => {
      const link = Array.from(document.querySelectorAll("a")).find((a) =>
        a.innerText.includes("Copy an Existing Phone"),
      );
      if (link) link.click();
    });

    await delay(4000);
  }

  console.log("🎉 All Phones Created Successfully!");
})();
