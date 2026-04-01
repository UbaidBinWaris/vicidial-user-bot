const puppeteer = require("puppeteer");
require("dotenv").config();

const domain = process.env.DOMAIN;
const admin_username = process.env.ADMIN_USERNAME;
const admin_password = process.env.ADMIN_PASSWORD;
const common_phone_password = process.env.COMMON_PHONE_PASSWORD;
const use_common_password = process.env.USE_COMMON_PASSWORD === "true";

const user_id_start = Number.parseInt(process.env.ID_START);
const user_id_end = Number.parseInt(process.env.ID_END);
const copy_from_user = "1001";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getFrameByContent(page, keyword) {
  for (const frame of page.frames()) {
    try {
      const content = await frame.content();
      if (content.includes(keyword)) {
        return frame;
      }
    } catch {
      // frame was destroyed during navigation, skip it
    }
  }
  return null;
}

(async () => {
  console.log("🚀 Starting Advanced Phone Copy Bot...");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    ignoreHTTPSErrors: true,
    args: [
      "--disable-extensions",
      "--disable-component-extensions-with-background-pages",
      "--no-proxy-server",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking",
      "--disable-sync",
      "--disable-features=HttpsFirstBalancedModeAutoEnable,HttpsUpgrades,HTTPS-FirstModeSetting",
      "--ignore-certificate-errors",
    ],
  });

  const page = await browser.newPage();

  await page.authenticate({
    username: admin_username,
    password: admin_password,
  });

  const adminUrl = `${domain}/vicidial/admin.php`;
  try {
    await page.goto(adminUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
  } catch (error) {
    if (error.message?.includes("ERR_BLOCKED_BY_CLIENT")) {
      console.log("❌ Browser/network client blocked the URL before page load.");
      console.log(
        "👉 Disable ad-block/web-shield/proxy/VPN filtering for this host, then run again:",
      );
      console.log(`   ${adminUrl}`);
      await browser.close();
      process.exit(1);
    }
    throw error;
  }

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

    const passwordToUse = use_common_password ? common_phone_password : userId.toString();

    await contentFrame.type('input[name="new_pass"]', passwordToUse, {
      delay: 30,
    });
    await contentFrame.type(
      'input[name="new_conf_secret"]',
      passwordToUse,
      { delay: 30 },
    );

    // Select Source Phone by finding the option that starts with copy_from_user
    const sourceSelected = await contentFrame.evaluate((copyFrom) => {
      const select = document.querySelector('select[name="source_phone"]');
      const option = Array.from(select.options).find((o) =>
        o.value.startsWith(copyFrom + "|"),
      );
      if (option) {
        select.value = option.value;
        return true;
      }
      return false;
    }, copy_from_user);

    if (!sourceSelected) {
      console.log(`❌ Could not find source phone ${copy_from_user} in dropdown`);
      break;
    }

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
