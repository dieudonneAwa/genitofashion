# Google Cloud Vision API Setup Guide

This guide will help you set up Google Cloud Vision API for the AI image analysis feature.

## Error: Permission Denied

If you're seeing "Permission denied" errors, follow these steps to fix it:

## Using Service Account (Recommended)

**Note:** The `@google-cloud/vision` library requires service account credentials. API keys are not supported directly with this library.

## Step 1: Enable the Vision API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to **APIs & Services** > **Library**
4. Search for "Cloud Vision API"
5. Click on it and press **Enable**

## Step 2: Create a Service Account

1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Enter a name (e.g., "vision-api-service")
4. Click **Create and Continue**
5. Grant role: **Cloud Vision API User** (or **Cloud Vision API Client**)
6. Click **Continue** then **Done**

## Step 3: Create and Download Key

1. Click on the service account you just created
2. Go to **Keys** tab
3. Click **Add Key** > **Create new key**
4. Choose **JSON** format
5. Download the JSON file
6. Save it securely (e.g., `google-credentials.json` in your project root)

## Step 4: Add to Environment Variables

Add to your `.env.local` file:

```env
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id-here
```

**Important:** 
- Add `google-credentials.json` to your `.gitignore` (it should already be there)
- Use the **absolute path** or **relative path from project root** to the JSON file
- Example absolute path: `/Users/yourname/project/google-credentials.json`
- Example relative path: `./google-credentials.json` (if file is in project root)
- Restart your development server after adding these variables

## Verify Setup

After configuring, test the image analysis feature:

1. Restart your development server: `npm run dev`
2. Go to the admin panel
3. Try uploading an image and clicking "Analyze with AI"

## Troubleshooting

### "Permission denied" Error

- ✅ Ensure Vision API is **enabled** in your Google Cloud project
- ✅ Check that your API key has **Cloud Vision API** enabled
- ✅ Verify your service account has the **Cloud Vision API User** role
- ✅ Make sure the project ID matches your Google Cloud project

### "API not configured" Error

- ✅ Check that environment variables are set in `.env.local`
- ✅ Restart your development server after adding environment variables
- ✅ Verify the variable names are correct (case-sensitive)

### "Invalid image URL" Error

- ✅ Ensure the image URL is publicly accessible
- ✅ Check that Cloudinary images are set to public access
- ✅ Verify the URL format is correct (http:// or https://)

## Cost Considerations

Google Cloud Vision API has a free tier:
- **First 1,000 units per month**: FREE
- **1,001 - 5,000,000 units**: $1.50 per 1,000 units

Each image analysis uses multiple units (labels, objects, text, colors), so monitor your usage in the Google Cloud Console.

## Security Best Practices

1. **Never commit credentials to git** - The `.gitignore` should already exclude `.env.local` and credential files
2. **Use API key restrictions** - Restrict your API key to only Cloud Vision API
3. **Use service accounts for production** - More secure than API keys
4. **Rotate credentials regularly** - Especially if they're exposed

## Need Help?

If you continue to have issues:
1. Check the server console logs for detailed error messages
2. Verify your Google Cloud project billing is enabled (required for API access)
3. Check the [Google Cloud Vision API documentation](https://cloud.google.com/vision/docs)

