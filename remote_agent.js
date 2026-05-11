const puppeteer = require("puppeteer");
require("dotenv").config();

const domain = process.env.DOMAIN;
const admin_username = process.env.ADMIN_USERNAME;
const admin_password = process.env.ADMIN_PASSWORD;

const user_id_start = Number.parseInt(process.env.ID_START);
const user_id_end = Number.parseInt(process.env.ID_END);

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

async function findFrameWithSelector(page, selector) {
  for (const frame of page.frames()) {
    try {
      const element = await frame.$(selector);
      if (element) {
        return frame;
      }
    } catch {
      // ignore frame access errors
    }
  }
  return null;
}

(async () => {
  console.log("🚀 Starting Remote Agent Addition Bot...");

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

  // Basic Auth
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
    if (error.message?.includes("ERR_EMPTY_RESPONSE")) {
      console.log("❌ Server returned empty response. The Vicidial server may be down or unreachable.");
      console.log("👉 Check if the server is running and accessible:");
      console.log(`   ${adminUrl}`);
      console.log("👉 Verify the DOMAIN in .env is correct.");
      await browser.close();
      process.exit(1);
    }
    throw error;
  }

  await delay(4000);

  console.log("✅ Admin loaded");

  const addRemoteAgentUrl = `${domain}/vicidial/admin.php?ADD=11111`;

  // Load the add-remote-agent page once up front.
  await page.goto(addRemoteAgentUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await delay(3000);

  // Now loop through user IDs
  for (let user_id = user_id_start; user_id <= user_id_end; user_id++) {
    console.log(`🔄 Adding remote agent for user ${user_id}`);

    const formFrame =
      (await findFrameWithSelector(page, 'input[name="user_start"]')) ||
      (await findFrameWithSelector(page, 'input[name="number_of_lines"]')) ||
      page.mainFrame();

    // Clear and fill User ID Start
    const userStartEl = await formFrame.$('input[name="user_start"]');
    if (!userStartEl) {
      console.log("❌ Could not find the remote agent form. Checking available frames...");
      console.log(
        page.frames().map((frame) => `${frame.name() || 'main'} -> ${frame.url()}`).join('\n'),
      );
      await browser.close();
      return;
    }
    await userStartEl.click({ clickCount: 3 });
    await userStartEl.type(user_id.toString());

    // Number of Lines: 1
    const linesEl = await formFrame.$('input[name="number_of_lines"]');
    if (!linesEl) {
      console.log("❌ Could not find number_of_lines input on the form.");
      await browser.close();
      return;
    }
    await linesEl.click({ clickCount: 3 });
    await linesEl.type("1");

    // Server IP: select the first option
    await formFrame.select('select[name="server_ip"]', "162.55.236.150");

    // External Extension: 88888 + user_id
    const ext = "88888" + user_id.toString();
    const extEl = await formFrame.$('input[name="conf_exten"]');
    if (!extEl) {
      console.log("❌ Could not find conf_exten input on the form.");
      await browser.close();
      return;
    }
    await extEl.click({ clickCount: 3 });
    await extEl.type(ext);

    // Status: INACTIVE
    await formFrame.select('select[name="status"]', "INACTIVE");

    // Campaign: leave default, do not select anything

    // Inbound Groups: leave blank (do not select any)

    // Submit
    const submitEl = await formFrame.$('input[name="SUBMIT"]');
    if (!submitEl) {
      console.log("❌ Could not find SUBMIT button on the remote agent form.");
      await browser.close();
      return;
    }

    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => null),
      submitEl.click(),
    ]);

    await delay(3000);
    await page.goto(addRemoteAgentUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await delay(3000);

    console.log(`✅ Added remote agent for user ${user_id}`);
  }

  console.log("🎉 All remote agents added!");
  await browser.close();
})();