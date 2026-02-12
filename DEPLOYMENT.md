# Deployment Instructions for Netlify

## What Changed
Your static website now includes a Netlify serverless function that acts as a proxy to fetch gold prices. This solves the CORS issue when deployed.

## Files Added/Modified
1. **netlify/functions/gold-price.js** - Serverless function that proxies API requests
2. **netlify.toml** - Netlify configuration file
3. **app.js** - Updated to use proxy function in production, direct API locally

## Deployment Steps

### Option 1: Git-based Deployment (Recommended)

If your site is connected to a Git repository (GitHub, GitLab, Bitbucket):

1. Commit the new files:
   ```bash
   git add netlify/functions/gold-price.js netlify.toml app.js DEPLOYMENT.md
   git commit -m "Add Netlify function proxy for gold price API"
   git push
   ```

2. Netlify will automatically:
   - Detect the changes
   - Deploy the function
   - Redeploy your site

3. Wait 1-2 minutes for deployment to complete

4. Test your site at: https://gold-tracker-ai.netlify.app/

### Option 2: Manual Drag & Drop Deployment

If you're using drag & drop deployment:

1. Create a new deployment folder with all files:
   - index.html
   - app.js (updated version)
   - styles.css
   - netlify.toml
   - netlify/functions/gold-price.js

2. Drag the entire folder to Netlify's deploy zone

3. Wait for deployment to complete

## How It Works

### Local Development (file:// or localhost)
- App detects local environment
- Calls gold price API directly with proper headers
- Works as before

### Production (Netlify)
- App detects it's on Netlify domain
- Calls `/.netlify/functions/gold-price` instead
- Function proxies request to gold price API with proper headers
- Returns data to your frontend
- No CORS issues!

## Testing After Deployment

1. Visit https://gold-tracker-ai.netlify.app/
2. Check that the "Current Gold Price" section loads (should show prices instead of "Loading...")
3. Open browser DevTools Console (F12)
4. Look for any errors - there should be none
5. You should see gold prices updating successfully

## Troubleshooting

### Function not found (404 error)
- Make sure `netlify.toml` is in the root directory
- Check that `netlify/functions/gold-price.js` exists
- Redeploy the site

### Still seeing CORS errors
- Clear browser cache
- Make sure you're testing on the Netlify domain, not localhost
- Check browser console for actual error message

### Prices show "Loading..." forever
- Check Netlify function logs in Netlify dashboard
- Go to: Site → Functions → gold-price → Logs
- Look for error messages

## Cost
Netlify Functions are free for:
- 125,000 requests per month
- 100 hours of function runtime per month

Your app should stay well within these limits.
