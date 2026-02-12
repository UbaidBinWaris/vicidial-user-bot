const puppeteer = require("puppeteer");

const domain = "lead4s.letsscall.com";
const admin_username = "6666";
const admin_password = "hjkasbxasjh4645";

user_id_start = 1002;
user_id_end = 1052;

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
  console.log("🚀 Starting Frame-Aware Bot...");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  // Basic Auth
  await page.authenticate({
    username: admin_username,
    password: admin_password,
  });

  await page.goto(`http://${domain}/vicidial/admin.php`, {
    waitUntil: "domcontentloaded",
  });

  await delay(4000);

  console.log("✅ Admin loaded");

  // 🔍 Find LEFT MENU frame
  const leftFrame = await getFrameByContent(page, "Users");

  if (!leftFrame) {
    console.log("❌ Could not find left menu frame");
    return;
  }

  console.log("✅ Left menu frame found");

  // Click "Users"
  await leftFrame.evaluate(() => {
    const link = Array.from(document.querySelectorAll("a")).find(
      (a) => a.innerText.trim() === "Users",
    );
    if (link) link.click();
  });

  await delay(2000);

  // Click "Add A New User"
  await leftFrame.evaluate(() => {
    const link = Array.from(document.querySelectorAll("a")).find((a) =>
      a.innerText.includes("Add A New User"),
    );
    if (link) link.click();
  });

  await delay(4000);

  console.log("✅ Clicked Add A New User");

  // 🔍 Now find MAIN CONTENT frame
  let contentFrame = await getFrameByContent(page, "ADD A NEW USER");

  if (!contentFrame) {
    console.log("❌ Could not find Add User form frame");
    return;
  }

  console.log("✅ Add User form frame detected");

  for (let userId = user_id_start; userId <= user_id_end; userId++) {
    console.log(`\n👤 Creating user ${userId}`);

    // Always re-detect content frame
    const contentFrame = await getFrameByContent(page, "ADD A NEW USER");

    await contentFrame.waitForSelector('input[name="user"]');

    // Clear form
    await contentFrame.evaluate(() => {
      document.querySelector('input[name="user"]').value = "";
      document.querySelector('input[name="pass"]').value = "";
      document.querySelector('input[name="full_name"]').value = "";
      document.querySelector('input[name="phone_login"]').value = "";
      document.querySelector('input[name="phone_pass"]').value = "";
    });

    // Fill form
    await contentFrame.type('input[name="user"]', userId.toString(), {
      delay: 30,
    });
    await contentFrame.type('input[name="pass"]', userId.toString(), {
      delay: 30,
    });
    await contentFrame.type('input[name="full_name"]', `${userId}`, {
      delay: 30,
    });
    await contentFrame.type('input[name="phone_login"]', userId.toString(), {
      delay: 30,
    });
    await contentFrame.type('input[name="phone_pass"]', userId.toString(), {
      delay: 30,
    });

    await delay(1000);

    console.log("🟢 Clicking submit...");

    await contentFrame.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("input, button")).find(
        (el) =>
          el.value?.toLowerCase().includes("submit") ||
          el.innerText?.toLowerCase().includes("submit"),
      );
      if (btn) btn.click();
    });

    await delay(4000);

    const updatedFrame = await getFrameByContent(page, "USER");

    const content = await updatedFrame.content();

    if (content.includes("USER ADDED")) {
      console.log(`✅ User ${userId} added`);
    } else if (content.includes("already exists")) {
      console.log(`⚠ User ${userId} exists`);
    } else {
      console.log("⚠ Could not confirm, continuing...");
    }

    console.log("🔄 Clicking Add A New User again...");

    const leftFrame = await getFrameByContent(page, "Users");

    await leftFrame.evaluate(() => {
      const link = Array.from(document.querySelectorAll("a")).find((a) =>
        a.innerText.includes("Add A New User"),
      );
      if (link) link.click();
    });

    await delay(4000);
  }

  console.log("🎉 Finished successfully!");
})();
