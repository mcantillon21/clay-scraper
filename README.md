# The best personal CRM

Exporting data from Clay gives you almost nothing. Licensed data sucks. Why not just scrape it then?

Clay is a personal CRM and productivity tool. The script uses the Anon SDK to automate the browser and navigate through the Clay interface. It logs into Clay, navigates to the 'People' page, and scrapes information about each person, such as their name, details, avatar, network strength, timeline, last chat details, contact methods, and badges. The scraped data is then saved to a JSON file, which you can enhance, port over to a spreadsheet, and people track!

## Quickstart

### Prerequisites

- Node.js installed on your machine
- An `.env` file in the root directory with the necessary environment variables. You can use the `.env.example` file as a template.

### Environment Variables

To ensure the script functions correctly, set the following environment variables in your `.env` file:

- `ANON_APP_USER_ID`: This is the "sub" field from your user's JWT. It uniquely identifies your user account.
- `ANON_API_KEY`: The API key for a server-side SDK client. This key allows your script to authenticate with the Anon services.
- `ANON_ENV`: Specify the environment for your script. Use 'sandbox' for testing with simulated data, or 'prod' for production use with real data.

### NPM Token

Set your `NPM_TOKEN` environment variable in the file `.npmrc` using this command:

```sh
sed "s/\${NPM_TOKEN}/${NPM_TOKEN}/g" .npmrc.template >.npmrc
```

Alternatively, copy the `.npmrc` file you received from Anon.

## Install Dependencies

Install your dependencies with npm or yarn, which uses the above mentioned `NPM_TOKEN`:

```sh
npm install
```

## Variable Replacement
Replace your email in `index.ts` with your email for login and replace the first relevant name. Both have TODO comments.

## Running the Example

Start your app with:

```sh
npm run dev
```

You should see a Playwright browser open and navigate to Clay using Anon's browser context. From there, the script will scrape everything it sees.
It will continue pressing down until at the end, or until the number you set as max in the file.

It will show something like this, you will need to enter the code for 2FA. 
```
Starting clayLogin function...
Step 1: Navigating to Clay...
Successfully navigated to Clay.
Step 2: Waiting for page to load...
Waiting for network to become idle...
Network is idle.
Waiting for page to load...
Page loaded.
Step 3: Clicking 'Sign In'...
Step 4: Entering email...
Step 5: Entering code...
Enter code: 
```

NOTE: You may need to authenticate with an account like instagram, linkedin or one of the Anon examples to make this work. I wasn't trying to make this work standalone, 
was more a utility for me, and ended up seeming helpful for more people. 