import {
    Client,
    setupAnonBrowserWithContext,
    executeRuntimeScript,
    Environment,
  } from "@anon/sdk-typescript";
  import dotenv from "dotenv";
  import { fileURLToPath } from "url";
  import path from "path";
  import { APP_CONFIG, AppName, DEFAULT_APP, DO_DELETE_SESSION } from "./actions/config"
  import readline from 'readline';
  import { waitForNetworkIdle, retryWithBackoff, waitForPageLoad } from "./actions/browserHelpers"
  
  import fs from 'fs';
  
  
  console.log("Starting script execution...");
  
  // Load environment variables from parent .env file
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, ".env") });
  console.log("Environment variables loaded.");
  
  // Configuration
  const APP_USER_ID = process.env.ANON_APP_USER_ID!;
  const API_KEY = process.env.ANON_API_KEY!;
  const ANON_ENV = process.env.ANON_ENV! as Environment;
  // const APP: AppName = (process.env.APP as AppName) || DEFAULT_APP;
  const APP = "instagram"
  
  console.log("Configuration set:");
  console.log(`APP_USER_ID: ${APP_USER_ID ? "Set" : "Not set"}`);
  console.log(`API_KEY: ${API_KEY ? "Set" : "Not set"}`);
  console.log(`ANON_ENV: ${ANON_ENV}`);
  console.log(`APP: ${APP}`);
  
  // Validate environment variables
  [
    { name: "ANON_APP_USER_ID", value: APP_USER_ID },
    { name: "ANON_API_KEY", value: API_KEY },
    { name: "ANON_ENV", value: ANON_ENV },
  ].forEach(({ name, value }) => {
    if (!value) {
      console.error(`Error: Please set the ${name} environment variable.`);
      process.exit(1);
    }
  });
  
  const account = {
    app: APP,
    userId: APP_USER_ID,
  };
  
  console.log("Creating Anon client...");
  const client = new Client({
    environment: ANON_ENV,
    apiKey: API_KEY,
  });
  console.log("Anon client created.");
  
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const main = async () => {
    console.log(`Requesting ${account.app} session for appUserId ${account.userId}`);
    const { browserContext } = await setupAnonBrowserWithContext(
      client,
      account,
      { type: "local", input: { headless: false } },
    );
    await executeRuntimeScript({
      client,
      account,
      target: { browserContext },
      initialUrl: "https://clay.earth",
      run: async (page) => {
        const CLAY_URL = "https://clay.earth";
        console.log("Starting clayLogin function...");
  
        console.log("Step 1: Navigating to Clay...");
        await retryWithBackoff(async () => {
          await page.goto(CLAY_URL, { timeout: 30000 }); // Assuming NETWORK_TIMEOUT is 30000 milliseconds
          console.log("Successfully navigated to Clay.");
        });
  
        console.log("Step 2: Waiting for page to load...");
        await waitForNetworkIdle(page);
        await waitForPageLoad(page);
  
        console.log("Step 3: Clicking 'Sign In'...");
        await page.getByRole('link', { name: 'Sign In' }).click();
  
        console.log("Step 4: Entering email...");
        const email = "mcan@stanford.edu"; // TODO: Change to your email
        await page.getByPlaceholder('Enter your email').fill(email);
        await page.getByPlaceholder('Enter your email').press('Enter');
  
        console.log("Step 5: Entering code...");
        const code = await new Promise<string>((resolve) => {
          rl.question("Enter code: ", (input) => {
            resolve(input);
          });
        });
        await page.getByPlaceholder('Enter code').fill(code);
        await page.getByRole('button', { name: 'Sign in with code' }).click();
  
        console.log("Clay login process completed.");
        console.log("Navigating to 'People'...");
        await page.getByText('People').click();
        console.log("Scraping 'People' page...");
  
        await page.locator('svg._svgCommon_t4etb_1.icon.sort-icon._hoverOpacity_t4etb_1').click();
        await page.getByRole('menuitem', { name: 'Relevance' }).click();
        await page.getByText('Lola').click(); // TODO: You probably want to change this to whoever is first on your list
        await page.getByRole('banner').getByRole('button').click();
        await page.locator('body').press('ArrowDown');
        await page.locator('body').press('ArrowUp');
  
        let allPeople: { name: string; details: string }[] = [];
        let previousHeight = 0;
        
        // Define scrollToBottom function
        async function scrollToBottom(page) {
            console.log("Scroll to bottom");
            await page.keyboard.press('ArrowDown');
            await page.waitForTimeout(2000);
        }
        
        while (allPeople.length < 9400) {
          await scrollToBottom(page);
          const newPeople = await page.evaluate(() => {
            const peopleElements = Array.from(document.querySelectorAll('div._sidebarPrimary_1hvdg_148'));
            return peopleElements.map((person) => {
              // Basic Information
              const nameElement = person.querySelector('h4._name_1ryrj_176');
              const name = nameElement ? nameElement.textContent.trim() : 'Unknown';
        
              const detailsElement = person.querySelector('span.text-small._location_1ryrj_183');
              const details = detailsElement ? detailsElement.textContent.trim() : '';
        
              const avatarElement = person.querySelector('span.avatar._avatar_1ryrj_138');
              const avatar = avatarElement ? avatarElement.style.backgroundImage.slice(5, -2) : '';
        
              // Network Strength
              const networkStrengthElement = person.querySelector('span._badge_vb7sj_144');
              const networkStrength = networkStrengthElement ? networkStrengthElement.textContent.trim() : '';
        
              // Timeline
              const timelineItems = Array.from(person.querySelectorAll('div._container_jraq0_129')).map(item => {
                const sourceElement = item.querySelector('img._badge_jraq0_157');
                const source = sourceElement ? sourceElement.src : '';
                const descriptionElement = item.querySelector('div._interactionDescription_jraq0_170');
                const description = descriptionElement ? descriptionElement.textContent.trim() : '';
                const dateElement = item.querySelector('span._interactionDate_jraq0_196');
                const date = dateElement ? dateElement.textContent.trim() : '';
                return { source, description, date };
              });
        
              // Sources
              const sourcesSection = person.querySelector('div._section_1hlbb_129:last-child');
              const lastChattedElement = sourcesSection ? sourcesSection.querySelector('p') : null;
              const lastChatted = lastChattedElement ? lastChattedElement.textContent.trim() : '';
        
              // Extract specific data from lastChatted
              const lastChattedDaysAgo = lastChatted.match(/You last chatted with \w+ (\d+) days ago/);
              const lastChattedMethod = lastChatted.match(/ago via (\w+)/);
              const textCountMatch = lastChatted.match(/You've texted ([\d,]+) times/);
              const lastTextedMatch = lastChatted.match(/most recently (\d+) days ago/);
        
              const lastChattedDays = lastChattedDaysAgo ? parseInt(lastChattedDaysAgo[1]) : null;
              const chatMethod = lastChattedMethod ? lastChattedMethod[1] : '';
              const textCount = textCountMatch ? parseInt(textCountMatch[1].replace(',', '')) : null;
              const lastTextedDays = lastTextedMatch ? parseInt(lastTextedMatch[1]) : null;
        
              // Contact Methods
              const contactMethods = Array.from(sourcesSection ? sourcesSection.querySelectorAll('div._source_6h0lu_129') : []).map(method => {
                const iconElement = method.querySelector('span._icon_6h0lu_1');
                const iconMatch = iconElement ? iconElement.style.backgroundImage.match(/\/([^\/]+)\.\w+$/) : null;
                const icon = iconMatch ? iconMatch[1] : '';
                const labelElement = method.querySelector('a._sourceLabel_6h0lu_138');
                const buttonElement = method.querySelector('div[type="button"]');
                const value = labelElement ? labelElement.href : (buttonElement ? buttonElement.textContent.trim() : '');
                return { icon, value };
              });
  
        
              // Additional Details
              const badges = Array.from(person.querySelectorAll('div._badges_1ryrj_170 span')).map(badge => badge.textContent.trim());
        
              return {
                name,
                details,
                avatar,
                networkStrength,
                timeline: timelineItems,
                lastChatted,
                lastChattedDays,
                chatMethod,
                textCount,
                lastTextedDays,
                contactMethods,
                badges
              };
            });
          });
          
          allPeople = allPeople.concat(newPeople);
          console.log(`Scraped ${allPeople.length} people so far:`, newPeople);
    
          // Write filteredPeople to the JSON file
          fs.appendFileSync('people.json', JSON.stringify(newPeople, null, 2) + ',\n');
  
      }
  
      console.log("Finished scraping 'People' page.");
      console.log("Total people found:", allPeople.length);
  
      }
    });
  };
  
  console.log("Starting main function...");
  main()
    .then(() => console.log("Script execution completed."))
    .catch(error => console.error("Unhandled error in main:", error));